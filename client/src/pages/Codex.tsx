import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import VossArchiveShell from "@/components/VossArchiveShell";
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
    <VossArchiveShell>
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

        .codex-page {
          min-height: 100vh;
          padding: 88px 30px 86px;
          color: var(--voss-text);
        }

        .codex-shell {
          width: min(1440px, 100%);
          margin: 0 auto;
        }

        .codex-hero {
          position: sticky;
          top: 80px;
          z-index: 10;
          margin-bottom: 30px;
          padding: clamp(22px, 3vw, 36px);
          border: 1px solid var(--voss-border);
          background:
            radial-gradient(circle at 86% 14%, rgba(121, 228, 234, 0.08), transparent 32%),
            linear-gradient(135deg, rgba(15, 15, 21, 0.94), rgba(8, 8, 12, 0.76));
          box-shadow: 0 22px 80px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(18px);
        }

        .codex-hero-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .codex-kicker {
          margin-bottom: 8px;
          font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Red Hat Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          color: var(--voss-cyan);
          text-transform: uppercase;
        }

        .codex-title {
          margin: 0;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(38px, 5vw, 72px);
          font-weight: 300;
          line-height: 0.94;
          letter-spacing: -0.03em;
          color: var(--voss-ivory);
        }

        .codex-subtitle {
          margin-top: 14px;
          max-width: 680px;
          font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Red Hat Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          line-height: 1.8;
          color: rgba(154, 150, 142, 0.82);
          text-transform: uppercase;
        }

        .codex-reading-button {
          flex-shrink: 0;
          padding: 10px 18px;
          border: 1px solid rgba(121, 228, 234, 0.34);
          background: rgba(121, 228, 234, 0.045);
          color: var(--voss-cyan);
          font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Red Hat Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          transition: border-color 180ms ease, box-shadow 180ms ease, color 180ms ease;
        }

        .codex-reading-button:hover {
          border-color: rgba(121, 228, 234, 0.55);
          box-shadow: 0 0 24px rgba(121, 228, 234, 0.12);
          color: var(--voss-ivory);
        }

        .codex-search {
          position: relative;
          width: min(420px, 100%);
        }

        .codex-search svg {
          position: absolute;
          left: 12px;
          top: 50%;
          width: 13px;
          height: 13px;
          transform: translateY(-50%);
          color: var(--voss-text-dim);
        }

        .codex-search input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 13px 11px 34px;
          border: 1px solid rgba(189, 163, 107, 0.16);
          outline: none;
          background: rgba(8, 8, 12, 0.62);
          color: var(--voss-text);
          font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Red Hat Mono", monospace;
          font-size: 12px;
        }

        .codex-search input:focus {
          border-color: rgba(121, 228, 234, 0.42);
          box-shadow: 0 0 24px rgba(121, 228, 234, 0.08);
        }

        .codex-grid-wrap {
          padding: 6px 0 0;
        }

        .codex-tile {
          border-color: rgba(189, 163, 107, 0.11) !important;
          background:
            radial-gradient(circle at 50% 28%, rgba(121, 228, 234, 0.055), transparent 45%),
            rgba(10, 10, 14, 0.68) !important;
          backdrop-filter: blur(10px);
        }

        .codex-tile:hover {
          border-color: rgba(121, 228, 234, 0.38) !important;
          background:
            radial-gradient(circle at 50% 28%, rgba(121, 228, 234, 0.08), transparent 45%),
            rgba(15, 15, 21, 0.82) !important;
          box-shadow: 0 18px 46px rgba(0, 0, 0, 0.22);
        }

        @media (max-width: 760px) {
          .codex-page {
            padding: 74px 16px 72px;
          }

          .codex-hero {
            position: relative;
            top: auto;
          }

          .codex-hero-row {
            flex-direction: column;
          }

          .codex-reading-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="codex-page">
        <div className="codex-shell">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="codex-hero">
          <div>
            <div className="codex-hero-row">
              <div>
                <div className="codex-kicker">FIELD INDEX · 64 ROOT CODONS</div>
                <h1 className="codex-title">
                  The Vossari Resonance Codex
                </h1>
                <p className="codex-subtitle">
                  A living map of codons, facets, centers, and resonance architecture.
                </p>
              </div>
              <button
                onClick={() => setLocation("/carrierlock")}
                className="codex-reading-button"
              >
                GET READING
              </button>
            </div>
            <div className="codex-search">
              <Search />
              <input
                type="text"
                placeholder="Search name, title, domain…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        <div className="codex-grid-wrap">
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
                      "codex-tile group relative flex flex-col items-center gap-2 p-3 rounded-xl border",
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
      </div>
    </VossArchiveShell>
  );
}
