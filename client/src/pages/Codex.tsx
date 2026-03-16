import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import Layout from "@/components/Layout";
import CodonGlyph from "@/components/CodonGlyph";

const ACTIVATION_MS = 480;

export default function Codex() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activating, setActivating] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: codons, isLoading } = trpc.codex.getRootCodons.useQuery();

  const filtered = codons?.filter(codon =>
    codon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    codon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    codon.domain?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleClick = (codon: NonNullable<typeof codons>[number]) => {
    if (activating) return;
    setActivating(codon.id);
    timerRef.current = setTimeout(() => {
      setLocation(`/codex/${codon.numericId}`);
    }, ACTIVATION_MS);
  };

  return (
    <Layout>
      {/* Scan-line keyframe injected once */}
      <style>{`
        @keyframes scanline {
          from { transform: translateY(-100%); opacity: 0.8; }
          to   { transform: translateY(200%);  opacity: 0; }
        }
        @keyframes glyphPulse {
          0%   { opacity: 1; }
          50%  { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", color: "#e8e4dc" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(10,10,14,0.92)", backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(189,163,107,0.12)",
        }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#e8e4dc", letterSpacing: "0.05em", marginBottom: 4 }}>
                  Voss Arkiva Codex
                </h1>
                <p style={{ fontFamily: "monospace", fontSize: 9, color: "#6a665e", letterSpacing: "0.2em" }}>
                  64 ROOT CODONS · GENETIC ARCHITECTURE OF CONSCIOUSNESS
                </p>
              </div>
              <button
                onClick={() => setLocation("/carrierlock")}
                style={{
                  padding: "7px 18px",
                  border: "1px solid rgba(91,164,164,0.35)",
                  background: "rgba(91,164,164,0.05)",
                  color: "#5ba4a4",
                  fontFamily: "monospace", fontSize: 9,
                  letterSpacing: "0.15em", cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                }}
              >
                GET READING
              </button>
            </div>
            <div style={{ position: "relative", maxWidth: 380 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6a665e", width: 12, height: 12 }} />
              <input
                type="text"
                placeholder="Search name, title, domain…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                  background: "rgba(20,20,28,0.8)", border: "1px solid rgba(189,163,107,0.12)",
                  color: "#e8e4dc", fontFamily: "monospace", fontSize: 11,
                  outline: "none", boxSizing: "border-box" as const,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 0", flexDirection: "column", gap: 12 }}>
              <Loader2 style={{ color: "#5ba4a4", animation: "spin 1s linear infinite" }} size={24} />
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6a665e", letterSpacing: "0.2em" }}>LOADING CODEX…</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filtered?.map(codon => {
                const isActive = activating === codon.id;
                return (
                  <button
                    key={codon.id}
                    onClick={() => handleClick(codon)}
                    disabled={!!activating && !isActive}
                    className={[
                      "group relative flex flex-col items-center gap-2 p-3 rounded-xl border",
                      "transition-all duration-200 cursor-pointer select-none outline-none",
                      isActive
                        ? "border-primary bg-primary/10 scale-105"
                        : "border-zinc-800 bg-zinc-900/40 hover:border-primary/40 hover:bg-zinc-900/70",
                    ].join(" ")}
                    style={
                      isActive
                        ? { boxShadow: "0 0 24px rgba(0,240,255,0.35), inset 0 0 12px rgba(0,240,255,0.08)" }
                        : undefined
                    }
                  >
                    {/* RC label */}
                    <span className="absolute top-2 left-2.5 text-[9px] font-mono text-zinc-600 group-hover:text-primary/50 transition-colors">
                      {codon.id}
                    </span>

                    {/* Glyph */}
                    <div
                      className="relative mt-3"
                      style={{
                        filter: isActive
                          ? "drop-shadow(0 0 12px rgba(0,240,255,0.9))"
                          : "drop-shadow(0 0 0px rgba(0,240,255,0))",
                        transition: "filter 0.15s ease",
                      }}
                    >
                      <CodonGlyph
                          codonNumber={codon.numericId}
                        isActivating={isActive}
                        className={[
                          "w-14 h-14 text-primary",
                          isActive ? "" : "opacity-60 group-hover:opacity-100",
                          "transition-opacity duration-200",
                        ].join(" ")}
                      />
                      {/* Scan line overlay — only during activation */}
                      {isActive && (
                        <div
                          className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
                          aria-hidden
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(180deg, transparent 20%, rgba(0,240,255,0.35) 50%, transparent 80%)",
                              animation: `scanline ${ACTIVATION_MS}ms ease-out forwards`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <span
                      className={[
                        "text-[10px] font-mono text-center leading-tight break-words w-full px-0.5",
                        isActive ? "text-primary" : "text-zinc-400 group-hover:text-zinc-200",
                        "transition-colors duration-150",
                      ].join(" ")}
                      style={isActive ? { animation: `glyphPulse ${ACTIVATION_MS}ms ease-in-out` } : undefined}
                    >
                      {codon.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!isLoading && filtered?.length === 0 && (
            <div style={{ textAlign: "center", padding: "120px 0" }}>
              <p style={{ fontFamily: "monospace", fontSize: 10, color: "#6a665e", letterSpacing: "0.1em" }}>No codons match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
