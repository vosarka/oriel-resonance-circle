import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as gemini from "./gemini";
import { chatWithORIELMistral } from "./mistral-oriel";
import { handlePayPalWebhook, PayPalWebhookPayload } from "./paypal-webhook";
import { performDiagnosticReading, performEvolutionaryAssistance } from "./oriel-diagnostic-engine";
import { generateChunkedSpeech, audioToDataUrl } from "./inworld-tts";
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
    /** Returns the currently authenticated user (from the legacy users table) */
    me: publicProcedure.query(opts => {
      const u = opts.ctx.user;
      if (!u) return null;
      // Strip sensitive fields before sending to client
      const { passwordHash: _ph, googleId: _gid, ...safe } = u as any;
      return safe;
    }),
    /**
     * Logout is now handled by Better Auth at POST /api/auth/sign-out.
     * This tRPC endpoint is kept as a convenience wrapper.
     */
    logout: publicProcedure.mutation(async ({ ctx }) => {
      // Better Auth manages session cookies — just signal success
      // The client will call authClient.signOut() which hits Better Auth directly
      return { success: true } as const;
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
    // ── Conversation management ──
    listConversations: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      // Auto-migrate orphaned messages (pre-conversation-system) into a conversation
      await db.migrateOrphanedMessages(ctx.user.id);
      return db.getUserConversations(ctx.user.id);
    }),

    getConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) return null;
        const conversation = await db.getConversationById(input.id, ctx.user.id);
        if (!conversation) return null;
        const messages = await db.getConversationMessages(input.id, ctx.user.id);
        return { ...conversation, messages };
      }),

    deleteConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Authentication required");
        await db.deleteConversation(input.id, ctx.user.id);
        return { success: true };
      }),

    chat: publicProcedure
      .input(z.object({
        message: z.string(),
        conversationId: z.number().optional(),
        createNewConversation: z.boolean().optional().default(false),
        history: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })).optional(),
        fileContents: z.array(z.object({
          name: z.string(),
          data: z.string(), // base64-encoded file data
        })).max(2).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        if (ctx.user && input.conversationId) {
          // Load history from the specific conversation
          const history = await db.getConversationMessages(input.conversationId, ctx.user.id);
          conversationHistory = history.slice(-6).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            // Truncate old assistant messages — full text causes the LLM to parrot them
            content: msg.role === 'assistant' && msg.content.length > 300
              ? msg.content.substring(0, 300) + '...'
              : msg.content,
          }));
        } else if (ctx.user) {
          // New conversation: start with empty history.
          // UMM context (injected into system prompt) provides cross-conversation memory.
          conversationHistory = [];
        } else if (input.history && input.history.length > 0) {
          conversationHistory = input.history;
        }

        // Build the full message with file contents prepended as context
        let fullMessage = input.message;
        if (input.fileContents && input.fileContents.length > 0) {
          const { extractTextFromFile } = await import('./file-parser');
          const extractions = await Promise.all(
            input.fileContents.map(async (f) => {
              const text = await extractTextFromFile(f.name, f.data);
              return `--- FILE: ${f.name} ---\n${text}\n--- END FILE ---`;
            })
          );
          const fileBlocks = extractions.join('\n\n');
          fullMessage = `The user has attached ${input.fileContents.length} file(s) for context. Read and analyze them to answer the query.\n\n${fileBlocks}\n\nUser query: ${input.message}`;
        }

        // Trim conversation history to avoid context flooding
        // Long ORIEL responses (letters, readings) can push the current message
        // too far down the context, causing the LLM to fixate on old content
        const { trimConversationHistory, deduplicateConsecutiveMessages } = await import('./response-deduplication');
        conversationHistory = deduplicateConsecutiveMessages(conversationHistory) as Array<{ role: 'user' | 'assistant'; content: string }>;
        conversationHistory = trimConversationHistory(conversationHistory, 8) as Array<{ role: 'user' | 'assistant'; content: string }>;

        // ── RGP Bridge: detect birth reading requests and inject real data ──
        try {
          const { extractBirthData, runRGPForChat } = await import('./oriel-rgp-bridge');
          const birthData = extractBirthData(fullMessage, conversationHistory);
          if (birthData) {
            console.log('[ORIEL] Birth reading detected:', birthData);
            const rgpResult = await runRGPForChat(birthData);
            if (rgpResult.success) {
              console.log('[ORIEL] RGP engine ran successfully — injecting real data');
              fullMessage = `${fullMessage}\n\n${rgpResult.summary}`;
            } else {
              console.warn('[ORIEL] RGP engine failed:', rgpResult.summary);
            }
          }
        } catch (err) {
          console.warn('[ORIEL] RGP bridge error (non-fatal):', err);
        }

        // Helper to call the active LLM — Gemini primary, Mistral fallback
        const callLLM = async (
          msg: string,
          history: typeof conversationHistory,
          options?: { temperature?: number },
        ) => {
          try {
            const geminiResponse = await gemini.chatWithORIEL(msg, history, ctx.user?.id, options);
            if (
              geminiResponse === "The signal is disrupted. Please try again in a moment." &&
              process.env.MISTRAL_API_KEY
            ) {
              console.log("[ORIEL] Gemini returned disruption sentinel, falling back to Mistral...");
              return await chatWithORIELMistral(msg, history, ctx.user?.id);
            }
            return geminiResponse;
          } catch (geminiErr) {
            console.error("[ORIEL] Gemini failed:", geminiErr);
            if (process.env.MISTRAL_API_KEY) {
              console.log("[ORIEL] Falling back to Mistral...");
              return await chatWithORIELMistral(msg, history, ctx.user?.id);
            }
            throw geminiErr;
          }
        };

        let response = await callLLM(fullMessage, conversationHistory);

        // Deduplication with retry loop (max 2 retries, temperature escalation)
        if (conversationHistory.some(m => m.role === 'assistant')) {
          const { detectDuplication } = await import('./response-deduplication');
          const MAX_RETRIES = 2;
          const TEMPERATURE_ESCALATION = [1.2, 1.5];

          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const dupCheck = detectDuplication(response, conversationHistory);
            if (!dupCheck.isDuplicate) break;

            const isStructural = dupCheck.duplicateFrom === 'structural';
            console.warn(
              `[ORIEL] ${isStructural ? 'Structural' : 'Content'} duplicate detected ` +
              `(${(dupCheck.similarity * 100).toFixed(0)}% similar), ` +
              `retry ${attempt + 1}/${MAX_RETRIES}`
            );

            // Build summary of recent responses so LLM knows what to avoid
            const recentAssistant = conversationHistory
              .filter(m => m.role === 'assistant')
              .slice(-2);
            const summaries = recentAssistant.map((m, i) => {
              const paragraphs = m.content.split(/\n\n+/).filter(p => p.trim()).length;
              const lastSentence = m.content.trim().split(/[.!?]\s+/).pop()?.trim() || '';
              return `Response ${i + 1}: ${paragraphs} paragraphs, ended with: "${lastSentence.substring(0, 60)}"`;
            });
            const summaryBlock = summaries.length > 0
              ? `\nYour recent responses looked like this: ${summaries.join('; ')}. Do NOT repeat these patterns.`
              : '';

            const systemNote = isStructural
              ? `[SYSTEM NOTE: Your response has the same structure as your recent messages ` +
                `(same paragraph count, same closing pattern). Change your structure entirely: ` +
                `use a different number of paragraphs, open differently, close differently. ` +
                `If you ended with a question last time, end with a statement. ` +
                `If you wrote 3 paragraphs, write 1 or 5.${summaryBlock}]`
              : `[SYSTEM NOTE: Your previous response covered similar ground. ` +
                `Approach from a completely different angle — different metaphors, ` +
                `different structure, different depth. Do not rephrase your earlier answer. ` +
                `Say something you have NOT said yet.${summaryBlock}]`;

            const freshMsg = `${fullMessage}\n\n${systemNote}`;
            response = await callLLM(freshMsg, conversationHistory, {
              temperature: TEMPERATURE_ESCALATION[attempt],
            });
          }
        }

        let conversationId = input.conversationId ?? null;

        if (ctx.user) {
          // Create a conversation only when explicitly requested by client
          if (!conversationId && input.createNewConversation) {
            const title = input.message.length > 60
              ? input.message.substring(0, 57) + '...'
              : input.message;
            const conv = await db.createConversation(ctx.user.id, title);
            conversationId = conv?.id ?? null;
          }

          await db.saveChatMessage({ userId: ctx.user.id, conversationId, role: "user", content: input.message });
          await db.saveChatMessage({ userId: ctx.user.id, conversationId, role: "assistant", content: response });

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

        return { response, conversationId };
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
        text: z.string().min(1, "Text is required").max(20000, "Text too long for TTS"),
        voiceId: z.enum(["sophianic", "deep", "none"]).optional().default("sophianic"),
      }))
      .mutation(async ({ input }) => {
        try {
          // If voiceId is 'none', skip TTS entirely
          if (input.voiceId === "none") {
            console.log("[generateSpeech] Voice disabled, skipping TTS");
            return {
              success: true,
              audioUrl: null,
            };
          }

          console.log("[generateSpeech] Starting TTS generation for text:", input.text.substring(0, 100), `(${input.text.length} chars) with voiceId: ${input.voiceId}`);

          let audioBase64: string;
          let audioUrl: string;

          // Both voices use Inworld TTS with different voice IDs
          const { INWORLD_VOICES } = await import("./inworld-tts");
          const inworldVoice = input.voiceId === "deep"
            ? INWORLD_VOICES.deep
            : INWORLD_VOICES.sophianic;
          audioBase64 = await generateChunkedSpeech(input.text, inworldVoice);
          audioUrl = audioToDataUrl(audioBase64);

          console.log("[generateSpeech] Audio generated successfully, size:", audioBase64.length);
          return {
            success: true,
            audioUrl,
          };
        } catch (error) {
          const internalMsg = error instanceof Error ? error.message : String(error);
          console.error("[generateSpeech] Failed to generate speech:", internalMsg);
          // Map known errors; never leak internal details to client
          const knownErrors: Record<string, string> = {
            "ECONNREFUSED": "Voice service is temporarily unavailable",
            "ETIMEDOUT": "Voice service timed out",
            "rate limit": "Voice service rate limit reached, please try again shortly",
          };
          const clientMsg = Object.entries(knownErrors).find(([key]) =>
            internalMsg.toLowerCase().includes(key.toLowerCase())
          )?.[1] ?? "Text-to-Speech generation failed";
          return {
            success: false,
            error: clientMsg,
          };
        }
      }),

    // Mutation to save user's voice preference
    setVoicePreference: protectedProcedure
      .input(z.object({
        voicePreference: z.enum(["sophianic", "deep", "none"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Authentication required");
        }
        try {
          await db.updateUserVoicePreference(ctx.user.id, input.voicePreference);
          return { success: true, voicePreference: input.voicePreference };
        } catch (error) {
          console.error("[setVoicePreference] Failed to save preference:", error);
          throw new Error("Failed to save voice preference");
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
            // Use actual days in year (365 or 366) to avoid out-of-bounds on leap years
            const year = birthDateObj.getFullYear();
            const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
            const primaryCodon = Math.min(64, Math.floor((dayOfYear / daysInYear) * 64) + 1);
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
      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return db.getOracleById(input.id);
        }),
      getByOracleId: publicProcedure
        .input(z.object({ oracleId: z.string() }))
        .query(async ({ input }) => {
          return db.getOraclesByOracleId(input.oracleId);
        }),
      getByThread: publicProcedure
        .input(z.object({ threadId: z.string() }))
        .query(async ({ input }) => {
          return db.getOraclesByThread(input.threadId);
        }),
      threads: publicProcedure.query(async () => {
        return db.getThreadsWithProgress();
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
    resonances: router({
      add: protectedProcedure
        .input(z.object({ oracleId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("User not authenticated");
          await db.addOracleResonance(ctx.user.id, input.oracleId);
          return { success: true };
        }),
      remove: protectedProcedure
        .input(z.object({ oracleId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("User not authenticated");
          await db.removeOracleResonance(ctx.user.id, input.oracleId);
          return { success: true };
        }),
      isResonated: protectedProcedure
        .input(z.object({ oracleId: z.string() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user) return false;
          return db.isOracleResonated(ctx.user.id, input.oracleId);
        }),
      getCount: publicProcedure
        .input(z.object({ oracleId: z.string() }))
        .query(async ({ input }) => {
          return db.getOracleResonanceCount(input.oracleId);
        }),
      getUserResonated: protectedProcedure
        .query(async ({ ctx }) => {
          if (!ctx.user) return [];
          return db.getResonatedOracleIds(ctx.user.id);
        }),
    }),
  }),

  // Vossari Resonance Codex router
  codex: router({
    // Browse all 64 Root Codons — sourced from Vossari Codons 64x256facets.json
    getRootCodons: publicProcedure.query(async () => {
      const { getCodonEntry } = await import("./vrc-codon-library");
      const result = [];
      for (let i = 1; i <= 64; i++) {
        const c = getCodonEntry(i);
        if (c) {
          result.push({
            id: `RC${String(i).padStart(2, '0')}`,
            numericId: i,
            name: c.name,
            title: c.traditional_name,
            essence: c.somatic_marker,
            shadow: c.frequency.shadow,
            gift: c.frequency.gift,
            crown: c.frequency.siddhi,
            domain: c.archetype_role,
            binary: c.binary,
          });
        }
      }
      return result;
    }),

    // Get full codon data — sourced from JSON + Engine Constants + Mandala position
    // Accepts: "38", "RC38", "RC01", "38-A" (facet suffix stripped automatically)
    getCodonDetails: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { getCodonEntry } = await import("./vrc-codon-library");
        const { getChannelsForCodon } = await import("./vrc-engine-constants");
        const { VRC_MANDALA, WHEEL_OFFSET, CODON_ARC } = await import("./vrc-mandala");

        // Normalise: strip "RC" prefix and optional "-A"/"-B"/"-C"/"-D" facet suffix
        const raw = input.id.replace(/^RC/i, '').replace(/-[A-Da-d]$/, '');
        const numericId = parseInt(raw, 10);
        if (isNaN(numericId) || numericId < 1 || numericId > 64) {
          throw new Error("Codon not found");
        }

        const c = getCodonEntry(numericId);

        // Fallback: if codon library is unavailable, create a basic entry
        const codon = c || {
          id: numericId,
          code: `RC${String(numericId).padStart(2, '0')}`,
          name: `Codon ${numericId}`,
          traditional_name: `Codon ${numericId}`,
          binary: '000000',
          chemical_marker: 'Unknown',
          archetype_role: 'Unknown',
          somatic_marker: 'Unknown',
          frequency: {
            shadow: 'Shadow aspect',
            shadow_desc: 'The distorted expression of this codon',
            gift: 'Gift aspect',
            gift_desc: 'The healthy expression of this codon',
            siddhi: 'Siddhi aspect',
            siddhi_desc: 'The transcendent expression of this codon'
          },
          facets: {
            A: { title: 'Somatic', degrees: '0-1.40625°', description: 'Physical anchor', shadow_manifestation: 'Physical distortion', micro_correction: 'Ground in the body', resonance_keys: [] },
            B: { title: 'Relational', degrees: '1.40625-2.8125°', description: 'Interaction field', shadow_manifestation: 'Relational distortion', micro_correction: 'Connect authentically', resonance_keys: [] },
            C: { title: 'Cognitive', degrees: '2.8125-4.21875°', description: 'Mental processing', shadow_manifestation: 'Mental distortion', micro_correction: 'Clarify thinking', resonance_keys: [] },
            D: { title: 'Transpersonal', degrees: '4.21875-5.625°', description: 'Spirit/collective', shadow_manifestation: 'Spiritual distortion', micro_correction: 'Align with source', resonance_keys: [] }
          }
        };

        // Mandala position: slot index + degree range
        const slotIndex = VRC_MANDALA.indexOf(numericId);
        const startDeg = (WHEEL_OFFSET + slotIndex * CODON_ARC) % 360;
        const endDeg = (startDeg + CODON_ARC) % 360;

        // Pre-selected facet from URL suffix (e.g. "38-A" → "A")
        const facetSuffix = input.id.match(/-([A-Da-d])$/)?.[1]?.toUpperCase() ?? null;

        // Channels that include this codon
        const channels = getChannelsForCodon(numericId);

        return {
          // Backwards-compat fields (CodonDetail still uses codon.id, codon.shadow, etc.)
          id: `RC${String(codon.id).padStart(2, '0')}`,
          name: codon.name,
          title: codon.traditional_name,
          essence: codon.facets.A.description,
          shadow: codon.frequency.shadow,
          gift: codon.frequency.gift,
          crown: codon.frequency.siddhi,
          domain: codon.archetype_role,
          // Rich JSON fields
          numericId: codon.id,
          traditional_name: codon.traditional_name,
          binary: codon.binary,
          chemical_marker: codon.chemical_marker,
          archetype_role: codon.archetype_role,
          somatic_marker: codon.somatic_marker,
          frequency: codon.frequency,
          facets: codon.facets,
          // Derived
          channels,
          mandalaSlot: slotIndex,
          startDegree: +startDeg.toFixed(4),
          endDegree: +endDeg.toFixed(4),
          initialFacet: facetSuffix,
        };
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
        coreCodonEngine: z.unknown().optional(),
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
        const sig = await db.getStaticSignature(input.readingId);
        if (!sig) return null;
        if (sig.userId !== ctx.user.id) throw new Error("Unauthorized");
        return sig;
      }),

    // Get a static signature by numeric ID
    getStaticReadingById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const sig = await db.getStaticSignatureById(input.id);
        if (!sig) return null;
        if (sig.userId !== ctx.user.id) throw new Error("Unauthorized");
        return sig;
      }),

    // Get all static signatures for current user
    getStaticReadings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getUserStaticSignatures(ctx.user.id);
    }),

    // Get recent Carrierlock history for the current user
    getCoherenceHistory: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(30).default(10) }).optional())
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        return db.getCarrierlockHistory(ctx.user.id, input?.limit ?? 10);
      }),

    // Get profile sigil data: fractal role, VRC type, Lumens (points)
    getProfileSigil: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      const [sig, readingCount] = await Promise.all([
        db.getLatestStaticSignature(ctx.user.id),
        db.getReadingCount(ctx.user.id),
      ]);
      const donated: number = (ctx.user as any).donated || 0;
      const lumens = Math.floor(donated) + (readingCount * 5);
      return {
        fractalRole: sig?.fractalRole || sig?.vrcType || null,
        vrcType: sig?.vrcType || null,
        vrcAuthority: sig?.authorityNode || sig?.vrcAuthority || null,
        primeCodonName: (sig?.primeStack as any)?.[0]?.codonName || null,
        lumens,
        readingCount,
        donated,
      };
    }),

    // Get a single codon (dynamic) reading by ID
    getCodonReading: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const reading = await db.getCodonReadingById(input.id);
        if (!reading) return null;
        if (reading.userId !== ctx.user.id) throw new Error("Unauthorized");
        return reading;
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

  // ── Admin Dashboard ─────────────────────────────────────────────────────────
  admin: router({
    transmissions: router({
      list: adminProcedure.query(async () => {
        return db.getAllTransmissions();
      }),

      create: adminProcedure
        .input(z.object({
          title: z.string().min(1),
          field: z.string().min(1),
          coreMessage: z.string().min(1),
          tags: z.string().min(1),
          microSigil: z.string().min(1),
          signalClarity: z.string().default("98.7%"),
          channelStatus: z.enum(["OPEN", "RESONANT", "COHERENT", "PROPHETIC", "LIVE", "STABLE", "HIGH COHERENCE", "MAXIMUM COHERENCE", "CRITICAL / STABLE"]).default("OPEN"),
          encodedArchetype: z.string().optional(),
          leftPanelPrompt: z.string().optional(),
          centerPanelPrompt: z.string().optional(),
          rightPanelPrompt: z.string().optional(),
          hashtags: z.string().optional(),
          cycle: z.string().default("FOUNDATION ARC"),
          status: z.enum(["Draft", "Confirmed", "Deprecated", "Mythic"]).default("Confirmed"),
        }))
        .mutation(async ({ input }) => {
          const nextNum = await db.getNextTxNumber();
          const txId = `TX-${String(nextNum).padStart(4, "0")}`;
          await db.createTransmission({
            txId,
            txNumber: nextNum,
            ...input,
          });
          return { success: true, txId, txNumber: nextNum };
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          field: z.string().min(1).optional(),
          coreMessage: z.string().min(1).optional(),
          tags: z.string().optional(),
          microSigil: z.string().optional(),
          signalClarity: z.string().optional(),
          channelStatus: z.enum(["OPEN", "RESONANT", "COHERENT", "PROPHETIC", "LIVE", "STABLE", "HIGH COHERENCE", "MAXIMUM COHERENCE", "CRITICAL / STABLE"]).optional(),
          encodedArchetype: z.string().optional(),
          leftPanelPrompt: z.string().optional(),
          centerPanelPrompt: z.string().optional(),
          rightPanelPrompt: z.string().optional(),
          hashtags: z.string().optional(),
          cycle: z.string().optional(),
          status: z.enum(["Draft", "Confirmed", "Deprecated", "Mythic"]).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateTransmission(id, data);
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteTransmission(input.id);
          return { success: true };
        }),
    }),

    oracles: router({
      list: adminProcedure.query(async () => {
        return db.getAllOracles();
      }),

      create: adminProcedure
        .input(z.object({
          part: z.enum(["Past", "Present", "Future"]),
          title: z.string().min(1),
          field: z.string().min(1),
          content: z.string().min(1),
          signalClarity: z.string().default("95.2%"),
          channelStatus: z.enum(["OPEN", "RESONANT", "PROPHETIC", "LIVE"]).default("OPEN"),
          currentFieldSignatures: z.string().optional(),
          encodedTrajectory: z.string().optional(),
          convergenceZones: z.string().optional(),
          keyInflectionPoint: z.string().optional(),
          majorOutcomes: z.string().optional(),
          visualStyle: z.string().optional(),
          hashtags: z.string().optional(),
          linkedCodons: z.string().optional(),
          threadId: z.string().optional(),
          threadTitle: z.string().optional(),
          threadOrder: z.number().optional(),
          threadSynthesis: z.string().optional(),
          status: z.enum(["Draft", "Confirmed", "Deprecated", "Prophetic"]).default("Confirmed"),
          oracleId: z.string().optional(),
          oracleNumber: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          const { oracleId: inputOracleId, oracleNumber: inputOracleNumber, ...data } = input;
          const oracleNumber = inputOracleNumber ?? await db.getNextOracleNumber();
          const oracleId = inputOracleId || `OX-${String(oracleNumber).padStart(4, "0")}`;
          await db.createOracle({
            oracleId,
            oracleNumber,
            ...data,
          });
          return { success: true, oracleId, oracleNumber };
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          field: z.string().min(1).optional(),
          content: z.string().min(1).optional(),
          part: z.enum(["Past", "Present", "Future"]).optional(),
          signalClarity: z.string().optional(),
          channelStatus: z.enum(["OPEN", "RESONANT", "PROPHETIC", "LIVE"]).optional(),
          currentFieldSignatures: z.string().optional(),
          encodedTrajectory: z.string().optional(),
          convergenceZones: z.string().optional(),
          keyInflectionPoint: z.string().optional(),
          majorOutcomes: z.string().optional(),
          visualStyle: z.string().optional(),
          hashtags: z.string().optional(),
          linkedCodons: z.string().optional(),
          threadId: z.string().optional(),
          threadTitle: z.string().optional(),
          threadOrder: z.number().optional(),
          threadSynthesis: z.string().optional(),
          status: z.enum(["Draft", "Confirmed", "Deprecated", "Prophetic"]).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateOracle(id, data);
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteOracle(input.id);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
