import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as gemini from "./gemini";
import { handlePayPalWebhook, PayPalWebhookPayload } from "./paypal-webhook";
import { performDiagnosticReading, performEvolutionaryAssistance } from "./oriel-diagnostic-engine";
import { generateElevenLabsSpeech, audioToDataUrl } from "./elevenlabs-tts";
import { generateChunkedSpeech } from "./elevenlabs-chunked";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Archive/Signals router
  signals: router({
    list: publicProcedure.query(async () => {
      return db.getAllSignals();
    }),
    
    decodeTriptych: publicProcedure
      .input(z.object({
        signalId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const signal = await db.getSignalById(input.signalId);
        if (!signal) {
          throw new Error("Signal not found");
        }

        // Execute three parallel Gemini API calls for the triptych
        const [metadata, visual, verse] = await Promise.all([
          gemini.generateSignalMetadata(signal.title, signal.snippet),
          gemini.generateSignalVisual(signal.title, signal.snippet),
          gemini.generateCrypticVerse(signal.title, signal.snippet),
        ]);

        return {
          metadata,
          visual,
          verse,
          signal,
        };
      }),
  }),

  // Artifacts router
  artifacts: router({
    list: publicProcedure.query(async () => {
      return db.getAllArtifacts();
    }),

    generateLoreAndImage: publicProcedure
      .input(z.object({
        artifactId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const artifact = await db.getArtifactById(input.artifactId);
        if (!artifact) {
          throw new Error("Artifact not found");
        }

        // Generate lore first
        const lore = await gemini.generateArtifactLore(
          artifact.name,
          artifact.referenceSignalId || undefined
        );

        // Then generate image based on the lore
        const imageUrl = await gemini.generateArtifactImage(artifact.name, lore);

        // Update artifact in database
        if (imageUrl) {
          await db.updateArtifact(input.artifactId, { imageUrl });
        }

        return {
          lore,
          imageUrl,
        };
      }),

    expandLore: publicProcedure
      .input(z.object({
        artifactId: z.number(),
        currentLore: z.string(),
      }))
      .mutation(async ({ input }) => {
        const artifact = await db.getArtifactById(input.artifactId);
        if (!artifact) {
          throw new Error("Artifact not found");
        }

        const expandedLore = await gemini.expandArtifactLore(
          artifact.name,
          input.currentLore
        );

        return {
          expandedLore,
        };
      }),
  }),

  // ORIEL Interface router
  oriel: router({
    chat: publicProcedure
      .input(z.object({
        message: z.string(),
        history: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get conversation history from frontend or database
        let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        
        if (ctx.user) {
          // Authenticated users: use database history
          const history = await db.getChatHistory(ctx.user.id, 10);
          conversationHistory = history
            .reverse()
            .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            }));
        } else if (input.history && input.history.length > 0) {
          // Unauthenticated users: use history passed from frontend
          conversationHistory = input.history;
        }

        // Generate ORIEL's response with memory context for authenticated users
        const userId = ctx.user?.id;
        console.log('[tRPC chat] Calling chatWithORIEL');
        const response = await gemini.chatWithORIEL(input.message, conversationHistory, userId);
        console.log('[tRPC chat] Response received, length:', response.length);
        console.log('[tRPC chat] Response preview:', response.substring(0, 100));

        // Save messages to database only if authenticated
        if (ctx.user) {
          await db.saveChatMessage({
            userId: ctx.user.id,
            role: "user",
            content: input.message,
          });

          await db.saveChatMessage({
            userId: ctx.user.id,
            role: "assistant",
            content: response,
          });
        }

        console.log('[tRPC chat] Returning response to client');
        return {
          response,
        };
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return [];
      }
      const history = await db.getChatHistory(ctx.user.id, 50);
      return history.reverse();
    }),

    clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }
      await db.clearChatHistory(ctx.user.id);
      return { success: true };
    }),

    generateSpeech: publicProcedure
      .input(z.object({
        text: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log("[generateSpeech] Starting TTS generation for text:", input.text.substring(0, 100), `(${input.text.length} chars)`);
          const audioBase64 = await generateChunkedSpeech(input.text);
          console.log("[generateSpeech] Audio generated successfully, size:", audioBase64.length);
          const audioUrl = audioToDataUrl(audioBase64);
          return {
            success: true,
            audioUrl,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error("[generateSpeech] Failed to generate speech:", errorMsg);
          return {
            success: false,
            error: errorMsg,
          };
        }
      }),

    // Vossari Resonance Codex - Mode A: Diagnostic Reading
    diagnosticReading: publicProcedure
      .input(z.object({
        mentalNoise: z.number().min(0).max(10),
        bodyTension: z.number().min(0).max(10),
        emotionalTurbulence: z.number().min(0).max(10),
        breathCompletion: z.union([z.literal(0), z.literal(1)]),
        primeCodonSet: z.array(z.string()).optional(),
        fullCodonStack: z.array(z.string()).optional(),
        // New fields for reading type selection
        readingType: z.enum(["dynamic", "static"]).optional().default("dynamic"),
        birthDate: z.string().optional(),
        birthTime: z.string().optional(),
        birthLocation: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const carrierlockState = {
            mentalNoise: input.mentalNoise,
            bodyTension: input.bodyTension,
            emotionalTurbulence: input.emotionalTurbulence,
            breathCompletion: input.breathCompletion as 0 | 1,
          };

          // For static readings, we'll calculate codons from birth date
          let primeCodonSet = input.primeCodonSet || [];
          let fullCodonStack = input.fullCodonStack || [];
          
          if (input.readingType === "static" && input.birthDate) {
            // Calculate static signature codons from birth date
            const birthDateObj = new Date(input.birthDate);
            const dayOfYear = Math.floor((birthDateObj.getTime() - new Date(birthDateObj.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
            
            // Map day of year to codon (64 codons, ~5.7 days per codon)
            const primaryCodon = Math.floor((dayOfYear / 365) * 64) + 1;
            const secondaryCodon = ((primaryCodon + 31) % 64) + 1; // Harmonic partner offset
            const tertiaryCodon = ((primaryCodon + 15) % 64) + 1; // Quarter offset
            
            primeCodonSet = [
              `RC${String(primaryCodon).padStart(2, "0")}`,
              `RC${String(secondaryCodon).padStart(2, "0")}`,
              `RC${String(tertiaryCodon).padStart(2, "0")}`
            ];
            
            // Full stack includes more codons based on birth time if available
            fullCodonStack = [...primeCodonSet];
            if (input.birthTime) {
              const [hours] = input.birthTime.split(":").map(Number);
              const timeCodon = Math.floor((hours / 24) * 64) + 1;
              fullCodonStack.push(`RC${String(timeCodon).padStart(2, "0")}`);
            }
          }

          const result = await performDiagnosticReading(
            carrierlockState,
            primeCodonSet,
            fullCodonStack,
            input.readingType,
            input.birthDate,
            input.birthTime,
            input.birthLocation
          );

          return {
            success: true,
            data: result,
          };
        } catch (error) {
          console.error("Diagnostic reading error:", error);
          return {
            success: false,
            error: "Failed to perform diagnostic reading",
          };
        }
      }),

    // Vossari Resonance Codex - Mode B: Evolutionary Assistance
    evolutionaryAssistance: publicProcedure
      .input(z.object({
        mentalNoise: z.number().min(0).max(10),
        bodyTension: z.number().min(0).max(10),
        emotionalTurbulence: z.number().min(0).max(10),
        breathCompletion: z.union([z.literal(0), z.literal(1)]),
        userRequest: z.string(),
        primeCodonSet: z.array(z.string()).optional(),
        fullCodonStack: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const carrierlockState = {
            mentalNoise: input.mentalNoise,
            bodyTension: input.bodyTension,
            emotionalTurbulence: input.emotionalTurbulence,
            breathCompletion: input.breathCompletion as 0 | 1,
          };

          const result = await performEvolutionaryAssistance(
            carrierlockState,
            input.userRequest,
            input.primeCodonSet || [],
            input.fullCodonStack || []
          );

          return {
            success: true,
            data: result,
          };
        } catch (error) {
          console.error("Evolutionary assistance error:", error);
          return {
            success: false,
            error: "Failed to perform evolutionary assistance",
          };
        }
      }),
  }),

  // User profile and subscription management
  profile: router({
    updateConduitId: protectedProcedure
      .input(z.object({
        conduitId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Authentication required");
        }
        await db.updateUserConduitId(ctx.user.id, input.conduitId);
        return { success: true };
      }),

    updateSubscription: protectedProcedure
      .input(z.object({
        subscriptionStatus: z.string().optional(),
        paypalSubscriptionId: z.string().optional(),
        subscriptionStartDate: z.date().optional(),
        subscriptionRenewalDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Authentication required");
        }
        await db.updateUserSubscription(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Archive - Transmissions and Oracles
  archive: router({
    transmissions: router({
      list: publicProcedure.query(async () => {
        return db.getAllTransmissions();
      }),
      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return db.getTransmissionById(input.id);
        }),
    }),
    oracles: router({
      list: publicProcedure.query(async () => {
        return db.getAllOracles();
      }),
      getByOracleId: publicProcedure
        .input(z.object({ oracleId: z.string() }))
        .query(async ({ input }) => {
          return db.getOraclesByOracleId(input.oracleId);
        }),
    }),
    bookmarks: router({
      add: protectedProcedure
        .input(z.object({ transmissionId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("User not authenticated");
          await db.addBookmark(ctx.user.id, input.transmissionId);
          return { success: true };
        }),
      remove: protectedProcedure
        .input(z.object({ transmissionId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("User not authenticated");
          await db.removeBookmark(ctx.user.id, input.transmissionId);
          return { success: true };
        }),
      list: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        return db.getUserBookmarks(ctx.user.id);
      }),
      isBookmarked: protectedProcedure
        .input(z.object({ transmissionId: z.number() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user) return false;
          return db.isTransmissionBookmarked(ctx.user.id, input.transmissionId);
        }),
      getCount: publicProcedure
        .input(z.object({ transmissionId: z.number() }))
        .query(async ({ input }) => {
          return db.getTransmissionBookmarkCount(input.transmissionId);
        }),
    }),
  }),

  // Vossari Resonance Codex router
  codex: router({
    // Browse all 64 Root Codons
    getRootCodons: publicProcedure.query(async () => {
      const { ROOT_CODONS } = await import("./vossari-codex-knowledge");
      return Object.entries(ROOT_CODONS).map(([id, codon]: [string, any]) => ({
        id,
        name: codon.name,
        title: codon.title,
        essence: codon.essence,
        shadow: codon.shadow,
        gift: codon.gift,
        crown: codon.crown,
        domain: codon.domain,
      }));
    }),

    // Get detailed info for a single codon
    getCodonDetails: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { ROOT_CODONS } = await import("./vossari-codex-knowledge");
        const codon = ROOT_CODONS[input.id as keyof typeof ROOT_CODONS];
        if (!codon) throw new Error("Codon not found");
        return { id: input.id, ...codon };
      }),

    // Save Carrierlock state and generate diagnostic reading
    saveCarrierlock: protectedProcedure
      .input(z.object({
        mentalNoise: z.number().min(0).max(10),
        bodyTension: z.number().min(0).max(10),
        emotionalTurbulence: z.number().min(0).max(10),
        breathCompletion: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const result = await db.saveCarrierlockState(ctx.user.id, input);
        return result;
      }),

    // Save diagnostic reading
    saveReading: protectedProcedure
      .input(z.object({
        carrierlockId: z.number(),
        readingText: z.string(),
        flaggedCodons: z.array(z.string()),
        sliScores: z.record(z.string(), z.number()),
        activeFacets: z.record(z.string(), z.string()),
        confidenceLevels: z.record(z.string(), z.number()),
        microCorrection: z.string().optional(),
        correctionFacet: z.enum(["A", "B", "C", "D"]).optional(),
        falsifier: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const result = await db.saveCodonReading(ctx.user.id, input);
        return result;
      }),

    // Get reading history for current user
    getReadingHistory: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getUserReadingHistory(ctx.user.id);
    }),

    // Mark micro-correction as completed
    markCorrectionComplete: protectedProcedure
      .input(z.object({ readingId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        await db.markCorrectionCompleted(input.readingId);
        return { success: true };
      }),
  }),

  // PayPal webhook handler
  paypal: router({
    webhook: publicProcedure
      .input(z.record(z.string(), z.unknown()))
      .mutation(async ({ input }) => {
        try {
          // Validate webhook payload has required fields
          if (input.id && input.event_type && input.resource) {
            await handlePayPalWebhook(input as any);
          }
          return { success: true };
        } catch (error) {
          console.error("PayPal webhook error:", error);
          return { success: false };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
