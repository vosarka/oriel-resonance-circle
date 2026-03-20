import { useState, useMemo } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";
import { Loader2, ArrowLeft } from "lucide-react";

// ── Design Tokens (shared with StaticReading) ──────────────────
const C = {
  void:     "#0a0a0e",
  deep:     "#0f0f15",
  surface:  "#14141c",
  surfaceR: "#1a1a24",
  border:   "rgba(189,163,107,0.12)",
  borderH:  "rgba(189,163,107,0.25)",
  gold:     "#bda36b",
  goldL:    "#d4c090",
  goldDim:  "rgba(189,163,107,0.5)",
  teal:     "#5ba4a4",
  tealDim:  "rgba(91,164,164,0.4)",
  txt:      "#e8e4dc",
  txtS:     "#9a968e",
  txtD:     "#6a665e",
  red:      "#c94444",
  green:    "#44a866",
  blue:     "#4488cc",
};

// ── Zone theming ──────────────────────────────────────────────
type CoherenceZone = "Entropy" | "Flux" | "Resonance";

function getZone(score: number): CoherenceZone {
  if (score >= 80) return "Resonance";
  if (score >= 40) return "Flux";
  return "Entropy";
}

const ZONE_THEME: Record<CoherenceZone, { color: string; glow: string; bg: string; label: string }> = {
  Entropy:   { color: C.red,  glow: "rgba(201,68,68,0.15)",  bg: "rgba(201,68,68,0.04)",  label: "ENTROPY" },
  Flux:      { color: C.gold, glow: "rgba(189,163,107,0.15)", bg: "rgba(189,163,107,0.04)", label: "FLUX" },
  Resonance: { color: C.teal, glow: "rgba(91,164,164,0.15)",  bg: "rgba(91,164,164,0.04)",  label: "RESONANCE" },
};

// ══════════════════════════════════════════════════════════════
// SVG: Circular Coherence Gauge
// ══════════════════════════════════════════════════════════════
function CoherenceGauge({ score }: { score: number }) {
  const zone = getZone(score);
  const theme = ZONE_THEME[zone];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg viewBox="0 0 100 100" style={{ width: 180, height: 180 }}>
        {/* Background track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke={C.border} strokeWidth="3" />
        {/* Progress arc */}
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke={theme.color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        {/* Inner glow */}
        <circle cx="50" cy="50" r="30" fill={theme.glow} opacity="0.5" />
        {/* Score text */}
        <text x="50" y="46" textAnchor="middle" style={{ fontSize: "18px", fontFamily: "monospace", fill: theme.color, fontWeight: 700 }}>
          {score}
        </text>
        <text x="50" y="56" textAnchor="middle" style={{ fontSize: "5px", fontFamily: "monospace", fill: C.txtD, letterSpacing: "2px" }}>
          / 100
        </text>
        <text x="50" y="66" textAnchor="middle" style={{ fontSize: "4px", fontFamily: "monospace", fill: theme.color, letterSpacing: "3px" }}>
          {theme.label}
        </text>
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SVG: 3-Axis Interference Radar (MN / BT / ET)
// ══════════════════════════════════════════════════════════════
function InterferenceRadar({ mn, bt, et }: { mn: number; bt: number; et: number }) {
  // Triangle vertices at 10-scale
  const cx = 50, cy = 52;
  const scale = 3.5;
  // 3 axes: top, bottom-left, bottom-right (120° apart)
  const axes = [
    { label: "MN", angle: -90,  value: mn },
    { label: "BT", angle: 150,  value: bt },
    { label: "ET", angle: 30,   value: et },
  ];

  const toXY = (angle: number, val: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * val * scale,
      y: cy + Math.sin(rad) * val * scale,
    };
  };

  // Grid lines at 33%, 66%, 100%
  const gridLevels = [3.3, 6.6, 10];

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", maxWidth: 200, height: "auto" }}>
      {/* Grid triangles */}
      {gridLevels.map((level, gi) => {
        const pts = axes.map(a => toXY(a.angle, level));
        return (
          <polygon key={gi}
            points={pts.map(p => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke={C.border} strokeWidth="0.3"
          />
        );
      })}
      {/* Axis lines */}
      {axes.map((a, i) => {
        const end = toXY(a.angle, 10);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={C.border} strokeWidth="0.3" />;
      })}
      {/* Data shape */}
      {(() => {
        const pts = axes.map(a => toXY(a.angle, a.value));
        return (
          <>
            <polygon
              points={pts.map(p => `${p.x},${p.y}`).join(" ")}
              fill="rgba(201,68,68,0.12)" stroke={C.red} strokeWidth="0.6"
            />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={C.red} />
            ))}
          </>
        );
      })()}
      {/* Labels */}
      {axes.map((a, i) => {
        const pos = toXY(a.angle, 12.5);
        return (
          <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: "3.5px", fontFamily: "monospace", fill: C.txtS, letterSpacing: "1px" }}>
            {a.label} {a.value}
          </text>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// SVG: Coherence Sparkline (history)
// ══════════════════════════════════════════════════════════════
function CoherenceSparkline({ history }: { history: { coherenceScore: number; createdAt: Date | string }[] }) {
  if (history.length < 2) return null;

  const sorted = [...history].reverse(); // oldest first for left-to-right
  const w = 280, h = 60, pad = 8;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const points = sorted.map((entry, i) => {
    const x = pad + (i / (sorted.length - 1)) * innerW;
    const y = pad + innerH - (entry.coherenceScore / 100) * innerH;
    return { x, y, score: entry.coherenceScore };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Zone bands
  const yAt = (score: number) => pad + innerH - (score / 100) * innerH;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      {/* Zone bands */}
      <rect x={pad} y={yAt(100)} width={innerW} height={yAt(80) - yAt(100)} fill="rgba(91,164,164,0.05)" />
      <rect x={pad} y={yAt(80)} width={innerW} height={yAt(40) - yAt(80)} fill="rgba(189,163,107,0.05)" />
      <rect x={pad} y={yAt(40)} width={innerW} height={yAt(0) - yAt(40)} fill="rgba(201,68,68,0.05)" />
      {/* Zone threshold lines */}
      <line x1={pad} y1={yAt(80)} x2={w - pad} y2={yAt(80)} stroke={C.teal} strokeWidth="0.3" strokeDasharray="3 3" />
      <line x1={pad} y1={yAt(40)} x2={w - pad} y2={yAt(40)} stroke={C.red} strokeWidth="0.3" strokeDasharray="3 3" />
      {/* Threshold labels */}
      <text x={w - pad + 2} y={yAt(80) + 1} style={{ fontSize: "4px", fill: C.teal, fontFamily: "monospace" }}>80</text>
      <text x={w - pad + 2} y={yAt(40) + 1} style={{ fontSize: "4px", fill: C.red, fontFamily: "monospace" }}>40</text>
      {/* Line */}
      <path d={pathD} fill="none" stroke={C.gold} strokeWidth="1" />
      {/* Dots */}
      {points.map((p, i) => {
        const zone = getZone(p.score);
        return <circle key={i} cx={p.x} cy={p.y} r="2" fill={ZONE_THEME[zone].color} />;
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════
export default function DynamicReading() {
  const { user } = useAuth();
  const [, params] = useRoute("/reading/dynamic/:id");
  const readingId = params?.id ? parseInt(params.id, 10) : 0;

  const [activeView, setActiveView] = useState<"field" | "transmission" | "history" | "context">("field");

  const { data: reading, isLoading, error } = trpc.codex.getCodonReading.useQuery(
    { id: readingId },
    { enabled: !!user && readingId > 0, retry: false }
  );

  const { data: coherenceHistory } = trpc.codex.getCoherenceHistory.useQuery(
    { limit: 10 },
    { enabled: !!user }
  );

  // ── Parse stored data ──────────────────────────────────────
  const transmission = reading?.readingText ?? "";
  const microCorrection = reading?.microCorrection;
  const falsifier = reading?.falsifier;
  const sliScores = (reading?.sliScores ?? {}) as Record<string, number>;

  // Extract coherence from header: "ORIEL Dynamic Reading — 72/100 — Flux"
  const headerMatch = transmission.match(/(\d+)\/100\s*[—–-]\s*(Entropy|Flux|Resonance)/i);
  const coherenceScore: number = headerMatch ? parseInt(headerMatch[1], 10) : 50;
  const zone = getZone(coherenceScore);
  const theme = ZONE_THEME[zone];

  // Extract MN/BT/ET from sliScores (passed through from Carrierlock)
  const mn = sliScores.mentalNoise ?? 5;
  const bt = sliScores.bodyTension ?? 5;
  const et = sliScores.emotionalTurbulence ?? 5;
  const breathDone = coherenceScore > (100 - (mn * 3 + bt * 3 + et * 3));

  // Strip header line for prose display
  const transmissionBody = transmission.startsWith("ORIEL Dynamic Reading")
    ? transmission.split("\n").slice(1).join("\n").trim()
    : transmission;

  // Compute trend from history
  const trend = useMemo(() => {
    if (!coherenceHistory || coherenceHistory.length < 2) return null;
    const recent = coherenceHistory.slice(0, 3).reduce((s, h) => s + h.coherenceScore, 0) / Math.min(3, coherenceHistory.length);
    const older = coherenceHistory.slice(-3).reduce((s, h) => s + h.coherenceScore, 0) / Math.min(3, coherenceHistory.length);
    const delta = recent - older;
    if (delta > 5) return { label: "RISING", color: C.teal, symbol: "↑" };
    if (delta < -5) return { label: "FALLING", color: C.red, symbol: "↓" };
    return { label: "STABLE", color: C.gold, symbol: "→" };
  }, [coherenceHistory]);

  // ── Auth guard ─────────────────────────────────────────────
  if (!user) {
    return (
      <Layout>
        <div style={{ background: C.void, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: C.txtS, marginBottom: 16, fontFamily: "monospace", fontSize: 12 }}>Signal requires authentication</p>
            <a href={getLoginUrl()} style={{ color: C.gold, fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", border: `1px solid ${C.goldDim}`, padding: "8px 20px" }}>
              ALIGN
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div style={{ background: C.void, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 style={{ color: C.teal, width: 28, height: 28, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: C.txtD, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em" }}>RECEIVING TRANSMISSION</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !reading) {
    return (
      <Layout>
        <div style={{ background: C.void, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: C.txtS, marginBottom: 16, fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Reading not found</p>
            <Link href="/carrierlock">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.txtD, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer" }}>
                <ArrowLeft style={{ width: 14, height: 14 }} /> BACK TO ASSESSMENT
              </span>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ══════════════════════════════════════════════════════════
  // VIEW 1: Field State
  // ══════════════════════════════════════════════════════════
  const renderFieldState = () => (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Zone banner */}
      <div style={{
        padding: "14px 20px", marginBottom: 28,
        background: theme.bg,
        borderLeft: `2px solid ${theme.color}`,
      }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: theme.color, letterSpacing: "0.25em" }}>
          FIELD STATE · {theme.label}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.txt, marginTop: 4, fontWeight: 300 }}>
          {zone === "Entropy" && "High interference detected. The field is fragmented."}
          {zone === "Flux" && "The field oscillates between patterns. Signal partially coherent."}
          {zone === "Resonance" && "Clear signal. The field has stabilized into harmonic coherence."}
        </div>
      </div>

      {/* Gauge + Radar side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start", marginBottom: 28 }}>
        {/* Coherence Gauge */}
        <div style={{ background: C.deep, padding: "24px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 16 }}>
            COHERENCE INDEX
          </div>
          <CoherenceGauge score={coherenceScore} />
        </div>

        {/* Interference Radar */}
        <div style={{ background: C.deep, padding: "24px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 16 }}>
            INTERFERENCE PATTERN
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <InterferenceRadar mn={mn} bt={bt} et={et} />
          </div>
        </div>
      </div>

      {/* Diagnostic breakdown */}
      <div style={{ background: C.deep, padding: "24px", borderTop: `1px solid ${C.border}`, marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 16 }}>
          AXIS BREAKDOWN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "MENTAL NOISE", value: mn, desc: "Cognitive interference" },
            { label: "BODY TENSION", value: bt, desc: "Somatic stress" },
            { label: "EMOTIONAL TURBULENCE", value: et, desc: "Emotional reactivity" },
          ].map(({ label, value, desc }) => {
            const pct = (value / 10) * 100;
            const barColor = pct >= 70 ? C.red : pct >= 40 ? C.gold : C.teal;
            return (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS }}>{label}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginLeft: 8 }}>{desc}</span>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 14, color: barColor }}>{value}<span style={{ fontSize: 9, color: C.txtD }}>/10</span></span>
                </div>
                <div style={{ height: 3, background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: barColor, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Breath protocol badge */}
        <div style={{
          marginTop: 16, padding: "10px 14px",
          background: breathDone ? "rgba(91,164,164,0.06)" : "transparent",
          border: `1px solid ${breathDone ? C.tealDim : C.border}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: breathDone ? C.teal : C.txtD }} />
          <span style={{ fontFamily: "monospace", fontSize: 10, color: breathDone ? C.teal : C.txtD, letterSpacing: "0.1em" }}>
            BREATH PROTOCOL {breathDone ? "COMPLETED (+10)" : "NOT COMPLETED"}
          </span>
        </div>
      </div>

      {/* Formula */}
      <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.05em" }}>
        CS = 100 − (MN+BT+ET)×3 + BC×10
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // VIEW 2: ORIEL Transmission
  // ══════════════════════════════════════════════════════════
  const renderTransmission = () => (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Transmission card */}
      <div style={{
        background: C.deep, padding: "28px 24px",
        borderTop: `2px solid ${theme.color}`,
        marginBottom: 24,
      }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 20 }}>
          ORIEL TRANSMISSION
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {transmissionBody.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontSize: 16, color: C.txt, lineHeight: 1.8, marginBottom: 16, fontWeight: 300 }}>
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Micro-correction */}
      {microCorrection && (
        <div style={{
          background: C.deep, padding: "24px",
          borderLeft: `2px solid ${C.gold}`,
          marginBottom: 24,
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.gold, letterSpacing: "0.2em", marginBottom: 12 }}>
            MICRO-CORRECTION
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.txt, lineHeight: 1.7, fontWeight: 300 }}>
            {microCorrection}
          </p>
        </div>
      )}

      {/* Falsifier */}
      {falsifier && (
        <div style={{
          background: C.deep, padding: "24px",
          borderLeft: `2px solid ${C.red}`,
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.red, letterSpacing: "0.2em", marginBottom: 12 }}>
            FALSIFIER · TEST IN THE NEXT 24 HOURS
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.txt, lineHeight: 1.7, fontStyle: "italic", fontWeight: 300 }}>
            {falsifier}
          </p>
        </div>
      )}

      {/* Flagged Codons */}
      {reading.flaggedCodons && reading.flaggedCodons.length > 0 && (
        <div style={{ background: C.deep, padding: "24px", marginTop: 24, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 16 }}>
            ACTIVE CODONS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
            {reading.flaggedCodons.map((codonId: string) => (
              <Link key={codonId} href={`/codex/${codonId}`}>
                <div style={{
                  padding: "10px 14px",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.teal }}>{codonId}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginLeft: 8 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // VIEW 3: Coherence History
  // ══════════════════════════════════════════════════════════
  const renderHistory = () => (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {!coherenceHistory || coherenceHistory.length === 0 ? (
        <div style={{ background: C.deep, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txtS, marginBottom: 12, fontWeight: 300 }}>
            No history yet
          </div>
          <p style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, lineHeight: 1.8 }}>
            Complete more Carrierlock assessments to see your coherence trajectory over time.
          </p>
          <Link href="/carrierlock">
            <span style={{
              display: "inline-block", marginTop: 20,
              fontFamily: "monospace", fontSize: 10, color: C.gold, letterSpacing: "0.1em",
              border: `1px solid ${C.goldDim}`, padding: "8px 20px", cursor: "pointer",
            }}>
              NEW ASSESSMENT
            </span>
          </Link>
        </div>
      ) : (
        <>
          {/* Trend indicator */}
          {trend && (
            <div style={{
              padding: "14px 20px", marginBottom: 24,
              background: C.deep, borderLeft: `2px solid ${trend.color}`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 20, color: trend.color }}>{trend.symbol}</span>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: trend.color, letterSpacing: "0.2em" }}>
                  TRAJECTORY · {trend.label}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, marginTop: 4 }}>
                  Based on your last {coherenceHistory.length} assessment{coherenceHistory.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          )}

          {/* Sparkline */}
          <div style={{ background: C.deep, padding: "24px", borderTop: `1px solid ${C.border}`, marginBottom: 24 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 16 }}>
              COHERENCE OVER TIME
            </div>
            <CoherenceSparkline history={coherenceHistory} />
          </div>

          {/* History list */}
          <div style={{ background: C.deep, padding: "24px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 16 }}>
              RECENT ASSESSMENTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {coherenceHistory.map((entry, i) => {
                const entryZone = getZone(entry.coherenceScore);
                const entryTheme = ZONE_THEME[entryZone];
                const isCurrentReading = i === 0; // most recent
                return (
                  <div key={entry.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    background: isCurrentReading ? entryTheme.bg : "transparent",
                    borderLeft: isCurrentReading ? `2px solid ${entryTheme.color}` : "2px solid transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 14, color: entryTheme.color, fontWeight: 600, minWidth: 28 }}>
                        {entry.coherenceScore}
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: 9, color: entryTheme.color, letterSpacing: "0.1em" }}>
                        {entryTheme.label}
                      </span>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>
                      {new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" "}
                      {new Date(entry.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // VIEW 4: Resonance Context (from static signature)
  // ══════════════════════════════════════════════════════════
  const renderContext = () => {
    // Try to extract static signature data from the reading's carrierlock link
    // For now, we show a CTA if no static data is available
    // The server-side dynamicState already loads this — we need it stored or fetched separately
    // Use the latest static reading query
    return (
      <div style={{ animation: "fadeUp 0.4s ease" }}>
        <StaticContextSection userId={user.id} zone={zone} theme={theme} coherenceScore={coherenceScore} />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════
  const views = [
    { id: "field"        as const, label: "Field State" },
    { id: "transmission" as const, label: "Transmission" },
    { id: "history"      as const, label: "History" },
    { id: "context"      as const, label: "Resonance" },
  ];

  return (
    <Layout>
      <div style={{ background: C.void, minHeight: "100vh" }}>
        {/* Zone atmosphere */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 300,
          background: `radial-gradient(ellipse at 50% 0%, ${theme.glow}, transparent 70%)`,
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Sticky Tab Bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 24px",
          background: "rgba(10,10,14,0.90)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
        }}>
          {/* Reading timestamp */}
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.1em" }}>
            {reading.createdAt
              ? new Date(reading.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : "DYNAMIC"}
          </div>

          {/* View Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {views.map(v => (
              <button key={v.id}
                onClick={() => setActiveView(v.id)}
                style={{
                  background: activeView === v.id ? "rgba(189,163,107,0.1)" : "transparent",
                  border: `1px solid ${activeView === v.id ? C.goldDim : "transparent"}`,
                  color: activeView === v.id ? C.gold : C.txtD,
                  fontFamily: "monospace", fontSize: 10, letterSpacing: "0.08em",
                  padding: "6px 14px", cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Back link */}
          <Link href="/readings">
            <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.1em", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 12, height: 12 }} /> HISTORY
            </span>
          </Link>
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto", padding: "28px 24px 80px" }}>
          {activeView === "field"        && renderFieldState()}
          {activeView === "transmission" && renderTransmission()}
          {activeView === "history"      && renderHistory()}
          {activeView === "context"      && renderContext()}
        </div>

        {/* Footer nav */}
        <div style={{
          maxWidth: 920, margin: "0 auto", padding: "0 24px 60px",
          display: "flex", gap: 8, position: "relative", zIndex: 1,
        }}>
          <Link href="/carrierlock">
            <span style={{
              fontFamily: "monospace", fontSize: 10, color: C.gold, letterSpacing: "0.1em",
              border: `1px solid ${C.goldDim}`, padding: "10px 20px", cursor: "pointer",
            }}>
              NEW READING
            </span>
          </Link>
          <Link href="/readings">
            <span style={{
              fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.1em",
              border: `1px solid ${C.border}`, padding: "10px 20px", cursor: "pointer",
            }}>
              ALL READINGS
            </span>
          </Link>
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </Layout>
  );
}

// ══════════════════════════════════════════════════════════════
// Static Signature Context Sub-component
// ══════════════════════════════════════════════════════════════
function StaticContextSection({ userId, zone, theme, coherenceScore }: {
  userId: number;
  zone: CoherenceZone;
  theme: typeof ZONE_THEME["Entropy"];
  coherenceScore: number;
}) {
  const { data: staticReadings, isLoading } = trpc.codex.getStaticReadings.useQuery();

  if (isLoading) {
    return (
      <div style={{ background: C.deep, padding: "48px 24px", textAlign: "center" }}>
        <Loader2 style={{ color: C.teal, width: 20, height: 20, margin: "0 auto", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const latest = staticReadings?.[0];

  if (!latest) {
    return (
      <div style={{ background: C.deep, padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txtS, marginBottom: 12, fontWeight: 300 }}>
          No Static Signature found
        </div>
        <p style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, lineHeight: 1.8, maxWidth: 400, margin: "0 auto" }}>
          Generate a Static Signature reading to see how your permanent blueprint interacts with your current field state.
        </p>
        <Link href="/carrierlock">
          <span style={{
            display: "inline-block", marginTop: 20,
            fontFamily: "monospace", fontSize: 10, color: C.teal, letterSpacing: "0.1em",
            border: `1px solid ${C.tealDim}`, padding: "8px 20px", cursor: "pointer",
          }}>
            GENERATE STATIC SIGNATURE
          </span>
        </Link>
      </div>
    );
  }

  // Parse the static signature data
  const vrcType = latest.vrcType ?? "Unknown";
  const vrcAuthority = latest.vrcAuthority ?? "Unknown";
  const fractalRole = latest.fractalRole ?? "Unknown";
  const primeStack = (latest.primeStack ?? []) as Array<{ codonId: string; codonName?: string; center?: string; facet?: string }>;
  const prime = primeStack[0];

  return (
    <>
      {/* Blueprint header */}
      <div style={{
        padding: "14px 20px", marginBottom: 28,
        background: theme.bg,
        borderLeft: `2px solid ${theme.color}`,
      }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: theme.color, letterSpacing: "0.25em" }}>
          YOUR {vrcType.toUpperCase()} BLUEPRINT · THROUGH TODAY'S LENS
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.txt, marginTop: 4, fontWeight: 300 }}>
          {zone === "Entropy" && "Your blueprint is being filtered through heavy static. Expression is distorted."}
          {zone === "Flux" && "Your blueprint oscillates between shadow and gift expression today."}
          {zone === "Resonance" && "Clear channel. Your blueprint expresses its highest potential today."}
        </div>
      </div>

      {/* Type + Authority + Role */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, marginBottom: 28 }}>
        {[
          { label: "TYPE", value: vrcType },
          { label: "AUTHORITY", value: vrcAuthority },
          { label: "FRACTAL ROLE", value: fractalRole },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: C.deep, padding: "20px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.gold, fontWeight: 300 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Prime Codon */}
      {prime && (
        <div style={{ background: C.deep, padding: "24px", borderTop: `1px solid ${C.border}`, marginBottom: 28 }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 16 }}>
            PRIME CODON
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${C.gold}`, background: "rgba(189,163,107,0.06)",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 16, color: C.gold }}>
                RC{String(prime.codonId).padStart(2, "0")}
              </span>
            </div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txt, fontWeight: 300 }}>
                {prime.codonName || `Codon ${prime.codonId}`}
              </div>
              {prime.center && (
                <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, marginTop: 4 }}>
                  {prime.center} Center
                  {prime.facet && <span style={{ color: C.txtD }}> · Facet {prime.facet}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Current expression based on coherence */}
          <div style={{
            marginTop: 16, padding: "12px 14px",
            background: theme.bg,
            border: `1px solid ${theme.color}30`,
          }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: theme.color, letterSpacing: "0.15em", marginBottom: 6 }}>
              CURRENT EXPRESSION · CS {coherenceScore}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, lineHeight: 1.7 }}>
              {zone === "Entropy" && "Shadow frequency dominant. The prime codon's distortion pattern is active."}
              {zone === "Flux" && "Gift frequency emerging. The prime codon oscillates between shadow and gift."}
              {zone === "Resonance" && "Siddhi frequency accessible. The prime codon expresses its highest potential."}
            </div>
          </div>
        </div>
      )}

      {/* Link to full static reading */}
      {latest.readingId && (
        <Link href={`/reading/static/${latest.readingId}`}>
          <div style={{
            background: C.deep, padding: "14px 20px",
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer",
          }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, letterSpacing: "0.1em" }}>
              VIEW FULL STATIC SIGNATURE
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD }}>→</span>
          </div>
        </Link>
      )}
    </>
  );
}
