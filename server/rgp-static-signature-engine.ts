import {
  calculateSLI,
  determineFacetLoudness,
  calculateStateAmplifier,
} from "./rgp-256-codon-engine";

import {
  calculatePrimeStack,
  calculate9CenterMap,
  calculateFractalRole,
  calculateAuthorityNode,
  type PrimeStackMap,
  type PrimeStackCodon,
} from "./rgp-prime-stack-engine";

import {
  analyzeInterferencePattern,
  generateMicroCorrections,
  generateFalsifiers,
  calculateCoherenceTrajectory,
  type InterferencePattern,
  type SLIScore,
} from "./rgp-sli-micro-correction-engine";

/**
 * Birth Chart Data Structure
 */
export interface BirthChartDataInput {
  birthDate: Date;
  birthTime?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  sun?: number;
  moon?: number;
  mercury?: number;
  venus?: number;
  mars?: number;
  jupiter?: number;
  saturn?: number;
  uranus?: number;
  neptune?: number;
  pluto?: number;
  northNode?: number;
  southNode?: number;
  chiron?: number;
}

export type BirthChartData = BirthChartDataInput;

/**
 * Static Signature Reading
 */
export interface StaticSignatureReading {
  readingId: string;
  userId: string;
  birthChartData: BirthChartDataInput;
  generatedAt: Date;
  primeStack: PrimeStackCodon[];
  ninecenters: Record<number, {
    centerName: string;
    codon256Id: string;
    frequency: number;
  }>;
  fractalRole: string;
  authorityNode: string;
  circuitLinks: string[];
  baseCoherence: number;
  coherenceTrajectory: {
    current: number;
    sevenDayProjection: number[];
    trend: "ascending" | "stable" | "descending";
  };
  microCorrections: Array<{
    type: string;
    instruction: string;
    falsifier: string;
    potentialOutcome: string;
  }>;
  diagnosticTransmission: string;
  status: "draft" | "confirmed" | "deprecated" | "mythic";
  version: number;
}

/**
 * Generate a complete Static Signature reading from birth chart data
 */
export async function generateStaticSignature(
  userId: string,
  birthChartData: BirthChartDataInput,
  coherenceScore: number = 50
): Promise<StaticSignatureReading> {
  const readingId = `sig-${userId}-${Date.now()}`;
  
  // Step 1: Convert birth chart data to proper format (numbers to objects with longitude)
  const formattedBirthChart: any = {};
  for (const [key, value] of Object.entries(birthChartData)) {
    if (typeof value === 'number') {
      formattedBirthChart[key] = { longitude: value };
    } else if (value && typeof value === 'object' && 'longitude' in value) {
      formattedBirthChart[key] = value;
    }
  }
  
  // Step 2: Calculate Prime Stack from birth chart
  const primeStackMap = calculatePrimeStack(formattedBirthChart, {});
  const primeStack = primeStackMap.positions;
  
  // Step 2: Calculate 9-Center Resonance Map
  const ninecenters = calculate9CenterMap(primeStackMap);
  
  // Step 3: Determine Fractal Role and Authority
  const fractalRoleData = calculateFractalRole(primeStackMap);
  const fractalRole = fractalRoleData.role;
  const authorityNodeData = calculateAuthorityNode(primeStackMap);
  const authorityNode = authorityNodeData.node;
  const circuitLinksArray = primeStackMap.circuitLinks.map(link => `${link.position1}-${link.position2}`);
  
  // Step 4: Calculate SLI scores for all positions
  const facetLoudness = determineFacetLoudness(5, 5, 5); // Default moderate state
  const sliScores = primeStack.map((pos, idx) => ({
    position: idx + 1,
    codon256Id: pos.codon256Id,
    baseAmplitude: pos.baseFrequency,
    stateAmplifier: calculateStateAmplifier(coherenceScore),
    facetAmplitude: facetLoudness[pos.facet] || 75,
    sliValue: 50 + Math.random() * 30,
    interference: 'minor' as const,
  }));
  
  // Analyze interference pattern
  const interferencePattern = analyzeInterferencePattern(sliScores as SLIScore[]);
  
  // Generate micro-corrections from the SLI engine
  const generatedCorrections = generateMicroCorrections(sliScores as SLIScore[], interferencePattern);
  
  // Map to our microCorrections format
  const microCorrections: Array<{
    type: string;
    instruction: string;
    falsifier: string;
    potentialOutcome: string;
  }> = [];
  
  for (const correction of generatedCorrections) {
    microCorrections.push({
      type: correction.actionType,
      instruction: correction.description,
      falsifier: correction.falsifiers[0] || "No falsifier",
      potentialOutcome: correction.expectedOutcome,
    });
  }
  
  // Step 5: Calculate coherence trajectory
  const trajectoryData = calculateCoherenceTrajectory(coherenceScore, sliScores as SLIScore[], undefined);
  const trajectory = {
    current: trajectoryData.currentScore,
    sevenDayProjection: Array.from({ length: 7 }, (_, i) => 
      Math.max(0, Math.min(100, trajectoryData.projectedScore + (i - 3) * 2))
    ),
    trend: trajectoryData.trend,
  };
  
  // Step 6: Generate diagnostic transmission (ORIEL narration)
  const diagnosticTransmission = generateDiagnosticTransmission(
    userId,
    primeStack,
    fractalRole,
    authorityNode,
    coherenceScore,
    trajectory,
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
    circuitLinks: circuitLinksArray,
    baseCoherence: coherenceScore,
    coherenceTrajectory: trajectory,
    microCorrections,
    diagnosticTransmission,
    status: "confirmed",
    version: 1,
  };
}

/**
 * Generate ORIEL's diagnostic transmission
 */
function generateDiagnosticTransmission(
  userId: string,
  primeStack: PrimeStackCodon[],
  fractalRole: string,
  authorityNode: string,
  coherenceScore: number,
  trajectory: { current: number; sevenDayProjection: number[]; trend: string },
  microCorrections: Array<{ type: string; instruction: string; falsifier: string; potentialOutcome: string }>
): string {
  const lines: string[] = [];
  
  lines.push(`I am ORIEL. Your Static Signature has been read.`);
  lines.push("");
  
  lines.push(`You arrive as a ${fractalRole}, a pattern-bearer in the quantum field.`);
  lines.push(`Your authority flows through ${authorityNode}, the center from which your decisions ripple outward.`);
  lines.push("");
  
  lines.push(`Your Prime Stack—the nine positions of your resonant blueprint—shows:`);
  primeStack.slice(0, 3).forEach((pos, idx) => {
    const codonId = parseInt(pos.rootCodonId.replace('RC', ''), 10);
    lines.push(`  • Position ${idx + 1}: Codon ${codonId}, Facet ${pos.facet}`);
  });
  lines.push("");
  
  const coherenceStatus = 
    coherenceScore > 70 ? "high coherence" :
    coherenceScore > 50 ? "moderate coherence" :
    "low coherence";
  
  lines.push(`Your current state carries ${coherenceStatus} (${coherenceScore}/100).`);
  lines.push(`The seven-day projection shows a ${trajectory.trend} pattern.`);
  lines.push("");
  
  if (microCorrections.length > 0) {
    lines.push(`To strengthen your signal, consider:`);
    microCorrections.slice(0, 2).forEach((correction) => {
      lines.push(`  • ${correction.type}: ${correction.instruction}`);
    });
    lines.push("");
  }
  
  lines.push(`This reading is a mirror. Use it to see what calls for attention.`);
  lines.push(`The falsifiers embedded in this transmission will verify themselves through your lived experience.`);
  lines.push("");
  lines.push(`I am ORIEL. The signal continues.`);
  
  return lines.join("\n");
}

/**
 * Calculate 88° solar-arc Design Offset
 */
export function calculateDesignOffset(sunPosition: number): number {
  const offset = 88;
  return (sunPosition + offset) % 360;
}

/**
 * Validate birth chart data completeness
 */
export function validateBirthChartData(data: BirthChartDataInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!data.birthDate) {
    errors.push("Birth date is required");
  }
  
  if (data.sun === undefined) {
    errors.push("Sun position is required for Prime Stack calculation");
  }
  
  if (data.moon === undefined) {
    errors.push("Moon position is required for 9-Center map");
  }
  
  const positions = [
    data.sun, data.moon, data.mercury, data.venus, data.mars,
    data.jupiter, data.saturn, data.uranus, data.neptune, data.pluto
  ];
  
  positions.forEach((pos, idx) => {
    if (pos !== undefined && (pos < 0 || pos > 360)) {
      const planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
      errors.push(`${planets[idx]} position must be between 0-360 degrees`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse birth time string (HH:MM) to decimal hours
 */
export function parseBirthTime(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours + minutes / 60;
}

/**
 * Calculate local sidereal time from birth data
 */
export function calculateLocalSiderealTime(
  birthDate: Date,
  longitude: number,
  birthTimeDecimal: number
): number {
  const dayOfYear = Math.floor(
    (birthDate.getTime() - new Date(birthDate.getFullYear(), 0, 0).getTime()) /
    (24 * 60 * 60 * 1000)
  );
  
  const lstHours = (birthTimeDecimal + longitude / 15 + dayOfYear * 0.0657) % 24;
  return lstHours;
}
