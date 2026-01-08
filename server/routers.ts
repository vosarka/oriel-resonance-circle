import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as gemini from "./gemini";
import { handlePayPalWebhook, PayPalWebhookPayload } from "./paypal-webhook";
import { performDiagnosticReading, performEvolutionaryAssistance } from "./oriel-diagnostic-engine";

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
        const response = await gemini.chatWithORIEL(input.message, conversationHistory, userId);

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

    // Vossari Resonance Codex - Mode A: Diagnostic Reading
    diagnosticReading: publicProcedure
      .input(z.object({
        mentalNoise: z.number().min(0).max(10),
        bodyTension: z.number().min(0).max(10),
        emotionalTurbulence: z.number().min(0).max(10),
        breathCompletion: z.union([z.literal(0), z.literal(1)]),
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

          const result = await performDiagnosticReading(
            carrierlockState,
            input.primeCodonSet || [],
            input.fullCodonStack || []
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
