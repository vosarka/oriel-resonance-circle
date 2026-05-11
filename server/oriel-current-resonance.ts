import {
  getCarrierlockHistory,
  getUserReadingHistory,
  getUserStaticProfile,
} from "./db";

export type CurrentResonanceStatus =
  | "missing_static_profile"
  | "missing_carrierlock"
  | "missing_dynamic_reading"
  | "ready";

type JsonRecord = Record<string, unknown>;

export interface CurrentResonanceStaticAnchor {
  vrcType: string | null;
  vrcAuthority: string | null;
  fractalRole: string | null;
  birthLocation: string | null;
  primeStackCount: number;
}

export interface CurrentResonanceCarrierlock {
  id: number | null;
  coherenceScore: number | null;
  mentalNoise: number | null;
  bodyTension: number | null;
  emotionalTurbulence: number | null;
  breathCompletion: boolean | null;
  createdAt: string | null;
}

export interface CurrentResonanceActivePattern {
  key: string;
  codon256Id: string;
  codon: number | null;
  facet: string | null;
  sli: number;
  interpretation: "highest_shadow_loudness";
}

export interface CurrentResonancePrimeStackPosition {
  position: number | null;
  codon: number | null;
  facet: string | null;
  codon256Id: string | null;
  codonName: string | null;
  center: string | null;
  label: string | null;
}

export interface CurrentResonanceResult {
  status: CurrentResonanceStatus;
  staticAnchor: CurrentResonanceStaticAnchor | null;
  carrierlock: CurrentResonanceCarrierlock | null;
  activePattern: CurrentResonanceActivePattern | null;
  primeStackPosition: CurrentResonancePrimeStackPosition | null;
  microCorrection: string | null;
  falsifier: string | null;
  nextAction: string;
  evidence: string[];
}

export interface CurrentResonanceInput {
  staticProfile: unknown | null | undefined;
  carrierlock: unknown | null | undefined;
  dynamicReading: unknown | null | undefined;
}

interface SliCandidate {
  key: string;
  codon256Id: string;
  codon: number | null;
  facet: string | null;
  sli: number;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }
  return null;
}

function normalizeCodon(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value.replace(/^RC/i, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePrimeStack(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonRecord => Boolean(asRecord(entry)))
    : [];
}

function buildStaticAnchor(profile: JsonRecord): CurrentResonanceStaticAnchor {
  const city = asString(profile.birthCity);
  const country = asString(profile.birthCountry);
  const birthLocation = [city, country].filter(Boolean).join(", ") || null;

  return {
    vrcType: asString(profile.vrcType),
    vrcAuthority: asString(profile.vrcAuthority ?? profile.authorityNode),
    fractalRole: asString(profile.fractalRole),
    birthLocation,
    primeStackCount: normalizePrimeStack(profile.primeStack).length,
  };
}

function buildCarrierlock(
  carrierlock: JsonRecord
): CurrentResonanceCarrierlock {
  return {
    id: asNumber(carrierlock.id),
    coherenceScore: asNumber(carrierlock.coherenceScore),
    mentalNoise: asNumber(carrierlock.mentalNoise),
    bodyTension: asNumber(carrierlock.bodyTension),
    emotionalTurbulence: asNumber(carrierlock.emotionalTurbulence),
    breathCompletion: asBoolean(carrierlock.breathCompletion),
    createdAt: toIsoString(carrierlock.createdAt),
  };
}

function parseSliKey(key: string): {
  codon256Id: string;
  codon: number | null;
  facet: string | null;
} {
  const codon256Id = key.includes(":") ? (key.split(":").at(-1) ?? key) : key;
  const match = codon256Id.match(/^(?:RC)?(\d+)(?:-([A-D]))?$/i);

  return {
    codon256Id,
    codon: match ? Number.parseInt(match[1], 10) : null,
    facet: match?.[2]?.toUpperCase() ?? null,
  };
}

function highestFiniteSli(value: unknown): SliCandidate | null {
  const scores = asRecord(value);
  if (!scores) return null;

  let selected: SliCandidate | null = null;
  for (const [key, rawScore] of Object.entries(scores)) {
    if (typeof rawScore !== "number" || !Number.isFinite(rawScore)) continue;
    const parsed = parseSliKey(key);
    const candidate: SliCandidate = {
      key,
      codon256Id: parsed.codon256Id,
      codon: parsed.codon,
      facet: parsed.facet,
      sli: rawScore,
    };
    if (!selected || candidate.sli > selected.sli) selected = candidate;
  }

  return selected;
}

function findPrimeStackPosition(
  primeStack: JsonRecord[],
  active: SliCandidate
): CurrentResonancePrimeStackPosition | null {
  const match = primeStack.find(entry => {
    const codon256Id = asString(entry.codon256Id);
    const codon = normalizeCodon(
      entry.codon ?? entry.codonId ?? entry.rootCodonId
    );
    const facet = asString(entry.facet);

    return (
      (codon256Id && codon256Id === active.codon256Id) ||
      (codon !== null &&
        active.codon !== null &&
        codon === active.codon &&
        (!active.facet || !facet || facet === active.facet))
    );
  });

  if (!match) return null;

  return {
    position: asNumber(match.position),
    codon: normalizeCodon(match.codon ?? match.codonId ?? match.rootCodonId),
    facet: asString(match.facet),
    codon256Id: asString(match.codon256Id),
    codonName: asString(match.codonName),
    center: asString(match.center),
    label: asString(match.name),
  };
}

export function buildCurrentResonance(
  input: CurrentResonanceInput
): CurrentResonanceResult {
  const profile = asRecord(input.staticProfile);
  if (!profile) {
    return {
      status: "missing_static_profile",
      staticAnchor: null,
      carrierlock: null,
      activePattern: null,
      primeStackPosition: null,
      microCorrection: null,
      falsifier: null,
      nextAction: "Complete your natal profile before resonance can be read.",
      evidence: ["No static profile available."],
    };
  }

  const staticAnchor = buildStaticAnchor(profile);
  const evidence = [
    staticAnchor.birthLocation
      ? `Static profile loaded from ${staticAnchor.birthLocation}.`
      : "Static profile loaded.",
  ];

  const carrierlockRecord = asRecord(input.carrierlock);
  if (!carrierlockRecord) {
    return {
      status: "missing_carrierlock",
      staticAnchor,
      carrierlock: null,
      activePattern: null,
      primeStackPosition: null,
      microCorrection: null,
      falsifier: null,
      nextAction: "Run a Carrierlock diagnostic to capture current state.",
      evidence: [...evidence, "No Carrierlock state available."],
    };
  }

  const carrierlock = buildCarrierlock(carrierlockRecord);
  evidence.push(
    carrierlock.coherenceScore !== null
      ? `Carrierlock coherence ${carrierlock.coherenceScore}/100.`
      : "Carrierlock state loaded without a finite coherence score."
  );

  const reading = asRecord(input.dynamicReading);
  const readingCarrierlockId = reading ? asNumber(reading.carrierlockId) : null;
  if (
    reading &&
    carrierlock.id !== null &&
    readingCarrierlockId !== carrierlock.id
  ) {
    return {
      status: "missing_dynamic_reading",
      staticAnchor,
      carrierlock,
      activePattern: null,
      primeStackPosition: null,
      microCorrection: null,
      falsifier: null,
      nextAction:
        "Generate a dynamic reading from the latest Carrierlock state.",
      evidence: [
        ...evidence,
        readingCarrierlockId === null
          ? "Latest dynamic reading has no Carrierlock link."
          : `Latest dynamic reading belongs to Carrierlock ${readingCarrierlockId}, not latest Carrierlock ${carrierlock.id}.`,
      ],
    };
  }

  const active = reading ? highestFiniteSli(reading.sliScores) : null;
  if (!reading || !active) {
    return {
      status: "missing_dynamic_reading",
      staticAnchor,
      carrierlock,
      activePattern: null,
      primeStackPosition: null,
      microCorrection: null,
      falsifier: null,
      nextAction:
        "Generate a dynamic reading from the latest Carrierlock state.",
      evidence: [
        ...evidence,
        reading
          ? "Dynamic reading exists but has no finite stored SLI scores."
          : "No dynamic reading available.",
      ],
    };
  }

  const primeStackPosition = findPrimeStackPosition(
    normalizePrimeStack(profile.primeStack),
    active
  );
  evidence.push(
    `Active pattern selected from highest finite stored SLI score: ${active.sli}.`
  );

  return {
    status: "ready",
    staticAnchor,
    carrierlock,
    activePattern: {
      ...active,
      interpretation: "highest_shadow_loudness",
    },
    primeStackPosition,
    microCorrection: asString(reading.microCorrection),
    falsifier: asString(reading.falsifier),
    nextAction:
      "Apply the micro-correction, then run a fresh Carrierlock diagnostic.",
    evidence,
  };
}

export async function getCurrentResonanceForUser(
  userId: number
): Promise<CurrentResonanceResult> {
  const [staticProfile, carrierlockHistory, readingHistory] = await Promise.all(
    [
      getUserStaticProfile(userId),
      getCarrierlockHistory(userId, 1),
      getUserReadingHistory(userId),
    ]
  );

  return buildCurrentResonance({
    staticProfile,
    carrierlock: carrierlockHistory[0] ?? null,
    dynamicReading: readingHistory[0] ?? null,
  });
}
