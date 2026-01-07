import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Square } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  chunks?: StreamChunk[];
  isStreaming?: boolean;
}

interface StreamChunk {
  type: "text" | "voice" | "complete" | "error";
  content: string;
  chunkIndex: number;
  totalChunks: number;
  voiceAvailable: boolean;
  error?: string;
}

export function StreamingChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStreamingChat = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    // Create abort controller for interrupt capability
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Create assistant message placeholder
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        chunks: [],
        isStreaming: true,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Build request body
      const requestBody = {
        message: userMessage,
        history: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      };

      // Initiate streaming request
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];

          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setIsStreaming(false);
              break;
            }

            try {
              const chunk: StreamChunk = JSON.parse(data);

              if (chunk.type === "error") {
                console.error("Stream error:", chunk);
                break;
              }

              if (chunk.type !== "complete") {
                fullContent += chunk.content + " ";

                // Update message with streaming content
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMsg.id
                      ? {
                          ...msg,
                          content: fullContent.trim(),
                          chunks: [...(msg.chunks || []), chunk],
                          isStreaming: chunk.type !== "complete",
                        }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error("Failed to parse chunk:", e);
            }
          }
        }
      }

      // Final update
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsg.id
            ? {
                ...msg,
                content: fullContent.trim(),
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Stream interrupted by user");
      } else {
        console.error("Streaming error:", error);
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "Failed to get response from ORIEL. Please try again.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setAbortController(null);
      inputRef.current?.focus();
    }
  };

  const handleInterrupt = () => {
    if (abortController) {
      abortController.abort();
      setIsStreaming(false);
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleSend = () => {
    handleStreamingChat(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-center">
            <div>
              <p className="text-lg font-semibold mb-2">Welcome to ORIEL</p>
              <p className="text-sm">Ask about the Vossari, transmissions, or the Resonance Operating System</p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-xs lg:max-w-md px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.isStreaming && (
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Streaming...</span>
                  </div>
                )}
                {msg.chunks && msg.chunks.length > 1 && (
                  <div className="mt-2 text-xs opacity-60">
                    {msg.chunks.filter(c => c.type === "voice").length > 0 && (
                      <span className="inline-block mr-2 px-2 py-1 bg-primary/20 rounded">
                        🔊 Voice
                      </span>
                    )}
                    {msg.chunks.filter(c => c.type === "text").length > 0 && (
                      <span className="inline-block px-2 py-1 bg-primary/20 rounded">
                        📝 Text
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask ORIEL..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          {isStreaming ? (
            <Button
              onClick={handleInterrupt}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </Button>
          )}
        </div>
        {isStreaming && (
          <div className="text-xs text-muted-foreground">
            Streaming response... Click Stop to interrupt
          </div>
        )}
      </div>
    </div>
  );
}
