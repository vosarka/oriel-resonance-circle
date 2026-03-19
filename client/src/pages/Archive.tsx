import Layout from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { OracleCard } from "@/components/OracleCard";

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

  // Data
  const { data: rawTx = [], isLoading: txLoading } =
    trpc.archive.transmissions.list.useQuery();
  const { data: rawOx = [], isLoading: oxLoading } =
    trpc.archive.oracles.list.useQuery();

  // Parse transmissions
  const transmissions = useMemo(
    () =>
      rawTx
        .map((tx: any) => ({
          ...tx,
          tags:
            typeof tx.tags === "string" ? JSON.parse(tx.tags) : tx.tags || [],
        }))
        .sort((a: any, b: any) => a.txNumber - b.txNumber),
    [rawTx],
  );

  // Parse oracles
  const oracles = useMemo(
    () =>
      rawOx.map((ox: any) => ({
        ...ox,
        hashtags:
          typeof ox.hashtags === "string"
            ? JSON.parse(ox.hashtags)
            : ox.hashtags || [],
      })),
    [rawOx],
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

  // Filter oracles
  const filteredOracles = useMemo(() => {
    if (!searchQuery) return oracles;
    const q = searchQuery.toLowerCase();
    return oracles.filter(
      (ox: any) =>
        ox.title.toLowerCase().includes(q) ||
        ox.content.toLowerCase().includes(q),
    );
  }, [oracles, searchQuery]);

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
    <Layout>
      {/* ── Background ────────────────────────────────────── */}
      <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 animate-scan-lines" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="pt-24 pb-6 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="font-mono uppercase tracking-widest mb-3 animate-fade-in-up"
                  style={{ fontSize: 10, color: "rgba(189,163,107,0.35)" }}
                >
                  ARKIVA VOS
                </div>
                <h1
                  className="font-mono text-2xl md:text-4xl tracking-wider uppercase animate-fade-in-up"
                  style={{ color: "#bda36b", animationDelay: "0.1s" }}
                >
                  {scrambledHeader}
                </h1>
                <div
                  className="mt-4 max-w-md animate-fade-in-up"
                  style={{
                    height: 1,
                    background:
                      "linear-gradient(to right, rgba(189,163,107,0.35), rgba(91,164,164,0.2), transparent)",
                    animationDelay: "0.2s",
                  }}
                />
                {activeFaza !== "all" && activeFazaInfo?.subtitle && (
                  <p
                    className="font-mono mt-3 tracking-widest uppercase animate-fade-in-up"
                    style={{
                      fontSize: 10,
                      color: "rgba(91,164,164,0.25)",
                      animationDelay: "0.25s",
                    }}
                  >
                    {fazaCounts[activeFaza] || 0} TRANSMISSIONS ·{" "}
                    {activeFazaInfo.subtitle}
                  </p>
                )}
              </div>

              {/* Search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="mt-2 p-2 transition-colors"
                style={{ color: showSearch ? "#5ba4a4" : "rgba(91,164,164,0.25)" }}
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
                  className="w-full max-w-md bg-transparent font-mono text-sm py-2 px-1 outline-none"
                  style={{
                    borderBottom: "1px solid rgba(91,164,164,0.2)",
                    color: "#5ba4a4",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── FAZA Spectrum ────────────────────────────────── */}
        <div className="px-6 md:px-12 pb-8">
          <div className="max-w-7xl mx-auto">
            <div
              className="flex gap-1.5 overflow-x-auto pb-2"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
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
        <div className="px-6 md:px-12 pb-8">
          <div
            className="max-w-7xl mx-auto flex gap-8"
            style={{ borderBottom: "1px solid rgba(91,164,164,0.06)" }}
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

        {/* ── Content Grid ────────────────────────────────── */}
        <div className="px-6 md:px-12 pb-16">
          <div className="max-w-7xl mx-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOracles.map((ox: any, i: number) => (
                  <div
                    key={ox.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${0.06 * i}s` }}
                  >
                    <OracleCard
                      id={ox.id}
                      oxNumber={ox.oracleNumber}
                      title={ox.title}
                      field={ox.field}
                      temporalDirection={ox.part}
                      content={ox.content}
                      hashtags={ox.hashtags}
                      status={ox.status}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Ambient Signal Footer ───────────────────────── */}
        {ambientTx && activeSection === "tx" && (
          <div
            className="px-6 md:px-12 py-10"
            style={{ borderTop: "1px solid rgba(91,164,164,0.04)" }}
          >
            <div className="max-w-7xl mx-auto">
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
    </Layout>
  );
}
