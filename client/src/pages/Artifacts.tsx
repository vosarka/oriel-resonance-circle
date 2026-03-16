import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";

const C = {
  void:    "#0a0a0e",
  deep:    "#0f0f15",
  surface: "#14141c",
  border:  "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold:    "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  teal:    "#5ba4a4",
  txt:     "#e8e4dc",
  txtS:    "#9a968e",
  txtD:    "#6a665e",
};

export default function Artifacts() {
  const utils = trpc.useUtils();
  const { data: artifacts, isLoading } = trpc.artifacts.list.useQuery();
  const generateMutation = trpc.artifacts.generateLoreAndImage.useMutation({
    onSuccess: () => { utils.artifacts.list.invalidate(); },
  });
  const expandMutation = trpc.artifacts.expandLore.useMutation({
    onSuccess: () => { utils.artifacts.list.invalidate(); },
  });

  const handleGenerate = async (artifactId: number) => {
    try { await generateMutation.mutateAsync({ artifactId }); } catch {}
  };

  const handleExpand = async (artifactId: number) => {
    try {
      const artifact = artifacts?.find(a => a.id === artifactId);
      if (!artifact?.lore) return;
      await expandMutation.mutateAsync({ artifactId, currentLore: artifact.lore });
    } catch {}
  };

  return (
    <Layout>
      <div style={{ minHeight: "100vh", padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.25em", marginBottom: 12 }}>
              RECOVERED ARTIFACTS
            </div>
            <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: 20 }} />
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 300, color: C.txt, lineHeight: 1.1, marginBottom: 8,
            }}>
              Vossari Artifacts
            </h1>
            <p style={{ fontFamily: "monospace", fontSize: 11, color: C.txtS, maxWidth: 560, lineHeight: 1.9 }}>
              Physical remnants of the Vossari civilization. Each artifact carries encoded memory
              and quantum resonance. Generate lore to unlock their secrets.
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", flexDirection: "column", gap: 12 }}>
              <Loader2 style={{ color: C.teal, animation: "spin 1s linear infinite" }} size={24} />
              <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.2em" }}>RETRIEVING ARTIFACTS…</span>
            </div>
          )}

          {/* Grid */}
          {!isLoading && artifacts && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, background: C.border }}>
              {artifacts.map((artifact) => (
                <div key={artifact.id} style={{ background: C.deep, padding: "24px" }}>

                  {/* Image */}
                  <div style={{
                    aspectRatio: "1", background: C.void, marginBottom: 20,
                    border: `1px solid ${C.border}`, overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {artifact.imageUrl ? (
                      <img src={artifact.imageUrl} alt={artifact.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "serif", fontSize: 48, color: C.txtD, marginBottom: 8 }}>◈</div>
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em" }}>AWAITING MANIFESTATION</div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: C.txt, marginBottom: 4 }}>
                      {artifact.name}
                    </h3>
                    {artifact.price && (
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.gold, letterSpacing: "0.1em", marginBottom: 6 }}>
                        VALUE: {artifact.price}
                      </div>
                    )}
                    {artifact.referenceSignalId && (
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.08em", marginBottom: 10 }}>
                        REF: {artifact.referenceSignalId}
                      </div>
                    )}
                    {artifact.lore && (
                      <div style={{
                        background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`,
                        padding: 12, marginBottom: 12, maxHeight: 180, overflowY: "auto",
                      }}>
                        <p style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                          {artifact.lore}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {!artifact.lore && !artifact.imageUrl && (
                      <button
                        onClick={() => handleGenerate(artifact.id)}
                        disabled={generateMutation.isPending}
                        style={{
                          width: "100%", padding: "9px 0",
                          border: `1px solid ${C.teal}50`,
                          background: "rgba(91,164,164,0.05)",
                          color: C.teal,
                          fontFamily: "monospace", fontSize: 9,
                          letterSpacing: "0.15em", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          opacity: generateMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        {generateMutation.isPending ? (
                          <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> MANIFESTING…</>
                        ) : (
                          "GENERATE LORE & IMAGE →"
                        )}
                      </button>
                    )}
                    {artifact.lore && (
                      <button
                        onClick={() => handleExpand(artifact.id)}
                        disabled={expandMutation.isPending}
                        style={{
                          width: "100%", padding: "8px 0",
                          border: `1px solid ${C.border}`,
                          background: "transparent",
                          color: C.txtD,
                          fontFamily: "monospace", fontSize: 9,
                          letterSpacing: "0.12em", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          opacity: expandMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        {expandMutation.isPending ? (
                          <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> EXPANDING…</>
                        ) : (
                          "EXPAND LORE"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
