import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import CodonGlyph from "@/components/CodonGlyph";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const C = {
  void: "#0a0a0e",
  deep: "#0f0f15",
  surface: "#14141c",
  surfaceR: "#1b1b26",
  border: "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.26)",
  gold: "#bda36b",
  goldL: "#d4c090",
  goldDim: "rgba(189,163,107,0.52)",
  goldGlow: "rgba(189,163,107,0.10)",
  teal: "#5ba4a4",
  tealDim: "rgba(91,164,164,0.45)",
  tealGlow: "rgba(91,164,164,0.14)",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
  red: "#c94444",
  green: "#44a866",
};

const WHEEL_OFFSET = 11.25;
const CODON_ARC = 5.625;

const MANDALA_SEQUENCE = [
  51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39,
  53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48,
  57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38,
  54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21,
] as const;

const MANDALA_SEQUENCE_LIST: number[] = [...MANDALA_SEQUENCE];

const CENTER_LAYOUT: Array<{ id: string; x: number; y: number }> = [
  { id: "Crown", x: 50, y: 8 },
  { id: "Ajna", x: 50, y: 20 },
  { id: "Throat", x: 50, y: 33 },
  { id: "G-Self", x: 50, y: 47 },
  { id: "Heart", x: 32, y: 52 },
  { id: "Spleen", x: 28, y: 66 },
  { id: "Solar Plexus", x: 72, y: 66 },
  { id: "Sacral", x: 50, y: 74 },
  { id: "Root", x: 50, y: 90 },
];

const CENTER_CONNECTIONS: Array<[string, string]> = [
  ["Crown", "Ajna"],
  ["Ajna", "Throat"],
  ["Throat", "G-Self"],
  ["Throat", "Solar Plexus"],
  ["Throat", "Heart"],
  ["Throat", "Spleen"],
  ["G-Self", "Sacral"],
  ["G-Self", "Spleen"],
  ["Heart", "Spleen"],
  ["Heart", "Solar Plexus"],
  ["Spleen", "Sacral"],
  ["Sacral", "Root"],
  ["Solar Plexus", "Root"],
  ["G-Self", "Heart"],
];

type RootCodon = {
  id: string;
  numericId: number;
  name: string;
  title?: string;
  essence?: string;
  shadow?: string;
  gift?: string;
  crown?: string;
  domain?: string;
  binary?: string;
};

type PrimeStackEntry = {
  position: number;
  name: string;
  source: string;
  planetaryBody: string;
  weight: number;
  codon: number;
  codonName: string;
  facet: string;
  facetFull: string;
  codon256Id: string;
  center: string;
  weightedFrequency: number;
  baseFrequency: number;
};

type CenterEntry = {
  id: string;
  centerName: string;
  codon256Id: string;
  frequency: number;
  defined: boolean;
};

type CorrectionEntry = {
  type: string;
  instruction: string;
  falsifier: string;
  potentialOutcome: string;
};

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringOr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function formatRc(codon: number) {
  return `RC${String(codon).padStart(2, "0")}`;
}

function normalizePrimeStack(value: unknown): PrimeStackEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        position: numberOr(row.position, 0),
        name: stringOr(row.name, "Position"),
        source: stringOr(row.source, "unknown"),
        planetaryBody: stringOr(row.planetaryBody, "Unknown"),
        weight: numberOr(row.weight, 0),
        codon: numberOr(row.codon, 0),
        codonName: stringOr(row.codonName, "Unknown Codon"),
        facet: stringOr(row.facet, "?"),
        facetFull: stringOr(row.facetFull, "Unknown Facet"),
        codon256Id: stringOr(row.codon256Id, ""),
        center: stringOr(row.center, "Unknown Center"),
        weightedFrequency: numberOr(row.weightedFrequency, 0),
        baseFrequency: numberOr(row.baseFrequency, 0),
      };
    })
    .filter((entry): entry is PrimeStackEntry => Boolean(entry && entry.codon > 0));
}

function normalizeCenters(value: unknown): CenterEntry[] {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>)
    .map(([id, raw]) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      return {
        id,
        centerName: stringOr(row.centerName, id),
        codon256Id: stringOr(row.codon256Id, ""),
        frequency: numberOr(row.frequency, 0),
        defined: Boolean(row.defined),
      };
    })
    .filter((entry): entry is CenterEntry => Boolean(entry));
}

function normalizeCorrections(value: unknown): CorrectionEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        type: stringOr(row.type, "Correction"),
        instruction: stringOr(row.instruction, ""),
        falsifier: stringOr(row.falsifier, ""),
        potentialOutcome: stringOr(row.potentialOutcome, ""),
      };
    })
    .filter((entry): entry is CorrectionEntry => Boolean(entry));
}

function buildPositionsByCodon(primeStack: PrimeStackEntry[]) {
  const map = new Map<number, PrimeStackEntry[]>();
  for (const entry of primeStack) {
    const current = map.get(entry.codon) ?? [];
    current.push(entry);
    map.set(entry.codon, current);
  }
  return map;
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.005) 100%)`,
        border: `1px solid ${C.border}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top left, rgba(91,164,164,0.08), transparent 38%), radial-gradient(circle at bottom right, rgba(189,163,107,0.06), transparent 44%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", padding: "18px 20px 20px" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            color: C.teal,
            letterSpacing: "0.18em",
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            color: C.txt,
            fontWeight: 300,
            marginBottom: 16,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {children}
      </div>
    </section>
  );
}

function DataPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        border: `1px solid ${accent ? C.goldDim : C.border}`,
        background: accent ? C.goldGlow : "rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          color: C.txtD,
          letterSpacing: "0.16em",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: accent ? "'Cormorant Garamond', serif" : "monospace",
          fontSize: accent ? 18 : 11,
          color: accent ? C.goldL : C.txtS,
          lineHeight: 1.5,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CenterConstellation({ centers }: { centers: CenterEntry[] }) {
  const centerMap = new Map(centers.map((center) => [center.id, center]));
  const positionMap = Object.fromEntries(CENTER_LAYOUT.map((center) => [center.id, center]));

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", maxWidth: 260, height: "auto" }}>
      {CENTER_CONNECTIONS.map(([from, to], index) => (
        <line
          key={index}
          x1={positionMap[from].x}
          y1={positionMap[from].y}
          x2={positionMap[to].x}
          y2={positionMap[to].y}
          stroke={C.border}
          strokeWidth="0.45"
        />
      ))}
      {CENTER_LAYOUT.map((point) => {
        const center = centerMap.get(point.id);
        const defined = Boolean(center?.defined);
        return (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={4.5}
              fill={defined ? C.surfaceR : "transparent"}
              stroke={defined ? C.gold : C.border}
              strokeWidth={defined ? "0.8" : "0.45"}
            />
            {defined && <circle cx={point.x} cy={point.y} r={1.55} fill={C.gold} opacity={0.8} />}
            <text
              x={point.x}
              y={point.y + 8.8}
              textAnchor="middle"
              style={{
                fontSize: "3.1px",
                fill: defined ? C.goldL : C.txtD,
                fontFamily: "monospace",
                letterSpacing: "0.4px",
              }}
            >
              {point.id === "Solar Plexus" ? "Solar" : point.id === "G-Self" ? "G-Self" : point.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MandalaWheel({
  selectedCodon,
  onSelect,
  positionsByCodon,
}: {
  selectedCodon: number | null;
  onSelect: (codon: number) => void;
  positionsByCodon: Map<number, PrimeStackEntry[]>;
}) {
  const cx = 240;
  const cy = 240;
  const nodeBaseRadius = 170;
  const labelRadius = 208;

  return (
    <svg viewBox="0 0 480 480" style={{ width: "100%", maxWidth: 540, height: "auto", display: "block", margin: "0 auto" }}>
      <defs>
        <radialGradient id="oriel-blueprint-wheel">
          <stop offset="0%" stopColor="rgba(91,164,164,0.12)" />
          <stop offset="55%" stopColor="rgba(91,164,164,0.04)" />
          <stop offset="100%" stopColor="rgba(10,10,14,0)" />
        </radialGradient>
        <filter id="oriel-node-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={226} fill="url(#oriel-blueprint-wheel)" />
      <circle cx={cx} cy={cy} r={196} fill="none" stroke={C.border} strokeWidth="0.7" strokeDasharray="3 6" />
      <circle cx={cx} cy={cy} r={152} fill="none" stroke={C.border} strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r={96} fill="none" stroke={C.border} strokeWidth="0.4" strokeDasharray="2 5" />
      <circle cx={cx} cy={cy} r={48} fill="none" stroke={C.border} strokeWidth="0.4" />

      {["Q1", "Q2", "Q3", "Q4"].map((label, index) => {
        const angle = (index * 90 - 45) * (Math.PI / 180);
        const x = cx + Math.cos(angle) * 116;
        const y = cy + Math.sin(angle) * 116;
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            style={{
              fontSize: "7px",
              fill: C.txtD,
              fontFamily: "monospace",
              letterSpacing: "1.4px",
            }}
          >
            {label}
          </text>
        );
      })}

      {Array.from({ length: 64 }, (_, index) => {
        const angle = (index / 64) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(angle) * 142;
        const y1 = cy + Math.sin(angle) * 142;
        const x2 = cx + Math.cos(angle) * 190;
        const y2 = cy + Math.sin(angle) * 190;
        return (
          <line
            key={`tick-${index}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={index % 8 === 0 ? C.goldDim : C.border}
            strokeWidth={index % 8 === 0 ? "0.85" : "0.4"}
          />
        );
      })}

      {MANDALA_SEQUENCE.map((codon, index) => {
        const angle = (index / 64) * Math.PI * 2 - Math.PI / 2;
        const activeEntries = positionsByCodon.get(codon) ?? [];
        const isSelected = selectedCodon === codon;
        const isActive = activeEntries.length > 0;
        const nodeRadius = nodeBaseRadius + (index % 2 === 0 ? 8 : -8);
        const x = cx + Math.cos(angle) * nodeRadius;
        const y = cy + Math.sin(angle) * nodeRadius;
        const lx = cx + Math.cos(angle) * labelRadius;
        const ly = cy + Math.sin(angle) * labelRadius;

        return (
          <g
            key={codon}
            onClick={() => onSelect(codon)}
            style={{ cursor: "pointer" }}
          >
            {isActive && (
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 15 : 11}
                fill="none"
                stroke={C.gold}
                strokeWidth="0.85"
                opacity={0.35}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={isSelected ? 9.5 : isActive ? 7 : 4.4}
              fill={isSelected ? C.gold : isActive ? C.surfaceR : C.deep}
              stroke={isSelected ? C.goldL : isActive ? C.gold : C.border}
              strokeWidth={isSelected ? "1.2" : isActive ? "0.9" : "0.4"}
              filter={isSelected || isActive ? "url(#oriel-node-glow)" : undefined}
            />
            {(isSelected || isActive || index % 4 === 0) && (
              <text
                x={lx}
                y={ly + 1.6}
                textAnchor="middle"
                style={{
                  fontSize: isSelected ? "6px" : isActive ? "5px" : "4.2px",
                  fill: isSelected ? C.goldL : isActive ? C.txtS : C.txtD,
                  fontFamily: "monospace",
                  letterSpacing: isSelected ? "0.5px" : "0.2px",
                }}
              >
                {String(codon).padStart(2, "0")}
              </text>
            )}
            {isActive && activeEntries[0] && (
              <text
                x={x}
                y={y + 2.2}
                textAnchor="middle"
                style={{
                  fontSize: "4.5px",
                  fill: isSelected ? C.void : C.gold,
                  fontFamily: "monospace",
                }}
              >
                {activeEntries[0].position}
              </text>
            )}
          </g>
        );
      })}

      <text
        x={cx}
        y={cy - 24}
        textAnchor="middle"
        style={{
          fontSize: "8px",
          fill: C.txtD,
          fontFamily: "monospace",
          letterSpacing: "2px",
        }}
      >
        VRC MANDALA
      </text>
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        style={{
          fontSize: "20px",
          fill: C.txt,
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
        }}
      >
        {selectedCodon ? formatRc(selectedCodon) : "BLUEPRINT"}
      </text>
      <text
        x={cx}
        y={cy + 24}
        textAnchor="middle"
        style={{
          fontSize: "6px",
          fill: C.txtS,
          fontFamily: "monospace",
          letterSpacing: "1.3px",
        }}
      >
        64 CODONS · 4 FACETS · 9 CENTERS
      </text>
    </svg>
  );
}

export default function StaticReading() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedCodon, setSelectedCodon] = useState<number | null>(null);

  const staticProfileQuery = trpc.profile.getStaticProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const rootCodonsQuery = trpc.codex.getRootCodons.useQuery();

  const profile = staticProfileQuery.data as Record<string, unknown> | null | undefined;
  const rootCodons = (rootCodonsQuery.data ?? []) as RootCodon[];
  const primeStack = useMemo(() => normalizePrimeStack(profile?.primeStack), [profile?.primeStack]);
  const centers = useMemo(() => normalizeCenters(profile?.ninecenters), [profile?.ninecenters]);
  const corrections = useMemo(() => normalizeCorrections(profile?.microCorrections), [profile?.microCorrections]);
  const dominantCodons = useMemo(() => {
    const engine = profile?.coreCodonEngine;
    if (!engine || typeof engine !== "object") return [] as PrimeStackEntry[];
    return normalizePrimeStack((engine as Record<string, unknown>).dominant);
  }, [profile?.coreCodonEngine]);
  const supportingCodons = useMemo(() => {
    const engine = profile?.coreCodonEngine;
    if (!engine || typeof engine !== "object") return [] as PrimeStackEntry[];
    return normalizePrimeStack((engine as Record<string, unknown>).supporting);
  }, [profile?.coreCodonEngine]);

  const positionsByCodon = useMemo(() => buildPositionsByCodon(primeStack), [primeStack]);
  const rootCodonMap = useMemo(() => new Map(rootCodons.map((codon) => [codon.numericId, codon])), [rootCodons]);

  useEffect(() => {
    if (!selectedCodon && primeStack[0]?.codon) {
      setSelectedCodon(primeStack[0].codon);
    }
  }, [primeStack, selectedCodon]);

  const selectedRootCodon = selectedCodon ? rootCodonMap.get(selectedCodon) : null;
  const selectedEntries = selectedCodon ? positionsByCodon.get(selectedCodon) ?? [] : [];
  const selectedSlotIndex = selectedCodon ? MANDALA_SEQUENCE_LIST.indexOf(selectedCodon) : -1;
  const selectedStartDegree = selectedSlotIndex >= 0 ? ((WHEEL_OFFSET + selectedSlotIndex * CODON_ARC) % 360) : null;
  const selectedEndDegree = selectedStartDegree !== null ? ((selectedStartDegree + CODON_ARC) % 360) : null;

  if (loading || staticProfileQuery.isLoading || rootCodonsQuery.isLoading) {
    return (
      <Layout>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <Loader2 style={{ color: C.teal, animation: "spin 1s linear infinite" }} size={24} />
          <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.2em" }}>
            RESTORING STATIC SIGNATURE…
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 480, width: "100%", background: C.deep, border: `1px solid ${C.border}`, padding: "28px 24px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.18em", marginBottom: 12 }}>
              AUTHENTICATION REQUIRED
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: C.txt, marginBottom: 10, fontWeight: 300 }}>
              Sign in to open your blueprint
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, lineHeight: 1.8, marginBottom: 22 }}>
              The Static Signature page is now driven by your canonical natal profile. It needs your authenticated profile data to render the mandala and codon map.
            </div>
            <a href={getLoginUrl()} style={{ textDecoration: "none" }}>
              <div style={{ display: "inline-block", padding: "10px 20px", border: `1px solid ${C.goldDim}`, color: C.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.16em" }}>
                SIGN IN
              </div>
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 520, width: "100%", background: C.deep, border: `1px solid ${C.border}`, padding: "28px 24px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.18em", marginBottom: 12 }}>
              BLUEPRINT NOT FOUND
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: C.txt, marginBottom: 10, fontWeight: 300 }}>
              Complete natal onboarding first
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, lineHeight: 1.8, marginBottom: 22 }}>
              The dedicated Static Signature page is back, but it renders from your canonical natal profile. Save your birth data first, then the mandala and codon architecture can resolve correctly.
            </div>
            <Link href="/complete-profile">
              <span style={{ display: "inline-block", padding: "10px 20px", border: `1px solid ${C.goldDim}`, color: C.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.16em", cursor: "pointer" }}>
                COMPLETE PROFILE
              </span>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const birthDate = stringOr(profile.birthDate, "Unknown date");
  const birthTime = stringOr(profile.birthTime, "Unknown time");
  const birthCity = stringOr(profile.birthCity, "Unknown city");
  const birthCountry = stringOr(profile.birthCountry, "Unknown country");
  const vrcType = stringOr(profile.vrcType, "Unknown");
  const vrcAuthority = stringOr(profile.vrcAuthority, stringOr(profile.authorityNode, "Unknown"));
  const fractalRole = stringOr(profile.fractalRole, "Unknown");
  const diagnosticTransmission = stringOr(profile.diagnosticTransmission, "No stored transmission available.");

  return (
    <Layout>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blueprintPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.015); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          padding: "72px 24px 120px",
          background:
            "radial-gradient(circle at top left, rgba(91,164,164,0.08), transparent 30%), radial-gradient(circle at top right, rgba(189,163,107,0.08), transparent 34%), linear-gradient(180deg, #09090d 0%, #0f0f15 44%, #09090d 100%)",
        }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 26, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.24em", marginBottom: 12 }}>
                STATIC SIGNATURE · CANONICAL NATAL BLUEPRINT
              </div>
              <div style={{ width: 36, height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: 18 }} />
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px, 5vw, 56px)", color: C.txt, fontWeight: 300, lineHeight: 1, marginBottom: 10 }}>
                The Mandala Returns
              </h1>
              <p style={{ fontFamily: "monospace", fontSize: 11, color: C.txtS, lineHeight: 1.9, maxWidth: 760 }}>
                This page is the restored visual home of your Static Signature. It now renders from the canonical natal profile instead of the old archived reading flow, so the architecture is newer even though the ritual view is back.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/profile">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", border: `1px solid ${C.borderH}`, color: C.txtS, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.14em", cursor: "pointer" }}>
                  <ArrowLeft size={14} />
                  PROFILE
                </span>
              </Link>
              <Link href="/carrierlock">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", border: `1px solid ${C.goldDim}`, color: C.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.14em", cursor: "pointer" }}>
                  RUN CALIBRATION
                </span>
              </Link>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 18 }}>
            <DataPill label="VRC TYPE" value={vrcType} accent />
            <DataPill label="AUTHORITY" value={vrcAuthority} />
            <DataPill label="FRACTAL ROLE" value={fractalRole} />
            <DataPill label="NATAL ORIGIN" value={`${birthDate} · ${birthTime}`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22, alignItems: "start" }}>
            <Panel eyebrow="MANDALA" title="64 Codons in Wheel Form">
              <div
                style={{
                  position: "relative",
                  background: `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)`,
                  border: `1px solid ${C.border}`,
                  padding: "20px 14px 18px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "18% 18%",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${C.tealGlow}, transparent 65%)`,
                    animation: "blueprintPulse 7s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
                <MandalaWheel
                  selectedCodon={selectedCodon}
                  onSelect={setSelectedCodon}
                  positionsByCodon={positionsByCodon}
                />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, boxShadow: `0 0 10px ${C.gold}` }} />
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.12em" }}>
                      PRIME STACK ACTIVATION
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal, boxShadow: `0 0 10px ${C.teal}` }} />
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.12em" }}>
                      CURRENTLY SELECTED CODON
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel eyebrow="SELECTED CODON" title={selectedCodon ? `${formatRc(selectedCodon)} · ${selectedRootCodon?.name ?? selectedEntries[0]?.codonName ?? "Unknown Codon"}` : "Select a Codon"}>
              {selectedCodon ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "108px 1fr", gap: 18, alignItems: "center", marginBottom: 18 }}>
                    <div
                      style={{
                        width: 108,
                        height: 108,
                        borderRadius: "50%",
                        border: `1px solid ${C.goldDim}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "radial-gradient(circle, rgba(189,163,107,0.12) 0%, rgba(10,10,14,0.4) 70%)",
                      }}
                    >
                      <CodonGlyph codonNumber={selectedCodon} className="w-20 h-20" />
                    </div>

                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: C.teal, letterSpacing: "0.16em", marginBottom: 6 }}>
                        {selectedEntries.length > 0 ? `ACTIVE IN BLUEPRINT · ${selectedEntries.length} POSITION${selectedEntries.length > 1 ? "S" : ""}` : "MANDALA EXPLORER"}
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: C.txt, marginBottom: 8, fontWeight: 400 }}>
                        {selectedRootCodon?.title || selectedRootCodon?.name || selectedEntries[0]?.codonName || "Unnamed Codon"}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, lineHeight: 1.8 }}>
                        {selectedRootCodon?.essence || "This codon is part of the restored mandala navigator. Use the prime stack list to inspect how it appears inside your natal blueprint."}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 18 }}>
                    <DataPill
                      label="MANDALA SLOT"
                      value={selectedSlotIndex >= 0 ? `${selectedSlotIndex + 1}` : "Unknown"}
                    />
                    <DataPill
                      label="DEGREE ARC"
                      value={
                        selectedStartDegree !== null && selectedEndDegree !== null
                          ? `${selectedStartDegree.toFixed(3)}° → ${selectedEndDegree.toFixed(3)}°`
                          : "Unknown"
                      }
                    />
                    <DataPill
                      label="BINARY"
                      value={selectedRootCodon?.binary || "------"}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 18 }}>
                    <div style={{ padding: "12px 14px", border: `1px solid ${C.border}`, background: "rgba(201,68,68,0.05)" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 8, color: C.red, letterSpacing: "0.16em", marginBottom: 4 }}>SHADOW</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txt }}>{selectedRootCodon?.shadow || "Undisclosed"}</div>
                    </div>
                    <div style={{ padding: "12px 14px", border: `1px solid ${C.border}`, background: "rgba(68,168,102,0.05)" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 8, color: C.green, letterSpacing: "0.16em", marginBottom: 4 }}>GIFT</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txt }}>{selectedRootCodon?.gift || "Undisclosed"}</div>
                    </div>
                    <div style={{ padding: "12px 14px", border: `1px solid ${C.border}`, background: "rgba(91,164,164,0.05)" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.16em", marginBottom: 4 }}>SIDDHI</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txt }}>{selectedRootCodon?.crown || "Undisclosed"}</div>
                    </div>
                  </div>

                  {selectedEntries.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                      {selectedEntries.map((entry) => (
                        <div
                          key={`${entry.position}-${entry.codon}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "48px 1fr 86px",
                            gap: 10,
                            alignItems: "center",
                            padding: "10px 12px",
                            border: `1px solid ${C.border}`,
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <div style={{ fontFamily: "monospace", fontSize: 10, color: C.gold, letterSpacing: "0.14em" }}>
                            P{entry.position}
                          </div>
                          <div>
                            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtS, letterSpacing: "0.08em", marginBottom: 3 }}>
                              {entry.name} · {entry.source.toUpperCase()} · {entry.planetaryBody}
                            </div>
                            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.txt }}>
                              {entry.facetFull} facet · {entry.center}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" as const }}>
                            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.12em" }}>WEIGHTED</div>
                            <div style={{ fontFamily: "monospace", fontSize: 12, color: C.teal }}>{entry.weightedFrequency.toFixed(1)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link href={`/codex/${selectedCodon}`}>
                    <span style={{ display: "inline-block", padding: "10px 18px", border: `1px solid ${C.goldDim}`, color: C.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.16em", cursor: "pointer" }}>
                      OPEN CODEX ENTRY
                    </span>
                  </Link>
                </>
              ) : (
                <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, lineHeight: 1.8 }}>
                  Select a codon from the mandala to inspect its place in your natal blueprint.
                </div>
              )}
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22, marginTop: 22, alignItems: "start" }}>
            <Panel eyebrow="PRIME STACK" title="Nine Positions of the Static Signature">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {primeStack.map((entry) => (
                  <button
                    key={`${entry.position}-${entry.codon}`}
                    type="button"
                    onClick={() => setSelectedCodon(entry.codon)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "52px 1fr 90px",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 12px",
                      border: `1px solid ${selectedCodon === entry.codon ? C.goldDim : C.border}`,
                      background: selectedCodon === entry.codon ? C.goldGlow : "rgba(255,255,255,0.02)",
                      color: C.txt,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: C.gold, letterSpacing: "0.14em" }}>
                      P{entry.position}
                    </div>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtS, letterSpacing: "0.08em", marginBottom: 3 }}>
                        {entry.name} · {entry.planetaryBody}
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.txt }}>
                        {formatRc(entry.codon)} · {entry.codonName}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.08em" }}>{entry.facet}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>{entry.center}</div>
                    </div>
                  </button>
                ))}
              </div>

              {(dominantCodons.length > 0 || supportingCodons.length > 0) && (
                <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.16em", marginBottom: 8 }}>
                      DOMINANT CODONS
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {dominantCodons.map((entry) => (
                        <button
                          key={`dominant-${entry.position}-${entry.codon}`}
                          type="button"
                          onClick={() => setSelectedCodon(entry.codon)}
                          style={{
                            padding: "8px 10px",
                            border: `1px solid ${C.goldDim}`,
                            background: C.goldGlow,
                            color: C.goldL,
                            fontFamily: "monospace",
                            fontSize: 9,
                            letterSpacing: "0.12em",
                            cursor: "pointer",
                          }}
                        >
                          {formatRc(entry.codon)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.16em", marginBottom: 8 }}>
                      SUPPORTING CODONS
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {supportingCodons.map((entry) => (
                        <button
                          key={`supporting-${entry.position}-${entry.codon}`}
                          type="button"
                          onClick={() => setSelectedCodon(entry.codon)}
                          style={{
                            padding: "8px 10px",
                            border: `1px solid ${C.border}`,
                            background: "rgba(255,255,255,0.02)",
                            color: C.txtS,
                            fontFamily: "monospace",
                            fontSize: 9,
                            letterSpacing: "0.12em",
                            cursor: "pointer",
                          }}
                        >
                          {formatRc(entry.codon)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Panel>

            <Panel eyebrow="9 CENTERS" title="Resonance Architecture">
              <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) 1fr", gap: 18, alignItems: "center" }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <CenterConstellation centers={centers} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                  {centers.map((center) => (
                    <div
                      key={center.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto",
                        gap: 12,
                        alignItems: "center",
                        padding: "10px 12px",
                        border: `1px solid ${center.defined ? C.goldDim : C.border}`,
                        background: center.defined ? C.goldGlow : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: center.defined ? C.gold : C.txtS, letterSpacing: "0.1em", marginBottom: 3 }}>
                          {center.centerName.toUpperCase()}
                        </div>
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>
                          {center.codon256Id || "No codon mapped"}
                        </div>
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: C.teal }}>
                        {center.frequency.toFixed(1)}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: center.defined ? C.gold : C.txtD, letterSpacing: "0.12em" }}>
                        {center.defined ? "DEFINED" : "OPEN"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {Array.isArray(profile.circuitLinks) && profile.circuitLinks.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.16em", marginBottom: 8 }}>
                    CIRCUIT LINKS
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(profile.circuitLinks as unknown[]).map((link, index) => (
                      <div
                        key={`${String(link)}-${index}`}
                        style={{
                          padding: "8px 10px",
                          border: `1px solid ${C.border}`,
                          background: "rgba(255,255,255,0.02)",
                          color: C.txtS,
                          fontFamily: "monospace",
                          fontSize: 9,
                          letterSpacing: "0.1em",
                        }}
                      >
                        {String(link).replace("-", " ⇄ P")}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22, marginTop: 22, alignItems: "start" }}>
            <Panel eyebrow="MICRO-CORRECTIONS" title="Blueprint Calibration Prompts">
              {corrections.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {corrections.map((correction, index) => (
                    <div
                      key={`${correction.type}-${index}`}
                      style={{
                        padding: "14px 14px 12px",
                        border: `1px solid ${C.border}`,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.gold, letterSpacing: "0.14em", marginBottom: 6 }}>
                        {correction.type.toUpperCase()}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, lineHeight: 1.8, marginBottom: 8 }}>
                        {correction.instruction}
                      </div>
                      {correction.falsifier && (
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, lineHeight: 1.7, marginBottom: 6 }}>
                          Falsifier: {correction.falsifier}
                        </div>
                      )}
                      {correction.potentialOutcome && (
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txt }}>
                          {correction.potentialOutcome}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, lineHeight: 1.8 }}>
                  No natal micro-corrections were stored for this profile.
                </div>
              )}
            </Panel>

            <Panel eyebrow="ORIEL TRANSMISSION" title="Stored Static Signature Transmission">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: C.txtS }}>
                <MapPin size={14} />
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.16em" }}>
                  {birthCity}, {birthCountry} · {birthDate} · {birthTime}
                </div>
              </div>
              <div
                style={{
                  padding: "16px 18px",
                  border: `1px solid ${C.border}`,
                  background: "rgba(255,255,255,0.015)",
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: C.txtS,
                  lineHeight: 1.95,
                  whiteSpace: "pre-wrap",
                }}
              >
                {diagnosticTransmission}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Layout>
  );
}
