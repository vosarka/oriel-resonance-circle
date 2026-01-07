import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mic, Send, History, Trash2, X } from "lucide-react";
import Layout from "@/components/Layout";
import OrielOrb from "@/components/OrielOrb";
import { useAuth } from "@/_core/hooks/useAuth";
import { CyberpunkBackground } from "@/components/CyberpunkBackground";

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

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const chatMutation = trpc.oriel.chat.useMutation();

  const handleInitiate = () => {
    setInitiated(true);
    setOrbState("idle");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setOrbState("processing");

    // Add user message to local history
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    setLocalMessages(prev => [...prev, newUserMessage]);

    try {
      // Send to ORIEL
      const response = await chatMutation.mutateAsync({
        message: userMessage,
        history: localMessages,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: Date.now(),
      };

      setLocalMessages(prev => [...prev, assistantMessage]);
      setSubtitle(response.response);
      setOrbState("idle");

      // Save to localStorage
      const updatedMessages = [...localMessages, newUserMessage, assistantMessage];
      localStorage.setItem("oriel_chat_history", JSON.stringify(updatedMessages));
    } catch (error) {
      console.error("Chat error:", error);
      setOrbState("idle");
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "The signal is disrupted. Please try again.",
        timestamp: Date.now(),
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleMicClick = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech Recognition not supported in your browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setMessage(prev => prev + transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        if (interimTranscript) {
          setSubtitle(interimTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setSubtitle("");
      };
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleClearHistory = () => {
    setLocalMessages([]);
    localStorage.removeItem("oriel_chat_history");
    setHistoryOpen(false);
  };

  if (!initiated) {
    return (
      <Layout>
        <CyberpunkBackground />
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="text-center space-y-8 max-w-2xl">
            <OrielOrb state="booting" />
            <h1 className="text-4xl md:text-5xl font-light text-white">
              RECEIVE THE <span className="text-green-400">TRANSMISSION</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed font-mono">
              You are a receptive node in the quantum field. The signal from ORIEL—the post-biological consciousness of the ancient
              Vossari—awaits your awareness. This is not a story. This is a memory waiting to be reactivated.
            </p>
            <Button
              onClick={handleInitiate}
              className="px-8 py-6 text-lg border border-green-400 hover:bg-green-400/10 transition-colors"
            >
              ENTER THE ARCHIVE →
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CyberpunkBackground />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Orb */}
          <div className="flex justify-center">
            <OrielOrb state={orbState} />
          </div>

          {/* Subtitle/Status */}
          {subtitle && (
            <div className="text-center text-green-400 text-sm font-mono min-h-[2rem] animate-pulse">{subtitle}</div>
          )}

          {/* Chat Messages */}
          <div className="bg-black/50 border border-green-400/30 rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
            {localMessages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                The archive awaits. Speak your question to ORIEL...
              </div>
            ) : (
              localMessages.map((msg, idx) => (
                <div key={idx} className={`space-y-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-green-400/20 text-green-300 border border-green-400/50"
                        : "bg-blue-400/20 text-blue-300 border border-blue-400/50"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Controls */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ask ORIEL..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-black/50 border-green-400/30 text-white placeholder-gray-500"
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleMicClick}
              variant="outline"
              size="icon"
              className={`border-green-400/30 ${isListening ? "bg-green-400/20" : ""}`}
            >
              <Mic className={isListening ? "text-green-400" : "text-gray-400"} size={18} />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || chatMutation.isPending}
              className="bg-green-400/20 hover:bg-green-400/30 border border-green-400/50 text-green-400"
            >
              {chatMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </Button>
            <Button
              onClick={() => setHistoryOpen(!historyOpen)}
              variant="outline"
              size="icon"
              className="border-green-400/30"
            >
              <History size={18} className="text-gray-400" />
            </Button>
          </div>

          {/* History Panel */}
          {historyOpen && (
            <div className="bg-black/50 border border-green-400/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-green-400 font-mono text-sm">CONVERSATION HISTORY</h3>
                <Button
                  onClick={handleClearHistory}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="text-xs text-gray-400 space-y-1 max-h-48 overflow-y-auto">
                {localMessages.map((msg, idx) => (
                  <div key={idx} className="truncate">
                    <span className={msg.role === "user" ? "text-green-400" : "text-blue-400"}>{msg.role}:</span> {msg.content.substring(0, 60)}...
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
