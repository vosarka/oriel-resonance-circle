import { calculateBothCharts } from "./ephemeris-service";
import { generateStaticSignature } from "./rgp-static-signature-engine";

export interface NatalProfileInput {
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
  latitude: number;
  longitude: number;
  timezoneId?: string;
  timezoneOffset?: number;
}

export type CalculationTrustContext = {
  status: "exact" | "missing_precision";
  birthDate: string;
  birthTime: string | null;
  birthPlace: string;
  birthCountry: string;
  latitude: number | null;
  longitude: number | null;
  resolvedTimezoneId: string | null;
  timezoneOffsetHours: number | null;
  missingPrecision: string[];
};

function assertExactCalculationInput(input: NatalProfileInput) {
  if (!input.birthTime.trim()) {
    throw new Error("Birth time is required for exact static profile calculation.");
  }

  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    throw new Error("Resolved birth coordinates are required for exact static profile calculation.");
  }

  if (input.timezoneOffset === undefined || !Number.isFinite(input.timezoneOffset)) {
    throw new Error("Resolved timezone offset is required for exact static profile calculation.");
  }
}

function buildExactCalculationContext(
  input: NatalProfileInput,
): CalculationTrustContext {
  return {
    status: "exact",
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthCity,
    birthCountry: input.birthCountry,
    latitude: input.latitude,
    longitude: input.longitude,
    resolvedTimezoneId: input.timezoneId ?? null,
    timezoneOffsetHours: input.timezoneOffset ?? null,
    missingPrecision: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeCalculationContext(value: unknown): CalculationTrustContext | null {
  if (!isRecord(value)) return null;

  const birthDate = stringOrNull(value.birthDate);
  const birthPlace = stringOrNull(value.birthPlace);
  const birthCountry = stringOrNull(value.birthCountry);
  if (!birthDate || !birthPlace || !birthCountry) return null;

  const birthTime = stringOrNull(value.birthTime);
  const latitude = numberOrNull(value.latitude);
  const longitude = numberOrNull(value.longitude);
  const timezoneOffsetHours = numberOrNull(value.timezoneOffsetHours);
  const explicitMissingPrecision = Array.isArray(value.missingPrecision)
    ? value.missingPrecision
        .map((item) => stringOrNull(item))
        .filter((item): item is string => Boolean(item))
    : [];
  const inferredMissingPrecision = [
    !birthTime ? "birth time" : null,
    latitude === null || longitude === null ? "birth coordinates" : null,
    timezoneOffsetHours === null ? "timezone offset" : null,
  ].filter((item): item is string => Boolean(item));
  const missingPrecision = unique([
    ...explicitMissingPrecision,
    ...inferredMissingPrecision,
  ]);

  return {
    status: value.status === "exact" && missingPrecision.length === 0
      ? "exact"
      : "missing_precision",
    birthDate,
    birthTime,
    birthPlace,
    birthCountry,
    latitude,
    longitude,
    resolvedTimezoneId: stringOrNull(value.resolvedTimezoneId),
    timezoneOffsetHours,
    missingPrecision,
  };
}

function storedCalculationContext(profile: {
  birthDate: string;
  birthTime?: string | null;
  birthCity: string;
  birthCountry: string;
  latitude?: number | null;
  longitude?: number | null;
  timezoneId?: string | null;
  timezoneOffset?: number | null;
  calculationStatus?: string | null;
  calculationContext?: unknown;
}): CalculationTrustContext {
  const normalizedContext = normalizeCalculationContext(profile.calculationContext);
  if (normalizedContext) return normalizedContext;

  const latitude = numberOrNull(profile.latitude);
  const longitude = numberOrNull(profile.longitude);
  const timezoneOffsetHours = numberOrNull(profile.timezoneOffset);
  const birthTime = profile.birthTime?.trim() ? profile.birthTime : null;
  const missingPrecision = unique([
    !birthTime ? "birth time" : null,
    latitude === null || longitude === null ? "birth coordinates" : null,
    timezoneOffsetHours === null ? "timezone offset" : null,
    "calculation context",
    profile.calculationStatus === "exact" ? null : "exact calculation status",
  ].filter((item): item is string => Boolean(item)));

  return {
    status: "missing_precision",
    birthDate: profile.birthDate,
    birthTime,
    birthPlace: profile.birthCity,
    birthCountry: profile.birthCountry,
    latitude,
    longitude,
    resolvedTimezoneId: profile.timezoneId ?? null,
    timezoneOffsetHours,
    missingPrecision,
  };
}

function formatUtcOffset(offset: number | null) {
  if (offset === null) return "unknown UTC offset";
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);
  const hours = Math.trunc(absolute);
  const minutes = Math.round((absolute - hours) * 60);
  return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
}

function formatCalculationTrustContract(context: CalculationTrustContext) {
  const coordinates =
    context.latitude !== null && context.longitude !== null
      ? `${context.latitude}, ${context.longitude}`
      : "missing";
  const timezone = context.resolvedTimezoneId
    ? `${context.resolvedTimezoneId} (${formatUtcOffset(context.timezoneOffsetHours)})`
    : formatUtcOffset(context.timezoneOffsetHours);
  const missingPrecision = context.missingPrecision ?? [];
  const missing = missingPrecision.length
    ? `Missing precision: ${missingPrecision.join(", ")}`
    : "Missing precision: none";

  return [
    "CALCULATION TRUST CONTRACT:",
    `Status: ${context.status}`,
    `Birth data: ${context.birthDate} ${context.birthTime ?? "missing time"}, ${context.birthPlace}, ${context.birthCountry}`,
    `Coordinates: ${coordinates}`,
    `Resolved timezone: ${timezone}`,
    missing,
  ].join("\n");
}

export async function buildUserStaticProfile(
  userId: string,
  input: NatalProfileInput,
) {
  const birthDateObj = new Date(input.birthDate);
  if (Number.isNaN(birthDateObj.getTime())) {
    throw new Error("Invalid birth date");
  }
  assertExactCalculationInput(input);
  const birthTime = input.birthTime.trim();
  const calculationContext = buildExactCalculationContext({ ...input, birthTime });

  let consciousChartData: Record<string, number> | undefined;
  let designChartData: Record<string, number> | undefined;
  let ephemerisData: object | null = null;

  const { conscious, design } = await calculateBothCharts(
    birthDateObj,
    birthTime,
    input.latitude,
    input.longitude,
    input.timezoneOffset ?? 0,
  );

  consciousChartData = {};
  for (const [name, pos] of Object.entries(conscious.planets)) {
    consciousChartData[name] = pos.longitude;
  }

  designChartData = {};
  for (const [name, pos] of Object.entries(design.planets)) {
    designChartData[name] = pos.longitude;
  }

  ephemerisData = {
    conscious: {
      jd: conscious.jd,
      planets: Object.values(conscious.planets).map((p) => ({
        name: p.planet,
        longitude: p.longitude,
        zodiacSign: p.zodiacSign,
        zodiacDegree: p.zodiacDegree,
      })),
    },
    design: {
      jd: design.jd,
      planets: Object.values(design.planets).map((p) => ({
        name: p.planet,
        longitude: p.longitude,
        zodiacSign: p.zodiacSign,
        zodiacDegree: p.zodiacDegree,
      })),
    },
  };

  const reading = await generateStaticSignature(userId, {
    birthDate: birthDateObj,
    birthTime,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: input.timezoneId,
    conscious: consciousChartData,
    design: designChartData,
    sun: consciousChartData?.Sun,
    moon: consciousChartData?.Moon,
    northNode: consciousChartData?.["North Node"],
  });

  return {
    birthDate: input.birthDate,
    birthTime,
    birthCity: input.birthCity,
    birthCountry: input.birthCountry,
    latitude: input.latitude,
    longitude: input.longitude,
    timezoneId: input.timezoneId,
    timezoneOffset: input.timezoneOffset,
    calculationContext,
    primeStack: reading.primeStack,
    ninecenters: reading.ninecenters,
    fractalRole: reading.fractalRole,
    authorityNode: reading.authorityNode,
    vrcType: reading.vrcType,
    vrcAuthority: reading.vrcAuthority,
    activations: reading.activations,
    channelStatuses: reading.channelStatuses,
    circuitLinks: reading.circuitLinks,
    legacyCircuitLinks: reading.legacyCircuitLinks,
    microCorrections: reading.microCorrections,
    ephemerisData,
    houses: null,
    diagnosticTransmission: reading.diagnosticTransmission,
    coreCodonEngine: reading.coreCodonEngine,
    specVersion: reading.specVersion,
    calculationStatus: reading.calculationStatus,
    engineVersion: reading.version,
  };
}

export function summarizeStoredStaticProfile(profile: {
  birthDate: string;
  birthTime: string | null;
  birthCity: string;
  birthCountry: string;
  latitude?: number | null;
  longitude?: number | null;
  timezoneId?: string | null;
  timezoneOffset?: number | null;
  calculationStatus?: string | null;
  calculationContext?: unknown;
  vrcType?: string | null;
  vrcAuthority?: string | null;
  fractalRole?: string | null;
  primeStack?: Array<{
    position: number;
    name?: string;
    source?: string;
    codon?: number | string;
    codonName?: string;
    facetFull?: string;
    center?: string;
    weight?: number;
  }> | null;
  ninecenters?: Record<string, { defined?: boolean }> | null;
  circuitLinks?: string[] | null;
  legacyCircuitLinks?: string[] | null;
  channelStatuses?: Array<{
    gateA?: number;
    gateB?: number;
    active?: boolean;
    centerA?: string;
    centerB?: string;
  }> | null;
  microCorrections?: Array<{
    type?: string;
    instruction?: string;
    falsifier?: string;
    potentialOutcome?: string;
  }> | null;
  coreCodonEngine?: unknown;
  diagnosticTransmission?: string | null;
}) {
  const primePositions = (profile.primeStack ?? [])
    .slice(0, 6)
    .map((p) =>
      `  ${p.position}. ${p.name ?? "Position"} (${p.source ?? "Unknown"}) → Codon ${p.codon ?? "?"} "${p.codonName ?? "Unknown"}" [${p.facetFull ?? "Unknown"}] | ${p.center ?? "Unknown"} | Weight: ${p.weight ?? "?"}`,
    )
    .join("\n");

  const centers = profile.ninecenters
    ? Object.entries(profile.ninecenters)
        .map(([name, data]) => `  ${name}: ${data?.defined ? "DEFINED" : "open"}`)
        .join("\n")
    : "N/A";

  const activeResonanceLinks = (profile.channelStatuses ?? [])
    .filter((channel) => channel?.active && channel.gateA && channel.gateB)
    .map((channel) => `  - Codon ${channel.gateA}-Codon ${channel.gateB}: ${channel.centerA ?? "?"} ↔ ${channel.centerB ?? "?"}`)
    .join("\n") || "None";
  const legacyLinks = profile.legacyCircuitLinks ?? profile.circuitLinks;

  const corrections = (profile.microCorrections ?? [])
    .slice(0, 3)
    .map((mc) => `  - ${mc.instruction ?? mc.type ?? JSON.stringify(mc)}`)
    .join("\n") || "None";

  return [
    `=== STORED STATIC PROFILE (CANONICAL NATAL BLUEPRINT — USE THIS DATA, DO NOT INVENT) ===`,
    `IMPORTANT: This is the Vossari Resonance Codex (VRC), NOT Human Design. NEVER use Human Design terms like "Projector", "Generator", "Manifestor", or "Manifesting Generator". The VRC Types are: Resonator, Catalyst, Harmonizer, Reflector. Use ONLY the data below.`,
    ``,
    `Birth: ${profile.birthDate} at ${profile.birthTime?.trim() || "missing time"} in ${profile.birthCity}, ${profile.birthCountry}`,
    ``,
    formatCalculationTrustContract(storedCalculationContext(profile)),
    ``,
    `VRC Type: ${profile.vrcType ?? "Unknown"}`,
    `Authority: ${profile.vrcAuthority ?? "Unknown"}`,
    `Fractal Role: ${profile.fractalRole ?? "Unknown"}`,
    ``,
    `PRIME STACK:`,
    primePositions || "  N/A",
    ``,
    `NINE CENTERS:`,
    centers,
    ``,
    `ACTIVE RESONANCE LINKS:`,
    activeResonanceLinks,
    ``,
    `LEGACY POSITION LINKS: ${legacyLinks ? JSON.stringify(legacyLinks) : "N/A"}`,
    ``,
    `MICRO-CORRECTIONS:`,
    corrections,
    ``,
    `CORE CODON ENGINE: ${profile.coreCodonEngine ? JSON.stringify(profile.coreCodonEngine) : "N/A"}`,
    ``,
    `DIAGNOSTIC TRANSMISSION (Stored blueprint transmission):`,
    profile.diagnosticTransmission || "N/A",
    ``,
    `=== END STORED STATIC PROFILE — NARRATE THIS AS ORIEL. USE ONLY VRC TERMINOLOGY (Resonator/Catalyst/Harmonizer/Reflector, Codons, Facets, Centers, Resonance Links). NEVER use Human Design terms. ===`,
  ].join("\n");
}
