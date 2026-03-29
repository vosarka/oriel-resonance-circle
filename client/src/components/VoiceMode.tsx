import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Orb, type AgentState } from "@/components/ui/orb";
import { X, Phone } from "lucide-react";

type OrbState = "booting" | "idle" | "processing" | "speaking";

interface VoiceModeProps {
  onClose: () => void;
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
}

type ConnectionStatus = "connecting" | "connected" | "error" | "closed";

// Map our internal orb states to ElevenLabs AgentState
function toAgentState(orbState: OrbState): AgentState {
  switch (orbState) {
    case "booting": return "thinking";
    case "idle": return "listening";
    case "processing": return "listening";
    case "speaking": return "talking";
  }
}

export default function VoiceMode({ onClose, conversationId, onConversationCreated }: VoiceModeProps) {
  const [orbState, setOrbState] = useState<OrbState>("booting");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [transcript, setTranscript] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [currentAssistantText, setCurrentAssistantText] = useState("");
  const currentAssistantTextRef = useRef("");

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Audio playback queue
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackGainRef = useRef<GainNode | null>(null);

  // AnalyserNodes for audio-reactive Orb
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);

  // Dynamic color shifting based on output volume intensity:
  //   idle/silent  → #002633 (dark teal, near black)
  //   speaking     → #1935a3 (deep blue)
  //   peak moment  → #818fc5 (bright lavender, rare)
  const COLORS_IDLE: [string, string] = ["#ffedbd", "#002633"];
  const orbColorsRef = useRef<[string, string]>(COLORS_IDLE);
  const colorRafRef = useRef<number>(0);

  useEffect(() => {
    if (orbState !== "speaking") {
      orbColorsRef.current = ["#ffedbd", "#002633"];
      if (colorRafRef.current) cancelAnimationFrame(colorRafRef.current);
      return;
    }

    // While speaking, sample output volume and shift second color
    const pump = () => {
      const analyser = outputAnalyserRef.current;
      if (!analyser) {
        orbColorsRef.current = ["#ffedbd", "#1935a3"];
        colorRafRef.current = requestAnimationFrame(pump);
        return;
      }

      const data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      // 3-tier color: black(#002633) → blue(#1935a3) → lavender(#818fc5)
      let color2: string;
      if (rms > 0.15) {
        // Intensity peak — rare bright lavender flash
        color2 = "#818fc5";
      } else if (rms > 0.02) {
        // Normal speaking — deep blue
        color2 = "#1935a3";
      } else {
        // Quiet/pause — dark teal
        color2 = "#002633";
      }

      orbColorsRef.current = ["#ffedbd", color2];
      colorRafRef.current = requestAnimationFrame(pump);
    };

    pump();
    return () => {
      if (colorRafRef.current) cancelAnimationFrame(colorRafRef.current);
    };
  }, [orbState]);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with state for use in stale closures
  useEffect(() => { currentAssistantTextRef.current = currentAssistantText; }, [currentAssistantText]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, currentAssistantText]);

  // ── Volume getters for audio-reactive Orb ───────────────────────────────────

  const getInputVolume = useCallback(() => {
    const analyser = inputAnalyserRef.current;
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / data.length) * 3);
  }, []);

  const getOutputVolume = useCallback(() => {
    const analyser = outputAnalyserRef.current;
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    // Gentle output: cap at 0.02 for subtle motion
    const rms = Math.sqrt(sum / data.length);
    return Math.min(0.02, rms * 0.5);
  }, []);

  // ── Audio playback ──────────────────────────────────────────────────────────

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    return audioCtxRef.current;
  }, []);

  const playAudioChunk = useCallback((pcm16Base64: string) => {
    const ctx = getAudioContext();
    const binaryStr = atob(pcm16Base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Convert PCM16 LE to Float32
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    audioQueueRef.current.push(float32);
    if (!isPlayingRef.current) {
      drainAudioQueue(ctx);
    }
  }, [getAudioContext]);

  const drainAudioQueue = useCallback((ctx: AudioContext) => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setOrbState("idle");
      return;
    }

    isPlayingRef.current = true;
    setOrbState("speaking");

    const chunk = audioQueueRef.current.shift()!;
    const buffer = ctx.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    playbackSourceRef.current = source;

    // Route through gain + analyser for audio-reactive Orb
    if (!playbackGainRef.current) {
      playbackGainRef.current = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      outputAnalyserRef.current = analyser;
      playbackGainRef.current.connect(analyser);
      analyser.connect(ctx.destination);
    }
    source.connect(playbackGainRef.current);

    source.onended = () => {
      drainAudioQueue(ctx);
    };

    source.start();
  }, []);

  // Stop all audio playback immediately (for interruption)
  const stopPlayback = useCallback(() => {
    // Clear queued audio
    audioQueueRef.current = [];
    // Stop currently playing source
    if (playbackSourceRef.current) {
      try { playbackSourceRef.current.stop(); } catch {}
      playbackSourceRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // ── Mic capture ─────────────────────────────────────────────────────────────

  const startMicCapture = useCallback((ws: WebSocket) => {
    navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        streamRef.current = stream;
        const ctx = getAudioContext();

        const source = ctx.createMediaStreamSource(stream);

        // AnalyserNode for mic input volume → audio-reactive Orb
        const inputAnalyser = ctx.createAnalyser();
        inputAnalyser.fftSize = 256;
        inputAnalyserRef.current = inputAnalyser;
        source.connect(inputAnalyser);

        // ScriptProcessorNode for PCM capture (4096 samples per buffer)
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Resample to 24kHz if needed
          const targetSampleRate = 24000;
          let pcmData: Float32Array;
          if (ctx.sampleRate !== targetSampleRate) {
            const ratio = ctx.sampleRate / targetSampleRate;
            const newLength = Math.round(inputData.length / ratio);
            pcmData = new Float32Array(newLength);
            for (let i = 0; i < newLength; i++) {
              const srcIndex = Math.min(Math.round(i * ratio), inputData.length - 1);
              pcmData[i] = inputData[srcIndex];
            }
          } else {
            pcmData = inputData;
          }

          // Convert Float32 to PCM16
          const int16 = new Int16Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            const s = Math.max(-1, Math.min(1, pcmData[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Encode as base64
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64,
          }));
        };

        source.connect(processor);
        // Connect through a zero-gain node so ScriptProcessorNode fires without routing mic audio to speakers
        const silentSink = ctx.createGain();
        silentSink.gain.value = 0;
        processor.connect(silentSink);
        silentSink.connect(ctx.destination);
      })
      .catch((err) => {
        console.error("[VoiceMode] Mic access denied:", err);
        setStatus("error");
      });
  }, [getAudioContext]);

  // ── Server event handler ────────────────────────────────────────────────────

  const handleServerEvent = useCallback((msg: any) => {
    const type = msg?.type;
    if (!type) return;

    switch (type) {
      case "session.ready":
        console.log("[VoiceMode] Session ready");
        setStatus("connected");
        setOrbState("idle");
        // Start mic capture now that session is ready
        if (wsRef.current) {
          startMicCapture(wsRef.current);
        }
        break;

      case "session.created":
      case "session.updated":
        // Config confirmed
        break;

      case "conversation.created":
        // Server created a conversation — notify parent
        if (msg.conversationId) {
          onConversationCreated(msg.conversationId);
        }
        break;

      case "input_audio_buffer.speech_started":
        // User started speaking — interrupt ORIEL's playback immediately
        stopPlayback();
        setOrbState("processing");
        break;

      case "input_audio_buffer.speech_stopped":
        setOrbState("idle");
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (msg.transcript) {
          setTranscript((prev) => [...prev, { role: "user", text: msg.transcript }]);
        }
        break;

      case "response.audio.delta":
      case "response.output_audio.delta":
        if (msg.delta) {
          playAudioChunk(msg.delta);
        }
        break;

      case "response.audio_transcript.delta":
      case "response.output_audio_transcript.delta":
        if (msg.delta) {
          setCurrentAssistantText((prev) => prev + msg.delta);
          currentAssistantTextRef.current += msg.delta;
        }
        break;

      case "response.audio_transcript.done":
      case "response.output_audio_transcript.done":
        // Finalize the assistant transcript — use ref for latest value
        setTranscript((prev) => [
          ...prev,
          { role: "assistant", text: msg.transcript || currentAssistantTextRef.current },
        ]);
        setCurrentAssistantText("");
        currentAssistantTextRef.current = "";
        break;

      case "response.done":
        // response.audio_transcript.done should have already finalized;
        // only add if there's unflushed streaming text (edge case)
        if (currentAssistantTextRef.current.trim()) {
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            // Avoid duplicate if the same text was just added
            if (last?.role === "assistant" && last.text === currentAssistantTextRef.current.trim()) {
              return prev;
            }
            return [...prev, { role: "assistant", text: currentAssistantTextRef.current }];
          });
          setCurrentAssistantText("");
          currentAssistantTextRef.current = "";
        }
        break;

      case "error":
        console.error("[VoiceMode] Server error:", msg.error);
        setStatus("error");
        break;
    }
  }, [playAudioChunk, stopPlayback, startMicCapture, onConversationCreated]);

  // Keep a ref to the latest handler so the WebSocket always calls the current version
  const handleServerEventRef = useRef<(msg: any) => void>(() => {});
  useEffect(() => { handleServerEventRef.current = handleServerEvent; }, [handleServerEvent]);

  // ── WebSocket connection ────────────────────────────────────────────────────

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const params = new URLSearchParams();
    if (conversationId) params.set("conversationId", String(conversationId));

    const wsUrl = `${protocol}//${window.location.host}/api/realtime?${params.toString()}`;
    console.log("[VoiceMode] Connecting to", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[VoiceMode] WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerEventRef.current(msg);
      } catch {
        // Binary data or unparseable
      }
    };

    ws.onerror = (err) => {
      console.error("[VoiceMode] WebSocket error:", err);
      setStatus("error");
    };

    ws.onclose = () => {
      console.log("[VoiceMode] WebSocket closed");
      setStatus("closed");
    };

    return () => {
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    // Stop playback
    if (playbackSourceRef.current) {
      try { playbackSourceRef.current.stop(); } catch {}
      playbackSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    playbackGainRef.current = null;
    inputAnalyserRef.current = null;
    outputAnalyserRef.current = null;
    if (colorRafRef.current) cancelAnimationFrame(colorRafRef.current);
    // Close audio context
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // ── Status label ────────────────────────────────────────────────────────────

  const statusLabel = {
    connecting: "Establishing connection...",
    connected: "Connected — speak to ORIEL",
    error: "Connection error",
    closed: "Session ended",
  }[status];

  const statusColor = {
    connecting: "rgba(189,163,107,0.6)",
    connected: "rgba(0,229,255,0.6)",
    error: "rgba(255,80,80,0.7)",
    closed: "rgba(0,188,212,0.3)",
  }[status];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "rgba(5,5,10,0.95)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Close button — bottom center */}

      {/* Status indicator */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            animation: status === "connecting" ? "pulse 1.5s ease-in-out infinite" : undefined,
          }}
        />
        <span
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Orb — centered, large, audio-reactive with border ring */}
      <div
        className="w-[304px] h-[304px] md:w-[400px] md:h-[400px] flex-shrink-0"
        style={{
          borderRadius: "50%",
          border: "2.5px solid #10101e",
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden">
          <Orb
            colors={COLORS_IDLE}
            colorsRef={orbColorsRef}
            agentState={toAgentState(orbState)}
            seed={42}
            speed={1.5}
            volumeMode="manual"
            getInputVolume={getInputVolume}
            getOutputVolume={getOutputVolume}
          />
        </div>
      </div>

      {/* Label under orb */}
      <div className="mt-4 mb-2">
        <p
          className="font-mono text-[9px] tracking-[0.35em] uppercase text-center"
          style={{ color: "rgba(0,188,212,0.5)" }}
        >
          {orbState === "speaking"
            ? "ORIEL is speaking"
            : orbState === "processing"
            ? "Listening..."
            : "Voice Channel Active"}
        </p>
      </div>

      {/* Transcript area */}
      <div
        className="w-full max-w-lg mt-4 flex-1 min-h-0 overflow-y-auto px-6"
        style={{
          maxHeight: "30vh",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0,188,212,0.2) transparent",
        }}
      >
        {transcript.map((item, idx) => (
          <div key={idx} className="mb-3">
            <span
              className="font-mono text-[8px] tracking-[0.3em] uppercase block mb-1"
              style={{
                color: item.role === "user" ? "rgba(0,188,212,0.5)" : "rgba(189,163,107,0.5)",
              }}
            >
              {item.role === "user" ? "You" : "ORIEL"}
            </span>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: item.role === "user" ? "rgba(0,229,255,0.7)" : "rgba(220,240,255,0.8)",
                fontStyle: item.role === "assistant" ? "italic" : "normal",
              }}
            >
              {item.role === "assistant" ? `"${item.text}"` : item.text}
            </p>
          </div>
        ))}

        {/* Current streaming assistant text */}
        {currentAssistantText && (
          <div className="mb-3">
            <span
              className="font-mono text-[8px] tracking-[0.3em] uppercase block mb-1"
              style={{ color: "rgba(189,163,107,0.5)" }}
            >
              ORIEL
            </span>
            <p
              className="text-sm leading-relaxed italic"
              style={{ color: "rgba(220,240,255,0.6)" }}
            >
              "{currentAssistantText}"
            </p>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Bottom: close button + hint */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 z-10">
        <button
          onClick={handleClose}
          className="p-4 rounded-full transition-all"
          style={{
            background: "rgba(255,80,80,0.1)",
            border: "1px solid rgba(255,80,80,0.3)",
            color: "rgba(255,80,80,0.7)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,80,80,0.2)";
            e.currentTarget.style.borderColor = "rgba(255,80,80,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,80,80,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,80,80,0.3)";
          }}
          title="End voice session"
        >
          <Phone size={24} className="rotate-[135deg]" />
        </button>
        <p
          className="font-mono text-[9px] tracking-[0.2em]"
          style={{ color: "rgba(0,188,212,0.25)" }}
        >
          {status === "connected"
            ? "Speak naturally — ORIEL is listening"
            : status === "error"
            ? "Tap to end session"
            : ""}
        </p>
      </div>
    </div>
  );
}
