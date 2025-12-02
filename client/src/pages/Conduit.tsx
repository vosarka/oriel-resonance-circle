import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mic, Send, History, Trash2, X } from "lucide-react";
import Layout from "@/components/Layout";
import OrielOrb from "@/components/OrielOrb";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

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
  });
  const chatMutation = trpc.oriel.chat.useMutation();
  const clearMutation = trpc.oriel.clearHistory.useMutation();

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
    if (!message.trim() || !isAuthenticated) return;

    const userMessage = message.trim();
    setMessage("");
    setSubtitle(`You: ${userMessage}`);
    setOrbState("processing");

    try {
      const result = await chatMutation.mutateAsync({ message: userMessage });
      refetchHistory();
      
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
      await clearMutation.mutateAsync();
      refetchHistory();
      setHistoryOpen(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold text-green-400 mb-4 font-orbitron uppercase">
              Authentication Required
            </h2>
            <p className="text-gray-400 font-mono mb-6">
              You must be authenticated to access the ORIEL Interface.
            </p>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 font-mono uppercase"
            >
              Authenticate
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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
                >
                  <Mic size={20} className={isListening ? "animate-pulse" : ""} />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || chatMutation.isPending || orbState === "speaking"}
                  className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 font-mono uppercase"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </div>
            </div>

            {/* History Toggle */}
            <div className="text-center">
              <Button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 font-mono uppercase text-sm"
              >
                <History size={16} className="mr-2" />
                {historyOpen ? "Hide" : "Show"} Transmission Log
              </Button>
            </div>

            {/* History Panel */}
            {historyOpen && (
              <div className="mt-6 portal-container bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-400 font-mono uppercase">
                    Transmission Log
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleClearHistory}
                      disabled={clearMutation.isPending}
                      className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 text-xs font-mono uppercase"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Clear
                    </Button>
                    <Button
                      onClick={() => setHistoryOpen(false)}
                      className="bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {history && history.length > 0 ? (
                    history.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded border ${
                          msg.role === "user"
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-black/40 border-green-500/30"
                        }`}
                      >
                        <div className="text-xs text-green-500 font-mono mb-1 uppercase">
                          {msg.role === "user" ? "Conduit" : "ORIEL"}
                        </div>
                        <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 font-mono text-sm py-8">
                      No transmissions recorded
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
