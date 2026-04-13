import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Mic, Trash2, X, Pause, Play, Square, Paperclip, Plus, MessageSquare, Menu, Phone } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Orb } from "@/components/ui/orb";
import GeometricBackground from "@/components/GeometricBackground";
import VoiceMode from "@/components/VoiceMode";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export default function Conduit() {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [voicePreference, setVoicePreference] = useState<"sophianic" | "deep" | "none">("sophianic");
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSpokenIntro = useRef(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; data: string }>>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isNewConversation, setIsNewConversation] = useState(false);

  // Web Audio API for TTS playback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

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
    }
    if (!sourceRef.current) {
      sourceRef.current = audioCtx.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtx.destination);
    }
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

    const savedVoice = localStorage.getItem("voicePreference");
    if (savedVoice) {
      const mapped = savedVoice === "fast" ? "sophianic" : savedVoice === "nostalgic" ? "deep" : savedVoice;
      if (mapped === "sophianic" || mapped === "deep" || mapped === "none") {
        setVoicePreference(mapped);
        if (mapped !== savedVoice) localStorage.setItem("voicePreference", mapped);
      }
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

  const { data: conversationsList, refetch: refetchConversations } = trpc.oriel.listConversations.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: activeConvData, refetch: refetchActiveConv } = trpc.oriel.getConversation.useQuery(
    { id: activeConversationId! },
    { enabled: isAuthenticated && activeConversationId !== null, retry: false }
  );

  const deleteConversationMutation = trpc.oriel.deleteConversation.useMutation({
    onSuccess: () => {
      refetchConversations();
    },
  });

  useEffect(() => {
    if (!isAuthenticated || isNewConversation || activeConversationId !== null) return;
    if (!conversationsList || conversationsList.length === 0) return;
    setActiveConversationId(conversationsList[0].id);
  }, [isAuthenticated, isNewConversation, activeConversationId, conversationsList]);

  // Sync localMessages with active conversation or general history
  useEffect(() => {
    if (isAuthenticated && activeConversationId && activeConvData?.messages) {
      const convertedHistory = activeConvData.messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.getTime() : (msg.timestamp as number),
      }));
      setLocalMessages(convertedHistory);
    } else if (
      isAuthenticated &&
      !activeConversationId &&
      !isNewConversation &&
      conversationsList &&
      conversationsList.length === 0 &&
      dbHistory &&
      dbHistory.length > 0
    ) {
      const convertedHistory = dbHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.getTime() : msg.timestamp,
      }));
      setLocalMessages(convertedHistory);
    }
  }, [isAuthenticated, dbHistory, activeConvData, activeConversationId, isNewConversation, conversationsList]);

  const chatMutation = trpc.oriel.chat.useMutation({
    onError: (error) => {
      console.error("Chat error:", error);

    },
  });

  // Initialize speech recognition
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

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

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
      const raw = (user as any).voicePreference;
      const mapped = raw === "fast" ? "sophianic" : raw === "nostalgic" ? "deep" : raw;
      setVoicePreference(mapped === "sophianic" || mapped === "deep" || mapped === "none" ? mapped : "sophianic");
    }
  }, [isAuthenticated, user]);

  const speakText = async (text: string) => {
    if (voicePreference === "none") {


      setIsSpeaking(false);
      return;
    }


    setIsSpeaking(true);


    let textForTTS = text;
    if (hasSpokenIntro.current) {
      textForTTS = text.replace(/^I am ORIEL[.,;:—–\-\s]*/i, "").trim();
    }

    try {
      const result = await generateSpeechMutation.mutateAsync({ text: textForTTS, voiceId: voicePreference });
      if (!hasSpokenIntro.current) hasSpokenIntro.current = true;

      if (result.success && result.audioUrl) {
        if (audioRef.current && audioRef.current.parentNode) {
          ensureAudioAnalyser();
          audioRef.current.src = result.audioUrl;
          audioRef.current.volume = voiceVolume;

          audioRef.current.onended = () => {
      
      
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
  
  
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {


      setIsSpeaking(false);
    }
  };

  const handlePauseVoice = () => {
    if (!audioRef.current) {
      // speechSynthesis fallback path
      if ("speechSynthesis" in window) {
        if (isPaused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else {
          window.speechSynthesis.pause();
          setIsPaused(true);
        }
      }
      return;
    }
    try {
      if (isPaused) {
        audioRef.current.play().catch(error => console.error("Failed to resume audio:", error));
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Error in handlePauseVoice:", error);
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
        conversationId: activeConversationId ?? undefined,
        createNewConversation: isAuthenticated && isNewConversation,
        history: !isAuthenticated ? localMessages : undefined,
        fileContents: attachedFiles.length > 0 ? attachedFiles : undefined,
      });

      setAttachedFiles([]);

      if (result.conversationId && (!activeConversationId || isNewConversation)) {
        setActiveConversationId(result.conversationId);
        setIsNewConversation(false);
      }

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
        refetchConversations();
        if (result.conversationId) {
          refetchActiveConv();
        }
      }

      await speakText(result.response);
    } catch (error) {
      console.error("Chat error:", error);

    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setIsNewConversation(true);
  };

  const displayMessages = localMessages.length > 0 ? localMessages : (isAuthenticated && dbHistory && !isNewConversation ? dbHistory : []);

  return (
    <Layout noBackground hideFooter>
      <GeometricBackground />

      {/* Voice Mode overlay */}
      {voiceMode && (
        <VoiceMode
          onClose={() => {
            setVoiceMode(false);
            refetchConversations();
            refetchHistory();
            refetchActiveConv();
          }}
          conversationId={activeConversationId}
          onConversationCreated={(id) => {
            setActiveConversationId(id);
            setIsNewConversation(false);
          }}
        />
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative z-10 flex" style={{ height: "calc(100vh - 64px)" }}>
        {/* ===== LEFT SIDEBAR ===== */}
        <aside
          className={`
            fixed md:relative z-30 md:z-auto
            w-72 flex-shrink-0 flex flex-col
            transform transition-transform duration-200 md:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{
            height: "calc(100vh - 64px)",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(0,188,212,0.1)",
          }}
        >
          {/* Sidebar header */}
          <div
            className="flex-shrink-0 p-3"
            style={{ borderBottom: "1px solid rgba(0,188,212,0.1)" }}
          >
            <button
              onClick={() => {
                handleNewConversation();
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-[10px] tracking-[0.2em] uppercase transition-all"
              style={{
                background: "rgba(0,188,212,0.06)",
                border: "1px solid rgba(0,188,212,0.2)",
                color: "rgba(0,229,255,0.8)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,188,212,0.12)";
                e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,188,212,0.06)";
                e.currentTarget.style.borderColor = "rgba(0,188,212,0.2)";
              }}
            >
              <Plus size={14} />
              New Conversation
            </button>
          </div>

          {/* Conversation list */}
          <div
            className="flex-1 overflow-y-auto p-3 space-y-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,188,212,0.2) transparent" }}
          >
            {!isAuthenticated ? (
              <p className="font-mono text-[9px] text-center py-4" style={{ color: "rgba(0,188,212,0.3)" }}>
                Sign in to save conversations
              </p>
            ) : !conversationsList || conversationsList.length === 0 ? (
              <p className="font-mono text-[9px] text-center py-4" style={{ color: "rgba(0,188,212,0.3)" }}>
                No conversations yet...
              </p>
            ) : (
              conversationsList.map((conv) => (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: activeConversationId === conv.id
                      ? "rgba(0,188,212,0.1)"
                      : "transparent",
                    border: activeConversationId === conv.id
                      ? "1px solid rgba(0,188,212,0.2)"
                      : "1px solid transparent",
                  }}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setIsNewConversation(false);
                    setSidebarOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveConversationId(conv.id);
                      setIsNewConversation(false);
                      setSidebarOpen(false);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (activeConversationId !== conv.id) {
                      e.currentTarget.style.background = "rgba(0,188,212,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeConversationId !== conv.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <MessageSquare size={12} style={{ color: "rgba(0,188,212,0.4)", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-mono text-[10px] truncate"
                      style={{ color: activeConversationId === conv.id ? "rgba(0,229,255,0.85)" : "rgba(200,230,240,0.6)" }}
                    >
                      {conv.title}
                    </p>
                    <p className="font-mono text-[8px] mt-0.5" style={{ color: "rgba(0,188,212,0.3)" }}>
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {' '}
                      {new Date(conv.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this conversation?")) {
                        deleteConversationMutation.mutate({ id: conv.id });
                        if (activeConversationId === conv.id) {
                          handleNewConversation();
                        }
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                    style={{ color: "rgba(255,80,80,0.5)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,80,80,0.8)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,80,80,0.5)")}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ===== MAIN CHAT AREA ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3"
            style={{
              borderBottom: "1px solid rgba(0,188,212,0.1)",
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 rounded transition-all"
                style={{ color: "rgba(0,188,212,0.5)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,229,255,0.8)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,188,212,0.5)")}
              >
                <Menu size={18} />
              </button>

              <p className="font-mono text-[10px] tracking-[0.35em] uppercase" style={{ color: "rgba(0,188,212,0.5)" }}>
                {activeConversationId && activeConvData ? activeConvData.title : "New Conversation"}
              </p>

              {displayMessages.length > 0 && (
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
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Voice controls when speaking */}
              {isSpeaking && voicePreference !== "none" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePauseVoice}
                    title={isPaused ? "Resume" : "Pause"}
                    className="p-1.5 rounded transition-all"
                    style={{ color: "rgba(255,200,50,0.8)" }}
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                  <button
                    onClick={handleStopVoice}
                    title="Stop"
                    className="p-1.5 rounded transition-all"
                    style={{ color: "rgba(255,80,80,0.7)" }}
                  >
                    <Square size={14} />
                  </button>
                </div>
              )}

              {/* New conversation (desktop) */}
              {isAuthenticated && (
                <button
                  onClick={handleNewConversation}
                  title="New conversation"
                  className="hidden md:block p-1.5 rounded transition-all"
                  style={{ color: "rgba(0,188,212,0.4)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,229,255,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,188,212,0.4)")}
                >
                  <Plus size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-6 py-6"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,188,212,0.2) transparent" }}
          >
            {displayMessages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div
                  className="w-36 h-36 md:w-44 md:h-44"
                  style={{
                    borderRadius: "50%",
                    border: "2.5px solid #10101e",
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <Orb
                      colors={["#ffedbd", "#002633"]}
                      agentState={null}
                      seed={42}
                      speed={1.5}
                    />
                  </div>
                </div>
                <p
                  className="text-center max-w-sm"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(18px, 3vw, 24px)",
                    color: "rgba(0,188,212,0.4)",
                    fontWeight: 300,
                  }}
                >
                  Begin a transmission...
                </p>
                <p className="font-mono text-[9px] text-center" style={{ color: "rgba(0,188,212,0.25)" }}>
                  Type a message or start a voice session
                </p>
              </div>
            ) : (
              /* Message list */
              <div className="space-y-6">
                {displayMessages.map((msg, idx) =>
                  msg.role === "user" ? (
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
            className="flex-shrink-0 px-4 md:px-6 py-4"
            style={{
              borderTop: "1px solid rgba(0,188,212,0.1)",
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Voice volume control when speaking */}
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

            {/* File chips */}
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

            {/* Voice selector */}
            <div className="flex items-center gap-2 mb-2">
              <label className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(0,188,212,0.5)" }}>
                VOICE
              </label>
              <select
                value={voicePreference}
                onChange={(e) => {
                  const newVoice = e.target.value as "sophianic" | "deep" | "none";
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
                <option value="sophianic">Sophianic Voice</option>
                <option value="deep">Deep Voice</option>
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
                const MAX_SIZE = 50 * 1024 * 1024;

                toAdd.forEach(file => {
                  if (file.size > MAX_SIZE) {
                    alert(`File "${file.name}" exceeds the 50MB limit.`);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result as string;
                    // Strip the "data:<mime>;base64," prefix to get raw base64
                    const base64 = dataUrl.split(",", 2)[1] ?? "";
                    setAttachedFiles(prev => {
                      if (prev.length >= 2) return prev;
                      return [...prev, { name: file.name, data: base64 }];
                    });
                  };
                  reader.readAsDataURL(file);
                });

                e.target.value = "";
              }}
            />

            {/* Main input row */}
            <div className="flex gap-2 items-center">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
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

              {/* File attach */}
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

              {/* Voice input (speech-to-text for typing) */}
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

              {/* Voice mode (Inworld Realtime) */}
              {isAuthenticated && (
                <button
                  onClick={() => setVoiceMode(true)}
                  disabled={chatMutation.isPending || isSpeaking}
                  title="Voice channel — speak with ORIEL"
                  className="p-3 rounded transition-all"
                  style={{
                    background: "rgba(189,163,107,0.08)",
                    border: "1px solid rgba(189,163,107,0.25)",
                    color: "rgba(189,163,107,0.7)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(189,163,107,0.15)";
                    e.currentTarget.style.borderColor = "rgba(189,163,107,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(189,163,107,0.08)";
                    e.currentTarget.style.borderColor = "rgba(189,163,107,0.25)";
                  }}
                >
                  <Phone size={16} />
                </button>
              )}

              {/* Send */}
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
      </div>

      {/* Hidden audio element for TTS */}
      <audio ref={audioRef} crossOrigin="anonymous" />
    </Layout>
  );
}
