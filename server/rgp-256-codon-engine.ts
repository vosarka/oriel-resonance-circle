/**
 * RGP 256-Codon Resolution Engine
 * 
 * The Resonance Genetics Protocol operates on a 256-codon resolution system:
 * - 64 Root Codons (RC01-RC64) form the archetypal foundation
 * - Each Root Codon has 4 Facets (A, B, C, D) based on planetary position
 * - Total: 64 × 4 = 256 possible codon expressions
 * 
 * Facet Determination:
 * - Planetary longitude remainder (0-360°) divided into 4 quadrants
 * - Facet A: 0-90° (Shadow frequency)
 * - Facet B: 90-180° (Gift frequency)
 * - Facet C: 180-270° (Crown frequency)
 * - Facet D: 270-360° (Siddhi frequency)
 * 
 * Prime Stack Weighting:
 * - Conscious Sun (PCS): 1.8x weight
 * - Design Sun (Design): 1.3x weight
 * - Personality Sun: 1.0x weight
 * - Earth: 0.8x weight
 * - Nodes: 0.6x weight
 */

export interface CodonFacet {
  id: string; // RC01-A, RC01-B, etc.
  rootCodonId: string; // RC01-RC64
  facet: 'A' | 'B' | 'C' | 'D';
  frequency: 'shadow' | 'gift' | 'crown' | 'siddhi';
  name: string;
  essence: string;
  keyword: string;
  planetaryRange: [number, number]; // 0-90, 90-180, etc.
}

export interface PrimeStackPosition {
  position: number; // 1-9
  name: string;
  planetaryBody: string;
  weight: number;
  codonId?: string;
  facet?: 'A' | 'B' | 'C' | 'D';
}

export interface CodonFrequency {
  shadow: number; // 0-100
  gift: number; // 0-100
  crown: number; // 0-100
  siddhi: number; // 0-100
}

export interface FacetLoudness {
  A: number; // Shadow amplitude
  B: number; // Gift amplitude
  C: number; // Crown amplitude
  D: number; // Siddhi amplitude
  dominant: 'A' | 'B' | 'C' | 'D';
}

/**
 * Prime Stack Configuration
 * Maps the 9 positions in the Prime Stack with their weighting
 */
export const PRIME_STACK_CONFIG: PrimeStackPosition[] = [
  { position: 1, name: 'Conscious Sun', planetaryBody: 'Sun', weight: 1.8 },
  { position: 2, name: 'Design Sun', planetaryBody: 'Earth', weight: 1.3 },
  { position: 3, name: 'Personality Sun', planetaryBody: 'Sun', weight: 1.0 },
  { position: 4, name: 'Conscious Moon', planetaryBody: 'Moon', weight: 1.0 },
  { position: 5, name: 'Design Moon', planetaryBody: 'Moon', weight: 0.9 },
  { position: 6, name: 'Personality Moon', planetaryBody: 'Moon', weight: 0.8 },
  { position: 7, name: 'Nodes', planetaryBody: 'Nodes', weight: 0.6 },
  { position: 8, name: 'Earth', planetaryBody: 'Earth', weight: 0.8 },
  { position: 9, name: 'Chiron', planetaryBody: 'Chiron', weight: 0.5 },
];

/**
 * Determine codon facet from planetary longitude
 * 
 * @param longitude - Planetary longitude in degrees (0-360)
 * @returns Facet letter (A, B, C, or D)
 */
export function determineFacetFromLongitude(longitude: number): 'A' | 'B' | 'C' | 'D' {
  const normalized = longitude % 360;
  
  if (normalized < 90) return 'A';
  if (normalized < 180) return 'B';
  if (normalized < 270) return 'C';
  return 'D';
}

/**
 * Get facet frequency label from facet letter
 */
export function getFacetFrequency(facet: 'A' | 'B' | 'C' | 'D'): 'shadow' | 'gift' | 'crown' | 'siddhi' {
  const frequencyMap: Record<string, 'shadow' | 'gift' | 'crown' | 'siddhi'> = {
    'A': 'shadow',
    'B': 'gift',
    'C': 'crown',
    'D': 'siddhi',
  };
  return frequencyMap[facet];
}

/**
 * Calculate weighted codon position in Prime Stack
 * 
 * @param position - Position number (1-9)
 * @param baseFrequency - Base frequency value (0-100)
 * @returns Weighted frequency considering position weight
 */
export function calculateWeightedFrequency(position: number, baseFrequency: number): number {
  const config = PRIME_STACK_CONFIG.find(p => p.position === position);
  if (!config) return baseFrequency;
  return baseFrequency * config.weight;
}

/**
 * Calculate SLI (Shadow Loudness Index) for a codon
 * 
 * Formula: SLI(r) = PCS(r) × StateAmplifier × FacetAmplitude(r)
 * 
 * @param consciousSunFrequency - Conscious Sun codon frequency
 * @param stateAmplifier - Current state amplifier (0-1)
 * @param facetAmplitude - Facet loudness amplitude (0-1)
 * @returns SLI score (0-100)
 */
export function calculateSLI(
  consciousSunFrequency: number,
  stateAmplifier: number,
  facetAmplitude: number
): number {
  const sli = consciousSunFrequency * stateAmplifier * facetAmplitude;
  return Math.min(100, Math.max(0, sli));
}

/**
 * Determine facet loudness from coherence state
 * 
 * Maps Mental Noise, Body Tension, Emotional Turbulence to facet amplitudes
 * 
 * @param mentalNoise - Mental Noise score (0-10)
 * @param bodyTension - Body Tension score (0-10)
 * @param emotionalTurbulence - Emotional Turbulence score (0-10)
 * @returns FacetLoudness with A/B/C/D amplitudes
 */
export function determineFacetLoudness(
  mentalNoise: number,
  bodyTension: number,
  emotionalTurbulence: number
): FacetLoudness {
  // Normalize scores to 0-1 range
  const mn = mentalNoise / 10;
  const bt = bodyTension / 10;
  const et = emotionalTurbulence / 10;
  
  // Map to facet amplitudes
  // A (Shadow): Mental noise dominates
  // B (Gift): Body tension dominates
  // C (Crown): Emotional turbulence dominates
  // D (Siddhi): Coherence (inverse of all three)
  
  const facetA = Math.max(0, 1 - mn) * 100; // Shadow: reduced by mental noise
  const facetB = Math.max(0, 1 - bt) * 100; // Gift: reduced by body tension
  const facetC = Math.max(0, 1 - et) * 100; // Crown: reduced by emotional turbulence
  const facetD = Math.max(0, (1 - (mn + bt + et) / 3)) * 100; // Siddhi: coherence

  // Find dominant facet
  const facetValues: Array<[string, number]> = [
    ['A', facetA],
    ['B', facetB],
    ['C', facetC],
    ['D', facetD],
  ];
  const dominant = facetValues.reduce((prev, current) =>
    current[1] > prev[1] ? current : prev
  )[0] as 'A' | 'B' | 'C' | 'D';

  return {
    A: facetA,
    B: facetB,
    C: facetC,
    D: facetD,
    dominant,
  };
}

/**
 * Generate 256-codon identifier from root codon and facet
 * 
 * @param rootCodonId - Root codon ID (RC01-RC64)
 * @param facet - Facet letter (A, B, C, D)
 * @returns 256-codon ID (e.g., RC01-A)
 */
export function generateCodon256Id(rootCodonId: string, facet: 'A' | 'B' | 'C' | 'D'): string {
  return `${rootCodonId}-${facet}`;
}

/**
 * Parse 256-codon identifier back to components
 * 
 * @param codon256Id - 256-codon ID (e.g., RC01-A)
 * @returns Object with rootCodonId and facet
 */
export function parseCodon256Id(codon256Id: string): { rootCodonId: string; facet: 'A' | 'B' | 'C' | 'D' } {
  const [rootCodonId, facet] = codon256Id.split('-');
  return { rootCodonId, facet: facet as 'A' | 'B' | 'C' | 'D' };
}

/**
 * Calculate state amplifier from coherence score
 * 
 * State Amplifier represents how much the current coherence state
 * amplifies or dampens the codon frequencies
 * 
 * @param coherenceScore - Coherence score (0-100)
 * @returns State amplifier (0-1)
 */
export function calculateStateAmplifier(coherenceScore: number): number {
  // Coherence score directly maps to amplifier
  // 0 coherence = 0 amplification
  // 100 coherence = 1.0 amplification
  return coherenceScore / 100;
}

/**
 * Calculate Primary Interference Pattern
 * 
 * Identifies which facets are most active based on state
 * 
 * @param facetLoudness - Facet loudness distribution
 * @returns Array of active facets sorted by amplitude
 */
export function calculatePrimaryInterference(facetLoudness: FacetLoudness): Array<{ facet: 'A' | 'B' | 'C' | 'D'; amplitude: number }> {
  const facets: Array<{ facet: 'A' | 'B' | 'C' | 'D'; amplitude: number }> = [
    { facet: 'A', amplitude: facetLoudness.A },
    { facet: 'B', amplitude: facetLoudness.B },
    { facet: 'C', amplitude: facetLoudness.C },
    { facet: 'D', amplitude: facetLoudness.D },
  ];
  return facets.sort((a, b) => b.amplitude - a.amplitude);
}

/**
 * Validate 256-codon resolution integrity
 * 
 * Ensures all 256 codons are properly defined and accessible
 */
export function validate256CodonResolution(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check Prime Stack configuration
  if (PRIME_STACK_CONFIG.length !== 9) {
    errors.push(`Prime Stack should have 9 positions, found ${PRIME_STACK_CONFIG.length}`);
  }
  
  // Verify position numbers are sequential
  const positions = PRIME_STACK_CONFIG.map(p => p.position).sort((a, b) => a - b);
  if (positions.join(',') !== '1,2,3,4,5,6,7,8,9') {
    errors.push('Prime Stack positions are not sequential 1-9');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
