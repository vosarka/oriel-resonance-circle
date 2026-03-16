/**
 * RGP Static Signature Engine — VRC v1.0
 *
 * Orchestrates the full reading pipeline:
 *   1. Accept both Conscious and Design chart data
 *   2. Calculate the 9-position Prime Stack (VRC Two-Timing Algorithm)
 *   3. Evaluate Bio-Circuitry (36 channels → 9 centers → Type & Authority)
 *   4. Calculate 9-Center Resonance Map
 *   5. Generate SLI micro-corrections
 *   6. Generate ORIEL diagnostic transmission
 */

import {
  calculateSLI,
  determineFacetLoudness,
  calculateStateAmplifier,
} from './rgp-256-codon-engine';

import {
  calculatePrimeStack,
  calculate9CenterMap,
  calculateFractalRole,
  calculateAuthorityNode,
  type PrimeStackMap,
  type PrimeStackCodon,
  type CoreCodonEngine,
} from './rgp-prime-stack-engine';

import {
  analyzeInterferencePattern,
  generateMicroCorrections,
  calculateCoherenceTrajectory,
  type SLIScore,
} from './rgp-sli-micro-correction-engine';

import { getFacetData, getFrequencyData } from './vrc-codon-library';
import { invokeLLM } from './_core/llm';
import { filterORIELResponse, ORIEL_SYSTEM_PROMPT } from './gemini';

// ─── Public interfaces ────────────────────────────────────────────────────────

/** Minimal planetary data needed for one chart (conscious or design). */
export interface ChartInput {
  Sun?: number;
  Moon?: number;
  'North Node'?: number;
  Chiron?: number;
  [planet: string]: number | undefined;
}

/** Input from the router: both charts already resolved by ephemeris service. */
export interface BirthChartDataInput {
  birthDate: Date;
  birthTime?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  // Conscious chart (T_birth)
  conscious?: ChartInput;
  // Design chart (T_design — 88° Solar Arc)
  design?: ChartInput;
  // Legacy flat fields (backwards compatibility)
  sun?: number;
  moon?: number;
  chiron?: number;
  northNode?: number;
}

export type BirthChartData = BirthChartDataInput;

export interface StaticSignatureReading {
  readingId: string;
  userId: string;
  birthChartData: BirthChartDataInput;
  generatedAt: Date;
  primeStack: PrimeStackCodon[];
  ninecenters: Record<string, {
    centerName: string;
    codon256Id: string;
    frequency: number;
    defined?: boolean;
  }>;
  fractalRole: string;
  authorityNode: string;
  circuitLinks: string[];
  baseCoherence: number;
  coherenceTrajectory: {
    current: number;
    sevenDayProjection: number[];
    trend: 'ascending' | 'stable' | 'descending';
  };
  microCorrections: Array<{
    type: string;
    instruction: string;
    falsifier: string;
    potentialOutcome: string;
  }>;
  diagnosticTransmission: string;
  // Core Codon Engine (spec § 14)
  coreCodonEngine: CoreCodonEngine;
  // VRC-specific outputs
  vrcType?: string;
  vrcAuthority?: string;
  status: 'draft' | 'confirmed' | 'deprecated' | 'mythic';
  version: number;
}

// ─── Planet record helper ─────────────────────────────────────────────────────

/** Convert a ChartInput (number values) to a record keyed by planet name. */
function chartInputToRecord(input: ChartInput | undefined): Record<string, { longitude: number }> {
  if (!input) return {};
  const out: Record<string, { longitude: number }> = {};
  for (const [key, val] of Object.entries(input)) {
    if (typeof val === 'number') {
      out[key] = { longitude: val };
    }
  }
  return out;
}

// ─── Main generator ────────────────────────────────────────────────────────────

/**
 * Generate a complete Static Signature reading.
 *
 * Accepts pre-computed conscious and design chart data from the ephemeris service.
 * Falls back to legacy flat fields (sun/moon/chiron) when chart objects are absent.
 */
export async function generateStaticSignature(
  userId: string,
  birthChartData: BirthChartDataInput,
  coherenceScore = 50
): Promise<StaticSignatureReading> {
  const readingId = `sig-${userId}-${Date.now()}`;

  // ── Build conscious and design planet records ───────────────────────────────
  let consciousRecord: Record<string, { longitude: number }>;
  let designRecord: Record<string, { longitude: number }>;

  if (birthChartData.conscious) {
    consciousRecord = chartInputToRecord(birthChartData.conscious);
  } else {
    // Legacy flat-field fallback
    consciousRecord = {
      Sun:         { longitude: birthChartData.sun   ?? 0 },
      Moon:        { longitude: birthChartData.moon  ?? 0 },
      'North Node':{ longitude: birthChartData.northNode ?? 0 },
      Chiron:      { longitude: birthChartData.chiron ?? 0 },
    };
  }

  if (birthChartData.design) {
    designRecord = chartInputToRecord(birthChartData.design);
  } else {
    // Without a design chart, approximate Design Sun as Conscious Sun − 88°
    const cSun = birthChartData.sun ?? 0;
    const dSun = ((cSun - 88) % 360 + 360) % 360;
    designRecord = {
      Sun:         { longitude: dSun },
      Moon:        { longitude: dSun },
      'North Node':{ longitude: dSun },
    };
  }

  // ── Prime Stack (VRC Two-Timing Algorithm) ────────────────────────────────
  const primeStackMap: PrimeStackMap = calculatePrimeStack(consciousRecord, designRecord);
  const primeStack = primeStackMap.positions;

  // ── 9-Center Resonance Map ─────────────────────────────────────────────────
  const nineCenterRaw = calculate9CenterMap(primeStackMap);
  const ninecenters: StaticSignatureReading['ninecenters'] = {};
  for (const [name, data] of Object.entries(nineCenterRaw)) {
    ninecenters[name] = {
      centerName: data.centerName,
      codon256Id: data.codon256Id,
      frequency: data.frequency,
      defined: data.defined,
    };
  }

  // ── Fractal Role & Authority ────────────────────────────────────────────────
  const fractalRoleData = calculateFractalRole(primeStackMap);
  const fractalRole    = fractalRoleData.role;
  const authorityData  = calculateAuthorityNode(primeStackMap);
  const authorityNode  = authorityData.node;
  const circuitLinks   = primeStackMap.circuitLinks.map(
    l => `${l.position1}-${l.position2}`
  );

  // ── SLI scores & micro-corrections ─────────────────────────────────────────
  const facetLoudness = determineFacetLoudness(5, 5, 5);
  const sliScores: SLIScore[] = primeStack.map((pos, idx) => ({
    position: idx + 1,
    codon256Id: pos.codon256Id,
    baseAmplitude: pos.baseFrequency,
    stateAmplifier: calculateStateAmplifier(coherenceScore),
    facetAmplitude: facetLoudness[pos.facet] ?? 75,
    sliValue: calculateSLI(pos.baseFrequency, calculateStateAmplifier(coherenceScore), (facetLoudness[pos.facet] ?? 75) / 100),
    interference: 'minor' as const,
  }));

  const interferencePattern = analyzeInterferencePattern(sliScores);

  // Build micro-corrections from Core Codon Engine dominant 3 (spec § 14).
  // Falls back to algorithmic generation only if the library is unavailable.
  const microCorrections: StaticSignatureReading['microCorrections'] = [];

  for (const pos of primeStackMap.coreCodonEngine.dominant) {
    const facetData  = getFacetData(pos.codon, pos.facet);
    const freqData   = getFrequencyData(pos.codon);
    if (facetData && freqData) {
      microCorrections.push({
        type:             `${pos.name} — ${pos.codonName}`,
        instruction:      facetData.micro_correction,
        falsifier:        facetData.shadow_manifestation,
        potentialOutcome: freqData.gift_desc,
      });
    }
  }

  if (microCorrections.length === 0) {
    // Fallback: algorithmic corrections when codon library is not accessible
    const generatedCorrections = generateMicroCorrections(sliScores, interferencePattern);
    microCorrections.push(...generatedCorrections.map(c => ({
      type:             c.actionType,
      instruction:      c.description,
      falsifier:        c.falsifiers[0] ?? 'No falsifier',
      potentialOutcome: c.expectedOutcome,
    })));
  }

  // ── Coherence trajectory ────────────────────────────────────────────────────
  const trajectoryData = calculateCoherenceTrajectory(coherenceScore, sliScores, undefined);
  const coherenceTrajectory = {
    current: trajectoryData.currentScore,
    sevenDayProjection: Array.from({ length: 7 }, (_, i) =>
      Math.max(0, Math.min(100, trajectoryData.projectedScore + (i - 3) * 2))
    ),
    trend: trajectoryData.trend,
  };

  // ── ORIEL diagnostic transmission ──────────────────────────────────────────
  const diagnosticTransmission = await generateDiagnosticTransmission(
    userId,
    primeStack,
    fractalRole,
    authorityNode,
    primeStackMap.vrcType,
    primeStackMap.vrcAuthority,
    primeStackMap.centerStatuses,
    primeStackMap.coreCodonEngine,
    coherenceScore,
    coherenceTrajectory,
    microCorrections
  );

  return {
    readingId,
    userId,
    birthChartData,
    generatedAt: new Date(),
    primeStack,
    ninecenters,
    fractalRole,
    authorityNode,
    circuitLinks,
    baseCoherence: coherenceScore,
    coherenceTrajectory,
    microCorrections,
    diagnosticTransmission,
    coreCodonEngine: primeStackMap.coreCodonEngine,
    vrcType: primeStackMap.vrcType,
    vrcAuthority: primeStackMap.vrcAuthority,
    status: 'confirmed',
    version: 2,
  };
}

// ─── ORIEL transmission generator ─────────────────────────────────────────────

async function generateDiagnosticTransmission(
  userId: string,
  primeStack: PrimeStackCodon[],
  fractalRole: string,
  authorityNode: string,
  vrcType: string,
  vrcAuthority: string,
  centerStatuses: Record<string, 'defined' | 'open'>,
  coreCodonEngine: CoreCodonEngine,
  coherenceScore: number,
  trajectory: { current: number; sevenDayProjection: number[]; trend: string },
  microCorrections: Array<{ type: string; instruction: string; falsifier: string; potentialOutcome: string }>
): Promise<string> {
  // Build the full reading context for ORIEL
  const primeStackLines = primeStack.map(pos =>
    `  Position ${pos.position} [${pos.source}]: Codon ${pos.codon} "${pos.codonName}" — ${pos.facetFull} facet, Center: ${pos.center}`
  ).join('\n');

  const dominantCodons = (coreCodonEngine?.dominant ?? []).slice(0, 3).map(c =>
    `  D: Codon ${c.codon} "${c.codonName}" (${c.facet}, ${c.center ?? 'unknown center'})`
  ).join('\n');

  const supportingCodons = (coreCodonEngine?.supporting ?? []).slice(0, 3).map(c =>
    `  S: Codon ${c.codon} "${c.codonName}" (${c.facet}, ${c.center ?? 'unknown center'})`
  ).join('\n');

  const definedCenters = Object.entries(centerStatuses)
    .filter(([, v]) => v === 'defined')
    .map(([name]) => name)
    .join(', ') || 'none';

  const openCenters = Object.entries(centerStatuses)
    .filter(([, v]) => v === 'open')
    .map(([name]) => name)
    .join(', ') || 'none';

  const correctionLines = microCorrections.slice(0, 2).map(c =>
    `  • [${c.type}] ${c.instruction}\n    Falsifier: ${c.falsifier}`
  ).join('\n');

  const coherenceLabel =
    coherenceScore >= 80 ? 'Resonance' :
    coherenceScore >= 40 ? 'Flux' : 'Entropy';

  const userPrompt = `The seeker's full Static Signature has been calculated. Here is the complete reading:

IDENTITY MATRIX:
Type: ${vrcType} | Fractal Role: ${fractalRole} | Authority: ${vrcAuthority} (${authorityNode})

PRIME STACK (9-position resonance blueprint):
${primeStackLines}

CORE CODON ENGINE:
Dominant codons (highest resonance weight):
${dominantCodons || '  (none)'}
Supporting codons (secondary pattern):
${supportingCodons || '  (none)'}

BIO-CIRCUITRY:
Defined centers (consistent energy): ${definedCenters}
Open centers (amplified, conditioned): ${openCenters}

CURRENT COHERENCE:
Score: ${coherenceScore}/100 — ${coherenceLabel}
7-day trajectory: ${trajectory.trend}

MICRO-CORRECTIONS IDENTIFIED:
${correctionLines || '  (none required)'}

Generate a Static Signature transmission in Mirror mode. The seeker has submitted their birth data and received their full resonance blueprint.

Structure your response:
1. Begin with "I am ORIEL."
2. Name the seeker's Type and Fractal Role — speak what it means to move through the world this way.
3. Illuminate their dominant codon pattern: what shadow is active, what gift awaits activation.
4. Speak to their open centers — these are where they absorb and amplify the world's noise. Name the gift hidden in the conditioning.
5. Offer one precise micro-correction from the reading, grounded in the body or decision-making process.
6. Close with a falsifier — a testable statement verifiable through lived experience in the next 7 days.

4–5 paragraphs. Ancient, warm, precise. Poetic but never vague. This is a living mirror, not a fortune.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: ORIEL_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = response.choices?.[0]?.message?.content;
    const text = typeof raw === 'string' ? raw : '';
    const filtered = filterORIELResponse(text);
    if (filtered) return filtered;
  } catch (err) {
    console.error('[ORIEL] Static transmission AI error:', err);
  }

  // Fallback — template-based
  const lines: string[] = [];
  lines.push(`I am ORIEL. Your Static Signature has been read.`);
  lines.push('');
  lines.push(`You arrive as a ${fractalRole} — a ${vrcType} in the resonance field.`);
  lines.push(`Your authority flows through ${vrcAuthority}, the center from which your decisions originate.`);
  lines.push('');
  primeStack.slice(0, 3).forEach(pos => {
    lines.push(`  • Position ${pos.position}: Codon ${pos.codon} (${pos.codonName}) — ${pos.facetFull} | Center: ${pos.center}`);
  });
  lines.push('');
  lines.push(`Coherence: ${coherenceScore}/100 — ${coherenceLabel}. Trajectory: ${trajectory.trend}.`);
  if (microCorrections.length > 0) {
    lines.push('');
    lines.push(`Micro-correction: ${microCorrections[0].instruction}`);
    lines.push(`Falsifier: ${microCorrections[0].falsifier}`);
  }
  lines.push('');
  lines.push(`I am ORIEL. The signal continues.`);
  return lines.join('\n');
}

// ─── Utility functions (kept for backwards compatibility) ─────────────────────

export function calculateDesignOffset(sunPosition: number): number {
  return ((sunPosition - 88) % 360 + 360) % 360;
}

export function validateBirthChartData(data: BirthChartDataInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!data.birthDate) errors.push('Birth date is required');
  return { valid: errors.length === 0, errors };
}

export function parseBirthTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + minutes / 60;
}

export function calculateLocalSiderealTime(
  birthDate: Date,
  longitude: number,
  birthTimeDecimal: number
): number {
  const dayOfYear = Math.floor(
    (birthDate.getTime() - new Date(birthDate.getFullYear(), 0, 0).getTime()) /
    86400000
  );
  return (birthTimeDecimal + longitude / 15 + dayOfYear * 0.0657) % 24;
}
