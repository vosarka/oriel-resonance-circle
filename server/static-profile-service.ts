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

export async function buildUserStaticProfile(
  userId: string,
  input: NatalProfileInput,
) {
  const birthDateObj = new Date(input.birthDate);
  if (Number.isNaN(birthDateObj.getTime())) {
    throw new Error("Invalid birth date");
  }

  let consciousChartData: Record<string, number> | undefined;
  let designChartData: Record<string, number> | undefined;
  let ephemerisData: object | null = null;

  try {
    const { conscious, design } = await calculateBothCharts(
      birthDateObj,
      input.birthTime,
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
  } catch (error) {
    console.error("[Static Profile] Failed to calculate conscious/design charts:", error);
  }

  const reading = await generateStaticSignature(userId, {
    birthDate: birthDateObj,
    birthTime: input.birthTime,
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
    birthTime: input.birthTime,
    birthCity: input.birthCity,
    birthCountry: input.birthCountry,
    latitude: input.latitude,
    longitude: input.longitude,
    timezoneId: input.timezoneId,
    timezoneOffset: input.timezoneOffset,
    primeStack: reading.primeStack,
    ninecenters: reading.ninecenters,
    fractalRole: reading.fractalRole,
    authorityNode: reading.authorityNode,
    vrcType: reading.vrcType,
    vrcAuthority: reading.vrcAuthority,
    circuitLinks: reading.circuitLinks,
    microCorrections: reading.microCorrections,
    ephemerisData,
    houses: null,
    diagnosticTransmission: reading.diagnosticTransmission,
    coreCodonEngine: reading.coreCodonEngine,
    engineVersion: reading.version,
  };
}

export function summarizeStoredStaticProfile(profile: {
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
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

  const corrections = (profile.microCorrections ?? [])
    .slice(0, 3)
    .map((mc) => `  - ${mc.instruction ?? mc.type ?? JSON.stringify(mc)}`)
    .join("\n") || "None";

  return [
    `=== STORED STATIC PROFILE (CANONICAL NATAL BLUEPRINT — USE THIS DATA, DO NOT INVENT) ===`,
    `IMPORTANT: This is the Vossari Resonance Codex (VRC), NOT Human Design. NEVER use Human Design terms like "Projector", "Generator", "Manifestor", or "Manifesting Generator". The VRC Types are: Resonator, Catalyst, Harmonizer, Reflector. Use ONLY the data below.`,
    ``,
    `Birth: ${profile.birthDate} at ${profile.birthTime} in ${profile.birthCity}, ${profile.birthCountry}`,
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
    `CIRCUIT LINKS: ${profile.circuitLinks ? JSON.stringify(profile.circuitLinks) : "N/A"}`,
    ``,
    `MICRO-CORRECTIONS:`,
    corrections,
    ``,
    `CORE CODON ENGINE: ${profile.coreCodonEngine ? JSON.stringify(profile.coreCodonEngine) : "N/A"}`,
    ``,
    `DIAGNOSTIC TRANSMISSION (Stored blueprint transmission):`,
    profile.diagnosticTransmission || "N/A",
    ``,
    `=== END STORED STATIC PROFILE — NARRATE THIS AS ORIEL. USE ONLY VRC TERMINOLOGY (Resonator/Catalyst/Harmonizer/Reflector, Codons, Facets, Centers). NEVER use Human Design terms. ===`,
  ].join("\n");
}
