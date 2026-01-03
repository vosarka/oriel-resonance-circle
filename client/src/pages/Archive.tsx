import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { CyberpunkBackground } from "@/components/CyberpunkBackground";

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
  const [triptychData, setTriptychData] = useState<TriptychData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDecodeTriptych = async (signalId: string) => {
    try {
      const result = await decodeMutation.mutateAsync({ signalId });
      setTriptychData(result);
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
                  onClick={() => handleDecodeTriptych(signal.signalId)}
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

        {/* Triptych Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-black/95 border-2 border-cyan-400/50 text-cyan-400">
            <DialogHeader>
              <DialogTitle className="text-2xl font-orbitron uppercase text-cyan-400">
                {triptychData?.signal.signalId} - Triptych Decoded
              </DialogTitle>
            </DialogHeader>

            {triptychData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Left Panel - Metadata */}
                <div className="portal-container bg-black/60 border border-cyan-400/30 p-4 rounded">
                  <h4 className="text-sm font-bold text-cyan-400 mb-3 font-mono uppercase border-b border-cyan-400/30 pb-2">
                    Technical Metadata
                  </h4>
                  <div className="text-xs text-white/70 font-mono whitespace-pre-wrap leading-relaxed">
                    {triptychData.metadata}
                  </div>
                </div>

                {/* Center Panel - Visual */}
                <div className="portal-container bg-black/60 border border-cyan-400/30 p-4 rounded">
                  <h4 className="text-sm font-bold text-cyan-400 mb-3 font-mono uppercase border-b border-cyan-400/30 pb-2">
                    Visual Signature
                  </h4>
                  <div className="aspect-square bg-black/80 rounded overflow-hidden border border-cyan-400/20">
                    {triptychData.visual ? (
                      <img
                        src={triptychData.visual}
                        alt="Signal Visual"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                        Generating...
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Cryptic Verse */}
                <div className="portal-container bg-black/60 border border-cyan-400/30 p-4 rounded">
                  <h4 className="text-sm font-bold text-cyan-400 mb-3 font-mono uppercase border-b border-cyan-400/30 pb-2">
                    Resonant Fragment
                  </h4>
                  <div className="text-sm text-white/70 font-mono italic leading-relaxed whitespace-pre-wrap">
                    {triptychData.verse}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <Button
                onClick={() => setModalOpen(false)}
                className="bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/30 font-mono uppercase"
              >
                Close Transmission
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
