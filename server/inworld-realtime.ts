/**
 * Inworld Realtime API WebSocket Proxy
 *
 * Proxies WebSocket connections between the browser and Inworld's Realtime API
 * for speech-to-speech communication with ORIEL.
 *
 * Architecture:
 *   Browser <--WebSocket--> This Server <--WebSocket--> Inworld Realtime API
 *
 * The proxy keeps the INWORLD_API_KEY server-side and intercepts transcript
 * events to save conversations to the database.
 */

import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { parse as parseUrl } from "url";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./_core/auth";
import { ENV } from "./_core/env";
import * as db from "./db";
import { buildOrielPromptContext } from "./oriel-prompt-context";
import { buildVoiceResponseLanguageDirective } from "./oriel-language-routing";
import { buildOrielVoiceIntroRuntimeDirective } from "../shared/oriel/voice-intro";

const INWORLD_REALTIME_BASE = "wss://api.inworld.ai/api/v1/realtime/session";
const SOPHIANIC_VOICE_ID = "default-0o0vqxaayifb0rqvrpyf5a__oriel_fema";
const DEEP_VOICE_ID = "default-0o0vqxaayifb0rqvrpyf5a__oriel_serii";
const REALTIME_MODEL_ID = process.env.INWORLD_REALTIME_MODEL || "google-ai-studio/gemini-2.5-flash";
const STT_MODEL_ID = process.env.INWORLD_REALTIME_STT_MODEL || "assemblyai/whisper-rt";
const VOICE_TURN_STOP_DETECTION_MS = 500;

async function buildRealtimeInstructions(
  userId: number,
  userMessage?: string,
  voiceIntroAlreadySpoken = false,
): Promise<string> {
  const instructions = await buildOrielPromptContext({
    userId,
    userMessage,
    conversationHistory: [],
  });
  console.log(
    `[Realtime] Built instructions: ${instructions.length} chars ` +
    `(base + UMM${userMessage?.trim() ? " + field state" : ""})`,
  );

  return [
    instructions,
    buildVoiceResponseLanguageDirective(userMessage),
    buildOrielVoiceIntroRuntimeDirective(voiceIntroAlreadySpoken),
  ].join("\n\n");
}

// The full session.update config sent to Inworld on connection
async function buildSessionUpdate(
  userId: number,
  userMessage?: string,
  voiceIntroAlreadySpoken = false,
): Promise<object> {
  const instructions = await buildRealtimeInstructions(
    userId,
    userMessage,
    voiceIntroAlreadySpoken,
  );

  const user = await db.getUserById(userId);
  const selectedVoiceId = user?.voicePreference === "deep" ? DEEP_VOICE_ID : SOPHIANIC_VOICE_ID;

  return {
    type: "session.update",
    session: {
      type: "realtime",
      model: REALTIME_MODEL_ID,
      instructions,
      output_modalities: ["audio", "text"],
      audio: {
        input: {
          transcription: {
            model: STT_MODEL_ID,
            prompt: "The speaker may use Romanian or English. Transcribe Romanian accurately with diacritics when present, and preserve canonical terms such as ORIEL, Vos Arkana, Vossari, Carrierlock, Codex, and Resonance Operating System.",
          },
          turn_detection: {
            // Use server VAD only to detect turn boundaries, then trigger
            // the actual model response ourselves after a fixed pause.
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: VOICE_TURN_STOP_DETECTION_MS,
            create_response: false,
            interrupt_response: false,
          },
        },
        output: {
          model: "inworld-tts-1.5-max",
          voice: selectedVoiceId,
        },
      },
      providerData: {
        stt: {
          voice_profile: false,
        },
      },
    },
  };
}

async function refreshRealtimeInstructions(
  state: SessionState,
  inworldWs: WebSocket,
): Promise<void> {
  if (inworldWs.readyState !== WebSocket.OPEN) return;

  try {
    const sessionUpdate = await buildSessionUpdate(
      state.userId,
      state.latestUserTranscript || undefined,
      state.voiceIntroAlreadySpoken,
    );
    inworldWs.send(JSON.stringify(sessionUpdate));
  } catch (err) {
    console.error("[Realtime] Failed to refresh session instructions:", err);
  }
}

interface SessionState {
  userId: number;
  conversationId: number | null;
  currentUserTranscript: string;
  currentAssistantTranscript: string;
  latestUserTranscript: string;
  pendingUmmUserTranscript: string;
  voiceIntroAlreadySpoken: boolean;
  /** Per-connection promise chain to serialize DB writes */
  saveQueue: Promise<void>;
}

/**
 * Resolve the legacy user from the session cookie in the WebSocket upgrade request.
 */
async function resolveUser(req: IncomingMessage): Promise<{ id: number } | null> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user?.email) return null;

    const legacyUser = await db.getUserByEmail(session.user.email);
    return legacyUser ? { id: legacyUser.id } : null;
  } catch (err) {
    console.error("[Realtime] Auth resolution failed:", err);
    return null;
  }
}

function getInworldAuthorizationValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  return trimmed.toLowerCase().startsWith("basic ")
    ? trimmed
    : `Basic ${trimmed}`;
}

function isTruthyQueryFlag(value: unknown): boolean {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized === "1" || normalized === "true";
}

/**
 * Set up the WebSocket server for the Inworld Realtime proxy.
 * Attaches to the existing HTTP server, handling upgrades on /api/realtime.
 */
export function setupRealtimeWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname, query } = parseUrl(req.url || "", true);

    if (pathname !== "/api/realtime") {
      // Not our path — let other handlers (e.g. Vite HMR) deal with it
      return;
    }

    wss.handleUpgrade(req, socket, head, (clientWs) => {
      wss.emit("connection", clientWs, req, query);
    });
  });

  wss.on("connection", async (clientWs: WebSocket, req: IncomingMessage, query: Record<string, any>) => {
    console.log("[Realtime] New client connection");

    // ── Auth ──────────────────────────────────────────────────────────────
    const user = await resolveUser(req);
    if (!user) {
      console.warn("[Realtime] Unauthorized — closing");
      clientWs.close(4001, "Unauthorized");
      return;
    }

    // ── Validate conversation ownership ──────────────────────────────────
    let conversationId: number | null = null;
    if (query.conversationId) {
      const parsedId = parseInt(query.conversationId as string, 10);
      if (!isNaN(parsedId)) {
        const conv = await db.getConversationById(parsedId, user.id);
        if (conv) {
          conversationId = parsedId;
        } else {
          console.warn(`[Realtime] Conversation ${parsedId} not owned by user ${user.id}`);
          // Don't reject — just start a fresh conversation
        }
      }
    }

    // ── Session state ────────────────────────────────────────────────────
    const state: SessionState = {
      userId: user.id,
      conversationId,
      currentUserTranscript: "",
      currentAssistantTranscript: "",
      latestUserTranscript: "",
      pendingUmmUserTranscript: "",
      voiceIntroAlreadySpoken: isTruthyQueryFlag(query.voiceIntroAlreadySpoken),
      saveQueue: Promise.resolve(),
    };

    // ── Connect to Inworld ───────────────────────────────────────────────
    const apiKey = ENV.inworldApiKey;
    if (!apiKey) {
      console.error("[Realtime] INWORLD_API_KEY not set");
      clientWs.close(4002, "Server misconfigured");
      return;
    }

    let inworldWs: WebSocket;
    try {
      // Inworld requires key (session identifier) and protocol query params
      const sessionKey = `voice-${Date.now()}`;
      const inworldUrl = `${INWORLD_REALTIME_BASE}?key=${sessionKey}&protocol=realtime`;
      console.log("[Realtime] Connecting to Inworld:", inworldUrl);

      inworldWs = new WebSocket(inworldUrl, {
        headers: {
          Authorization: getInworldAuthorizationValue(apiKey),
        },
      });
    } catch (err) {
      console.error("[Realtime] Failed to create Inworld WebSocket:", err);
      clientWs.close(4003, "Failed to connect to voice service");
      return;
    }

    let inworldReady = false;
    let sessionConfigured = false;

    // ── Inworld → Client forwarding ──────────────────────────────────────
    inworldWs.on("open", () => {
      console.log("[Realtime] Connected to Inworld, waiting for session.created...");
      // Don't send session.update yet — wait for session.created from Inworld
    });

    inworldWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        console.log("[Realtime] ← Inworld event:", msg.type, msg.error ? JSON.stringify(msg.error) : "");

        // Handle session lifecycle events
        if (msg.type === "session.created" && !sessionConfigured) {
          // Inworld is ready — now send our session config with user context
          sessionConfigured = true;
          buildSessionUpdate(
            state.userId,
            undefined,
            state.voiceIntroAlreadySpoken,
          ).then((sessionUpdate) => {
            console.log("[Realtime] Sending session.update");
            inworldWs.send(JSON.stringify(sessionUpdate));
          }).catch((err) => {
            console.error("[Realtime] Failed to build session update:", err);
          });
          return; // Don't forward session.created to client
        }

        if (msg.type === "session.updated") {
          if (!inworldReady) {
            // Initial session config accepted — inject conversation history if resuming
            console.log("[Realtime] Session configured successfully");

            if (state.conversationId) {
              injectConversationHistory(state, inworldWs).then(() => {
                inworldReady = true;
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: "session.ready" }));
                }
              });
            } else {
              inworldReady = true;
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "session.ready" }));
              }
            }
          } else {
            console.log("[Realtime] Session instructions refreshed");
          }
          return; // Don't forward session.updated to client
        }

        if (msg.type === "error") {
          console.error("[Realtime] Inworld error event:", JSON.stringify(msg));
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: "error",
              error: msg.error?.message || msg.message || "Voice service error",
            }));
          }
        }

        // Intercept transcript events for saving to DB
        handleInworldEvent(msg, state, clientWs);

        // Forward everything else to the client
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data.toString());
        }
      } catch {
        // Binary or unparseable — forward raw
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data);
        }
      }
    });

    inworldWs.on("error", (err) => {
      console.error("[Realtime] Inworld WebSocket error:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", error: "Voice service error" }));
      }
    });

    inworldWs.on("close", (code, reason) => {
      console.log(`[Realtime] Inworld closed: ${code} ${reason.toString()}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: "error",
          error: `Voice service disconnected (${code})${reason ? `: ${reason.toString()}` : ""}`,
        }));
        clientWs.close(1000, "Voice service disconnected");
      }
    });

    // ── Client → Inworld forwarding ──────────────────────────────────────
    clientWs.on("message", (data) => {
      if (!inworldReady || inworldWs.readyState !== WebSocket.OPEN) {
        return;
      }

      const payload = data.toString();
      try {
        const msg = JSON.parse(payload);
        if (msg?.type === "response.create") {
          state.voiceIntroAlreadySpoken = state.voiceIntroAlreadySpoken || msg.voiceIntroAlreadySpoken === true;
          void (async () => {
            await refreshRealtimeInstructions(state, inworldWs);
            if (inworldWs.readyState === WebSocket.OPEN) {
              const { voiceIntroAlreadySpoken: _voiceIntroAlreadySpoken, ...responseCreate } = msg;
              inworldWs.send(JSON.stringify(responseCreate));
            }
          })();
          return;
        }
      } catch {
        // Non-JSON payloads are forwarded below.
      }

      // Inworld requires text frames (JSON), not binary — convert Buffer to string
      inworldWs.send(payload);
    });

    clientWs.on("close", () => {
      console.log("[Realtime] Client disconnected");
      // Save any remaining transcripts (chained onto the queue)
      flushTranscripts(state);
      if (inworldWs.readyState === WebSocket.OPEN) {
        inworldWs.close();
      }
    });

    clientWs.on("error", (err) => {
      console.error("[Realtime] Client WebSocket error:", err);
      if (inworldWs.readyState === WebSocket.OPEN) {
        inworldWs.close();
      }
    });
  });

  console.log("[Realtime] WebSocket proxy ready on /api/realtime");
}

// ── Event interception for transcript saving ─────────────────────────────────

function handleInworldEvent(msg: any, state: SessionState, clientWs: WebSocket): void {
  const type = msg?.type;
  if (!type) return;

  switch (type) {
    // User's speech has been transcribed
    case "conversation.item.input_audio_transcription.completed":
      if (msg.transcript) {
        state.currentUserTranscript = msg.transcript;
        state.latestUserTranscript = msg.transcript;
        state.pendingUmmUserTranscript = msg.transcript;
        enqueueSaveUser(state, clientWs);
      }
      break;

    // Incremental assistant transcript
    case "response.audio_transcript.delta":
    case "response.output_audio_transcript.delta":
      if (msg.delta) {
        state.currentAssistantTranscript += msg.delta;
      }
      break;

    // Assistant response transcript complete
    case "response.audio_transcript.done":
    case "response.output_audio_transcript.done":
      if (msg.transcript) {
        state.currentAssistantTranscript = msg.transcript;
      }
      enqueueSaveAssistant(state);
      break;

    // Alternative: full response done
    case "response.done":
      // If we have an unsaved assistant transcript, save it
      if (state.currentAssistantTranscript.trim()) {
        enqueueSaveAssistant(state);
      }
      break;
  }
}

/**
 * Enqueue a user message save onto the per-connection promise chain.
 * Captures and clears the transcript before awaiting I/O to prevent races.
 */
function enqueueSaveUser(state: SessionState, clientWs: WebSocket | null): void {
  const content = state.currentUserTranscript.trim();
  state.currentUserTranscript = "";
  if (!content) return;

  state.saveQueue = state.saveQueue.then(async () => {
    try {
      // Auto-create conversation on first message
      if (!state.conversationId) {
        const title = content.length > 60 ? content.substring(0, 57) + "..." : content;
        const conv = await db.createConversation(state.userId, title);
        state.conversationId = conv?.id ?? null;
        console.log(`[Realtime] Created conversation ${state.conversationId}`);

        // Notify client so it can update its sidebar
        if (state.conversationId && clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: "conversation.created",
            conversationId: state.conversationId,
          }));
        }
      }

      await db.saveChatMessage({
        userId: state.userId,
        conversationId: state.conversationId,
        role: "user",
        content,
      });
      console.log(`[Realtime] Saved user message (${content.length} chars)`);
    } catch (err) {
      console.error("[Realtime] Failed to save user message:", err);
    }
  });
}

/**
 * Enqueue an assistant message save onto the per-connection promise chain.
 * Captures and clears the transcript before awaiting I/O to prevent races.
 */
function enqueueSaveAssistant(state: SessionState): void {
  const content = state.currentAssistantTranscript.trim();
  const pendingUserMessage = state.pendingUmmUserTranscript.trim();
  state.currentAssistantTranscript = "";
  if (!content || !state.conversationId) return;

  state.saveQueue = state.saveQueue.then(async () => {
    try {
      await db.saveChatMessage({
        userId: state.userId,
        conversationId: state.conversationId,
        role: "assistant",
        content,
      });
      console.log(`[Realtime] Saved assistant message (${content.length} chars)`);

      if (pendingUserMessage) {
        try {
          const { recordOrielRuntimeObservation } = await import("./oriel-autonomy-observer");
          await recordOrielRuntimeObservation({
            source: "voice_realtime",
            userId: state.userId,
            conversationId: state.conversationId,
            userMessage: pendingUserMessage,
            assistantResponse: content,
            conversationHistory: [],
          });
        } catch (err) {
          console.error("[Realtime] Runtime observation failed:", err);
        }

        try {
          const { processConversationThroughUMM } = await import("./oriel-umm");
          await processConversationThroughUMM(state.userId, pendingUserMessage, content);
          state.pendingUmmUserTranscript = "";
        } catch (err) {
          console.error("[Realtime] UMM processing failed:", err);
        }
      }
    } catch (err) {
      console.error("[Realtime] Failed to save assistant message:", err);
    }
  });
}

/**
 * Load previous conversation messages from the DB and inject them into the
 * Inworld session so ORIEL has context from earlier exchanges (text or voice).
 */
async function injectConversationHistory(state: SessionState, inworldWs: WebSocket): Promise<void> {
  if (!state.conversationId) return;

  try {
    const messages = await db.getConversationMessages(state.conversationId, state.userId);
    if (!messages || messages.length === 0) {
      console.log("[Realtime] No prior messages to inject");
      return;
    }

    // Limit to the most recent messages to avoid overwhelming the context
    const recentMessages = messages.slice(-50);
    console.log(`[Realtime] Injecting ${recentMessages.length} messages as conversation history`);

    for (const msg of recentMessages) {
      const event = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: msg.role === "assistant" ? "assistant" : "user",
          content: [
            {
              type: "input_text",
              text: msg.content,
            },
          ],
        },
      };
      inworldWs.send(JSON.stringify(event));
    }

    console.log("[Realtime] Conversation history injected");
  } catch (err) {
    console.error("[Realtime] Failed to inject conversation history:", err);
  }
}

function flushTranscripts(state: SessionState): void {
  if (state.currentUserTranscript.trim()) {
    enqueueSaveUser(state, null);
  }
  if (state.currentAssistantTranscript.trim()) {
    enqueueSaveAssistant(state);
  }
}
