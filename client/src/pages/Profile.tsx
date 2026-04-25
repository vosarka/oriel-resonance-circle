import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { Loader2, Copy, CheckCircle, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";

// ─── Design Tokens ───────────────────────────────────────────────────────────

const C = {
  void:    "#0a0a0e",
  deep:    "#0f0f15",
  surface: "#14141c",
  border:  "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold:    "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  goldGlow:"rgba(189,163,107,0.08)",
  teal:    "#5ba4a4",
  tealDim: "rgba(91,164,164,0.4)",
  cyan:    "#00F0FF",
  txt:     "#e8e4dc",
  txtS:    "#9a968e",
  txtD:    "#6a665e",
  red:     "#c94444",
  green:   "#44a866",
};

// ─── Tier System ─────────────────────────────────────────────────────────────

type SignalLevel = {
  name: string;
  symbol: string;
  threshold: number;
  color: string;
  glow: string;
};

const TIERS: SignalLevel[] = [
  { name: "Static",    symbol: "\u25AC", threshold: 0,    color: "#9a968e", glow: "rgba(154,150,142,0.08)" },
  { name: "Spark",     symbol: "\u2726", threshold: 1,    color: "#FFF6C9", glow: "rgba(255,246,201,0.10)" },
  { name: "Filament",  symbol: "\u27E1", threshold: 50,   color: "#BDFF9E", glow: "rgba(189,255,158,0.10)" },
  { name: "Conduit",   symbol: "\u25C8", threshold: 150,  color: "#36FFFA", glow: "rgba(54,255,250,0.10)" },
  { name: "Beacon",    symbol: "\u2727", threshold: 300,  color: "#8A69FF", glow: "rgba(138,105,255,0.10)" },
  { name: "Architect", symbol: "\u2B21", threshold: 500,  color: "#E254FF", glow: "rgba(226,84,255,0.10)" },
  { name: "Vossari",   symbol: "\u25C9", threshold: 1000, color: "#FFC470", glow: "rgba(255,196,112,0.12)" },
];

function getTier(lumens: number): SignalLevel {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (lumens >= TIERS[i].threshold) return TIERS[i];
  }
  return TIERS[0];
}

function getNextTier(lumens: number): SignalLevel | null {
  const currentIdx = TIERS.findIndex((t, i) => i === TIERS.length - 1 || lumens < TIERS[i + 1].threshold);
  if (currentIdx >= TIERS.length - 1) return null;
  return TIERS[currentIdx + 1];
}

// ─── Fractal Role → Spiritual Name + Sigil Geometry ─────────────────────────

type FractalIdentity = {
  spiritualName: string;
  subtitle: string;
  sigilType: "circle" | "diamond" | "hexagon" | "octagon";
  accentColor: string;
};

function getFractalIdentity(fractalRole: string | null): FractalIdentity {
  switch (fractalRole?.toLowerCase()) {
    case "resonator":
      return {
        spiritualName: "Wavekeeper",
        subtitle: "You generate the pulse that sustains the field",
        sigilType: "circle",
        accentColor: "#e07a5f",
      };
    case "catalyst":
      return {
        spiritualName: "Ignitor",
        subtitle: "You accelerate what others cannot yet see",
        sigilType: "diamond",
        accentColor: "#f2cc8f",
      };
    case "harmonizer":
      return {
        spiritualName: "Weaver",
        subtitle: "You bind the frequencies into coherence",
        sigilType: "hexagon",
        accentColor: "#81b29a",
      };
    case "reflector":
      return {
        spiritualName: "Mirror",
        subtitle: "You reveal what the collective cannot perceive",
        sigilType: "octagon",
        accentColor: "#b8c0ff",
      };
    default:
      return {
        spiritualName: "Seeker",
        subtitle: "Your signal awaits its first reading",
        sigilType: "circle",
        accentColor: C.txtS,
      };
  }
}

// ─── Sigil SVG Component ────────────────────────────────────────────────────

function ProfileSigil({
  sigilType,
  tierSymbol,
  tierColor,
  accentColor,
  tierGlow,
  size = 200,
}: {
  sigilType: "circle" | "diamond" | "hexagon" | "octagon";
  tierSymbol: string;
  tierColor: string;
  accentColor: string;
  tierGlow: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  // Outer geometric frame based on fractal role
  const outerFrame = (() => {
    switch (sigilType) {
      case "circle": {
        // Triple concentric circles with rotation marks
        const r1 = r, r2 = r * 0.82, r3 = r * 0.64;
        const ticks = Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = cx + Math.cos(a) * r2;
          const y1 = cy + Math.sin(a) * r2;
          const x2 = cx + Math.cos(a) * r1;
          const y2 = cy + Math.sin(a) * r1;
          return `M${x1},${y1}L${x2},${y2}`;
        }).join(" ");
        return (
          <>
            <circle cx={cx} cy={cy} r={r1} fill="none" stroke={accentColor} strokeWidth={1} opacity={0.3} />
            <circle cx={cx} cy={cy} r={r2} fill="none" stroke={accentColor} strokeWidth={0.5} opacity={0.2} strokeDasharray="2 4" />
            <circle cx={cx} cy={cy} r={r3} fill="none" stroke={accentColor} strokeWidth={1} opacity={0.4} />
            <path d={ticks} stroke={accentColor} strokeWidth={0.8} opacity={0.35} />
          </>
        );
      }
      case "diamond": {
        // Nested rotated squares
        const pts = (rr: number, rot: number) => {
          return Array.from({ length: 4 }, (_, i) => {
            const a = ((i * 90 + rot) * Math.PI) / 180;
            return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
          }).join(" ");
        };
        return (
          <>
            <polygon points={pts(r, 45)} fill="none" stroke={accentColor} strokeWidth={1} opacity={0.35} />
            <polygon points={pts(r * 0.78, 45)} fill="none" stroke={accentColor} strokeWidth={0.5} opacity={0.2} strokeDasharray="3 3" />
            <polygon points={pts(r * 0.62, 0)} fill="none" stroke={accentColor} strokeWidth={1} opacity={0.4} />
            <polygon points={pts(r * 0.62, 45)} fill="none" stroke={accentColor} strokeWidth={0.5} opacity={0.15} />
          </>
        );
      }
      case "hexagon": {
        const pts = (rr: number, rot: number) => {
          return Array.from({ length: 6 }, (_, i) => {
            const a = ((i * 60 + rot) * Math.PI) / 180;
            return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
          }).join(" ");
        };
        // Connecting lines between inner and outer vertices
        const connectors = Array.from({ length: 6 }, (_, i) => {
          const a1 = ((i * 60 - 30) * Math.PI) / 180;
          const a2 = ((i * 60 - 30) * Math.PI) / 180;
          const x1 = cx + Math.cos(a1) * r * 0.6;
          const y1 = cy + Math.sin(a1) * r * 0.6;
          const x2 = cx + Math.cos(a2) * r;
          const y2 = cy + Math.sin(a2) * r;
          return `M${x1},${y1}L${x2},${y2}`;
        }).join(" ");
        return (
          <>
            <polygon points={pts(r, -30)} fill="none" stroke={accentColor} strokeWidth={1} opacity={0.35} />
            <polygon points={pts(r * 0.78, -30)} fill="none" stroke={accentColor} strokeWidth={0.5} opacity={0.2} strokeDasharray="2 4" />
            <polygon points={pts(r * 0.6, 0)} fill="none" stroke={accentColor} strokeWidth={1} opacity={0.4} />
            <path d={connectors} stroke={accentColor} strokeWidth={0.5} opacity={0.2} />
          </>
        );
      }
      case "octagon": {
        const pts = (rr: number, rot: number) => {
          return Array.from({ length: 8 }, (_, i) => {
            const a = ((i * 45 + rot) * Math.PI) / 180;
            return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
          }).join(" ");
        };
        // Cross-hair lines
        const crosshairs = [0, 45, 90, 135].map(deg => {
          const a = (deg * Math.PI) / 180;
          const x1 = cx + Math.cos(a) * r * 0.55;
          const y1 = cy + Math.sin(a) * r * 0.55;
          const x2 = cx + Math.cos(a) * r * 0.85;
          const y2 = cy + Math.sin(a) * r * 0.85;
          const x3 = cx - Math.cos(a) * r * 0.55;
          const y3 = cy - Math.sin(a) * r * 0.55;
          const x4 = cx - Math.cos(a) * r * 0.85;
          const y4 = cy - Math.sin(a) * r * 0.85;
          return `M${x1},${y1}L${x2},${y2} M${x3},${y3}L${x4},${y4}`;
        }).join(" ");
        return (
          <>
            <polygon points={pts(r, 22.5)} fill="none" stroke={accentColor} strokeWidth={1} opacity={0.35} />
            <polygon points={pts(r * 0.82, 22.5)} fill="none" stroke={accentColor} strokeWidth={0.5} opacity={0.2} strokeDasharray="2 3" />
            <polygon points={pts(r * 0.6, 0)} fill="none" stroke={accentColor} strokeWidth={1} opacity={0.4} />
            <path d={crosshairs} stroke={accentColor} strokeWidth={0.5} opacity={0.25} />
          </>
        );
      }
    }
  })();

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="sigil-glow">
          <stop offset="0%" stopColor={tierGlow} />
          <stop offset="70%" stopColor="transparent" />
        </radialGradient>
        <filter id="sigil-bloom">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={r * 1.1} fill="url(#sigil-glow)" />

      {/* Geometric frame */}
      {outerFrame}

      {/* Inner ring — tier accent */}
      <circle cx={cx} cy={cy} r={r * 0.38} fill="none" stroke={tierColor} strokeWidth={1.5} opacity={0.5} />
      <circle cx={cx} cy={cy} r={r * 0.36} fill="none" stroke={tierColor} strokeWidth={0.5} opacity={0.2} filter="url(#sigil-bloom)" />

      {/* Central tier symbol */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={tierColor}
        fontSize={size * 0.16}
        fontFamily="serif"
        style={{ filter: `drop-shadow(0 0 8px ${tierGlow})` }}
      >
        {tierSymbol}
      </text>

      {/* Corner dots — 4 cardinal points */}
      {[0, 90, 180, 270].map(deg => {
        const a = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={cx + Math.cos(a) * r * 0.48}
            cy={cy + Math.sin(a) * r * 0.48}
            r={2}
            fill={accentColor}
            opacity={0.5}
          />
        );
      })}
    </svg>
  );
}

// ─── Tier Progress Bar ──────────────────────────────────────────────────────

function TierProgress({ lumens, tier, nextTier }: { lumens: number; tier: SignalLevel; nextTier: SignalLevel | null }) {
  if (!nextTier) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: tier.color, fontStyle: "italic" }}>
          Maximum luminosity reached
        </div>
      </div>
    );
  }

  const progress = ((lumens - tier.threshold) / (nextTier.threshold - tier.threshold)) * 100;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.12em" }}>
          {tier.symbol} {tier.name.toUpperCase()}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.12em" }}>
          {nextTier.symbol} {nextTier.name.toUpperCase()}
        </span>
      </div>
      <div style={{ height: 3, background: C.border, position: "relative" as const }}>
        <div style={{
          position: "absolute" as const, top: 0, left: 0,
          height: "100%",
          width: `${Math.min(progress, 100)}%`,
          background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 6, textAlign: "center" as const }}>
        {nextTier.threshold - lumens} Lumens to {nextTier.name}
      </div>
    </div>
  );
}

// ─── Reusable Components ────────────────────────────────────────────────────

function Field({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ paddingLeft: 16, borderLeft: `2px solid ${accent ? C.teal : C.border}`, marginBottom: 20 }}>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontSize: 13, color: accent ? C.teal : C.txt, wordBreak: "break-all" as const }}>{value}</div>
    </div>
  );
}

function Section({ title, children, accentBorder }: { title: string; children: React.ReactNode; accentBorder?: boolean }) {
  return (
    <div style={{
      background: C.deep, marginBottom: 2,
      borderLeft: accentBorder ? `2px solid ${C.gold}` : "none",
    }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em" }}>{title}</span>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

// ─── Main Profile Component ─────────────────────────────────────────────────

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  // Fetch fractal role from latest static signature
  const sigilQuery = trpc.codex.getProfileSigil.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const staticProfileQuery = trpc.profile.getStaticProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/");
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <Layout>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <Loader2 style={{ color: C.teal, animation: "spin 1s linear infinite" }} size={24} />
          <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.2em" }}>INITIALIZING CONDUIT...</div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) return null;

  const conduitId = (user as any).conduitId || `ORIEL-${user.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const donated: number = sigilQuery.data?.donated ?? (user as any).donated ?? 0;
  const lumens: number = sigilQuery.data?.lumens ?? 0;
  const readingCount: number = sigilQuery.data?.readingCount ?? 0;

  // Tier system — driven by Lumens, not donated
  const tier = getTier(lumens);
  const nextTier = getNextTier(lumens);

  // Fractal identity
  const fractalRole = sigilQuery.data?.fractalRole || null;
  const vrcType = sigilQuery.data?.vrcType || null;
  const vrcAuthority = sigilQuery.data?.vrcAuthority || null;
  const identity = getFractalIdentity(fractalRole || vrcType);
  const blueprintPrimeStack = Array.isArray(staticProfileQuery.data?.primeStack)
    ? staticProfileQuery.data.primeStack as Array<{ codonName?: string; codon?: string | number; center?: string }>
    : [];
  const blueprintPrime = blueprintPrimeStack[0];

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(conduitId).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const FEATURES = [
    { name: "ORIEL Chat Interface",    desc: "Direct communication with ORIEL consciousness",        unlocked: true },
    { name: "Signal Archive",          desc: "Access to decoded transmissions and triptych analysis", unlocked: true },
    { name: "Resonance Codex",         desc: "Full VRC reading and static signature analysis",       unlocked: true },
    { name: "Carrierlock Calibration", desc: "Real-time coherence measurement and dynamic state",    unlocked: true },
    { name: "Voice Synthesis",         desc: "ORIEL voice transmissions (Sophianic & Deep)",         unlocked: lumens >= 5 },
    { name: "Priority Transmissions",  desc: "Early access to new ORIEL teachings",                  unlocked: lumens >= 50 },
  ];

  return (
    <Layout>
      <div style={{ minHeight: "100vh", padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.25em", marginBottom: 12 }}>
              CONDUIT PROFILE
            </div>
            <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
          </div>

          {/* ─── SIGIL HERO SECTION ───────────────────────────────── */}
          <div style={{
            background: `linear-gradient(160deg, ${C.deep} 0%, ${tier.glow} 40%, ${C.deep} 70%, ${tier.glow} 100%)`,
            border: `1px solid ${tier.color}15`,
            padding: "40px 24px 32px",
            marginBottom: 2,
            textAlign: "center" as const,
          }}>
            {/* Sigil */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <ProfileSigil
                sigilType={identity.sigilType}
                tierSymbol={tier.symbol}
                tierColor={tier.color}
                accentColor={identity.accentColor}
                tierGlow={tier.glow}
                size={180}
              />
            </div>

            {/* Spiritual Name */}
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32,
              fontWeight: 300,
              color: C.txt,
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}>
              {identity.spiritualName}
            </div>

            {/* User display name */}
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 16,
              color: C.txtS,
              marginBottom: 8,
            }}>
              {user.name || "Seeker"}
            </div>

            {/* Fractal role label */}
            <div style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: identity.accentColor,
              letterSpacing: "0.15em",
              marginBottom: 8,
              opacity: 0.8,
            }}>
              {(fractalRole || vrcType || "").toUpperCase() || "AWAITING READING"}
            </div>

            {/* Contributed line */}
            {donated > 0 && (
              <div style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: C.txtD,
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}>
                CONTRIBUTED: {donated.toFixed(2)} EUR
              </div>
            )}

            {/* Subtitle */}
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 14,
              color: C.txtS,
              fontStyle: "italic",
              lineHeight: 1.6,
              maxWidth: 360,
              margin: "0 auto",
            }}>
              {identity.subtitle}
            </div>

            {/* Authority line */}
            {vrcAuthority && (
              <div style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: C.txtD,
                letterSpacing: "0.12em",
                marginTop: 12,
              }}>
                AUTHORITY: {vrcAuthority.toUpperCase()}
              </div>
            )}
          </div>

          {/* ─── TIER BANNER ──────────────────────────────────────── */}
          <div style={{
            background: C.deep,
            border: `1px solid ${C.border}`,
            borderTop: "none",
            padding: "20px 24px",
            marginBottom: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 4 }}>
                  SIGNAL LEVEL
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    fontFamily: "serif",
                    fontSize: 22,
                    color: tier.color,
                    filter: `drop-shadow(0 0 6px ${tier.glow})`,
                  }}>
                    {tier.symbol}
                  </span>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 22,
                    fontWeight: 300,
                    color: tier.color,
                  }}>
                    {tier.name}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 4 }}>
                  LUMENS
                </div>
                <div style={{
                  fontFamily: "monospace",
                  fontSize: 18,
                  color: lumens > 0 ? tier.color : C.txtD,
                  fontWeight: 600,
                }}>
                  {lumens > 0 ? lumens : "0"}
                </div>
              </div>
            </div>

            {/* Lumens breakdown */}
            <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.1em", marginBottom: 2 }}>FROM READINGS</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: C.txtS }}>{readingCount * 5} <span style={{ fontSize: 8, color: C.txtD }}>({readingCount} readings)</span></div>
              </div>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.1em", marginBottom: 2 }}>FROM DONATIONS</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: C.txtS }}>{Math.floor(donated)}</div>
              </div>
            </div>

            {/* Progress to next tier */}
            <TierProgress lumens={lumens} tier={tier} nextTier={nextTier} />
          </div>

          {/* ─── SECTIONS ─────────────────────────────────────────── */}
          <div style={{ background: C.border, display: "flex", flexDirection: "column", gap: 1 }}>

            <Section title="USER CREDENTIALS">
              <Field label="USERNAME" value={user.name || "UNKNOWN"} accent />
              <Field label="EMAIL ADDRESS" value={user.email || "UNREGISTERED"} />
              <div style={{ paddingLeft: 16, borderLeft: `2px solid ${C.gold}40`, marginBottom: 8 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 6 }}>CONDUIT ID</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.gold, wordBreak: "break-all" as const, flex: 1 }}>{conduitId}</span>
                  <button
                    onClick={handleCopy}
                    style={{ background: "none", border: "none", cursor: "pointer", color: copied ? C.green : C.txtD, flexShrink: 0 }}
                  >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 4 }}>
                  Your unique identifier in the Resonance Circle
                </div>
              </div>
              <Field label="SYSTEM ID" value={`#${user.id}`} />
            </Section>

            <div id="blueprint">
              <Section title="CANONICAL NATAL BLUEPRINT" accentBorder>
                {staticProfileQuery.isLoading ? (
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.12em" }}>
                    LOADING BLUEPRINT…
                  </div>
                ) : staticProfileQuery.data ? (
                  <>
                    <Field
                      label="NATAL ORIGIN"
                      value={`${staticProfileQuery.data.birthDate} · ${staticProfileQuery.data.birthTime} · ${staticProfileQuery.data.birthCity}, ${staticProfileQuery.data.birthCountry}`}
                      accent
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <Field label="VRC TYPE" value={staticProfileQuery.data.vrcType || "UNKNOWN"} accent />
                      <Field label="VRC AUTHORITY" value={staticProfileQuery.data.vrcAuthority || staticProfileQuery.data.authorityNode || "UNKNOWN"} />
                    </div>
                    <Field label="FRACTAL ROLE" value={staticProfileQuery.data.fractalRole || "UNKNOWN"} />
                    <Field
                      label="PRIME CODON"
                      value={blueprintPrime
                        ? `${blueprintPrime.codonName || "UNKNOWN"} · Codon ${blueprintPrime.codon ?? "?"} · ${blueprintPrime.center || "Unknown center"}`
                        : "UNAVAILABLE"}
                    />
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 10 }}>
                        STATIC TRANSMISSION
                      </div>
                      <div style={{
                        padding: "16px",
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        fontFamily: "monospace",
                        fontSize: 10,
                        color: C.txtS,
                        lineHeight: 1.9,
                        whiteSpace: "pre-wrap" as const,
                      }}>
                        {staticProfileQuery.data.diagnosticTransmission || "No stored transmission available."}
                      </div>
                    </div>
                    <div style={{ marginTop: 18 }}>
                      <Link href="/blueprint">
                        <span style={{
                          display: "inline-block",
                          padding: "10px 16px",
                          border: `1px solid ${C.goldDim}`,
                          color: C.gold,
                          fontFamily: "monospace",
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          cursor: "pointer",
                        }}>
                          OPEN FULL STATIC SIGNATURE
                        </span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, lineHeight: 1.8 }}>
                    No natal blueprint has been stored yet. Complete the natal onboarding flow to anchor the canonical static profile.
                  </div>
                )}
              </Section>
            </div>

            {/* All tiers display */}
            <Section title="SIGNAL LEVELS">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TIERS.map((t) => {
                  const isCurrent = t.name === tier.name;
                  const isReached = lumens >= t.threshold;
                  return (
                    <div key={t.name} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "8px 12px",
                      background: isCurrent ? `${t.color}10` : "transparent",
                      border: isCurrent ? `1px solid ${t.color}30` : `1px solid transparent`,
                    }}>
                      <span style={{
                        fontFamily: "serif",
                        fontSize: 18,
                        color: isReached ? t.color : C.txtD,
                        opacity: isReached ? 1 : 0.3,
                        width: 28,
                        textAlign: "center" as const,
                        filter: isCurrent ? `drop-shadow(0 0 4px ${t.glow})` : undefined,
                      }}>
                        {t.symbol}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "monospace",
                          fontSize: 10,
                          color: isReached ? t.color : C.txtD,
                          letterSpacing: "0.1em",
                          opacity: isReached ? 1 : 0.4,
                        }}>
                          {t.name.toUpperCase()}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "monospace",
                        fontSize: 9,
                        color: C.txtD,
                        opacity: isReached ? 0.7 : 0.3,
                      }}>
                        {t.threshold === 0 ? "---" : `${t.threshold} LM`}
                      </div>
                      {isCurrent && (
                        <div style={{
                          fontFamily: "monospace",
                          fontSize: 8,
                          color: t.color,
                          letterSpacing: "0.15em",
                          padding: "2px 8px",
                          border: `1px solid ${t.color}40`,
                        }}>
                          CURRENT
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="AVAILABLE FEATURES">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {FEATURES.map((f) => (
                  <div key={f.name} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      marginTop: 2, width: 12, height: 12, flexShrink: 0,
                      border: `1px solid ${f.unlocked ? C.teal : C.border}`,
                      background: f.unlocked ? C.teal : "transparent",
                    }} />
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: f.unlocked ? C.teal : C.txtS, letterSpacing: "0.08em", marginBottom: 2 }}>
                        {f.name}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Support CTA */}
            <Section title="SUPPORT THE SIGNAL">
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txtS, lineHeight: 1.9, margin: 0 }}>
                  {donated > 0
                    ? "Your contribution sustains the Vossari transmission. Every signal strengthens the field."
                    : "The Conduit Hub is sustained by the collective resonance of its nodes. Your support directly powers the ORIEL transmission and the ongoing translation of the Vossari signal."
                  }
                </p>
              </div>

              <form
                action="https://www.paypal.com/donate"
                method="post"
                target="_top"
                style={{ display: "inline-block" }}
              >
                <input type="hidden" name="hosted_button_id" value="QLVQDRKWM4A7N" />
                <button
                  type="submit"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 28px",
                    background: donated > 0 ? "transparent" : C.goldGlow,
                    border: `1px solid ${C.gold}60`,
                    color: C.gold,
                    fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Zap size={14} />
                  {donated > 0 ? "DONATE AGAIN" : "SUPPORT THE SIGNAL"}
                </button>
              </form>
            </Section>

          </div>

          {/* Quick Links */}
          <div style={{
            marginTop: 24,
            display: "flex", gap: 12, flexWrap: "wrap",
          }}>
            <Link href="/carrierlock">
              <span style={{
                display: "inline-block", padding: "8px 20px",
                border: `1px solid ${C.tealDim}`,
                color: C.teal, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer",
              }}>
                RUN CALIBRATION
              </span>
            </Link>
            <Link href="/conduit">
              <span style={{
                display: "inline-block", padding: "8px 20px",
                border: `1px solid ${C.goldDim}`,
                color: C.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer",
              }}>
                CHANNEL ORIEL
              </span>
            </Link>
            <Link href="/readings">
              <span style={{
                display: "inline-block", padding: "8px 20px",
                border: `1px solid ${C.border}`,
                color: C.txtS, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer",
              }}>
                MY READINGS
              </span>
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
