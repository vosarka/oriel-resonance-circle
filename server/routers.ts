import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as gemini from "./gemini";
import { handlePayPalWebhook, PayPalWebhookPayload } from "./paypal-webhook";

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
        await db.updateArtifact(input.artifactId, {
          lore,
          imageUrl,
        });

        return {
          lore,
          imageUrl,
        };
      }),

    expandLore: publicProcedure
      .input(z.object({
        artifactId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const artifact = await db.getArtifactById(input.artifactId);
        if (!artifact || !artifact.lore) {
          throw new Error("Artifact or existing lore not found");
        }

        const expandedLore = await gemini.expandArtifactLore(artifact.name, artifact.lore);

        // Append to existing lore
        const updatedLore = `${artifact.lore}\n\n${expandedLore}`;
        await db.updateArtifact(input.artifactId, {
          lore: updatedLore,
        });

        return {
          lore: updatedLore,
        };
      }),
  }),

  // ORIEL chat interface
  oriel: router({
    chat: publicProcedure
      .input(z.object({
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get recent chat history for context (only if authenticated)
        let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        
        if (ctx.user) {
          const history = await db.getChatHistory(ctx.user.id, 10);
          conversationHistory = history
            .reverse()
            .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            }));
        }

        // Generate ORIEL's response
        const response = await gemini.chatWithORIEL(input.message, conversationHistory);

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
  }),

  // User profile and subscription management
  profile: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }
      return ctx.user;
    }),

    updateSubscriptionStatus: protectedProcedure
      .input(z.object({
        subscriptionStatus: z.enum(["free", "active", "cancelled", "expired"]),
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

    generateConduitId: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }
      
      // Generate a unique Conduit ID if not already present
      const conduitId = `CONDUIT-${ctx.user.id}-${Date.now().toString(36).toUpperCase()}`;
      await db.updateUserConduitId(ctx.user.id, conduitId);
      
      return { conduitId };
    }),
  }),

  // PayPal webhook handler
  paypal: router({
    webhook: publicProcedure
      .input(z.record(z.string(), z.any()))
      .mutation(async ({ input }) => {
        try {
          const payload = input as unknown as PayPalWebhookPayload;
          await handlePayPalWebhook(payload);
          return { success: true };
        } catch (error) {
          console.error("[PayPal Webhook] Error:", error);
          throw error;
        }
      }),
  })
});

export type AppRouter = typeof appRouter;
