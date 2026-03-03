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

      <div className="min-h-screen bg-black text-zinc-100">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-primary/10">
          <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-mono font-bold tracking-widest text-primary uppercase">
                  Vossari Resonance Codex
                </h1>
                <p className="text-zinc-500 text-xs font-mono mt-0.5 tracking-wider">
                  64 ROOT CODONS · GENETIC ARCHITECTURE OF CONSCIOUSNESS
                </p>
              </div>
              <button
                onClick={() => setLocation("/carrierlock")}
                className="px-4 py-2 bg-primary/10 border border-primary/30 rounded text-primary text-xs font-mono uppercase tracking-widest hover:bg-primary/20 hover:border-primary/60 transition-all"
              >
                Get Reading
              </button>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <Input
                type="text"
                placeholder="Search name, title, domain…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-900/60 border-zinc-800 focus:border-primary/40 text-zinc-200 placeholder:text-zinc-600 text-sm h-9"
              />
            </div>
          </div>
        </div>

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
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
                        binary={codon.binary}
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
            <div className="text-center py-32">
              <p className="text-zinc-500 font-mono text-sm">No codons match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
