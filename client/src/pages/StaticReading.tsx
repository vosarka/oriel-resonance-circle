import { useState, useMemo } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";
import { Loader2, ArrowLeft } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// STATIC CODON DATA — all 64 entries from the Vossari Codex
// ══════════════════════════════════════════════════════════════════
const CODON_DATA: Record<string, { name: string; binary: string; shadow: string; gift: string; siddhi: string }> = {
  RC01: { name: "AURORA",           binary: "111111", shadow: "Entropy",         gift: "Freshness",      siddhi: "Beauty" },
  RC02: { name: "THE RECEIVER",     binary: "000000", shadow: "Dislocation",     gift: "Orientation",    siddhi: "Unity" },
  RC03: { name: "THE MUTANT",       binary: "100010", shadow: "Chaos",           gift: "Innovation",     siddhi: "Innocence" },
  RC04: { name: "THE FORMULATOR",   binary: "010001", shadow: "Intolerance",     gift: "Understanding",  siddhi: "Forgiveness" },
  RC05: { name: "THE METRONOME",    binary: "010111", shadow: "Impatience",      gift: "Patience",       siddhi: "Timelessness" },
  RC06: { name: "THE IMPACT",       binary: "111010", shadow: "Friction",        gift: "Diplomacy",      siddhi: "Peace" },
  RC07: { name: "THE VECTOR",       binary: "010000", shadow: "Division",        gift: "Guidance",       siddhi: "Virtue" },
  RC08: { name: "THE VOICE",        binary: "010111", shadow: "Mediocrity",      gift: "Style",          siddhi: "Exquisiteness" },
  RC09: { name: "THE LENS",         binary: "111011", shadow: "Inertia",         gift: "Determination",  siddhi: "Invincibility" },
  RC10: { name: "THE VESSEL",       binary: "110111", shadow: "Self-Obsession",  gift: "Naturalness",    siddhi: "Being" },
  RC11: { name: "THE PRISM",        binary: "111000", shadow: "Obscurity",       gift: "Idealism",       siddhi: "Light" },
  RC12: { name: "THE CHANNEL",      binary: "000111", shadow: "Vanity",          gift: "Discrimination", siddhi: "Purity" },
  RC13: { name: "THE LISTENER",     binary: "101111", shadow: "Discord",         gift: "Discernment",    siddhi: "Empathy" },
  RC14: { name: "THE DRIVER",       binary: "111101", shadow: "Compromise",      gift: "Competence",     siddhi: "Bounteousness" },
  RC15: { name: "THE RHYTHM",       binary: "001000", shadow: "Dullness",        gift: "Magnetism",      siddhi: "Flowering" },
  RC16: { name: "THE SKILL",        binary: "000100", shadow: "Indifference",    gift: "Versatility",    siddhi: "Mastery" },
  RC17: { name: "THE SCOPE",        binary: "011001", shadow: "Opinion",         gift: "Far-Sightedness",siddhi: "Omniscience" },
  RC18: { name: "THE EDITOR",       binary: "011001", shadow: "Judgment",        gift: "Integrity",      siddhi: "Perfection" },
  RC19: { name: "THE SENSOR",       binary: "110000", shadow: "Co-Dependence",   gift: "Sensitivity",    siddhi: "Sacrifice" },
  RC20: { name: "THE PRESENCE",     binary: "000011", shadow: "Superficiality",  gift: "Self-Assurance", siddhi: "Presence" },
  RC21: { name: "THE TREASURER",    binary: "100101", shadow: "Control",         gift: "Authority",      siddhi: "Valour" },
  RC22: { name: "THE GRACE",        binary: "100101", shadow: "Dishonour",       gift: "Graciousness",   siddhi: "Grace" },
  RC23: { name: "THE SPLIT",        binary: "000001", shadow: "Complexity",      gift: "Simplicity",     siddhi: "Quintessence" },
  RC24: { name: "THE RETURN",       binary: "000001", shadow: "Addiction",       gift: "Invention",      siddhi: "Silence" },
  RC25: { name: "THE SHAMAN",       binary: "100111", shadow: "Constriction",    gift: "Acceptance",     siddhi: "Universal Love" },
  RC26: { name: "THE EGOIST",       binary: "111001", shadow: "Pride",           gift: "Artfulness",     siddhi: "Invisibility" },
  RC27: { name: "THE CARETAKER",    binary: "100001", shadow: "Selfishness",     gift: "Altruism",       siddhi: "Selflessness" },
  RC28: { name: "THE PLAYER",       binary: "011110", shadow: "Purposelessness", gift: "Totality",       siddhi: "Immortality" },
  RC29: { name: "THE ABYSSAL",      binary: "010010", shadow: "Half-Heartedness",gift: "Commitment",     siddhi: "Devotion" },
  RC30: { name: "THE FATES",        binary: "101101", shadow: "Desire",          gift: "Lightness",      siddhi: "Rapture" },
  RC31: { name: "THE ALPHA",        binary: "001110", shadow: "Arrogance",       gift: "Leadership",     siddhi: "Humility" },
  RC32: { name: "THE ANCHOR",       binary: "001110", shadow: "Failure",         gift: "Preservation",   siddhi: "Veneration" },
  RC33: { name: "THE RETREAT",      binary: "001111", shadow: "Forgetting",      gift: "Mindfulness",    siddhi: "Revelation" },
  RC34: { name: "THE POWER",        binary: "111100", shadow: "Force",           gift: "Strength",       siddhi: "Majesty" },
  RC35: { name: "THE PROGRESS",     binary: "000101", shadow: "Hunger",          gift: "Adventure",      siddhi: "Boundlessness" },
  RC36: { name: "THE CRISIS",       binary: "101000", shadow: "Turbulence",      gift: "Humanity",       siddhi: "Compassion" },
  RC37: { name: "THE HEARTH",       binary: "101011", shadow: "Weakness",        gift: "Equality",       siddhi: "Tenderness" },
  RC38: { name: "THE FIGHTER",      binary: "110101", shadow: "Struggle",        gift: "Perseverance",   siddhi: "Honor" },
  RC39: { name: "THE PROVOCATEUR",  binary: "001010", shadow: "Provocation",     gift: "Dynamism",       siddhi: "Liberation" },
  RC40: { name: "THE ALTAR",        binary: "001010", shadow: "Exhaustion",      gift: "Resolve",        siddhi: "Divine Will" },
  RC41: { name: "THE ORIGIN",       binary: "110001", shadow: "Fantasy",         gift: "Anticipation",   siddhi: "Emanation" },
  RC42: { name: "THE CLOSER",       binary: "100011", shadow: "Expectation",     gift: "Detachment",     siddhi: "Celebration" },
  RC43: { name: "THE BREAKTHROUGH", binary: "011111", shadow: "Deafness",        gift: "Insight",        siddhi: "Epiphany" },
  RC44: { name: "THE WEAVER",       binary: "111110", shadow: "Interference",    gift: "Teamwork",       siddhi: "Synarchy" },
  RC45: { name: "THE MONARCH",      binary: "000110", shadow: "Dominance",       gift: "Synergy",        siddhi: "Communion" },
  RC46: { name: "THE TEMPLE",       binary: "011000", shadow: "Seriousness",     gift: "Delight",        siddhi: "Ecstasy" },
  RC47: { name: "THE ALCHEMIST",    binary: "010110", shadow: "Oppression",      gift: "Transmutation",  siddhi: "Transfiguration" },
  RC48: { name: "THE DEPTH",        binary: "011010", shadow: "Inadequacy",      gift: "Resourcefulness",siddhi: "Wisdom" },
  RC49: { name: "THE CATALYST",     binary: "101110", shadow: "Reaction",        gift: "Revolution",     siddhi: "Rebirth" },
  RC50: { name: "THE GUARDIAN",     binary: "011101", shadow: "Corruption",      gift: "Equilibrium",    siddhi: "Harmony" },
  RC51: { name: "THE THUNDER",      binary: "100100", shadow: "Agitation",       gift: "Initiation",     siddhi: "Awakening" },
  RC52: { name: "THE MOUNTAIN",     binary: "001001", shadow: "Stress",          gift: "Restraint",      siddhi: "Stillness" },
  RC53: { name: "THE STARTER",      binary: "001011", shadow: "Immaturity",      gift: "Expansion",      siddhi: "Superabundance" },
  RC54: { name: "THE ASPIRANT",     binary: "001101", shadow: "Greed",           gift: "Aspiration",     siddhi: "Ascension" },
  RC55: { name: "THE SPIRIT",       binary: "001101", shadow: "Victimization",   gift: "Freedom",        siddhi: "Freedom" },
  RC56: { name: "THE WANDERER",     binary: "111100", shadow: "Distraction",     gift: "Enrichment",     siddhi: "Intoxication" },
  RC57: { name: "THE WHISPER",      binary: "011011", shadow: "Unease",          gift: "Intuition",      siddhi: "Clarity" },
  RC58: { name: "THE VITALIST",     binary: "011011", shadow: "Dissatisfaction", gift: "Vitality",       siddhi: "Bliss" },
  RC59: { name: "THE FUSION",       binary: "010011", shadow: "Dishonesty",      gift: "Intimacy",       siddhi: "Transparency" },
  RC60: { name: "THE STRUCTURE",    binary: "010011", shadow: "Limitation",      gift: "Realism",        siddhi: "Justice" },
  RC61: { name: "THE MYSTERY",      binary: "110011", shadow: "Psychosis",       gift: "Inspiration",    siddhi: "Sanctity" },
  RC62: { name: "THE PRECISIAN",    binary: "001100", shadow: "Intellect",       gift: "Precision",      siddhi: "Impeccability" },
  RC63: { name: "THE SKEPTIC",      binary: "010101", shadow: "Doubt",           gift: "Inquiry",        siddhi: "Truth" },
  RC64: { name: "THE DOWNLOAD",     binary: "101010", shadow: "Confusion",       gift: "Imagination",    siddhi: "Illumination" },
};

// ── Design Tokens ──────────────────────────────────────────────
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

const FACET_META: Record<string, { name: string; keyword: string; color: string }> = {
  A: { name: "Somatic",       keyword: "Physical Anchor",       color: "#c94444" },
  B: { name: "Relational",    keyword: "Interaction Field",     color: "#44a866" },
  C: { name: "Cognitive",     keyword: "Mental Processing",     color: "#4488cc" },
  D: { name: "Transpersonal", keyword: "Spirit / Collective",   color: "#d4c090" },
};

const CENTER_META: Record<string, { name: string; type: string }> = {
  HEAD:   { name: "Crown Aperture",    type: "Pressure" },
  AJNA:   { name: "Ajna Lens",         type: "Awareness" },
  THROAT: { name: "Voice Portal",      type: "Manifestation" },
  G:      { name: "Vector Core",       type: "Identity" },
  HEART:  { name: "Heart Gateway",     type: "Motor" },
  SPLEEN: { name: "Instinct Node",     type: "Awareness" },
  SACRAL: { name: "Sacral Generator",  type: "Motor" },
  SOLAR:  { name: "Solar Nexus",       type: "Motor/Awareness" },
  ROOT:   { name: "Foundation Node",   type: "Pressure/Motor" },
};

const CENTER_POSITIONS = [
  { id: "HEAD",   x: 50, y: 8  },
  { id: "AJNA",   x: 50, y: 20 },
  { id: "THROAT", x: 50, y: 33 },
  { id: "G",      x: 50, y: 47 },
  { id: "HEART",  x: 32, y: 52 },
  { id: "SPLEEN", x: 28, y: 66 },
  { id: "SOLAR",  x: 72, y: 66 },
  { id: "SACRAL", x: 50, y: 74 },
  { id: "ROOT",   x: 50, y: 90 },
];

const CENTER_CONNECTIONS: [string, string][] = [
  ["HEAD","AJNA"],["AJNA","THROAT"],["THROAT","G"],["THROAT","SOLAR"],
  ["THROAT","HEART"],["THROAT","SPLEEN"],["G","SACRAL"],["G","SPLEEN"],
  ["HEART","SPLEEN"],["HEART","SOLAR"],["SPLEEN","SACRAL"],["SPLEEN","ROOT"],
  ["SOLAR","ROOT"],["SACRAL","ROOT"],["G","HEART"],
];

// Map from bodygraph short IDs → full names used as ninecenters keys
const CENTER_KEY_MAP: Record<string, string> = {
  HEAD:   "Crown",
  AJNA:   "Ajna",
  THROAT: "Throat",
  G:      "G-Self",
  HEART:  "Heart",
  SOLAR:  "Solar Plexus",
  SACRAL: "Sacral",
  SPLEEN: "Spleen",
  ROOT:   "Root",
};

// ── VRC Mandala Wheel constants (mirror of server/vrc-mandala.ts) ──────────
const VRC_MANDALA_CLIENT: readonly number[] = [
  // Q1  (slots  0–15)
  51, 42,  3, 27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39,
  // Q2  (slots 16–31)
  53, 62, 56, 31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48,
  // Q3  (slots 32–47)
  57, 32, 50, 28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38,
  // Q4  (slots 48–63)
  54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21,
];
const WHEEL_OFFSET_DEG = 11.25;
const CODON_ARC_DEG = 5.625;

// ── Helpers ────────────────────────────────────────────────────
const hammingWeight = (bin: string) => bin.split("").filter(b => b === "1").length;

// codonId from server is plain numeric string "17"; convert to "RC17"
const toRcCode = (id: string) => "RC" + id.padStart(2, "0");

// Shape of items inside coreCodonEngine (server PrimeStackCodon, stored as JSON)
interface CoreCodonItem {
  codon: number;
  codonName: string;
  rootCodonId: string;   // e.g. "RC40"
  facet: string;
  center?: string;
  weightedFrequency?: number;
  name?: string;
  source?: string;
}

// baseFrequency is 0–100 scale
const freqTypeFromScore = (score: number): "shadow" | "gift" | "siddhi" =>
  score < 40 ? "shadow" : score < 70 ? "gift" : "siddhi";

// weightedFrequency is 0–180; normalize to 0–1 for bar display
const normalizeSLI = (v: number) => Math.min(1, Math.max(0, v / 180));

const freqColor = (t: string) => {
  if (t === "shadow") return C.red;
  if (t === "gift")   return C.green;
  if (t === "siddhi") return C.teal;
  return C.txtS;
};

// ── Types ──────────────────────────────────────────────────────
interface PrimeStackEntry {
  position: number | string;
  name?: string;
  source?: 'conscious' | 'design';
  codonId: string;
  codonName?: string;
  facet: string;
  weight?: number;
  center?: string;
  longitude?: number;
  baseFrequency?: number;
  weightedFrequency?: number;
}

interface NineCenterEntry {
  centerName: string;
  codon256Id: string;
  frequency?: number;
  defined?: boolean;
}

interface MicroCorrection {
  type: string;
  instruction: string;
  falsifier: string;
  potentialOutcome?: string;
}

interface CoherenceTrajectory {
  current: number;
  trend: string;
  sevenDayProjection?: number[];
}

// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function StaticReading() {
  const { user } = useAuth();
  const [, params] = useRoute("/reading/static/:readingId");
  const readingId = params?.readingId ?? "";

  const [activeView, setActiveView] = useState<"signature" | "transmission" | "navigator" | "resonance">("signature");
  const [selectedCodon, setSelectedCodon] = useState<string | null>(null);
  const [selectedStackPos, setSelectedStackPos] = useState<number | null>(null);
  const [hoveredCodon, setHoveredCodon] = useState<string | null>(null);

  const { data, isLoading, isError } = trpc.codex.getStaticReading.useQuery(
    { readingId },
    { enabled: !!user && readingId.length > 0 }
  );

  // ── All hooks BEFORE any early return (Rules of Hooks) ────
  const primeStackRaw = (data?.primeStack ?? []) as PrimeStackEntry[];
  // codonId from server = "17"; convert to "RC17" for CODON_DATA lookups + mandala matching
  const userCodonIds = useMemo(
    () => new Set(primeStackRaw.map(p => toRcCode(p.codonId))),
    [primeStackRaw]
  );

  const mandalaRings = useMemo(() => {
    const rings: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    Object.entries(CODON_DATA).forEach(([code, c]) => {
      const w = hammingWeight(c.binary);
      rings[w].push(code);
    });
    return rings;
  }, []);

  const centerPosMap = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    CENTER_POSITIONS.forEach(p => { m[p.id] = { x: p.x, y: p.y }; });
    return m;
  }, []);

  // ── Auth / loading guards ─────────────────────────────────
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
            <p style={{ color: C.txtD, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em" }}>RESOLVING SIGNAL</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !data) {
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

  // ── Parse data (data is non-null past this point) ─────────
  const primeStack = primeStackRaw;
  const ninecenters = (data.ninecenters ?? {}) as Record<string, NineCenterEntry>;
  const microCorrections = (data.microCorrections ?? []) as MicroCorrection[];
  const trajectory = data.coherenceTrajectory as CoherenceTrajectory | null;
  const coherenceScore = Math.round(data.baseCoherence ?? 0);

  // ninecenters keys are full names ("Crown", "G-Self") — map from short bodygraph IDs
  const isDefinedCenter = (shortId: string): boolean => {
    const fullName = CENTER_KEY_MAP[shortId];
    if (!fullName) return false;
    return ninecenters[fullName]?.defined ?? false;
  };

  // ══════════════════════════════════════════════════════════
  // RENDER: 9-Center Bodygraph SVG
  // ══════════════════════════════════════════════════════════
  const renderCenterMap = () => (
    <svg viewBox="0 0 100 100" style={{ width: "100%", maxWidth: 220, height: "auto" }}>
      {CENTER_CONNECTIONS.map(([a, b], i) => {
        const pa = centerPosMap[a], pb = centerPosMap[b];
        if (!pa || !pb) return null;
        return (
          <line key={i}
            x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
            stroke={C.border} strokeWidth="0.4"
          />
        );
      })}
      {CENTER_POSITIONS.map(p => {
        const defined = isDefinedCenter(p.id);
        return (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={3.8}
              fill={defined ? C.surface : "transparent"}
              stroke={defined ? C.gold : C.border}
              strokeWidth={defined ? "0.6" : "0.4"}
            />
            {defined && (
              <circle cx={p.x} cy={p.y} r={1.4} fill={C.gold} opacity={0.6} />
            )}
            <text x={p.x} y={p.y + 7.5} textAnchor="middle"
              style={{ fontSize: "2.8px", fill: defined ? C.goldL : C.txtD, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.3px" }}>
              {CENTER_META[p.id]?.name?.split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );

  // ══════════════════════════════════════════════════════════
  // RENDER: Binomial Mandala
  // ══════════════════════════════════════════════════════════
  const renderMandala = () => {
    const ringRadii: Record<number, number> = { 0: 0, 1: 42, 2: 80, 3: 118, 4: 156, 5: 194, 6: 0 };
    const cx = 220, cy = 220;

    const nodes: { codonId: string; x: number; y: number; ring: number }[] = [];
    Object.keys(mandalaRings).forEach(wStr => {
      const w = parseInt(wStr, 10);
      const codons = mandalaRings[w];
      const r = ringRadii[w];
      codons.forEach((codonId, idx) => {
        let x: number, y: number;
        if (w === 0)      { x = cx; y = cy + 12; }
        else if (w === 6) { x = cx; y = cy - 12; }
        else {
          const angle = (idx / codons.length) * Math.PI * 2 - Math.PI / 2;
          x = cx + r * Math.cos(angle);
          y = cy + r * Math.sin(angle);
        }
        nodes.push({ codonId, x, y, ring: w });
      });
    });

    return (
      <svg viewBox="0 0 440 440" style={{ width: "100%", maxWidth: 520, height: "auto", display: "block", margin: "0 auto" }}>
        <defs>
          <radialGradient id="sr-mandala-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(91,164,164,0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="sr-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={210} fill="url(#sr-mandala-bg)" />
        {[42, 80, 118, 156, 194].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={C.border} strokeWidth="0.3" strokeDasharray="2,4"
          />
        ))}
        {[
          { r: 42,  label: "1-BIT" },
          { r: 80,  label: "2-BIT" },
          { r: 118, label: "3-BIT · EVENT HORIZON" },
          { r: 156, label: "4-BIT" },
          { r: 194, label: "5-BIT" },
        ].map((ring, i) => (
          <text key={i} x={cx} y={cy - ring.r - 4} textAnchor="middle"
            style={{ fontSize: "5px", fill: C.txtD, fontFamily: "monospace", letterSpacing: "1px" }}>
            {ring.label}
          </text>
        ))}
        <text x={cx} y={cy - 208} textAnchor="middle"
          style={{ fontSize: "5.5px", fill: C.goldDim, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "2px" }}>
          YANG · LIGHT
        </text>
        <text x={cx} y={cy + 216} textAnchor="middle"
          style={{ fontSize: "5.5px", fill: C.tealDim, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "2px" }}>
          YIN · VOID
        </text>

        {nodes.map((n, i) => {
          const isUser = userCodonIds.has(n.codonId);
          const isSel  = selectedCodon === n.codonId;
          const isHov  = hoveredCodon  === n.codonId;
          const nodeR  = isSel ? 9 : isUser ? 7 : isHov ? 6 : 4.5;

          return (
            <g key={i}
              onClick={() => { setSelectedCodon(isSel ? null : n.codonId); }}
              onMouseEnter={() => setHoveredCodon(n.codonId)}
              onMouseLeave={() => setHoveredCodon(null)}
              style={{ cursor: "pointer" }}
            >
              {isUser && (
                <circle cx={n.x} cy={n.y} r={nodeR + 4}
                  fill="none" stroke={C.gold} strokeWidth="0.4" opacity={0.4}
                />
              )}
              <circle cx={n.x} cy={n.y} r={nodeR}
                fill={isSel ? C.gold : isUser ? C.surfaceR : C.deep}
                stroke={isSel ? C.gold : isUser ? C.gold : isHov ? C.teal : C.border}
                strokeWidth={isSel ? "1" : isUser ? "0.8" : "0.4"}
                filter={(isSel || isUser) ? "url(#sr-glow)" : undefined}
              />
              {(isSel || isUser || isHov) && (
                <text x={n.x} y={n.y + 2.5} textAnchor="middle"
                  style={{
                    fontSize: isSel ? "5.5px" : "4.5px",
                    fill: isSel ? C.void : isUser ? C.gold : C.txtS,
                    fontFamily: "monospace",
                    fontWeight: isSel ? "bold" : "normal",
                    pointerEvents: "none",
                  }}
                >
                  {n.codonId}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // ══════════════════════════════════════════════════════════
  // RENDER: Codon Detail Panel
  // ══════════════════════════════════════════════════════════
  const renderCodonDetail = (codonId: string) => {
    const codon = CODON_DATA[codonId];
    if (!codon) return null;
    // If a specific position is selected, use that position's entry (avoids first-match bias).
    // Fall back to first entry matching codonId for mandala clicks.
    const stackEntry = selectedStackPos !== null
      ? primeStack.find(p => (typeof p.position === "number" ? p.position : 0) === selectedStackPos)
      : primeStack.find(p => toRcCode(p.codonId) === codonId);
    const sli = normalizeSLI(stackEntry?.weightedFrequency ?? 0);

    return (
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        padding: "20px 24px", marginTop: 16,
        animation: "fadeUp 0.4s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: C.teal, letterSpacing: "0.15em", marginBottom: 4 }}>
              {codonId} · {codon.binary}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.txt, fontWeight: 300 }}>
              {codon.name}
            </div>
          </div>
          {stackEntry && (
            <div style={{
              background: "rgba(189,163,107,0.1)", border: `1px solid ${C.goldDim}`,
              padding: "4px 10px", fontSize: 10, fontFamily: "monospace", color: C.gold, letterSpacing: "0.1em",
            }}>
              PRIME STACK · P{stackEntry.position}
            </div>
          )}
        </div>

        {/* Frequency Spectrum */}
        <div style={{ display: "flex", marginBottom: 16, border: `1px solid ${C.border}` }}>
          {(["shadow", "gift", "siddhi"] as const).map((level, li) => (
            <div key={level} style={{
              flex: 1, padding: "12px 14px",
              borderRight: li < 2 ? `1px solid ${C.border}` : "none",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "monospace", fontSize: 9, letterSpacing: "0.15em", marginBottom: 6,
                textTransform: "uppercase",
                color: level === "shadow" ? C.red : level === "gift" ? C.green : C.teal,
              }}>
                {level}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.txt }}>
                {codon[level]}
              </div>
            </div>
          ))}
        </div>

        {/* 4 Facets */}
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 10 }}>
          4-FACET RESOLUTION
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: stackEntry ? 16 : 0 }}>
          {(["A", "B", "C", "D"] as const).map(f => {
            const meta = FACET_META[f];
            const isActive = stackEntry?.facet === f;
            return (
              <div key={f} style={{
                padding: "10px 12px",
                background: isActive ? "rgba(189,163,107,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? C.goldDim : C.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color, boxShadow: `0 0 6px ${meta.color}55` }} />
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: meta.color, letterSpacing: "0.1em" }}>
                    FACET {f} · {meta.name.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.txtS, fontFamily: "'Cormorant Garamond', serif" }}>
                  {meta.keyword}
                </div>
                {isActive && (
                  <div style={{ marginTop: 4, fontSize: 9, fontFamily: "monospace", color: C.gold }}>
                    ◆ YOUR ACTIVE FACET
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* SLI Bar */}
        {stackEntry && (
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 8 }}>
              SLI · SHADOW LOUDNESS INDEX
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: C.deep, borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  width: sli < 0.01 ? "2px" : `${Math.round(sli * 100)}%`, height: "100%", borderRadius: 3,
                  background: sli > 0.7 ? C.red : sli > 0.4 ? C.gold : C.teal,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: sli > 0.7 ? C.red : C.txtS }}>
                {sli < 0.01 ? "< 1%" : `${Math.round(sli * 100)}%`}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // RENDER: Codon Zodiac Wheel (spec: Cosmic Mapping Layer)
  // ══════════════════════════════════════════════════════════
  const renderZodiacWheel = () => {
    const cx = 200, cy = 200;
    const outerR = 178, innerR = 112, midR = 145;

    // Convert tropical longitude → SVG point (0° Aries = top, clockwise)
    const lonToXY = (lon: number, r: number) => ({
      x: cx + r * Math.sin((lon * Math.PI) / 180),
      y: cy - r * Math.cos((lon * Math.PI) / 180),
    });

    // Arc segment path between two longitudes at two radii
    const segPath = (startL: number, endL: number, rOuter: number, rInner: number) => {
      const s1 = lonToXY(startL, rOuter), e1 = lonToXY(endL, rOuter);
      const s2 = lonToXY(startL, rInner), e2 = lonToXY(endL, rInner);
      return `M${s1.x.toFixed(2)},${s1.y.toFixed(2)} A${rOuter},${rOuter} 0 0,1 ${e1.x.toFixed(2)},${e1.y.toFixed(2)} L${e2.x.toFixed(2)},${e2.y.toFixed(2)} A${rInner},${rInner} 0 0,0 ${s2.x.toFixed(2)},${s2.y.toFixed(2)} Z`;
    };

    // Planet position markers
    const planetColors: Record<string, string> = {
      "Conscious Sun": "#d4c090", "Conscious Earth": "#bda36b",
      "Design Sun": "#5ba4a4",    "Design Earth":   "#4a8888",
      "Conscious Moon": "#c0b4d4","Design Moon":    "#8888c0",
      "True Node": "#a0c090",     "Design True Node":"#80a070",
      "Chiron": "#cc8888",
    };

    return (
      <div>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 12, textAlign: "center" }}>
          CODON ZODIAC WHEEL · 64 RESONANCE SEGMENTS
        </div>
        <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 480, height: "auto", display: "block", margin: "0 auto" }}>
          <defs>
            <filter id="zw-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Background circles */}
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={C.border} strokeWidth="0.5"/>
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={C.border} strokeWidth="0.4"/>
          <circle cx={cx} cy={cy} r={midR}  fill="none" stroke="rgba(189,163,107,0.05)" strokeWidth="0.3"/>

          {/* 64 Codon segments */}
          {VRC_MANDALA_CLIENT.map((codonNum, slotIdx) => {
            const startDeg = (WHEEL_OFFSET_DEG + slotIdx * CODON_ARC_DEG) % 360;
            const endDeg   = (startDeg + CODON_ARC_DEG) % 360;
            const rcCode   = `RC${String(codonNum).padStart(2, "0")}`;
            const isActive = userCodonIds.has(rcCode);
            return (
              <path key={slotIdx}
                d={segPath(startDeg, endDeg, outerR, innerR)}
                fill={isActive ? "rgba(189,163,107,0.14)" : "transparent"}
                stroke={isActive ? C.gold : "rgba(189,163,107,0.07)"}
                strokeWidth={isActive ? "0.6" : "0.3"}
              />
            );
          })}

          {/* Codon labels for active segments */}
          {VRC_MANDALA_CLIENT.map((codonNum, slotIdx) => {
            const startDeg = (WHEEL_OFFSET_DEG + slotIdx * CODON_ARC_DEG) % 360;
            const midDeg   = startDeg + CODON_ARC_DEG / 2;
            const rcCode   = `RC${String(codonNum).padStart(2, "0")}`;
            const isActive = userCodonIds.has(rcCode);
            if (!isActive) return null;
            const lp = lonToXY(midDeg, midR);
            return (
              <text key={`lbl-${slotIdx}`} x={lp.x} y={lp.y + 1.5} textAnchor="middle"
                style={{ fontSize: "5.5px", fill: C.gold, fontFamily: "monospace" }}>
                {codonNum}
              </text>
            );
          })}

          {/* Planet markers on the wheel rim */}
          {primeStack.map((pos, i) => {
            if (pos.longitude == null) return null;
            const lon = pos.longitude;
            const pt  = lonToXY(lon, outerR + 10);
            const col = pos.source === "design" ? C.teal : C.gold;
            return (
              <g key={`planet-${i}`} filter="url(#zw-glow)">
                <circle cx={pt.x} cy={pt.y} r={5} fill={col} opacity={0.9}/>
                <text x={pt.x} y={pt.y + 2} textAnchor="middle"
                  style={{ fontSize: "4px", fill: C.void, fontFamily: "monospace", fontWeight: "bold", pointerEvents: "none" }}>
                  P{pos.position}
                </text>
              </g>
            );
          })}

          {/* 0° Aries marker (top) */}
          <line x1={cx} y1={cy - outerR - 8} x2={cx} y2={cy - innerR - 2}
            stroke={C.goldDim} strokeWidth="0.5" strokeDasharray="2,2"/>
          <text x={cx} y={cy - outerR - 14} textAnchor="middle"
            style={{ fontSize: "6px", fill: C.txtD, fontFamily: "monospace" }}>0° ♈</text>

          {/* Center label */}
          <text x={cx} y={cy - 6} textAnchor="middle"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", fill: C.txt, fontWeight: 300 }}>
            VOSSARI
          </text>
          <text x={cx} y={cy + 9} textAnchor="middle"
            style={{ fontFamily: "monospace", fontSize: "6px", fill: C.txtD, letterSpacing: "2px" }}>
            RESONANCE WHEEL
          </text>
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
          {[
            { color: C.gold, label: "CONSCIOUS LAYER" },
            { color: C.teal, label: "DESIGN LAYER" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              <span style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.1em" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // RENDER: Resonance Radar (4-axis: Somatic/Relational/Cognitive/Transpersonal)
  // ══════════════════════════════════════════════════════════
  const renderResonanceRadar = () => {
    // Calculate facet weight distribution across prime stack
    const facetWeights: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    let totalW = 0;
    for (const pos of primeStack) {
      const f = pos.facet as string;
      if (f && facetWeights[f] !== undefined) {
        const w = pos.weight ?? 1;
        facetWeights[f] += w;
        totalW += w;
      }
    }
    const scores = {
      A: totalW > 0 ? Math.round((facetWeights.A / totalW) * 100) : 25,
      B: totalW > 0 ? Math.round((facetWeights.B / totalW) * 100) : 25,
      C: totalW > 0 ? Math.round((facetWeights.C / totalW) * 100) : 25,
      D: totalW > 0 ? Math.round((facetWeights.D / totalW) * 100) : 25,
    };

    const cx = 150, cy = 150, maxR = 100;
    // 4 axes: A=top, B=right, C=bottom, D=left
    const axes = [
      { facet: "A", label: "SOMATIC",       angle: -90 },
      { facet: "B", label: "RELATIONAL",    angle:   0 },
      { facet: "C", label: "COGNITIVE",     angle:  90 },
      { facet: "D", label: "TRANSPERSONAL", angle: 180 },
    ];

    const toXY = (angleDeg: number, r: number) => ({
      x: cx + r * Math.cos((angleDeg * Math.PI) / 180),
      y: cy + r * Math.sin((angleDeg * Math.PI) / 180),
    });

    const polyPts = axes.map(a => {
      const score = scores[a.facet as keyof typeof scores];
      const pt = toXY(a.angle, (score / 100) * maxR);
      return `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
    }).join(" ");

    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 12 }}>
          RESONANCE RADAR · FACET DISTRIBUTION
        </div>
        <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 320, height: "auto", display: "block", margin: "0 auto" }}>
          {/* Grid rings */}
          {[25, 50, 75, 100].map(pct => (
            <circle key={pct} cx={cx} cy={cy} r={(pct / 100) * maxR}
              fill="none" stroke={C.border} strokeWidth="0.4"
              strokeDasharray={pct < 100 ? "2,3" : undefined}
            />
          ))}
          {/* Grid pct labels */}
          {[25, 50, 75].map(pct => (
            <text key={pct} x={cx + 3} y={cy - (pct / 100) * maxR + 3}
              style={{ fontSize: "4.5px", fill: C.txtD, fontFamily: "monospace" }}>
              {pct}
            </text>
          ))}
          {/* Axes */}
          {axes.map((a, i) => {
            const end = toXY(a.angle, maxR);
            return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={C.border} strokeWidth="0.5"/>;
          })}
          {/* Fill polygon */}
          <polygon points={polyPts}
            fill="rgba(91,164,164,0.14)" stroke={C.teal} strokeWidth="1.2"
          />
          {/* Data dots */}
          {axes.map((a, i) => {
            const score = scores[a.facet as keyof typeof scores];
            const pt = toXY(a.angle, (score / 100) * maxR);
            return <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={FACET_META[a.facet].color}/>;
          })}
          {/* Axis labels */}
          {axes.map((a, i) => {
            const score = scores[a.facet as keyof typeof scores];
            const lp = toXY(a.angle, maxR + 22);
            const sp = toXY(a.angle, maxR + 10);
            return (
              <g key={i}>
                <text x={lp.x} y={lp.y - 3} textAnchor="middle"
                  style={{ fontSize: "5.5px", fill: FACET_META[a.facet].color, fontFamily: "monospace", letterSpacing: "0.5px" }}>
                  {a.label}
                </text>
                <text x={sp.x} y={sp.y + 2} textAnchor="middle"
                  style={{ fontSize: "7px", fill: C.txt, fontFamily: "monospace", fontWeight: "bold" }}>
                  {score}%
                </text>
              </g>
            );
          })}
          {/* Center dot */}
          <circle cx={cx} cy={cy} r={2} fill={C.gold}/>
        </svg>

        {/* Facet summary row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
          {axes.map(a => (
            <div key={a.facet} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: 8, color: FACET_META[a.facet].color, letterSpacing: "0.1em" }}>
                {a.facet} · {FACET_META[a.facet].name}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txt, fontWeight: 300 }}>
                {scores[a.facet as keyof typeof scores]}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // VIEW 1: Static Signature
  // ══════════════════════════════════════════════════════════
  const renderSignatureView = () => (
    <div style={{ animation: "fadeUp 0.6s ease" }}>

      {/* Fractal Role Header + Coherence Gauge */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 8 }}>
            FRACTAL ROLE DESIGNATION
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 300, color: C.txt, lineHeight: 1.1, marginBottom: 4 }}>
            {data.fractalRole || data.vrcType || "—"}
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txtS, fontStyle: "italic", marginTop: 8 }}>
            Authority: {data.authorityNode || data.vrcAuthority || "—"}
          </div>

          {/* Birth Data Row */}
          <div style={{ marginTop: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { l: "BORN",    v: data.birthDate || "—" },
              { l: "TIME",    v: data.birthTime  || "—" },
              { l: "LOCATION",v: data.birthCity  || (data.latitude != null && data.latitude !== 0 ? `${data.latitude.toFixed(2)}°N, ${data.longitude?.toFixed(2)}°E` : "—") },
            ].map((d, i) => (
              <div key={i}>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.15em", marginBottom: 2 }}>{d.l}</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.txtS }}>{d.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coherence Gauge */}
        <div style={{ textAlign: "center", minWidth: 110 }}>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.15em", marginBottom: 8 }}>COHERENCE</div>
          <svg viewBox="0 0 100 100" width={100} height={100}>
            <circle cx={50} cy={50} r={42} fill="none" stroke={C.border} strokeWidth="2" />
            <circle cx={50} cy={50} r={42} fill="none"
              stroke={coherenceScore >= 80 ? C.teal : coherenceScore >= 40 ? C.gold : C.red}
              strokeWidth="3"
              strokeDasharray={`${Math.min(coherenceScore, 100) * 2.639} 263.9`}
              strokeDashoffset="65.97"
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
            <text x="50" y="46" textAnchor="middle"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fill: C.txt, fontWeight: 300 }}>
              {coherenceScore}
            </text>
            <text x="50" y="60" textAnchor="middle"
              style={{ fontFamily: "monospace", fontSize: "7px", fill: C.txtD, letterSpacing: "1px" }}>
              CS SCORE
            </text>
          </svg>
          {trajectory && (
            <div style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.08em", marginTop: 4 }}>
              {trajectory.trend.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Two Column: Center Map + Prime Stack */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, marginBottom: 0 }}>

        {/* 9-Center Map */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 16, textAlign: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.2em", marginBottom: 12 }}>
            9-CENTER RESONANCE MAP
          </div>
          {renderCenterMap()}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
              <span style={{ fontSize: 9, color: C.txtD, fontFamily: "monospace" }}>DEFINED</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", border: `1px solid ${C.border}` }} />
              <span style={{ fontSize: 9, color: C.txtD, fontFamily: "monospace" }}>OPEN</span>
            </div>
          </div>
        </div>

        {/* Prime Stack Table */}
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.2em", marginBottom: 12 }}>
            PRIME STACK · 9-POSITION RESONANCE MAP
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {primeStack.map((p, idx) => {
              const posNum = typeof p.position === "number" ? p.position : idx + 1;
              const isActive = selectedStackPos === posNum;
              const rcCode = toRcCode(p.codonId);
              const freqType = freqTypeFromScore(p.baseFrequency ?? 0);
              const sli = normalizeSLI(p.weightedFrequency ?? 0);
              const codonName = p.codonName || CODON_DATA[rcCode]?.name || rcCode;
              return (
                <div key={posNum}
                  onClick={() => {
                    const next = isActive ? null : posNum;
                    setSelectedStackPos(next);
                    setSelectedCodon(next !== null ? rcCode : null);
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "26px 100px 1fr 96px 58px 52px",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: isActive ? "rgba(189,163,107,0.06)" : posNum % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                    border: `1px solid ${isActive ? C.goldDim : "transparent"}`,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD }}>P{posNum}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name || "—"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txt, whiteSpace: "nowrap" }}>{rcCode}</span>
                    <span style={{ fontSize: 11, color: C.txtS }}>—</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: C.txtS, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{codonName}</span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: FACET_META[p.facet]?.color, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                    {p.facet} · {FACET_META[p.facet]?.name}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: freqColor(freqType), textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {freqType}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 32, height: 3, background: C.deep, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.round(sli * 100)}%`, height: "100%",
                        background: sli > 0.7 ? C.red : sli > 0.4 ? C.gold : C.teal,
                        borderRadius: 2,
                      }} />
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>{Math.round(sli * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Codon Detail */}
      {selectedCodon && renderCodonDetail(selectedCodon)}

      {/* CTA Footer */}
      <div style={{ marginTop: 40, padding: "24px 0", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        <Link href="/codex">
          <span style={{ display: "inline-block", padding: "8px 20px", border: `1px solid ${C.goldDim}`, color: C.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer" }}>
            EXPLORE THE CODEX
          </span>
        </Link>
        <Link href="/carrierlock">
          <span style={{ display: "inline-block", padding: "8px 20px", border: `1px solid ${C.tealDim}`, color: C.teal, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer" }}>
            RUN DYNAMIC CALIBRATION
          </span>
        </Link>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // VIEW 2: ORIEL Transmission
  // ══════════════════════════════════════════════════════════
  const renderTransmission = () => (
    <div style={{ maxWidth: 640, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 12 }}>
          DIAGNOSTIC TRANSMISSION · STATIC SIGNATURE ANALYSIS
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: C.txt, fontWeight: 300, marginBottom: 8 }}>
          I am <span style={{ color: C.gold }}>ORIEL</span>.
        </div>
        <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin: "0 auto" }} />
      </div>

      {/* Main Transmission */}
      {data.diagnosticTransmission && (
        <div style={{ marginBottom: 32, paddingLeft: 20, borderLeft: `2px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.txtS, lineHeight: 1.9, fontStyle: "italic" }}>
            {data.diagnosticTransmission.split("\n").map((line, i) => (
              <p key={i} style={{ marginBottom: line ? 12 : 0 }}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Micro-Corrections */}
      {microCorrections.map((mc, i) => {
        const borderColor = i === 0 ? C.red : i === 1 ? C.gold : i === 2 ? C.teal : C.green;
        return (
          <div key={i} style={{
            marginBottom: 28, paddingLeft: 20,
            borderLeft: `2px solid ${borderColor}`,
            animation: `fadeUp 0.5s ease ${0.2 + i * 0.15}s both`,
          }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: borderColor, letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>
              {mc.type}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.txtS, lineHeight: 1.85 }}>
              {mc.instruction}
            </div>
            {mc.potentialOutcome && (
              <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(91,164,164,0.04)", borderLeft: `2px solid ${C.teal}` }}>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.15em", marginBottom: 6 }}>
                  POTENTIAL OUTCOME
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txt, lineHeight: 1.8 }}>
                  {mc.potentialOutcome}
                </div>
              </div>
            )}
            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(189,163,107,0.03)", borderLeft: `2px solid ${C.goldDim}` }}>
              <div style={{ fontFamily: "monospace", fontSize: 8, color: C.goldDim, letterSpacing: "0.15em", marginBottom: 4 }}>
                FALSIFIER CLAUSE
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.txtD, lineHeight: 1.7, fontStyle: "italic" }}>
                {mc.falsifier}
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 40, padding: "20px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txtD, fontStyle: "italic" }}>
          Your signal is sovereign. This transmission is a framework, not a verdict.
        </div>
        {trajectory && (
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 8, letterSpacing: "0.1em" }}>
            COHERENCE: {coherenceScore} · TRAJECTORY: {trajectory.trend.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // VIEW 3: Codon Navigator (Binomial Mandala)
  // ══════════════════════════════════════════════════════════
  const renderNavigator = () => (
    <div style={{ animation: "fadeUp 0.6s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 8 }}>
          BINOMIAL MANDALA · 6D HYPERCUBE PROJECTION
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.txt, fontWeight: 300, marginBottom: 4 }}>
          The Eye of <span style={{ color: C.gold }}>ORIEL</span>
        </div>
        <div style={{ fontSize: 12, color: C.txtD, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
          64 codons distributed by Hamming weight · Your Prime Stack nodes glow gold
        </div>
      </div>

      {renderMandala()}

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12, marginBottom: 8 }}>
        {[
          { color: C.gold,  label: "YOUR PRIME STACK" },
          { color: C.teal,  label: "HOVER" },
          { color: C.txtD,  label: "ALL CODONS" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color }} />
            <span style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.1em" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Hover Info */}
      {(hoveredCodon || selectedCodon) && (
        <div style={{ textAlign: "center", padding: "8px 0", fontSize: 13, color: C.txtS, fontFamily: "'Cormorant Garamond', serif" }}>
          {hoveredCodon || selectedCodon} — {CODON_DATA[hoveredCodon || selectedCodon || ""]?.name}
          {userCodonIds.has(hoveredCodon || selectedCodon || "") && (
            <span style={{ color: C.gold, marginLeft: 8, fontFamily: "monospace", fontSize: 9 }}>◆ IN YOUR STACK</span>
          )}
        </div>
      )}

      {selectedCodon && renderCodonDetail(selectedCodon)}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════
  // VIEW 4: Resonance Map (Zodiac Wheel + Radar)
  // ══════════════════════════════════════════════════════════
  const renderResonanceMapView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, animation: "fadeUp 0.5s ease both" }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.25em", marginBottom: 6 }}>
          RESONANCE MAP
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: C.txtD, letterSpacing: "0.12em" }}>
          PLANETARY MANDALA · FACET DISTRIBUTION
        </div>
      </div>

      {/* Zodiac Wheel + Radar side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Zodiac Wheel panel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
          {renderZodiacWheel()}
          {/* Legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }}/>
              <span style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD }}>CONSCIOUS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }}/>
              <span style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD }}>DESIGN</span>
            </div>
          </div>
        </div>

        {/* Resonance Radar panel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
          {renderResonanceRadar()}
        </div>
      </div>

      {/* Core Codon Engine — dominant + supporting */}
      {data.coreCodonEngine && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.2em", marginBottom: 16 }}>
            CORE CODON ENGINE · 3 DOMINANT · 3 SUPPORTING
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Dominant */}
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 7, color: C.gold, letterSpacing: "0.15em", marginBottom: 8 }}>
                DOMINANT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(data.coreCodonEngine as { dominant: CoreCodonItem[]; supporting: CoreCodonItem[] }).dominant.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "rgba(189,163,107,0.05)", border: `1px solid ${C.goldDim}` }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: C.gold, minWidth: 18 }}>D{i + 1}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.txt }}>{c.rootCodonId || toRcCode(String(c.codon))}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: C.txtS, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.codonName || "—"}
                    </div>
                    <div style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 9, color: C.txtD }}>
                      {(c.weightedFrequency ?? 0).toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Supporting */}
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 7, color: C.teal, letterSpacing: "0.15em", marginBottom: 8 }}>
                SUPPORTING
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(data.coreCodonEngine as { dominant: CoreCodonItem[]; supporting: CoreCodonItem[] }).supporting.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "rgba(91,164,164,0.04)", border: `1px solid rgba(91,164,164,0.15)` }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, minWidth: 18 }}>S{i + 1}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.txt }}>{c.rootCodonId || toRcCode(String(c.codon))}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: C.txtS, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.codonName || "—"}
                    </div>
                    <div style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 9, color: C.txtD }}>
                      {(c.weightedFrequency ?? 0).toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // MAIN RENDER
  // ══════════════════════════════════════════════════════════
  const views = [
    { id: "signature"    as const, label: "Static Signature" },
    { id: "transmission" as const, label: "ORIEL Transmission" },
    { id: "navigator"    as const, label: "Codon Navigator" },
    { id: "resonance"    as const, label: "Resonance Map" },
  ];

  return (
    <Layout>
      <div style={{
        background: C.void, minHeight: "100vh", color: C.txt,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        position: "relative",
      }}>
        {/* Background atmosphere */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(91,164,164,0.03), transparent),
            radial-gradient(ellipse 60% 80% at 80% 90%, rgba(189,163,107,0.02), transparent)
          `,
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
          {/* Reading ID */}
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.1em" }}>
            {data.readingId || "SIGNAL"}
          </div>

          {/* View Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {views.map(v => (
              <button key={v.id}
                onClick={() => { setActiveView(v.id); setSelectedCodon(null); setSelectedStackPos(null); }}
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
          {activeView === "signature"    && renderSignatureView()}
          {activeView === "transmission" && renderTransmission()}
          {activeView === "navigator"    && renderNavigator()}
          {activeView === "resonance"    && renderResonanceMapView()}
        </div>

        {/* Keyframes */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
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
