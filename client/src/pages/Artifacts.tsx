import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";

export default function Artifacts() {
  const utils = trpc.useUtils();
  const { data: artifacts, isLoading } = trpc.artifacts.list.useQuery();
  const generateMutation = trpc.artifacts.generateLoreAndImage.useMutation({
    onSuccess: () => {
      utils.artifacts.list.invalidate();
    },
  });
  const expandMutation = trpc.artifacts.expandLore.useMutation({
    onSuccess: () => {
      utils.artifacts.list.invalidate();
    },
  });

  const handleGenerate = async (artifactId: number) => {
    try {
      await generateMutation.mutateAsync({ artifactId });
    } catch (error) {
      console.error("Failed to generate lore and image:", error);
    }
  };

  const handleExpand = async (artifactId: number) => {
    try {
      const artifact = artifacts?.find(a => a.id === artifactId);
      if (!artifact || !artifact.lore) {
        console.error("Artifact or lore not found");
        return;
      }
      await expandMutation.mutateAsync({ artifactId, currentLore: artifact.lore });
    } catch (error) {
      console.error("Failed to expand lore:", error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-4 font-orbitron uppercase tracking-wider">
            Recovered Artifacts
          </h1>
          <p className="text-gray-400 font-mono text-sm md:text-base max-w-2xl mx-auto">
            Physical remnants of the Vossari civilization. Each artifact carries encoded memory
            and quantum resonance. Generate lore to unlock their secrets.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-green-400" size={48} />
          </div>
        )}

        {/* Artifacts Grid */}
        {!isLoading && artifacts && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="portal-container bg-black/60 backdrop-blur-sm border border-green-500/30 p-6 rounded-lg hover:border-green-400/60 transition-all duration-300"
              >
                {/* Image Container */}
                <div className="aspect-square bg-black/80 rounded overflow-hidden border border-green-500/20 mb-4">
                  {artifact.imageUrl ? (
                    <img
                      src={artifact.imageUrl}
                      alt={artifact.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-6xl mb-2">◈</div>
                        <div className="text-xs font-mono">AWAITING MANIFESTATION</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Artifact Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-green-400 mb-2 font-orbitron uppercase">
                    {artifact.name}
                  </h3>
                  {artifact.price && (
                    <div className="text-sm text-green-500 font-mono mb-2">
                      VALUE: {artifact.price}
                    </div>
                  )}
                  {artifact.referenceSignalId && (
                    <div className="text-xs text-gray-500 font-mono mb-3">
                      REF: {artifact.referenceSignalId}
                    </div>
                  )}

                  {/* Lore Display */}
                  {artifact.lore && (
                    <div className="bg-black/40 border border-green-500/20 rounded p-3 mb-3">
                      <div className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {artifact.lore}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!artifact.lore && !artifact.imageUrl && (
                    <Button
                      onClick={() => handleGenerate(artifact.id)}
                      disabled={generateMutation.isPending}
                      className="w-full bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-400 transition-all font-mono uppercase tracking-wider"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Manifesting...
                        </>
                      ) : (
                        "Generate Lore & Image"
                      )}
                    </Button>
                  )}

                  {artifact.lore && (
                    <Button
                      onClick={() => handleExpand(artifact.id)}
                      disabled={expandMutation.isPending}
                      className="w-full bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-400 transition-all font-mono uppercase tracking-wider text-sm"
                    >
                      {expandMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={14} />
                          Expanding...
                        </>
                      ) : (
                        "Expand Lore"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
