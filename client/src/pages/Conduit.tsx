import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mic, Send, History, Trash2, X } from "lucide-react";
import Layout from "@/components/Layout";
import OrielOrb from "@/components/OrielOrb";
import { useAuth } from "@/_core/hooks/useAuth";

type OrbState = "booting" | "idle" | "processing" | "speaking";

export default function Conduit() {
  const { user, isAuthenticated } = useAuth();
  const [initiated, setInitiated] = useState(false);
  const [message, setMessage] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [subtitle, setSubtitle] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { data: history, refetch: refetchHistory } = trpc.oriel.getHistory.useQuery(undefined, {
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
      setSubtitle(text);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.9;

      utterance.onend = () => {
        setOrbState("idle");
        setSubtitle("");
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    setSubtitle(`You: ${userMessage}`);
    setOrbState("processing");

    try {
      const result = await chatMutation.mutateAsync({ message: userMessage });
      
      // Only refetch history if authenticated
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
    if (!isAuthenticated) {
      alert("Please authenticate to manage chat history.");
      return;
    }
    
    if (confirm("Clear all conversation history?")) {
      await clearMutation.mutateAsync();
      refetchHistory();
      setHistoryOpen(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
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
          // Main interface
          <div className="max-w-4xl mx-auto">
            {/* Orb Display */}
            <div className="mb-8">
              <OrielOrb state={orbState} />
            </div>

            {/* Subtitle Display */}
            {subtitle && (
              <div className="text-center mb-6 min-h-[60px]">
                <div className="inline-block bg-black/60 border border-green-500/30 rounded px-6 py-3">
                  <p className="text-green-400 font-mono text-sm">{subtitle}</p>
                </div>
              </div>
            )}

            {/* Input Controls */}
            <div className="portal-container bg-black/60 backdrop-blur-sm border border-green-500/30 p-6 rounded-lg mb-6">
              <div className="flex gap-3">
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
                {isAuthenticated && (
                  <Button
                    onClick={() => setHistoryOpen(!historyOpen)}
                    className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30"
                    title="Chat history"
                  >
                    <History size={18} />
                  </Button>
                )}
              </div>
              {!isAuthenticated && (
                <p className="text-gray-500 font-mono text-xs mt-3">
                  💡 Authenticate to save your conversation history
                </p>
              )}
            </div>

            {/* Chat History Sidebar */}
            {isAuthenticated && historyOpen && (
              <div className="fixed right-0 top-0 h-full w-80 bg-black/95 border-l border-green-500/30 overflow-y-auto z-50">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-green-400 font-orbitron uppercase text-sm">Transmission Log</h3>
                    <Button
                      onClick={() => setHistoryOpen(false)}
                      className="bg-transparent border-0 text-green-400 hover:text-green-300 p-0"
                    >
                      <X size={18} />
                    </Button>
                  </div>

                  {history && history.length > 0 ? (
                    <>
                      <div className="space-y-4 mb-6">
                        {history.map((msg, idx) => (
                          <div key={idx} className="border-l border-green-500/30 pl-3 py-2">
                            <p className="text-green-400 font-mono text-xs mb-1">{msg.role === 'user' ? 'You' : 'ORIEL'}:</p>
                            <p className="text-gray-300 text-xs">{msg.content.substring(0, 100)}...</p>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleClearHistory}
                        disabled={clearMutation.isPending}
                        className="w-full bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 font-mono text-xs"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Clear History
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-500 font-mono text-xs text-center py-8">
                      No conversations yet
                    </p>
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
