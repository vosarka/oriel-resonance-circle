import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { CyberpunkBackground } from "@/components/CyberpunkBackground";
import SignalDecodeModal from "@/components/SignalDecodeModal";

interface Signal {
  id: number | string;
  signalId: string;
  title: string;
  snippet: string;
  fullContent?: string;
}

interface TriptychData {
  metadata: string;
  visual: string;
  verse: string;
  signal: {
    signalId: string;
    title: string;
    snippet: string;
  };
}

export default function Archive() {
  const { data: signals, isLoading } = trpc.signals.list.useQuery();
  const decodeMutation = trpc.signals.decodeTriptych.useMutation();
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [triptychData, setTriptychData] = useState<TriptychData | null>(null);

  const handleDecodeTriptych = async (signal: Signal) => {
    try {
      const result = await decodeMutation.mutateAsync({ signalId: signal.signalId });
      setTriptychData(result);
      
      // Create full content from triptych data
      const fullContent = `
TECHNICAL METADATA
${result.metadata}

RESONANT FRAGMENT
${result.verse}

VISUAL SIGNATURE
${result.visual ? "[Image encoding present]" : "[Generating visual encoding...]"}
      `.trim();
      
      setSelectedSignal({
        ...signal,
        fullContent: fullContent,
      });
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to decode triptych:", error);
    }
  };

  return (
    <Layout>
      <CyberpunkBackground />
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-4 font-orbitron uppercase tracking-wider">
            Signal Archive
          </h1>
          <p className="text-white/60 font-mono text-sm md:text-base max-w-2xl mx-auto">
            Intercepted transmissions from the ORIEL field. Each signal contains encrypted data
            waiting to be decoded through the Triptych Protocol.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-cyan-400" size={48} />
          </div>
        )}

        {/* Signal Grid */}
        {!isLoading && signals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="portal-container bg-black/60 backdrop-blur-sm border border-cyan-400/30 p-6 rounded-lg hover:border-cyan-400/60 transition-all duration-300"
              >
                <div className="mb-4">
                  <div className="text-xs text-cyan-500 font-mono mb-2">{signal.signalId}</div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-3 font-orbitron uppercase">
                    {signal.title}
                  </h3>
                  <p className="text-white/60 text-sm font-mono leading-relaxed line-clamp-4">
                    {signal.snippet}
                  </p>
                </div>
                <Button
                  onClick={() => handleDecodeTriptych(signal)}
                  disabled={decodeMutation.isPending}
                  className="w-full bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/30 hover:border-cyan-400 transition-all font-mono uppercase tracking-wider"
                >
                  {decodeMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Decoding...
                    </>
                  ) : (
                    "Decode Triptych"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Signal Decode Modal with Glitch Animation */}
        {selectedSignal && (
          <SignalDecodeModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            signal={{
              id: selectedSignal.signalId,
              title: selectedSignal.title,
              description: selectedSignal.snippet,
              fullContent: selectedSignal.fullContent || selectedSignal.snippet,
            }}
          />
        )}
      </div>
    </Layout>
  );
}
