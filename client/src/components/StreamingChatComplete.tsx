import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { Streamdown } from 'streamdown';

interface StreamChunk {
  type: 'chunk' | 'complete' | 'error';
  content: string;
  chunkIndex: number;
  totalChunks?: number;
  isComplete: boolean;
  timestamp: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isComplete?: boolean;
}

export default function StreamingChatComplete() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingContent]);

  const handleStreamingChat = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setStreamingError(null);
    setCurrentStreamingContent('');

    // Add user message
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Add placeholder for assistant response
    const assistantPlaceholder: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      isComplete: false,
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    setIsStreaming(true);

    try {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Build query string
      const params = new URLSearchParams({
        message: userMessage,
        history: JSON.stringify(
          messages.map(m => ({
            role: m.role,
            content: m.content,
          }))
        ),
      });

      // Connect to streaming endpoint
      const eventSource = new EventSource(`/api/chat/stream?${params}`);
      eventSourceRef.current = eventSource;

      let fullContent = '';
      let lastChunkIndex = -1;

      eventSource.addEventListener('message', (event: MessageEvent) => {
        if (event.data === '[DONE]') {
          // Streaming complete
          console.log('[Chat] Streaming complete. Total content length:', fullContent.length);

          // Update message as complete
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = fullContent;
              lastMsg.isStreaming = false;
              lastMsg.isComplete = true;
            }
            return updated;
          });

          setCurrentStreamingContent('');
          setIsStreaming(false);
          eventSource.close();
          return;
        }

        try {
          const chunk: StreamChunk = JSON.parse(event.data);

          if (chunk.type === 'error') {
            setStreamingError(chunk.content);
            console.error('[Chat] Stream error:', chunk.content);
            return;
          }

          if (chunk.type === 'chunk') {
            fullContent += chunk.content;
            setCurrentStreamingContent(fullContent);
            lastChunkIndex = chunk.chunkIndex;
            console.log(`[Chat] Chunk ${chunk.chunkIndex}/${chunk.totalChunks}: ${chunk.content.length} chars`);
          }

          if (chunk.type === 'complete') {
            // Verify completeness
            console.log('[Chat] Completion signal received');
            console.log('[Chat] Reconstructed length:', fullContent.length);
            console.log('[Chat] Completion signal length:', chunk.content.length);

            if (fullContent !== chunk.content) {
              console.warn('[Chat] Content mismatch detected!');
              // Use completion signal content as source of truth
              fullContent = chunk.content;
              setCurrentStreamingContent(fullContent);
            }
          }
        } catch (error) {
          console.error('[Chat] Failed to parse chunk:', error);
        }
      });

      eventSource.addEventListener('error', (error: Event) => {
        console.error('[Chat] EventSource error:', error);
        setStreamingError('Connection lost during streaming');
        setIsStreaming(false);
        eventSource.close();

        // Update message as incomplete
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.isStreaming = false;
            lastMsg.isComplete = false;
          }
          return updated;
        });
      });
    } catch (error) {
      console.error('[Chat] Error:', error);
      setStreamingError(error instanceof Error ? error.message : 'Unknown error');
      setIsStreaming(false);

      // Update message as failed
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = 'Failed to get response. Please try again.';
          lastMsg.isStreaming = false;
          lastMsg.isComplete = false;
        }
        return updated;
      });
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    setCurrentStreamingContent('');
    setStreamingError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Messages */}
      <div className="bg-black/50 border border-green-400/30 rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            Start a conversation with ORIEL. Messages will stream in real-time.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-green-400/20 text-green-300 border border-green-400/50'
                    : 'bg-blue-400/20 text-blue-300 border border-blue-400/50'
                }`}
              >
                <div className="text-sm">
                  {msg.role === 'assistant' && msg.isStreaming ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={14} />
                      <span>Streaming...</span>
                    </div>
                  ) : msg.role === 'assistant' && !msg.isComplete ? (
                    <div className="text-xs text-yellow-400">Incomplete message</div>
                  ) : (
                    <Streamdown>{msg.content}</Streamdown>
                  )}
                </div>
              </div>
              {msg.role === 'assistant' && msg.isStreaming && (
                <div className="text-xs text-gray-500 ml-2">
                  {currentStreamingContent.length} characters received...
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {streamingError && (
        <div className="bg-red-900/20 border border-red-400/50 rounded-lg p-3">
          <p className="text-red-300 text-sm">{streamingError}</p>
        </div>
      )}

      {/* Input Controls */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Ask ORIEL..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleStreamingChat()}
          disabled={isStreaming}
          className="flex-1 bg-black/50 border-green-400/30 text-white placeholder-gray-500"
        />
        <Button
          onClick={handleStreamingChat}
          disabled={!input.trim() || isStreaming}
          className="bg-green-400/20 hover:bg-green-400/30 border border-green-400/50 text-green-400"
        >
          {isStreaming ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </Button>
        <Button
          onClick={handleClearHistory}
          variant="outline"
          size="icon"
          className="border-green-400/30"
          disabled={isStreaming}
        >
          <Trash2 size={18} className="text-gray-400" />
        </Button>
      </div>

      {/* Status */}
      {isStreaming && (
        <div className="text-center text-green-400 text-xs font-mono">
          Streaming response... {currentStreamingContent.length} characters
        </div>
      )}
    </div>
  );
}
