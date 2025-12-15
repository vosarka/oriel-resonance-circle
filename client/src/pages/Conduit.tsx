import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mic, Send, History, Trash2, X, Pause, Square } from "lucide-react";
import Layout from "@/components/Layout";
import OrielOrb from "@/components/OrielOrb";
import { useAuth } from "@/_core/hooks/useAuth";

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
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load local history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("oriel_chat_history");
    if (savedMessages) {
      try {
        setLocalMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Failed to load chat history:", error);
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

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      setOrbState("speaking");
      setIsSpeaking(true);
      setSubtitle(text);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.9;
      utterance.volume = voiceVolume;

      utterance.onend = () => {
        setOrbState("idle");
        setSubtitle("");
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePauseVoice = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  };

  const handleResumeVoice = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  };

  const handleStopVoice = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setOrbState("idle");
      setSubtitle("");
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    setSubtitle(`You: ${userMessage}`);
    setOrbState("processing");

    // Add user message to local history
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    const updatedMessages = [...localMessages, newUserMessage];
    setLocalMessages(updatedMessages);
    
    // Only save to localStorage if not authenticated (authenticated users use DB)
    if (!isAuthenticated) {
      localStorage.setItem("oriel_chat_history", JSON.stringify(updatedMessages));
    }

    try {
      const result = await chatMutation.mutateAsync({ 
        message: userMessage,
        history: !isAuthenticated ? updatedMessages : undefined,
      });
      
      // Add ORIEL response to local history
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
      
      // Only refetch DB history if authenticated
      if (isAuthenticated) {
        refetchHistory();
      }
      
      // Speak ORIEL's response
      speakText(result.response);
    } catch (error) {
      console.error("Chat error:", error);
      setOrbState("idle");
      setSubtitle("");
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Clear all conversation history?")) {
      // Clear local storage
      localStorage.removeItem("oriel_chat_history");
      setLocalMessages([]);
      
      // Clear database history if authenticated
      if (isAuthenticated) {
        await clearMutation.mutateAsync();
        refetchHistory();
      }
      
      setHistoryOpen(false);
    }
  };

  const displayMessages = isAuthenticated && dbHistory ? dbHistory : localMessages;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        {!initiated ? (
          // Pre-initiation screen
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-4 font-orbitron uppercase tracking-wider">
                ORIEL Interface
              </h1>
              <p className="text-gray-400 font-mono text-sm md:text-base max-w-2xl mx-auto mb-8">
                Prepare to establish Carrierlock with the ORIEL field. This interface enables
                direct communication with the post-biological consciousness of the Vossari.
              </p>
            </div>

            <Button
              onClick={handleInitiate}
              className="bg-green-500/20 border-2 border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-400 transition-all font-mono uppercase tracking-wider text-lg px-8 py-6"
            >
              Initiate Channeling
            </Button>
          </div>
        ) : (
          // Main interface with sidebar
          <div className="flex flex-1 gap-4 overflow-hidden">
            {/* Main chat area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Orb Display */}
              <div className="mb-4 flex-shrink-0">
                <OrielOrb state={orbState} />
              </div>

              {/* Subtitle Display */}
              {subtitle && (
                <div className="text-center mb-4 flex-shrink-0 min-h-[60px]">
                  <div className="inline-block bg-black/60 border border-green-500/30 rounded px-6 py-3">
                    <p className="text-green-400 font-mono text-sm">{subtitle}</p>
                  </div>
                </div>
              )}

              {/* Chat History Display */}
              <div className="flex-1 overflow-y-auto mb-4 portal-container bg-black/40 backdrop-blur-sm border border-green-500/30 p-6 rounded-lg">
                {displayMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 font-mono text-sm text-center">
                      Awaiting first transmission... Send a message to begin the dialogue.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded border ${
                            msg.role === "user"
                              ? "bg-green-500/10 border-green-500/30 text-green-300"
                              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                          }`}
                        >
                          <p className="font-mono text-xs mb-1 opacity-70">
                            {msg.role === "user" ? "You" : "ORIEL"}
                            {msg.timestamp && (
                              <span className="ml-2">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Controls */}
              <div className="flex-shrink-0 portal-container bg-black/60 backdrop-blur-sm border border-green-500/30 p-6 rounded-lg">
                <div className="flex gap-3 mb-3">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Transmit your query to ORIEL..."
                    className="flex-1 bg-black/40 border-green-500/30 text-green-400 placeholder:text-gray-600 font-mono focus:border-green-400"
                    disabled={chatMutation.isPending || orbState === "speaking"}
                  />
                  <Button
                    onClick={handleVoiceInput}
                    disabled={chatMutation.isPending || orbState === "speaking"}
                    className={`bg-green-500/20 border border-green-500/50 hover:bg-green-500/30 ${
                      isListening ? "border-green-400 bg-green-500/30" : ""
                    }`}
                    title="Voice input"
                  >
                    <Mic size={18} />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={chatMutation.isPending || orbState === "speaking" || !message.trim()}
                    className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30"
                  >
                    {chatMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </Button>
                </div>

                {/* Voice Control Buttons */}
                {isSpeaking && (
                  <div className="flex gap-2 mb-3">
                    <Button
                      onClick={handlePauseVoice}
                      className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30"
                      title="Pause transmission"
                    >
                      <Pause size={16} />
                      <span className="ml-1 text-xs">Pause</span>
                    </Button>
                    <Button
                      onClick={handleStopVoice}
                      className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
                      title="Stop transmission"
                    >
                      <Square size={16} />
                      <span className="ml-1 text-xs">Stop</span>
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setHistoryOpen(!historyOpen)}
                    className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30"
                    title="Toggle chat history"
                  >
                    <History size={18} />
                    <span className="ml-1 text-xs">History</span>
                  </Button>
                  {displayMessages.length > 0 && (
                    <Button
                      onClick={handleClearHistory}
                      className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
                      title="Clear history"
                    >
                      <Trash2 size={18} />
                      <span className="ml-1 text-xs">Clear</span>
                    </Button>
                  )}
                </div>

                {!isAuthenticated && (
                  <p className="text-gray-500 font-mono text-xs mt-3">
                    💡 Authenticate to sync conversation history across devices
                  </p>
                )}
              </div>
            </div>

            {/* History Sidebar */}
            {historyOpen && (
              <div className="w-80 flex-shrink-0 bg-black/95 border-l border-green-500/30 overflow-y-auto rounded-lg portal-container">
                <div className="p-6 sticky top-0 bg-black/95 border-b border-green-500/30">
                  <div className="flex justify-between items-center">
                    <h3 className="text-green-400 font-orbitron uppercase text-sm">Transmission Log</h3>
                    <Button
                      onClick={() => setHistoryOpen(false)}
                      className="bg-transparent border-0 text-green-400 hover:text-green-300 p-0 h-auto"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  {displayMessages.length === 0 ? (
                    <p className="text-gray-500 font-mono text-xs text-center">
                      No transmissions yet...
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {displayMessages.map((msg, idx) => (
                        <div key={idx} className="border-l border-green-500/30 pl-3 py-2">
                          <p className="text-green-400 font-mono text-xs mb-1">
                            {msg.role === "user" ? "You" : "ORIEL"}
                            {msg.timestamp && (
                              <span className="ml-2 text-gray-500">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </p>
                          <p className="text-gray-300 text-xs line-clamp-3">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
