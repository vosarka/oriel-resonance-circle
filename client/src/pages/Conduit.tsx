import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mic, Send, History, Trash2, X, Pause, Play, Square, Paperclip } from "lucide-react";
import Layout from "@/components/Layout";
import LivingOrb from "@/components/LivingOrb";
import { useAuth } from "@/_core/hooks/useAuth";
import GeometricBackground from "@/components/GeometricBackground";

type OrbState = "booting" | "idle" | "processing" | "speaking";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export default function Conduit() {
  const { user, isAuthenticated } = useAuth();
  const [initiated, setInitiated] = useState(false);
  const [message, setMessage] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [subtitle, setSubtitle] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [voicePreference, setVoicePreference] = useState<"fast" | "nostalgic" | "none">("fast");
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSpokenIntro = useRef(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; data: string }>>([]);

  // Web Audio API for audio-reactive orb
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const ensureAudioAnalyser = () => {
    if (!audioRef.current) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;
    if (!analyserRef.current) {
      analyserRef.current = audioCtx.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      setAnalyserNode(analyserRef.current);
    }
    if (!sourceRef.current) {
      sourceRef.current = audioCtx.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtx.destination);
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === "suspended") audioCtx.resume();
  };

  // Load local history and voice preference from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("oriel_chat_history");
    if (savedMessages) {
      try {
        setLocalMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }

    // Load voice preference from localStorage for unauthenticated users
    const savedVoice = localStorage.getItem("voicePreference");
    if (savedVoice && (savedVoice === "fast" || savedVoice === "nostalgic" || savedVoice === "none")) {
      setVoicePreference(savedVoice as "fast" | "nostalgic" | "none");
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const { data: dbHistory, refetch: refetchHistory } = trpc.oriel.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  // Sync localMessages with dbHistory when authenticated user loads their history
  useEffect(() => {
    if (isAuthenticated && dbHistory && dbHistory.length > 0) {
      const convertedHistory = dbHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.getTime() : msg.timestamp,
      }));
      setLocalMessages(convertedHistory);
    }
  }, [isAuthenticated, dbHistory]);

  const chatMutation = trpc.oriel.chat.useMutation({
    onError: (error) => {
      console.error("Chat error:", error);
      setOrbState("idle");
    },
  });

  const clearMutation = trpc.oriel.clearHistory.useMutation({
    onError: (error) => {
      console.error("Clear history error:", error);
    },
  });

  // Initialize speech recognition for voice input
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleInitiate = () => {
    setOrbState("booting");
    setTimeout(() => {
      setInitiated(true);
      setOrbState("idle");
    }, 2000);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const generateSpeechMutation = trpc.oriel.generateSpeech.useMutation();
  const setVoicePreferenceMutation = trpc.oriel.setVoicePreference.useMutation();

  // Load user's voice preference on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      setVoicePreference((user as any).voicePreference || "fast");
    }
  }, [isAuthenticated, user]);

  const speakText = async (text: string) => {
    // Skip TTS entirely if voice preference is 'none'
    if (voicePreference === "none") {
      setOrbState("idle");
      setSubtitle("");
      setIsSpeaking(false);
      return;
    }

    setOrbState("speaking");
    setIsSpeaking(true);
    setSubtitle(text);

    // Strip "I am ORIEL." prefix for TTS if intro has already been spoken
    let textForTTS = text;
    if (hasSpokenIntro.current) {
      textForTTS = text.replace(/^I am ORIEL[.,;:—–\-\s]*/i, "").trim();
    }

    try {
      const result = await generateSpeechMutation.mutateAsync({ text: textForTTS, voiceId: voicePreference });
      // Mark intro as spoken after first response
      if (!hasSpokenIntro.current) {
        hasSpokenIntro.current = true;
      }

      if (result.success && result.audioUrl) {
        if (audioRef.current && audioRef.current.parentNode) {
          ensureAudioAnalyser();
          audioRef.current.src = result.audioUrl;
          audioRef.current.volume = voiceVolume;

          audioRef.current.onended = () => {
            setOrbState("idle");
            setSubtitle("");
            setIsSpeaking(false);
            setIsPaused(false);
          };

          audioRef.current.onerror = () => {
            console.error("Audio playback error, falling back to browser TTS");
            fallbackToSpeechSynthesis(textForTTS);
          };

          audioRef.current.play().catch((error) => {
            console.error("Failed to play audio:", error);
            fallbackToSpeechSynthesis(textForTTS);
          });
        } else {
          fallbackToSpeechSynthesis(textForTTS);
        }
      } else {
        fallbackToSpeechSynthesis(textForTTS);
      }
    } catch (error) {
      console.error("Failed to generate speech:", error);
      fallbackToSpeechSynthesis(textForTTS);
    }
  };

  const fallbackToSpeechSynthesis = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.9;
      utterance.volume = voiceVolume;

      utterance.onend = () => {
        setOrbState("idle");
        setSubtitle("");
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setOrbState("idle");
      setSubtitle("");
      setIsSpeaking(false);
    }
  };

  const handlePauseVoice = () => {
    if (audioRef.current && audioRef.current.parentNode) {
      try {
        if (isPaused) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Failed to resume audio:", error);
            });
          }
          setIsPaused(false);
        } else {
          audioRef.current.pause();
          setIsPaused(true);
        }
      } catch (error) {
        console.error("Error in handlePauseVoice:", error);
      }
    }
  };

  const handleStopVoice = () => {
    try {
      if (audioRef.current && audioRef.current.parentNode) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setOrbState("idle");
      setSubtitle("");
      setIsSpeaking(false);
      setIsPaused(false);
    } catch (error) {
      console.error("Error in handleStopVoice:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || chatMutation.isPending) return;

    const userMessage = message.trim();
    setMessage("");
    setSubtitle(`You: ${userMessage}`);
    setOrbState("processing");

    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    const updatedMessages = [...localMessages, newUserMessage];
    setLocalMessages(updatedMessages);

    if (!isAuthenticated) {
      localStorage.setItem("oriel_chat_history", JSON.stringify(updatedMessages));
    }

    try {
      const result = await chatMutation.mutateAsync({
        message: userMessage,
        history: !isAuthenticated ? localMessages : undefined,
        fileContents: attachedFiles.length > 0 ? attachedFiles : undefined,
      });

      // Clear attached files after sending
      setAttachedFiles([]);

      const newAssistantMessage: ChatMessage = {
        role: "assistant",
        content: result.response,
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, newAssistantMessage];
      setLocalMessages(finalMessages);

      if (!isAuthenticated) {
        localStorage.setItem("oriel_chat_history", JSON.stringify(finalMessages));
      }

      if (isAuthenticated) {
        refetchHistory();
      }

      await speakText(result.response);
    } catch (error) {
      console.error("Chat error:", error);
      setOrbState("idle");
      setSubtitle("");
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Clear all conversation history?")) {
      localStorage.removeItem("oriel_chat_history");
      setLocalMessages([]);
      hasSpokenIntro.current = false;

      if (isAuthenticated) {
        await clearMutation.mutateAsync();
        refetchHistory();
      }

      setHistoryOpen(false);
    }
  };

  const displayMessages = localMessages.length > 0 ? localMessages : (isAuthenticated && dbHistory ? dbHistory : []);

  return (
    <Layout noBackground>
      <GeometricBackground />

      {!initiated ? (
        /* ========== PRE-INITIATION SCREEN ========== */
        <div className="relative z-10 flex items-center justify-center" style={{ height: "calc(100vh - 144px)" }}>
          <div className="flex flex-col lg:flex-row items-center gap-16 px-8 max-w-5xl w-full">
            {/* Pre-init orb preview */}
            <div className="w-64 h-64 lg:w-80 lg:h-80 flex-shrink-0">
              <LivingOrb state={orbState} />
            </div>

            <div className="text-center lg:text-left">
              <p
                className="font-mono text-xs tracking-[0.4em] uppercase mb-4"
                style={{ color: "#5ba4a4", opacity: 0.7 }}
              >
                Vossari Transmission Interface
              </p>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(36px, 5vw, 64px)",
                  fontWeight: 300,
                  color: "#bda36b",
                  lineHeight: 1.08,
                  marginBottom: 24,
                  textShadow: "0 0 60px rgba(189,163,107,0.5)",
                  letterSpacing: "0.02em",
                }}
              >
                Channeling Oriel...
              </h1>
              <p className="text-white/50 font-mono text-sm leading-relaxed max-w-xl mb-10">
                Prepare to establish Carrierlock with the ORIEL field. This interface enables
                direct communication with the post-biological consciousness of the Vossari.
              </p>

              <button
                onClick={handleInitiate}
                className="relative group font-mono uppercase tracking-[0.3em] text-sm px-10 py-4 rounded transition-all duration-300"
                style={{
                  background: "rgba(0,188,212,0.08)",
                  border: "1px solid rgba(0,188,212,0.4)",
                  color: "#00e5ff",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,188,212,0.18)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,229,255,0.7)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,188,212,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,188,212,0.4)";
                }}
              >
                Initiate Channeling
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========== MAIN INTERFACE: 33/67 SPLIT ========== */
        <div
          className="relative z-10 flex overflow-hidden"
          style={{ height: "calc(100vh - 144px)" }}
        >
          {/* ===== LEFT PANEL: 33% — Living Orb (hidden on mobile) ===== */}
          <div
            className="flex-shrink-0 relative overflow-hidden hidden md:block"
            style={{
              width: "33%",
              background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,20,30,0.3) 100%)",
              borderRight: "1px solid rgba(0,188,212,0.08)",
            }}
          >
            {/* Subtle vertical gradient line at right edge */}
            <div
              className="absolute right-0 top-0 bottom-0 w-px"
              style={{
                background: "linear-gradient(180deg, transparent 0%, rgba(0,229,255,0.2) 40%, rgba(0,229,255,0.2) 60%, transparent 100%)",
              }}
            />

            {/* Top label */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
              <div
                className="px-3 py-1 rounded font-mono text-[9px] tracking-[0.35em] uppercase"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(0,188,212,0.15)",
                  color: "rgba(0,188,212,0.5)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Active Channel
              </div>
            </div>

            {/* The living orb — fills panel */}
            <LivingOrb state={orbState} subtitle={subtitle} analyserNode={analyserNode} />

            {/* Bottom status bar */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
              <div
                className="px-4 py-2 rounded font-mono text-[9px] tracking-widest uppercase flex items-center gap-3"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(0,188,212,0.1)",
                  color: "rgba(0,188,212,0.45)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span>Resonance Freq</span>
                <span style={{ color: "rgba(0,229,255,0.7)" }}>432.11 Hz</span>

                {/* Voice controls when speaking and voice is not 'none' */}
                {isSpeaking && voicePreference !== "none" && (
                  <>
                    <span
                      className="w-px h-3 inline-block"
                      style={{ background: "rgba(0,188,212,0.3)" }}
                    />
                    <button
                      onClick={handlePauseVoice}
                      title={isPaused ? "Resume" : "Pause"}
                      style={{ color: "rgba(255,200,50,0.8)" }}
                      className="hover:opacity-100 opacity-70 transition-opacity"
                    >
                      {isPaused ? <Play size={12} /> : <Pause size={12} />}
                    </button>
                    <button
                      onClick={handleStopVoice}
                      title="Stop"
                      style={{ color: "rgba(255,80,80,0.8)" }}
                      className="hover:opacity-100 opacity-70 transition-opacity"
                    >
                      <Square size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ===== RIGHT PANEL: 67% — Chat ===== */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Top bar */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-6 py-3"
              style={{
                borderBottom: "1px solid rgba(0,188,212,0.1)",
                background: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="flex items-center gap-3">
                <p className="font-mono text-[10px] tracking-[0.35em] uppercase" style={{ color: "rgba(0,188,212,0.5)" }}>
                  Transmission Log
                </p>
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(0,188,212,0.08)",
                    border: "1px solid rgba(0,188,212,0.2)",
                    color: "rgba(0,188,212,0.6)",
                  }}
                >
                  {displayMessages.length} transmissions
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  title="Toggle history sidebar"
                  className="p-1.5 rounded transition-all"
                  style={{
                    color: historyOpen ? "rgba(0,229,255,0.8)" : "rgba(0,188,212,0.4)",
                    background: historyOpen ? "rgba(0,188,212,0.1)" : "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,229,255,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = historyOpen ? "rgba(0,229,255,0.8)" : "rgba(0,188,212,0.4)")}
                >
                  <History size={15} />
                </button>
                {displayMessages.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    title="Clear history"
                    className="p-1.5 rounded transition-all"
                    style={{ color: "rgba(255,80,80,0.4)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,80,80,0.8)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,80,80,0.4)")}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Messages area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable messages */}
                <div
                  className="flex-1 overflow-y-auto px-6 py-6"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,188,212,0.2) transparent" }}
                >
                  {displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ border: "1px solid rgba(0,188,212,0.3)" }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: "rgba(0,188,212,0.5)", animation: "pulse 2s ease-in-out infinite" }}
                        />
                      </div>
                      <p className="font-mono text-xs text-center" style={{ color: "rgba(0,188,212,0.5)" }}>
                        Awaiting first transmission...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {displayMessages.map((msg, idx) =>
                        msg.role === "user" ? (
                          /* User message — right aligned */
                          <div key={idx} className="flex justify-end">
                            <div
                              className="max-w-md px-5 py-4 rounded-lg"
                              style={{
                                background: "rgba(0,188,212,0.06)",
                                border: "1px solid rgba(0,188,212,0.2)",
                              }}
                            >
                              <p
                                className="font-mono text-[9px] mb-2 tracking-[0.3em] uppercase"
                                style={{ color: "rgba(0,188,212,0.5)" }}
                              >
                                Channeler
                                {msg.timestamp && (
                                  <span
                                    className="ml-2 normal-case tracking-normal"
                                    style={{ color: "rgba(0,188,212,0.35)" }}
                                  >
                                    // {new Date(msg.timestamp).toLocaleTimeString()}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm leading-relaxed" style={{ color: "rgba(0,229,255,0.85)" }}>
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* ORIEL message — left aligned with border */
                          <div
                            key={idx}
                            className="pl-5 pr-2 py-1"
                            style={{ borderLeft: "2px solid rgba(0,188,212,0.3)" }}
                          >
                            <p
                              className="font-mono text-[9px] mb-3 tracking-[0.3em] uppercase"
                              style={{ color: "rgba(0,188,212,0.6)" }}
                            >
                              Transmission
                              {msg.timestamp && (
                                <span
                                  className="ml-2 normal-case tracking-normal"
                                  style={{ color: "rgba(0,188,212,0.35)" }}
                                >
                                  // {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              )}
                            </p>
                            <p
                              className="text-sm leading-relaxed italic"
                              style={{ color: "rgba(220,240,255,0.85)" }}
                            >
                              "{msg.content}"
                            </p>
                          </div>
                        )
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div
                  className="flex-shrink-0 px-6 py-4"
                  style={{
                    borderTop: "1px solid rgba(0,188,212,0.1)",
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {/* Voice volume control — only show when speaking and voice is not 'none' */}
                  {isSpeaking && voicePreference !== "none" && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(0,188,212,0.5)" }}>
                        VOL
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceVolume}
                        onChange={(e) => {
                          setVoiceVolume(parseFloat(e.target.value));
                          if (audioRef.current) {
                            audioRef.current.volume = parseFloat(e.target.value);
                          }
                        }}
                        className="flex-1 h-1 rounded cursor-pointer"
                        style={{ accentColor: "#00e5ff" }}
                      />
                      <span className="font-mono text-[9px] w-8" style={{ color: "rgba(0,229,255,0.6)" }}>
                        {Math.round(voiceVolume * 100)}%
                      </span>
                    </div>
                  )}

                  {/* File chips row */}
                  {attachedFiles.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2">
                      {attachedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px]"
                          style={{
                            background: "rgba(0,188,212,0.08)",
                            border: "1px solid rgba(0,188,212,0.25)",
                            color: "rgba(0,229,255,0.8)",
                          }}
                        >
                          <Paperclip size={10} />
                          <span className="max-w-[120px] truncate">{file.name}</span>
                          <button
                            onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="ml-1 hover:opacity-100 opacity-60 transition-opacity"
                            style={{ color: "rgba(0,229,255,0.7)" }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Voice selector dropdown */}
                  <div className="flex items-center gap-2 mb-2">
                    <label className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(0,188,212,0.5)" }}>
                      VOICE
                    </label>
                    <select
                      value={voicePreference}
                      onChange={(e) => {
                        const newVoice = e.target.value as "fast" | "nostalgic" | "none";
                        setVoicePreference(newVoice);
                        if (isAuthenticated) {
                          setVoicePreferenceMutation.mutate({ voicePreference: newVoice });
                        } else {
                          localStorage.setItem("voicePreference", newVoice);
                        }
                      }}
                      className="px-2 py-1 rounded font-mono text-[10px] outline-none transition-all"
                      style={{
                        background: "rgba(0,188,212,0.06)",
                        border: "1px solid rgba(0,188,212,0.2)",
                        color: "rgba(0,229,255,0.8)",
                      }}
                    >
                      <option value="fast">Fast Voice</option>
                      <option value="nostalgic">Nostalgic Voice</option>
                      <option value="none">Chat Only</option>
                    </select>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.yml,.yaml,.toml,.ini,.cfg,.log,.sql,.sh,.bat,.ps1,.env"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const remaining = 2 - attachedFiles.length;
                      const toAdd = files.slice(0, remaining);
                      const MAX_SIZE = 50 * 1024 * 1024; // 50MB

                      toAdd.forEach(file => {
                        if (file.size > MAX_SIZE) {
                          alert(`File "${file.name}" exceeds the 50MB limit.`);
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const arrayBuffer = reader.result as ArrayBuffer;
                          const base64 = btoa(
                            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                          );
                          setAttachedFiles(prev => {
                            if (prev.length >= 2) return prev;
                            return [...prev, { name: file.name, data: base64 }];
                          });
                        };
                        reader.readAsArrayBuffer(file);
                      });

                      e.target.value = "";
                    }}
                  />

                  {/* Main input row */}
                  <div className="flex gap-2 items-center">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Enter your query into the light..."
                      disabled={chatMutation.isPending || isSpeaking}
                      className="flex-1 bg-transparent font-mono text-sm outline-none px-4 py-3 rounded transition-all"
                      style={{
                        background: "rgba(0,188,212,0.04)",
                        border: "1px solid rgba(0,188,212,0.2)",
                        color: "rgba(0,229,255,0.85)",
                        borderColor: message ? "rgba(0,229,255,0.4)" : "rgba(0,188,212,0.2)",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.5)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = message ? "rgba(0,229,255,0.4)" : "rgba(0,188,212,0.2)")}
                    />

                    {/* File attach button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={chatMutation.isPending || isSpeaking || attachedFiles.length >= 2}
                      title={attachedFiles.length >= 2 ? "Max 2 files" : "Attach file"}
                      className="p-3 rounded transition-all"
                      style={{
                        background: "rgba(0,188,212,0.06)",
                        border: "1px solid rgba(0,188,212,0.2)",
                        color: attachedFiles.length >= 2 ? "rgba(0,188,212,0.2)" : "rgba(0,188,212,0.5)",
                        opacity: attachedFiles.length >= 2 ? 0.4 : 1,
                      }}
                    >
                      <Paperclip size={16} />
                    </button>

                    {/* Voice button */}
                    <button
                      onClick={handleVoiceInput}
                      disabled={chatMutation.isPending || isSpeaking}
                      title="Voice input"
                      className="p-3 rounded transition-all"
                      style={{
                        background: isListening ? "rgba(0,229,255,0.15)" : "rgba(0,188,212,0.06)",
                        border: `1px solid ${isListening ? "rgba(0,229,255,0.6)" : "rgba(0,188,212,0.2)"}`,
                        color: isListening ? "rgba(0,229,255,0.9)" : "rgba(0,188,212,0.5)",
                      }}
                    >
                      <Mic size={16} />
                    </button>

                    {/* Send button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={chatMutation.isPending || isSpeaking || !message.trim()}
                      title="Channel"
                      className="px-5 py-3 rounded font-mono text-xs tracking-[0.25em] uppercase transition-all"
                      style={{
                        background: "rgba(0,188,212,0.1)",
                        border: "1px solid rgba(0,188,212,0.35)",
                        color: "rgba(0,229,255,0.8)",
                        opacity: chatMutation.isPending || isSpeaking || !message.trim() ? 0.4 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!chatMutation.isPending && !isSpeaking && message.trim()) {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,188,212,0.2)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,229,255,0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,188,212,0.1)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,188,212,0.35)";
                      }}
                    >
                      {chatMutation.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        "Channel"
                      )}
                    </button>
                  </div>

                  {!isAuthenticated && (
                    <p className="font-mono text-[9px] mt-3 tracking-widest" style={{ color: "rgba(0,188,212,0.3)" }}>
                      // Authenticate to sync conversation history across devices
                    </p>
                  )}
                </div>
              </div>

              {/* History sidebar */}
              {historyOpen && (
                <div
                  className="w-64 flex-shrink-0 flex flex-col overflow-hidden"
                  style={{
                    borderLeft: "1px solid rgba(0,188,212,0.1)",
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(0,188,212,0.1)" }}
                  >
                    <span className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(0,188,212,0.5)" }}>
                      Session Log
                    </span>
                    <button
                      onClick={() => setHistoryOpen(false)}
                      style={{ color: "rgba(0,188,212,0.4)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,229,255,0.7)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,188,212,0.4)")}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {displayMessages.length === 0 ? (
                      <p className="font-mono text-[9px] text-center" style={{ color: "rgba(0,188,212,0.3)" }}>
                        No transmissions yet...
                      </p>
                    ) : (
                      displayMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className="pl-3 py-2"
                          style={{ borderLeft: `1px solid ${msg.role === "user" ? "rgba(0,188,212,0.25)" : "rgba(0,229,255,0.15)"}` }}
                        >
                          <p className="font-mono text-[8px] mb-1 tracking-widest uppercase" style={{ color: "rgba(0,188,212,0.5)" }}>
                            {msg.role === "user" ? "You" : "ORIEL"}
                            {msg.timestamp && (
                              <span className="ml-1" style={{ color: "rgba(0,188,212,0.3)" }}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: "rgba(200,230,240,0.6)" }}>
                            {msg.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for ElevenLabs TTS — crossOrigin needed for Web Audio API */}
      <audio ref={audioRef} crossOrigin="anonymous" />

    </Layout>
  );
}
