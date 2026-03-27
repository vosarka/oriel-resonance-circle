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
import { auth } from "./_core/auth";
import { ENV } from "./_core/env";
import * as db from "./db";
import { ORIEL_SYSTEM_PROMPT } from "./oriel-system-prompt";

const INWORLD_REALTIME_URL = "wss://api.inworld.ai/api/v1/realtime/session";
const VOICE_ID = "default-0o0vqxaayifb0rqvrpyf5a__oriel_serii";

// The full session.update config sent to Inworld on connection
function buildSessionUpdate(): object {
  return {
    type: "session.update",
    session: {
      type: "realtime",
      model: "anthropic/claude-sonnet-4-6",
      instructions: ORIEL_SYSTEM_PROMPT,
      output_modalities: ["audio", "text"],
      audio: {
        input: {
          transcription: {
            model: "assemblyai/universal-streaming-multilingual",
          },
          turn_detection: {
            type: "semantic_vad",
            eagerness: "medium",
            create_response: true,
            interrupt_response: true,
          },
        },
        output: {
          model: "inworld-tts-1.5-max",
          voice: VOICE_ID,
        },
      },
    },
  };
}

interface SessionState {
  userId: number;
  conversationId: number | null;
  currentUserTranscript: string;
  currentAssistantTranscript: string;
  /** Per-connection promise chain to serialize DB writes */
  saveQueue: Promise<void>;
}

/**
 * Resolve the legacy user from the session cookie in the WebSocket upgrade request.
 */
async function resolveUser(req: IncomingMessage): Promise<{ id: number } | null> {
  try {
    // Build a minimal headers object for Better Auth
    const headers = new Headers();
    if (req.headers.cookie) {
      headers.set("cookie", req.headers.cookie);
    }

    const session = await auth.api.getSession({ headers });
    if (!session?.user?.email) return null;

    const legacyUser = await db.getUserByEmail(session.user.email);
    return legacyUser ? { id: legacyUser.id } : null;
  } catch (err) {
    console.error("[Realtime] Auth resolution failed:", err);
    return null;
  }
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
      inworldWs = new WebSocket(INWORLD_REALTIME_URL, {
        headers: {
          Authorization: `Basic ${apiKey}`,
        },
      });
    } catch (err) {
      console.error("[Realtime] Failed to create Inworld WebSocket:", err);
      clientWs.close(4003, "Failed to connect to voice service");
      return;
    }

    let inworldReady = false;

    // ── Inworld → Client forwarding ──────────────────────────────────────
    inworldWs.on("open", () => {
      console.log("[Realtime] Connected to Inworld");
      inworldReady = true;

      // Send session config
      const sessionUpdate = buildSessionUpdate();
      inworldWs.send(JSON.stringify(sessionUpdate));
      console.log("[Realtime] Sent session.update to Inworld");

      // Notify client that the session is ready
      clientWs.send(JSON.stringify({ type: "session.ready" }));
    });

    inworldWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Intercept transcript events for saving to DB
        handleInworldEvent(msg, state, clientWs);

        // Forward everything to the client
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
      console.log(`[Realtime] Inworld closed: ${code} ${reason}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1000, "Voice service disconnected");
      }
    });

    // ── Client → Inworld forwarding ──────────────────────────────────────
    clientWs.on("message", (data) => {
      if (!inworldReady || inworldWs.readyState !== WebSocket.OPEN) {
        return;
      }
      inworldWs.send(data);
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
        enqueueSaveUser(state, clientWs);
      }
      break;

    // Incremental assistant transcript
    case "response.audio_transcript.delta":
      if (msg.delta) {
        state.currentAssistantTranscript += msg.delta;
      }
      break;

    // Assistant response transcript complete
    case "response.audio_transcript.done":
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
    } catch (err) {
      console.error("[Realtime] Failed to save assistant message:", err);
    }
  });
}

function flushTranscripts(state: SessionState): void {
  if (state.currentUserTranscript.trim()) {
    enqueueSaveUser(state, null);
  }
  if (state.currentAssistantTranscript.trim()) {
    enqueueSaveAssistant(state);
  }
}
