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
import { rgpRouter } from "./rgp-router";
import { geocodeCity, getTimezoneForCoords } from "./geocoding";
import { formatOrielResponse, generateOrielGreeting, generateMicroCorrectionMessage, generateFalsifierMessage, ORIEL_SYSTEM_PROMPT } from "./oriel-system-prompt";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  rgp: rgpRouter,

  geo: router({
    geocode: publicProcedure
      .input(z.object({ city: z.string().min(1) }))
      .query(async ({ input }) => {
        const { displayName, latitude, longitude } = await geocodeCity(input.city);
        const { tzId, offsetHours } = getTimezoneForCoords(latitude, longitude, new Date());
        return { displayName, latitude, longitude, tzId, offsetHours };
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => {
      const u = opts.ctx.user;
      if (!u) return null;
      const { passwordHash: _ph, googleId: _gid, ...safe } = u as any;
      return safe;
    }),
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
        let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        if (ctx.user) {
          const history = await db.getChatHistory(ctx.user.id, 10);
          conversationHistory = history.reverse().map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));
        } else if (input.history && input.history.length > 0) {
          conversationHistory = input.history;
        }

        const response = await gemini.chatWithORIEL(input.message, conversationHistory, ctx.user?.id);

        if (ctx.user) {
          await db.saveChatMessage({ userId: ctx.user.id, role: "user", content: input.message });
          await db.saveChatMessage({ userId: ctx.user.id, role: "assistant", content: response });

          const uid = ctx.user.id;
          (async () => {
            try {
              const { processConversationThroughUMM } = await import('./oriel-umm');
              await processConversationThroughUMM(uid, input.message, response);
            } catch (err) {
              console.error('[oriel.chat] UMM processing failed:', err);
            }
          })();
        }

        return { response };
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

    getGreeting: publicProcedure.query(() => ({
      greeting: generateOrielGreeting(),
    })),

    searchArchive: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().min(1).max(10).default(5) }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: ORIEL_SYSTEM_PROMPT },
              { role: "user", content: `Search the Vossari Archive for: "${input.query}". Return up to ${input.limit} results with their IDs, titles, status, and version. Format as a structured list.` },
            ],
          });
          const content = typeof response.choices?.[0]?.message?.content === 'string' ? response.choices[0].message.content : "";
          return { success: true, results: formatOrielResponse('librarian', content) };
        } catch (error) {
          console.error("ORIEL search error:", error);
          return { success: false, error: "Failed to search archive" };
        }
      }),

    getPathway: publicProcedure
      .input(z.object({
        receiverStatus: z.enum(["newcomer", "receiver", "archivist", "operator"]).default("newcomer"),
        coherenceScore: z.number().min(0).max(100).optional(),
        interest: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: ORIEL_SYSTEM_PROMPT },
              { role: "user", content: `Generate a guided pathway for a ${input.receiverStatus} with coherence score ${input.coherenceScore || 'unknown'}${input.interest ? ` interested in ${input.interest}` : ''}. Suggest 3-5 next steps in order.` },
            ],
          });
          const content = typeof response.choices?.[0]?.message?.content === 'string' ? response.choices[0].message.content : "";
          return { success: true, pathway: formatOrielResponse('guide', content) };
        } catch (error) {
          console.error("ORIEL pathway error:", error);
          return { success: false, error: "Failed to generate pathway" };
        }
      }),

    interpretReading: publicProcedure
      .input(z.object({
        coherenceScore: z.number().min(0).max(100),
        primaryCodon: z.string(),
        shadowPattern: z.string(),
        dominantFacet: z.enum(["A", "B", "C", "D"]),
        microCorrection: z.object({ center: z.string(), facet: z.string(), action: z.string(), duration: z.string(), rationale: z.string() }),
        falsifiers: z.array(z.object({ claim: z.string(), testCondition: z.string(), falsifiedElement: z.string() })),
      }))
      .mutation(async ({ input }) => {
        try {
          return {
            success: true,
            interpretation: formatOrielResponse('mirror', generateMicroCorrectionMessage(input.microCorrection), { coherenceScore: input.coherenceScore }),
            falsifiers: generateFalsifierMessage(input.falsifiers),
          };
        } catch (error) {
          console.error("ORIEL interpretation error:", error);
          return { success: false, error: "Failed to interpret reading" };
        }
      }),

    generateTransmission: publicProcedure
      .input(z.object({
        transmissionId: z.string(),
        style: z.enum(["poetic", "clinical", "narrative", "ritual"]).default("narrative"),
        length: z.enum(["short", "medium", "long"]).default("medium"),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: ORIEL_SYSTEM_PROMPT },
              { role: "user", content: `Generate a ${input.style} transmission for ID ${input.transmissionId} in ${input.length} form. Maintain the Vossari voice and aesthetic.` },
            ],
          });
          const content = typeof response.choices?.[0]?.message?.content === 'string' ? response.choices[0].message.content : "";
          return { success: true, transmission: formatOrielResponse('narrator', content) };
        } catch (error) {
          console.error("ORIEL transmission error:", error);
          return { success: false, error: "Failed to generate transmission" };
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

    // Save a full static signature reading (structured RGP data)
    saveStaticReading: protectedProcedure
      .input(z.object({
        carrierlockId: z.number().optional(),
        readingId: z.string(),
        birthDate: z.string(),
        birthTime: z.string().default(""),
        birthCity: z.string().default(""),
        birthCountry: z.string().default(""),
        latitude: z.number().default(0),
        longitude: z.number().default(0),
        timezoneId: z.string().optional(),
        timezoneOffset: z.number().optional(),
        primeStack: z.unknown().optional(),
        ninecenters: z.unknown().optional(),
        fractalRole: z.string().optional(),
        authorityNode: z.string().optional(),
        vrcType: z.string().optional(),
        vrcAuthority: z.string().optional(),
        circuitLinks: z.unknown().optional(),
        baseCoherence: z.number().optional(),
        coherenceTrajectory: z.unknown().optional(),
        microCorrections: z.unknown().optional(),
        ephemerisData: z.unknown().optional(),
        houses: z.unknown().optional(),
        diagnosticTransmission: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        return db.saveStaticSignature(ctx.user.id, input);
      }),

    // Get a static signature by reading ID
    getStaticReading: protectedProcedure
      .input(z.object({ readingId: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        return db.getStaticSignature(input.readingId);
      }),

    // Get a static signature by numeric ID
    getStaticReadingById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        return db.getStaticSignatureById(input.id);
      }),

    // Get all static signatures for current user
    getStaticReadings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getUserStaticSignatures(ctx.user.id);
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
