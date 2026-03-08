/**
 * useOrielVoice — Speech-to-speech hook for ORIEL via Inworld Realtime
 *
 * Connects to /api/voice/oriel-realtime (our server-side WS proxy to Inworld).
 * Captures mic audio as PCM16 @ 24kHz via AudioWorklet.
 * Receives PCM16 audio delta events and plays them back in real time.
 */

import { useRef, useState, useCallback, useEffect } from "react";

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "listening"
  | "speaking"
  | "error";

interface UseOrielVoiceReturn {
  status: VoiceStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
}

// Decode base64 PCM16 → Float32 samples for Web Audio playback
function pcm16ToFloat32(base64: string): Float32Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer as ArrayBuffer);
  const float32 = new Float32Array(int16.length) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

export function useOrielVoice(): UseOrielVoiceReturn {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Playback queue — PCM16 delta chunks from Inworld
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  const schedulePcm = useCallback((float32: Float32Array<ArrayBuffer>) => {
    const ctx = playbackCtxRef.current;
    if (!ctx) return;
    const buf = ctx.createBuffer(1, float32.length, 24000);
    buf.copyToChannel(float32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextPlayTimeRef.current);
    src.start(startAt);
    nextPlayTimeRef.current = startAt + buf.duration;

    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      setStatus("speaking");
    }
    src.onended = () => {
      // Only go back to ready if nothing else queued soon
      setTimeout(() => {
        if (
          playbackCtxRef.current &&
          nextPlayTimeRef.current <= playbackCtxRef.current.currentTime + 0.05
        ) {
          isPlayingRef.current = false;
          setStatus("ready");
        }
      }, 100);
    };
  }, []);

  const handleMessage = useCallback(
    (raw: string) => {
      try {
        const event = JSON.parse(raw);
        switch (event.type) {
          case "session.created":
          case "session.updated":
            setStatus("ready");
            break;

          case "response.audio.delta":
            if (event.delta) schedulePcm(pcm16ToFloat32(event.delta));
            break;

          case "input_audio_buffer.speech_started":
            setStatus("listening");
            break;

          case "input_audio_buffer.speech_stopped":
            setStatus("speaking");
            break;

          case "error":
            console.error("[OrielVoice] Server error:", event.error);
            setError(event.error?.message ?? "Voice error");
            setStatus("error");
            break;
        }
      } catch {
        // non-JSON message — ignore
      }
    },
    [schedulePcm]
  );

  const connect = useCallback(async () => {
    if (wsRef.current) return;
    setStatus("connecting");
    setError(null);

    try {
      // Init playback AudioContext at 24kHz
      playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayTimeRef.current = 0;

      // WebSocket to our proxy
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${proto}//${window.location.host}/api/voice/oriel-realtime`;
      console.log("[OrielVoice] Connecting to", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          console.log("[OrielVoice] ←", msg.type, JSON.stringify(msg).slice(0, 120));
        } catch { /* binary */ }
        handleMessage(ev.data);
      };
      ws.onerror = (e) => {
        console.error("[OrielVoice] WebSocket error", e);
        setError("Connection failed");
        setStatus("error");
      };
      ws.onclose = (e) => {
        console.log("[OrielVoice] WebSocket closed", e.code, e.reason);
        setStatus("idle");
        wsRef.current = null;
      };

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => { console.log("[OrielVoice] WS open"); resolve(); };
        setTimeout(() => reject(new Error("WS timeout after 8s")), 8000);
      });

      // Init capture AudioContext at 24kHz
      console.log("[OrielVoice] Loading AudioWorklet...");
      audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      await audioCtxRef.current.audioWorklet.addModule("/pcm-processor.js");
      console.log("[OrielVoice] AudioWorklet loaded");
      workletNodeRef.current = new AudioWorkletNode(
        audioCtxRef.current,
        "pcm-processor"
      );

      // PCM16 chunks → WebSocket
      let chunkCount = 0;
      workletNodeRef.current.port.onmessage = (ev: MessageEvent) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        if (chunkCount === 0) console.log("[OrielVoice] First audio chunk sending...");
        chunkCount++;
        const pcm16Buffer: ArrayBuffer = ev.data;
        const bytes = new Uint8Array(pcm16Buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64,
          })
        );
      };

      setStatus("ready");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect";
      setError(msg);
      setStatus("error");
    }
  }, [handleMessage]);

  const startListening = useCallback(async () => {
    if (!audioCtxRef.current || !workletNodeRef.current) return;

    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 24000, echoCancellation: true },
      });
      micSourceRef.current = audioCtxRef.current.createMediaStreamSource(
        micStreamRef.current
      );
      micSourceRef.current.connect(workletNodeRef.current);
      audioCtxRef.current.resume();
      setStatus("listening");
    } catch {
      setError("Microphone access denied");
      setStatus("error");
    }
  }, []);

  const stopListening = useCallback(() => {
    micSourceRef.current?.disconnect();
    micSourceRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "input_audio_buffer.commit" })
      );
    }
    setStatus("ready");
  }, []);

  const disconnect = useCallback(() => {
    stopListening();
    wsRef.current?.close();
    wsRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    playbackCtxRef.current?.close();
    playbackCtxRef.current = null;
    workletNodeRef.current = null;
    isPlayingRef.current = false;
    setStatus("idle");
    setError(null);
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => () => disconnect(), [disconnect]);

  return { status, error, connect, disconnect, startListening, stopListening };
}
