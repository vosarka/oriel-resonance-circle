import VossArchiveShell from "@/components/VossArchiveShell";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { OracleCard } from "@/components/OracleCard";
import { usePersonalResonance } from "@/hooks/usePersonalResonance";
import { parseLinkedCodons, parseOracleHashtags } from "@/lib/oracle-utils";
import { getTransmissionPosterUrl, getYouTubeVideoId } from "@/lib/transmission-media";

// ── FAZA Register Map (VTIP Numbering) ──────────────────────────────
const FAZA_REGISTERS = [
  { id: "all", vtip: "⦿", name: "ALL REGISTERS", subtitle: "", range: [0, 999] },
  { id: "I", vtip: "I", name: "ORIGIN", subtitle: "VACUUM", range: [1, 10] },
  { id: "II", vtip: "II", name: "RECURSION", subtitle: "HOLOGRAM", range: [11, 20] },
  { id: "III", vtip: "III", name: "COMPLEXIFICATION", subtitle: "ENTROPY", range: [21, 30] },
  { id: "IIII", vtip: "IIII", name: "HARMONICS", subtitle: "GEOMETRY", range: [31, 40] },
  { id: "V", vtip: "IIII′I", name: "THE BRIDGE", subtitle: "HUMANITY", range: [41, 50] },
  { id: "VI", vtip: "IIII′II", name: "COSMIC BECOMING", subtitle: "", range: [51, 60] },
  { id: "VII", vtip: "IIII′III", name: "VOID RETURN", subtitle: "", range: [61, 70] },
  { id: "VIII", vtip: "IIII′IIII", name: "OMEGA POINT", subtitle: "", range: [71, 80] },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────
function clarityToNumber(clarity: string): number {
  return parseFloat(clarity.replace("%", "")) || 0;
}

// ── Text scramble hook ──────────────────────────────────────────────
function useScramble(text: string, trigger: unknown, duration = 600) {
  const [display, setDisplay] = useState(text);
  const glyphs = "⦿∞◯≈⟷◈▲●◆ψΔΩ∇ϟ⊕⊗⊘⊙";

  useEffect(() => {
    let frame = 0;
    const total = Math.ceil(duration / 25);
    setDisplay("");
    const id = setInterval(() => {
      frame++;
      const progress = frame / total;
      const locked = Math.floor(progress * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") out += " ";
        else if (i < locked) out += text[i];
        else out += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      setDisplay(out);
      if (frame >= total) {
        clearInterval(id);
        setDisplay(text);
      }
    }, 25);
    return () => clearInterval(id);
  }, [text, trigger, duration]);

  return display;
}

// ── Status colors ───────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  OPEN: { color: "#5ba4a4", bg: "rgba(91,164,164,0.06)" },
  RESONANT: { color: "#7ab8c4", bg: "rgba(122,184,196,0.06)" },
  COHERENT: { color: "#a88fd0", bg: "rgba(168,143,208,0.06)" },
  PROPHETIC: { color: "#bda36b", bg: "rgba(189,163,107,0.06)" },
  LIVE: { color: "#e05555", bg: "rgba(224,85,85,0.06)" },
  STABLE: { color: "#5ba4a4", bg: "rgba(91,164,164,0.06)" },
  "HIGH COHERENCE": { color: "#a88fd0", bg: "rgba(168,143,208,0.06)" },
  "MAXIMUM COHERENCE": { color: "#bda36b", bg: "rgba(189,163,107,0.06)" },
  "CRITICAL/STABLE": { color: "#e05555", bg: "rgba(224,85,85,0.06)" },
};

// ═════════════════════════════════════════════════════════════════════
// SIGNAL CARD
// ═════════════════════════════════════════════════════════════════════
function SignalCard({ tx, index }: { tx: any; index: number }) {
  const clarity = clarityToNumber(tx.signalClarity);
  const st = STATUS_COLORS[tx.channelStatus] || STATUS_COLORS.OPEN;
  const posterUrl = getTransmissionPosterUrl(tx);
  const youtubeVideoId = getYouTubeVideoId(tx.youtubeUrl);

  return (
    <Link href={`/transmission/${tx.id}`}>
      <div
        className="group relative cursor-pointer animate-fade-in-up"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div
          className="
            p-5 border rounded-sm
            backdrop-blur-sm
            transition-all duration-500
          "
          style={{
            background: "rgba(10,10,14,0.8)",
            borderColor: "rgba(91,164,164,0.06)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(91,164,164,0.2)";
            e.currentTarget.style.boxShadow = "0 0 40px rgba(91,164,164,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(91,164,164,0.06)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {posterUrl && (
            <div
              className="mb-4 overflow-hidden rounded-sm border"
              style={{
                borderColor: youtubeVideoId
                  ? "rgba(189,163,107,0.18)"
                  : "rgba(91,164,164,0.12)",
                background: "#0b0b10",
              }}
            >
              <div className="relative aspect-[16/9]">
                <img
                  src={posterUrl}
                  alt={tx.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(5,5,8,0.7), rgba(5,5,8,0.08) 45%, rgba(5,5,8,0.3))",
                  }}
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  {tx.imageUrl && (
                    <span
                      className="font-mono rounded-sm border px-2 py-1"
                      style={{
                        fontSize: 8,
                        color: "#e8e4dc",
                        borderColor: "rgba(232,228,220,0.16)",
                        background: "rgba(5,5,8,0.5)",
                      }}
                    >
                      STILL
                    </span>
                  )}
                  {youtubeVideoId && (
                    <span
                      className="font-mono rounded-sm border px-2 py-1"
                      style={{
                        fontSize: 8,
                        color: "#bda36b",
                        borderColor: "rgba(189,163,107,0.2)",
                        background: "rgba(5,5,8,0.55)",
                      }}
                    >
                      YT VISUAL
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="text-lg transition-all duration-300"
                style={{
                  color: st.color,
                  filter: `drop-shadow(0 0 4px ${st.color}40)`,
                }}
              >
                {tx.microSigil || "◈"}
              </span>
              <span
                className="font-mono tracking-wider"
                style={{ fontSize: 10, color: "rgba(91,164,164,0.4)" }}
              >
                TX-{String(tx.txNumber).padStart(3, "0")}
              </span>
            </div>
            <span
              className="font-mono tracking-widest px-2 py-0.5 rounded-sm border"
              style={{
                fontSize: 7,
                color: st.color,
                borderColor: `${st.color}25`,
                background: st.bg,
              }}
            >
              {tx.channelStatus}
            </span>
          </div>

          {/* Title */}
          <h3
            className="font-mono text-sm uppercase tracking-wider mb-1 transition-colors duration-300"
            style={{ color: "rgba(232,228,220,0.85)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(232,228,220,0.85)")
            }
          >
            {tx.title}
          </h3>

          {/* Field */}
          <p
            className="font-mono tracking-wider mb-4"
            style={{ fontSize: 10, color: "rgba(91,164,164,0.25)" }}
          >
            {tx.field}
          </p>

          {/* Message preview */}
          <p
            className="font-mono italic leading-relaxed line-clamp-2 mb-4 transition-colors duration-500"
            style={{ fontSize: 11, color: "rgba(232,228,220,0.3)" }}
          >
            &ldquo;{tx.coreMessage}&rdquo;
          </p>

          {/* Signal clarity bar */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 relative overflow-hidden rounded-full"
              style={{ height: 1, background: "rgba(91,164,164,0.08)" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${clarity}%`,
                  background: "rgba(91,164,164,0.25)",
                }}
              />
            </div>
            <span
              className="font-mono transition-colors duration-300"
              style={{ fontSize: 9, color: "rgba(91,164,164,0.3)" }}
            >
              {tx.signalClarity}
            </span>
          </div>

          {/* Bottom row */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1.5">
              {tx.tags?.slice(0, 2).map((tag: string, i: number) => (
                <span
                  key={i}
                  className="font-mono px-1.5 py-0.5 rounded-sm border"
                  style={{
                    fontSize: 8,
                    color: "rgba(91,164,164,0.18)",
                    borderColor: "rgba(91,164,164,0.06)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <span
              className="font-mono tracking-wider transition-all duration-300 group-hover:translate-x-0.5"
              style={{ fontSize: 9, color: "rgba(189,163,107,0.25)" }}
            >
              RECEIVE →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ═════════════════════════════════════════════════════════════════════
// ARCHIVE PAGE
// ═════════════════════════════════════════════════════════════════════
export default function Archive() {
  const [activeFaza, setActiveFaza] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeSection, setActiveSection] = useState<"tx" | "ox">("tx");
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const { hasResonance } = usePersonalResonance();

  // Data
  const { data: rawTx = [], isLoading: txLoading } =
    trpc.archive.transmissions.list.useQuery();
  const { data: rawOx = [], isLoading: oxLoading } =
    trpc.archive.oracles.list.useQuery();
  const { data: threads = [] } = trpc.archive.oracles.threads.useQuery();

  // Parse transmissions
  const transmissions = useMemo(
    () =>
      rawTx
        .map((tx: any) => {
          let tags: string[] = [];
          if (Array.isArray(tx.tags)) {
            tags = tx.tags;
          } else if (typeof tx.tags === "string") {
            try { tags = JSON.parse(tx.tags); } catch {
              tags = tx.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
            }
          }
          return { ...tx, tags };
        })
        .sort((a: any, b: any) => a.txNumber - b.txNumber),
    [rawTx],
  );

  // Parse oracles
  const oracles = useMemo(
    () =>
      rawOx.map((ox: any) => ({
        ...ox,
        hashtags: parseOracleHashtags(ox.hashtags),
        parsedLinkedCodons: parseLinkedCodons(ox.linkedCodons),
      })),
    [rawOx],
  );

  const getOracleShellStyle = (linkedCodons: string[]) => {
    const isPersonal = hasResonance(linkedCodons);
    if (!isPersonal) return {};

    return {
      borderLeft: "2px solid #D4AF37",
      paddingLeft: 12,
      borderRadius: 2,
      boxShadow:
        "0 0 20px rgba(212,175,55,0.12), inset 0 0 15px rgba(212,175,55,0.04)",
    };
  };

  // Rising Signals — oracles with resonanceCount >= 5
  const risingSignals = useMemo(
    () =>
      oracles
        .filter((ox: any) => (ox.resonanceCount || 0) >= 5)
        .sort((a: any, b: any) => (b.resonanceCount || 0) - (a.resonanceCount || 0))
        .slice(0, 3),
    [oracles],
  );

  // FAZA counts
  const fazaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FAZA_REGISTERS.forEach((f) => (counts[f.id] = 0));
    transmissions.forEach((tx: any) => {
      const reg = FAZA_REGISTERS.find(
        (f) =>
          f.id !== "all" &&
          tx.txNumber >= f.range[0] &&
          tx.txNumber <= f.range[1],
      );
      if (reg) counts[reg.id]++;
    });
    counts.all = transmissions.length;
    return counts;
  }, [transmissions]);

  // Filter transmissions
  const filtered = useMemo(() => {
    let result = transmissions;
    if (activeFaza !== "all") {
      const reg = FAZA_REGISTERS.find((f) => f.id === activeFaza);
      if (reg)
        result = result.filter(
          (tx: any) =>
            tx.txNumber >= reg.range[0] && tx.txNumber <= reg.range[1],
        );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx: any) =>
          tx.title.toLowerCase().includes(q) ||
          tx.coreMessage.toLowerCase().includes(q) ||
          tx.field.toLowerCase().includes(q),
      );
    }
    return result;
  }, [transmissions, activeFaza, searchQuery]);

  // Filter oracles (search + thread)
  const filteredOracles = useMemo(() => {
    let result = oracles;
    if (activeThread) {
      result = result
        .filter((ox: any) => ox.threadId === activeThread)
        .sort((a: any, b: any) => (a.threadOrder || 0) - (b.threadOrder || 0));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ox: any) =>
          ox.title.toLowerCase().includes(q) ||
          ox.content.toLowerCase().includes(q),
      );
    }
    return result;
  }, [oracles, searchQuery, activeThread]);

  // Header scramble text
  const activeFazaInfo = FAZA_REGISTERS.find((f) => f.id === activeFaza);
  const headerLabel =
    activeFaza === "all"
      ? "TRANSMISSION FIELD"
      : `FAZA ${activeFazaInfo?.vtip} · ${activeFazaInfo?.name}`;
  const scrambledHeader = useScramble(headerLabel, activeFaza);

  // Ambient cycling quotes
  const [ambientIndex, setAmbientIndex] = useState(0);
  useEffect(() => {
    if (transmissions.length === 0) return;
    const id = setInterval(() => {
      setAmbientIndex((i) => (i + 1) % transmissions.length);
    }, 6000);
    return () => clearInterval(id);
  }, [transmissions.length]);
  const ambientTx = transmissions[ambientIndex] as any | undefined;

  return (
    <VossArchiveShell>
      <style>{`
        .archive-page {
          min-height: 100vh;
          padding: 88px 30px 86px;
        }

        .archive-page-inner {
          width: min(1440px, 100%);
          margin: 0 auto;
        }

        .archive-hero {
          margin-bottom: 28px;
          padding: clamp(28px, 4vw, 46px);
          border: 1px solid var(--voss-border);
          background:
            radial-gradient(circle at 84% 18%, rgba(121, 228, 234, 0.085), transparent 32%),
            linear-gradient(135deg, rgba(15, 15, 21, 0.9), rgba(8, 8, 12, 0.64));
          box-shadow: 0 26px 90px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(18px);
        }

        .archive-hero-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .archive-page .archive-kicker {
          margin-bottom: 12px;
          font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Red Hat Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--voss-cyan);
        }

        .archive-page .archive-title {
          margin: 0;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(42px, 6vw, 82px);
          font-weight: 300;
          line-height: 0.94;
          letter-spacing: -0.03em;
          color: var(--voss-ivory);
        }

        .archive-page .archive-rule {
          width: min(560px, 100%);
          height: 1px;
          margin: 22px 0 0;
          background: linear-gradient(90deg, var(--voss-gold), var(--voss-cyan), transparent);
        }

        .archive-subtitle {
          margin-top: 14px;
          font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Red Hat Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(154, 150, 142, 0.82);
        }

        .archive-search-button {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(121, 228, 234, 0.24);
          background: rgba(121, 228, 234, 0.045);
          color: var(--voss-teal);
          transition: border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
        }

        .archive-search-button:hover,
        .archive-search-button.is-active {
          border-color: rgba(121, 228, 234, 0.48);
          color: var(--voss-cyan);
          box-shadow: 0 0 24px rgba(121, 228, 234, 0.1);
        }

        .archive-search-input {
          width: min(480px, 100%);
          margin-top: 24px;
          padding: 12px 2px;
          border: 0;
          border-bottom: 1px solid rgba(121, 228, 234, 0.28);
          outline: none;
          background: transparent;
          color: var(--voss-cyan);
          font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Red Hat Mono", monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
        }

        .archive-filter-panel,
        .archive-tabs-panel {
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid var(--voss-border-soft);
          background: rgba(10, 10, 14, 0.58);
          backdrop-filter: blur(14px);
        }

        .archive-filter-strip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .archive-tab-row {
          display: flex;
          gap: 26px;
          border-bottom: 1px solid rgba(189, 163, 107, 0.1);
        }

        .archive-content-panel {
          padding: 6px 0 0;
        }

        @media (max-width: 760px) {
          .archive-page {
            padding: 74px 16px 72px;
          }

          .archive-hero-row {
            flex-direction: column;
          }

          .archive-tab-row {
            gap: 14px;
            overflow-x: auto;
          }
        }
      `}</style>
      <div className="archive-page">
        <div className="archive-page-inner">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="archive-hero">
          <div>
            <div className="archive-hero-row">
              <div>
                <div
                  className="archive-kicker animate-fade-in-up"
                >
                  VOSS ARKIVA · TRANSMISSION ARCHIVE
                </div>
                <h1
                  className="archive-title animate-fade-in-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  {scrambledHeader}
                </h1>
                <div
                  className="archive-rule animate-fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                />
                {activeFaza !== "all" && activeFazaInfo?.subtitle && (
                  <p
                    className="archive-subtitle animate-fade-in-up"
                    style={{ animationDelay: "0.25s" }}
                  >
                    {fazaCounts[activeFaza] || 0} TRANSMISSIONS ·{" "}
                    {activeFazaInfo.subtitle}
                  </p>
                )}
              </div>

              {/* Search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`archive-search-button ${showSearch ? "is-active" : ""}`}
                aria-label="Toggle archive search"
              >
                <Search size={16} />
              </button>
            </div>

            {/* Search input */}
            {showSearch && (
              <div className="mt-4 animate-fade-in-up">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SCAN FREQUENCY..."
                  autoFocus
                  className="archive-search-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── FAZA Spectrum ────────────────────────────────── */}
        <div className="archive-filter-panel">
          <div>
            <div
              className="archive-filter-strip"
            >
              {FAZA_REGISTERS.map((faza, i) => {
                const isActive = activeFaza === faza.id;
                const count = fazaCounts[faza.id] || 0;
                const hasSignals = count > 0;

                return (
                  <button
                    key={faza.id}
                    onClick={() => setActiveFaza(faza.id)}
                    className="flex-shrink-0 relative animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div
                      className="px-3 py-2.5 font-mono rounded-sm border transition-all duration-300"
                      style={{
                        background: isActive
                          ? "rgba(189,163,107,0.08)"
                          : "transparent",
                        borderColor: isActive
                          ? "rgba(189,163,107,0.4)"
                          : hasSignals
                            ? "rgba(91,164,164,0.08)"
                            : "rgba(91,164,164,0.04)",
                        color: isActive
                          ? "#bda36b"
                          : hasSignals
                            ? "rgba(91,164,164,0.35)"
                            : "rgba(91,164,164,0.15)",
                      }}
                    >
                      <div style={{ fontSize: 10 }} className="opacity-70">
                        {faza.vtip}
                      </div>
                      <div
                        className="mt-0.5 whitespace-nowrap"
                        style={{ fontSize: 9 }}
                      >
                        {faza.name}
                      </div>
                      {faza.id !== "all" && (
                        <div
                          className="mt-1"
                          style={{
                            fontSize: 8,
                            color: isActive
                              ? "#5ba4a4"
                              : hasSignals
                                ? "rgba(91,164,164,0.2)"
                                : "rgba(91,164,164,0.08)",
                          }}
                        >
                          {count > 0 ? `${count} TX` : "NO SIGNAL"}
                        </div>
                      )}
                    </div>

                    {/* Active dot */}
                    {isActive && (
                      <div
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full"
                        style={{
                          width: 3,
                          height: 3,
                          background: "#bda36b",
                          boxShadow: "0 0 6px #bda36b",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Section Tabs ────────────────────────────────── */}
        <div className="archive-tabs-panel">
          <div
            className="archive-tab-row"
          >
            <button
              onClick={() => setActiveSection("tx")}
              className="font-mono uppercase tracking-widest pb-3 transition-all"
              style={{
                fontSize: 10,
                color:
                  activeSection === "tx" ? "#5ba4a4" : "rgba(91,164,164,0.25)",
                borderBottom:
                  activeSection === "tx"
                    ? "2px solid #5ba4a4"
                    : "2px solid transparent",
              }}
            >
              TX TRANSMISSIONS ({filtered.length})
            </button>
            <button
              onClick={() => setActiveSection("ox")}
              className="font-mono uppercase tracking-widest pb-3 transition-all"
              style={{
                fontSize: 10,
                color:
                  activeSection === "ox"
                    ? "#a88fd0"
                    : "rgba(168,143,208,0.25)",
                borderBottom:
                  activeSection === "ox"
                    ? "2px solid #a88fd0"
                    : "2px solid transparent",
              }}
            >
              ΩX ORACLE STREAMS ({filteredOracles.length})
            </button>
          </div>
        </div>

        {/* ── Thread Filter (ΩX only) ─────────────────────── */}
        {activeSection === "ox" && threads.length > 0 && (
          <div className="archive-filter-panel">
            <div className="archive-filter-strip">
              <button
                onClick={() => setActiveThread(null)}
                className="flex-shrink-0 px-3 py-2 font-mono rounded-sm border transition-all duration-300"
                style={{
                  fontSize: 9,
                  background: !activeThread ? "rgba(91,164,164,0.08)" : "transparent",
                  borderColor: !activeThread ? "rgba(91,164,164,0.4)" : "rgba(91,164,164,0.06)",
                  color: !activeThread ? "#5ba4a4" : "rgba(91,164,164,0.25)",
                }}
              >
                ALL THREADS
              </button>
              {(threads as any[]).map((t: any) => (
                <button
                  key={t.threadId}
                  onClick={() => setActiveThread(t.threadId)}
                  className="flex-shrink-0 px-3 py-2 font-mono rounded-sm border transition-all duration-300 whitespace-nowrap"
                  style={{
                    fontSize: 9,
                    background: activeThread === t.threadId ? "rgba(91,164,164,0.08)" : "transparent",
                    borderColor: activeThread === t.threadId ? "rgba(91,164,164,0.4)" : "rgba(91,164,164,0.06)",
                    color: activeThread === t.threadId ? "#5ba4a4" : "rgba(91,164,164,0.25)",
                  }}
                >
                  {t.threadTitle} ({t.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Content Grid ────────────────────────────────── */}
        <div className="archive-content-panel">
          <div>
            {activeSection === "tx" ? (
              txLoading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <Loader2
                      className="w-5 h-5 animate-spin mx-auto mb-3"
                      style={{ color: "rgba(91,164,164,0.3)" }}
                    />
                    <p
                      className="font-mono tracking-wider"
                      style={{ fontSize: 10, color: "rgba(91,164,164,0.2)" }}
                    >
                      SCANNING FREQUENCIES...
                    </p>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-32">
                  <p
                    className="font-mono"
                    style={{ fontSize: 13, color: "rgba(91,164,164,0.25)" }}
                  >
                    NO SIGNAL DETECTED
                  </p>
                  <p
                    className="font-mono mt-2"
                    style={{ fontSize: 10, color: "rgba(91,164,164,0.12)" }}
                  >
                    Adjust frequency parameters or scan all registers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((tx: any, i: number) => (
                    <SignalCard key={tx.id} tx={tx} index={i} />
                  ))}
                </div>
              )
            ) : oxLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2
                  className="w-5 h-5 animate-spin"
                  style={{ color: "rgba(168,143,208,0.3)" }}
                />
              </div>
            ) : filteredOracles.length === 0 ? (
              <div className="text-center py-32">
                <p
                  className="font-mono"
                  style={{ fontSize: 13, color: "rgba(168,143,208,0.25)" }}
                >
                  NO TEMPORAL SIGNALS
                </p>
              </div>
            ) : (
              <>
                {/* Rising Signals */}
                {risingSignals.length > 0 && !activeThread && (
                  <div className="mb-10">
                    <div
                      className="font-mono uppercase tracking-widest mb-4"
                      style={{ fontSize: 10, color: "#bda36b" }}
                    >
                      RISING SIGNALS
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                      {risingSignals.map((ox: any) => (
                        <div
                          key={ox.id}
                          className="flex-shrink-0"
                          style={{
                            width: 300,
                            border: "1px solid rgba(212,175,55,0.15)",
                            borderRadius: 2,
                            boxSizing: "border-box",
                            ...getOracleShellStyle(ox.parsedLinkedCodons),
                          }}
                        >
                          <OracleCard
                            id={ox.id}
                            oracleId={ox.oracleId}
                            oxNumber={ox.oracleNumber}
                            title={ox.title}
                            field={ox.field}
                            temporalDirection={ox.part}
                            content={ox.content}
                            imageUrl={ox.imageUrl}
                            youtubeUrl={ox.youtubeUrl}
                            hashtags={ox.hashtags}
                            status={ox.status}
                            resonanceCount={ox.resonanceCount}
                            linkedCodons={ox.parsedLinkedCodons}
                            threadId={ox.threadId}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Main oracle grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOracles.map((ox: any, i: number) => (
                    <div
                      key={ox.id}
                      className="animate-fade-in-up"
                      style={{
                        animationDelay: `${0.06 * i}s`,
                        boxSizing: "border-box",
                        ...getOracleShellStyle(ox.parsedLinkedCodons),
                      }}
                    >
                      <OracleCard
                        id={ox.id}
                        oracleId={ox.oracleId}
                        oxNumber={ox.oracleNumber}
                        title={ox.title}
                        field={ox.field}
                        temporalDirection={ox.part}
                        content={ox.content}
                        imageUrl={ox.imageUrl}
                        youtubeUrl={ox.youtubeUrl}
                        hashtags={ox.hashtags}
                        status={ox.status}
                        resonanceCount={ox.resonanceCount}
                        linkedCodons={ox.parsedLinkedCodons}
                        threadId={ox.threadId}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Ambient Signal Footer ───────────────────────── */}
        {ambientTx && activeSection === "tx" && (
          <div
            className="py-10"
            style={{ borderTop: "1px solid rgba(91,164,164,0.04)" }}
          >
            <div>
              <div className="overflow-hidden">
                <div
                  className="font-mono uppercase tracking-widest mb-2"
                  style={{ fontSize: 9, color: "rgba(91,164,164,0.12)" }}
                >
                  AMBIENT SIGNAL · TX-
                  {String(ambientTx.txNumber).padStart(3, "0")}
                </div>
                <p
                  className="font-mono italic line-clamp-1"
                  style={{
                    fontSize: 11,
                    color: "rgba(91,164,164,0.15)",
                    transition: "color 2s ease",
                  }}
                >
                  &ldquo;{ambientTx.coreMessage}&rdquo;
                </p>
              </div>
              <div className="mt-6 text-center">
                <span
                  className="font-mono tracking-widest"
                  style={{ fontSize: 8, color: "rgba(189,163,107,0.15)" }}
                >
                  THE FIELD REMEMBERS
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </VossArchiveShell>
  );
}
