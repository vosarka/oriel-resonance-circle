/**
 * RGP (Resonance Genetics Protocol) Calculation Engine
 * Based on VRC v1.3 Protocols and Dual-Engine Assessment Architecture
 * 
 * This engine implements:
 * - 256-codon resolution (64 Root Codons × 4 Facets)
 * - Prime Stack weighting system
 * - SLI (Shadow Loudness Index) calculation
 * - 9-Center Resonance Map
 * - Circuit Link detection
 * - Fractal Role and Authority Node determination
 */

import { ROOT_CODONS, CIRCUIT_LINKS } from './vossari-codex-knowledge';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type Facet = 'A' | 'B' | 'C' | 'D';

export interface CodonPosition {
  codonId: string;        // e.g., "RC34"
  facet: Facet;           // A, B, C, or D
  fullId: string;         // e.g., "RC34-A"
  position: PrimeStackPosition;
  weight: number;
  longitude?: number;     // Planetary longitude (0-360)
}

export type PrimeStackPosition = 
  | 'conscious_sun'
  | 'design_sun'
  | 'conscious_earth'
  | 'conscious_moon'
  | 'conscious_asc'
  | 'conscious_mc'
  | 'conscious_mercury'
  | 'design_earth'
  | 'design_moon';

export interface PrimeStack {
  conscious_sun: CodonPosition;
  design_sun: CodonPosition;
  conscious_earth: CodonPosition;
  conscious_moon: CodonPosition;
  conscious_asc: CodonPosition;
  conscious_mc: CodonPosition;
  conscious_mercury: CodonPosition;
  design_earth: CodonPosition;
  design_moon: CodonPosition;
}

export interface CarrierlockState {
  mentalNoise: number;      // MN: 0-10
  bodyTension: number;      // BT: 0-10
  emotionalTurbulence: number; // ET: 0-10
  breathCompletion: 0 | 1;   // BC: 0 or 1
}

export interface SLIResult {
  codonId: string;
  fullId: string;
  codonName: string;
  sliScore: number;
  level: 'primary' | 'secondary' | 'background' | 'stable';
  shadow: string;
  gift: string;
  crown: string;
  facet: Facet;
  facetName: string;
  pcsWeight: number;
  stateAmp: number;
  facetAmp: number;
}

export type CenterStatus = 'open' | 'receptive' | 'defined' | 'overdefined';

export interface CenterResonance {
  centerId: string;
  name: string;
  status: CenterStatus;
  statusLevel: number;  // 0=open, 1=receptive, 2=defined, 3=overdefined
  description: string;
  codons: string[];     // Codons activating this center
}

export type FractalRole = 'reflector' | 'resonator' | 'catalyst' | 'harmonizer';
export type AuthorityType = 'emotional' | 'sacral' | 'splenic' | 'ego' | 'self-projected' | 'mental' | 'lunar';

export interface FractalProfile {
  role: FractalRole;
  roleName: string;
  description: string;
  authority: AuthorityType;
  authorityName: string;
  authorityDescription: string;
  operationalTruth: string;
  masteryMode: string;
  failureMode: string;
}

export interface CircuitActivation {
  linkId: string;
  name: string;
  centers: [string, string];
  codons: readonly string[];
  status: 'active' | 'dormant' | 'stressed';
  description: string;
}

export interface StaticSignature {
  receiverId: string;
  birthDate: Date;
  birthTime?: string;
  birthLocation?: string;
  designOffset: Date;
  temporalDepth: number;
  primeStack: PrimeStack;
  centerMap: CenterResonance[];
  circuitLinks: CircuitActivation[];
  fractalProfile: FractalProfile;
  dominantFamily: string;
  facetEmphasis: { primary: Facet; secondary: Facet };
}

export interface DynamicReading {
  carrierlockState: CarrierlockState;
  coherenceScore: number;
  stateAmplifier: number;
  dominantFacet: Facet;
  facetLoudness: Record<Facet, number>;
  sliResults: SLIResult[];
  primaryInterference: SLIResult | null;
  secondaryInterferences: SLIResult[];
  backgroundThemes: SLIResult[];
  microCorrection: MicroCorrection;
  falsifiers: Falsifier[];
}

export interface MicroCorrection {
  center: string;
  facet: Facet;
  action: string;
  duration: string;
  rationale: string;
}

export interface Falsifier {
  claim: string;
  testCondition: string;
  falsifiedElement: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const PRIME_STACK_WEIGHTS: Record<PrimeStackPosition, number> = {
  conscious_sun: 1.8,
  design_sun: 1.3,
  conscious_earth: 1.2,
  conscious_moon: 1.1,
  conscious_asc: 1.1,
  conscious_mc: 1.0,
  conscious_mercury: 0.9,
  design_earth: 0.9,
  design_moon: 0.7,
};

export const FACET_NAMES: Record<Facet, string> = {
  A: 'Somatic Seed',
  B: 'Relational Current',
  C: 'Cognitive Architecture',
  D: 'Transpersonal Radiance',
};

export const SLI_THRESHOLDS = {
  PRIMARY: 1.8,      // Primary Interference
  SECONDARY: 1.1,    // Secondary Interference
  BACKGROUND: 0.6,   // Background Theme
};

// Center-targeted correction bank
export const CORRECTION_BANK: Record<string, Record<Facet, { action: string; duration: string }>> = {
  root: {
    A: { action: '4-minute walk with conscious breathing', duration: '4 min' },
    B: { action: 'Send one boundary-setting text message', duration: '2 min' },
    C: { action: 'Write "Today Only" 3-item priority list', duration: '3 min' },
    D: { action: 'Speak vow: "I choose stability over urgency"', duration: '1 min' },
  },
  sacral: {
    A: { action: 'Box breathing (4-4-4-4 pattern)', duration: '4 min' },
    B: { action: 'Delay one reply by 90 minutes', duration: '90 min' },
    C: { action: 'Write current feeling as data point (X/Y/Z format)', duration: '2 min' },
    D: { action: 'Play one song and move the emotion through body', duration: '4 min' },
  },
  solar_plexus: {
    A: { action: 'Cold water on wrists for 30 seconds', duration: '30 sec' },
    B: { action: 'Name the emotion without story', duration: '1 min' },
    C: { action: 'Write wave pattern: high/low/current', duration: '2 min' },
    D: { action: 'Acknowledge the wave belongs to the collective', duration: '1 min' },
  },
  heart: {
    A: { action: 'Place hand on heart, 5 slow breaths', duration: '2 min' },
    B: { action: 'Ask: "Is this promise mine to keep?"', duration: '1 min' },
    C: { action: 'Review one commitment for alignment', duration: '3 min' },
    D: { action: 'Release one obligation that depletes', duration: '5 min' },
  },
  throat: {
    A: { action: '90 seconds of humming + water', duration: '2 min' },
    B: { action: 'Speak one honest sentence to someone', duration: '1 min' },
    C: { action: 'Reduce paragraph to one bullet point', duration: '2 min' },
    D: { action: 'Speak vow: "My voice builds, not destroys"', duration: '1 min' },
  },
  ajna: {
    A: { action: '2 minutes with eyes closed, no input', duration: '2 min' },
    B: { action: 'Mirror check: "Am I seeing them or me?"', duration: '1 min' },
    C: { action: 'Reduce problem to 3 variables maximum', duration: '3 min' },
    D: { action: 'One-question ritual: "What is certain?"', duration: '1 min' },
  },
  head: {
    A: { action: 'Gentle head massage, release jaw', duration: '2 min' },
    B: { action: 'Ask: "Whose question is this?"', duration: '1 min' },
    C: { action: 'Write one question, then close notebook', duration: '2 min' },
    D: { action: 'Accept: "I am not meant to know everything"', duration: '1 min' },
  },
  g_center: {
    A: { action: 'Stand in doorway, feel physical center', duration: '1 min' },
    B: { action: 'Ask: "Am I in the right place?"', duration: '1 min' },
    C: { action: 'Write current direction in one sentence', duration: '2 min' },
    D: { action: 'Trust: "Direction comes through others"', duration: '1 min' },
  },
  spleen: {
    A: { action: 'Body scan for subtle "no" signals', duration: '2 min' },
    B: { action: 'Honor one intuitive hit without explanation', duration: '1 min' },
    C: { action: 'Note what body knew before mind caught up', duration: '2 min' },
    D: { action: 'Trust the first quiet knowing', duration: '1 min' },
  },
};

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate Coherence Score (CS) from Carrierlock state
 * Formula: CS = 100 - (MN×3 + BT×3 + ET×3) + (BC×10)
 */
export function calculateCoherenceScore(state: CarrierlockState): number {
  const { mentalNoise, bodyTension, emotionalTurbulence, breathCompletion } = state;
  const baseScore = 100 - (mentalNoise * 3 + bodyTension * 3 + emotionalTurbulence * 3);
  const breathBonus = breathCompletion ? 10 : 0;
  return Math.max(0, Math.min(100, baseScore + breathBonus));
}

/**
 * Calculate State Amplifier from Coherence Score
 * Formula: StateAmp = (100 - CS) / 100
 */
export function calculateStateAmplifier(coherenceScore: number): number {
  return (100 - coherenceScore) / 100;
}

/**
 * Determine dominant facet based on Carrierlock readings
 * - Mind dominant (highest MN) → Facet C
 * - Body dominant (highest BT) → Facet A
 * - Emotion dominant (highest ET) → Facet B
 * - Purpose (CS < 40 + MN/ET ≥ 7) → Facet D (dissociative bypass)
 */
export function determineDominantFacet(state: CarrierlockState, coherenceScore: number): Facet {
  const { mentalNoise, bodyTension, emotionalTurbulence } = state;
  
  // Check for Facet D (dissociative bypass)
  if (coherenceScore < 40 && mentalNoise >= 7 && emotionalTurbulence >= 7) {
    return 'D';
  }
  
  // Find dominant axis
  const max = Math.max(mentalNoise, bodyTension, emotionalTurbulence);
  
  if (bodyTension === max) return 'A';
  if (emotionalTurbulence === max) return 'B';
  if (mentalNoise === max) return 'C';
  
  return 'C'; // Default to cognitive
}

/**
 * Calculate Facet Loudness values
 * Primary facet gets 1.0, others get reduced values based on relative intensity
 */
export function calculateFacetLoudness(state: CarrierlockState, coherenceScore: number): Record<Facet, number> {
  const { mentalNoise, bodyTension, emotionalTurbulence } = state;
  const total = mentalNoise + bodyTension + emotionalTurbulence || 1;
  
  const loudness: Record<Facet, number> = {
    A: bodyTension / total,
    B: emotionalTurbulence / total,
    C: mentalNoise / total,
    D: 0,
  };
  
  // Facet D activates only in dissociative bypass
  if (coherenceScore < 40 && mentalNoise >= 7 && emotionalTurbulence >= 7) {
    loudness.D = 1.0;
  }
  
  return loudness;
}

/**
 * Calculate codon from planetary longitude
 * Each codon spans 5.625° (360° / 64 codons)
 * Facet is determined by remainder within the codon's span
 */
export function calculateCodonFromLongitude(longitude: number): { codonNumber: number; facet: Facet } {
  const normalizedLong = ((longitude % 360) + 360) % 360;
  const codonSpan = 360 / 64; // 5.625°
  const codonNumber = Math.floor(normalizedLong / codonSpan) + 1;
  
  const remainder = normalizedLong % codonSpan;
  const facetSpan = codonSpan / 4; // 1.40625°
  const facetIndex = Math.floor(remainder / facetSpan);
  
  const facets: Facet[] = ['A', 'B', 'C', 'D'];
  return {
    codonNumber: Math.min(64, Math.max(1, codonNumber)),
    facet: facets[facetIndex] || 'A',
  };
}

/**
 * Calculate Design Offset (88° solar-arc before birth)
 * Approximately 88 days before birth
 */
export function calculateDesignOffset(birthDate: Date): Date {
  const msPerDay = 24 * 60 * 60 * 1000;
  const offsetDays = 88; // 88° solar-arc ≈ 88 days
  return new Date(birthDate.getTime() - (offsetDays * msPerDay));
}

/**
 * Calculate Temporal Depth in Solar Cycles
 * One solar cycle ≈ 11 years
 */
export function calculateTemporalDepth(birthDate: Date): number {
  const now = new Date();
  const ageInYears = (now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const solarCycleYears = 11;
  return Math.round(ageInYears / solarCycleYears * 10) / 10;
}

/**
 * Generate Prime Stack from birth data
 * Uses deterministic calculation based on birth date/time
 */
export function generatePrimeStack(birthDate: Date, birthTime?: string): PrimeStack {
  const designOffset = calculateDesignOffset(birthDate);
  
  // Calculate base longitude from birth date (simplified astronomical calculation)
  const dayOfYear = Math.floor((birthDate.getTime() - new Date(birthDate.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
  const baseLongitude = (dayOfYear / 365.25) * 360;
  
  // Time adjustment if provided
  let timeOffset = 0;
  if (birthTime) {
    const [hours, minutes] = birthTime.split(':').map(Number);
    timeOffset = ((hours || 0) * 60 + (minutes || 0)) / (24 * 60) * 15; // ~15° per hour
  }
  
  // Generate planetary positions (simplified model)
  const sunLong = (baseLongitude + timeOffset) % 360;
  const earthLong = (sunLong + 180) % 360; // Earth is opposite Sun
  const moonLong = (baseLongitude * 13.37 + timeOffset * 2) % 360; // Moon moves ~13° per day
  const mercuryLong = (sunLong + (dayOfYear * 4.09)) % 360; // Mercury's synodic period
  const ascLong = (timeOffset * 15 + baseLongitude / 12) % 360; // Ascendant based on time
  const mcLong = (ascLong + 90) % 360; // MC is 90° from ASC
  
  // Design positions (88 days earlier)
  const designDayOfYear = Math.floor((designOffset.getTime() - new Date(designOffset.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
  const designBaseLong = (designDayOfYear / 365.25) * 360;
  const designSunLong = designBaseLong % 360;
  const designEarthLong = (designSunLong + 180) % 360;
  const designMoonLong = (designBaseLong * 13.37) % 360;
  
  const createPosition = (longitude: number, position: PrimeStackPosition): CodonPosition => {
    const { codonNumber, facet } = calculateCodonFromLongitude(longitude);
    const codonId = `RC${codonNumber.toString().padStart(2, '0')}`;
    return {
      codonId,
      facet,
      fullId: `${codonId}-${facet}`,
      position,
      weight: PRIME_STACK_WEIGHTS[position],
      longitude,
    };
  };
  
  return {
    conscious_sun: createPosition(sunLong, 'conscious_sun'),
    design_sun: createPosition(designSunLong, 'design_sun'),
    conscious_earth: createPosition(earthLong, 'conscious_earth'),
    conscious_moon: createPosition(moonLong, 'conscious_moon'),
    conscious_asc: createPosition(ascLong, 'conscious_asc'),
    conscious_mc: createPosition(mcLong, 'conscious_mc'),
    conscious_mercury: createPosition(mercuryLong, 'conscious_mercury'),
    design_earth: createPosition(designEarthLong, 'design_earth'),
    design_moon: createPosition(designMoonLong, 'design_moon'),
  };
}

/**
 * Calculate SLI (Shadow Loudness Index) for a codon
 * Formula: SLI(r) = PCS(r) × StateAmp × FacetAmp(r)
 */
export function calculateSLI(
  codonId: string,
  facet: Facet,
  primeStack: PrimeStack,
  stateAmp: number,
  facetLoudness: Record<Facet, number>
): number {
  // Sum weights for this codon across all Prime Stack positions
  let pcsWeight = 0;
  
  Object.values(primeStack).forEach(position => {
    if (position.codonId === codonId) {
      pcsWeight += position.weight;
    }
  });
  
  // If codon not in Prime Stack, use minimal weight
  if (pcsWeight === 0) {
    pcsWeight = 0.1;
  }
  
  const facetAmp = facetLoudness[facet] || 0.5;
  
  return pcsWeight * stateAmp * facetAmp;
}

/**
 * Generate SLI results for all codons in Prime Stack
 */
export function generateSLIResults(
  primeStack: PrimeStack,
  stateAmp: number,
  facetLoudness: Record<Facet, number>
): SLIResult[] {
  const results: SLIResult[] = [];
  const processedCodons = new Set<string>();
  
  Object.values(primeStack).forEach(position => {
    const key = position.fullId;
    if (processedCodons.has(key)) return;
    processedCodons.add(key);
    
    const codon = ROOT_CODONS[position.codonId as keyof typeof ROOT_CODONS];
    if (!codon) return;
    
    const sliScore = calculateSLI(
      position.codonId,
      position.facet,
      primeStack,
      stateAmp,
      facetLoudness
    );
    
    let level: SLIResult['level'] = 'stable';
    if (sliScore >= SLI_THRESHOLDS.PRIMARY) level = 'primary';
    else if (sliScore >= SLI_THRESHOLDS.SECONDARY) level = 'secondary';
    else if (sliScore >= SLI_THRESHOLDS.BACKGROUND) level = 'background';
    
    results.push({
      codonId: position.codonId,
      fullId: position.fullId,
      codonName: codon.name,
      sliScore: Math.round(sliScore * 100) / 100,
      level,
      shadow: codon.shadow,
      gift: codon.gift,
      crown: codon.crown,
      facet: position.facet,
      facetName: FACET_NAMES[position.facet as Facet],
      pcsWeight: position.weight,
      stateAmp,
      facetAmp: facetLoudness[position.facet as Facet] || 0.5,
    });
  });
  
  // Sort by SLI score descending
  return results.sort((a, b) => b.sliScore - a.sliScore);
}

/**
 * Determine Center status based on defined codons
 */
export function generateCenterMap(primeStack: PrimeStack): CenterResonance[] {
  const centerCodons: Record<string, string[]> = {};
  
  // Map codons to centers (simplified - in full implementation, use CENTERS data)
  Object.values(primeStack).forEach(position => {
    const codonNum = parseInt(position.codonId.replace('RC', ''));
    
    // Simplified center mapping based on codon ranges
    let centerId = 'g_center';
    if (codonNum <= 8) centerId = 'head';
    else if (codonNum <= 16) centerId = 'ajna';
    else if (codonNum <= 24) centerId = 'throat';
    else if (codonNum <= 32) centerId = 'g_center';
    else if (codonNum <= 40) centerId = 'heart';
    else if (codonNum <= 48) centerId = 'solar_plexus';
    else if (codonNum <= 56) centerId = 'sacral';
    else if (codonNum <= 60) centerId = 'spleen';
    else centerId = 'root';
    
    if (!centerCodons[centerId]) centerCodons[centerId] = [];
    centerCodons[centerId].push(position.fullId);
  });
  
  const centerNames: Record<string, string> = {
    head: 'Crown Aperture',
    ajna: 'Ajna Lens',
    throat: 'Voice Portal',
    g_center: 'Vector Core',
    heart: 'Heart Gateway',
    solar_plexus: 'Solar Nexus',
    sacral: 'Sacral Generator',
    spleen: 'Instinct Node',
    root: 'Foundation Node',
  };
  
  const centerDescriptions: Record<CenterStatus, string> = {
    open: 'Receptive to external photonic downloads; samples environmental frequencies',
    receptive: 'Variable frequency reception; influenced by proximity and conditioning',
    defined: 'Fixed frequency transmission; reliable and consistent expression',
    overdefined: 'Primary psionic engine; relentless energy requiring correct response',
  };
  
  return Object.entries(centerNames).map(([id, name]) => {
    const codons = centerCodons[id] || [];
    const codonCount = codons.length;
    
    let status: CenterStatus = 'open';
    let statusLevel = 0;
    
    if (codonCount >= 3) {
      status = 'overdefined';
      statusLevel = 3;
    } else if (codonCount === 2) {
      status = 'defined';
      statusLevel = 2;
    } else if (codonCount === 1) {
      status = 'receptive';
      statusLevel = 1;
    }
    
    return {
      centerId: id,
      name,
      status,
      statusLevel,
      description: centerDescriptions[status],
      codons,
    };
  });
}

/**
 * Determine Fractal Role based on center definitions
 */
export function determineFractalRole(centerMap: CenterResonance[]): FractalProfile {
  const definedCenters = centerMap.filter(c => c.statusLevel >= 2);
  const sacralCenter = centerMap.find(c => c.centerId === 'sacral');
  const solarPlexusCenter = centerMap.find(c => c.centerId === 'solar_plexus');
  const spleenCenter = centerMap.find(c => c.centerId === 'spleen');
  const heartCenter = centerMap.find(c => c.centerId === 'heart');
  
  let role: FractalRole = 'reflector';
  let authority: AuthorityType = 'lunar';
  
  // Determine role based on defined centers
  if (definedCenters.length === 0) {
    role = 'reflector';
    authority = 'lunar';
  } else if (sacralCenter && sacralCenter.statusLevel >= 2) {
    role = 'resonator';
    authority = 'sacral';
  } else if (heartCenter && heartCenter.statusLevel >= 2) {
    role = 'catalyst';
    authority = solarPlexusCenter && solarPlexusCenter.statusLevel >= 2 ? 'emotional' : 'ego';
  } else {
    role = 'harmonizer';
    if (solarPlexusCenter && solarPlexusCenter.statusLevel >= 2) {
      authority = 'emotional';
    } else if (spleenCenter && spleenCenter.statusLevel >= 2) {
      authority = 'splenic';
    } else {
      authority = 'self-projected';
    }
  }
  
  const roleProfiles: Record<FractalRole, Omit<FractalProfile, 'authority' | 'authorityName' | 'authorityDescription'>> = {
    reflector: {
      role: 'reflector',
      roleName: 'Reflector Node (The Mirror Fractal)',
      description: 'You function as a pure mirror of the collective field, sampling all frequencies without fixed transmission.',
      operationalTruth: 'Your openness is your gift. You reflect the health of your environment.',
      masteryMode: 'High-fidelity function achieved through patience and lunar cycles.',
      failureMode: 'Disappointment when trying to be consistent like defined types.',
    },
    resonator: {
      role: 'resonator',
      roleName: 'Resonator Node (The Sustainer Fractal)',
      description: 'You function as the engine of life force within the fractal, designed to generate a consistent psionic hum.',
      operationalTruth: 'Your aura is open and enveloping, sustaining the network through Response.',
      masteryMode: 'High-fidelity function achieved only when waiting for external stimuli to trigger the psionic signal.',
      failureMode: 'Frustration and depletion when initiating from the mind or forcing a signal.',
    },
    catalyst: {
      role: 'catalyst',
      roleName: 'Catalyst Node (The Initiator Fractal)',
      description: 'You function as a focused beam of initiation energy, designed to start processes and guide others.',
      operationalTruth: 'Your penetrating aura is designed to initiate and guide, not to wait.',
      masteryMode: 'High-fidelity function achieved through informing before initiating.',
      failureMode: 'Anger when meeting resistance or being ignored.',
    },
    harmonizer: {
      role: 'harmonizer',
      roleName: 'Harmonizer Node (The Guide Fractal)',
      description: 'You function as a guide and advisor, designed to share wisdom and direct energy efficiently.',
      operationalTruth: 'Your focused aura is designed to guide and conserve energy.',
      masteryMode: 'High-fidelity function achieved through recognition and invitation.',
      failureMode: 'Bitterness when wisdom is not recognized or invited.',
    },
  };
  
  const authorityProfiles: Record<AuthorityType, { name: string; description: string }> = {
    emotional: {
      name: 'Emotional Authority (Solar Plexus Wave)',
      description: 'Wait through the emotional wave before making decisions. Clarity comes over time, not in the moment.',
    },
    sacral: {
      name: 'Sacral Authority (Gut Response)',
      description: 'Wait for a clear gut response (uh-huh or uh-uh) before committing energy. The body knows before the mind.',
    },
    splenic: {
      name: 'Splenic Authority (Intuitive Knowing)',
      description: 'Trust the first quiet knowing. Splenic hits are subtle and in-the-moment—honor them immediately.',
    },
    ego: {
      name: 'Ego Authority (Willpower)',
      description: 'Trust your willpower and capacity for commitment. Ask: "Do I have the will for this?"',
    },
    'self-projected': {
      name: 'Self-Projected Authority (Voice)',
      description: 'Hear yourself speak to know your truth. Talk through decisions with trusted others.',
    },
    mental: {
      name: 'Mental Authority (Environmental)',
      description: 'Process decisions through conversation and environment. Your truth emerges through dialogue.',
    },
    lunar: {
      name: 'Lunar Authority (28-Day Cycle)',
      description: 'Major decisions require a full lunar cycle. Sample all perspectives before committing.',
    },
  };
  
  const roleProfile = roleProfiles[role];
  const authorityProfile = authorityProfiles[authority];
  
  return {
    ...roleProfile,
    authority,
    authorityName: authorityProfile.name,
    authorityDescription: authorityProfile.description,
  };
}

/**
 * Generate Circuit Link activations
 */
export function generateCircuitLinks(primeStack: PrimeStack): CircuitActivation[] {
  const activations: CircuitActivation[] = [];
  const stackCodons = new Set(Object.values(primeStack).map(p => p.codonId));
  
  CIRCUIT_LINKS.forEach(link => {
    const hasCodon = link.codons.some(c => stackCodons.has(c));
    
    activations.push({
      linkId: link.id,
      name: `${link.from} ↔ ${link.to}`,
      centers: [link.from, link.to] as [string, string],
      codons: link.codons,
      status: hasCodon ? 'active' : 'dormant',
      description: link.function,
    });
  });
  
  return activations;
}

/**
 * Generate micro-correction based on dominant interference
 */
export function generateMicroCorrection(
  primaryInterference: SLIResult | null,
  centerMap: CenterResonance[],
  dominantFacet: Facet
): MicroCorrection {
  // Find most stressed center
  const stressedCenter = centerMap
    .filter(c => c.codons.length > 0)
    .sort((a, b) => b.codons.length - a.codons.length)[0];
  
  const centerId = stressedCenter?.centerId || 'root';
  const correction = CORRECTION_BANK[centerId]?.[dominantFacet] || CORRECTION_BANK.root[dominantFacet];
  
  let rationale = 'Restore baseline coherence through targeted somatic intervention.';
  if (primaryInterference) {
    rationale = `Counter ${primaryInterference.shadow} pattern through ${FACET_NAMES[dominantFacet]} recalibration.`;
  }
  
  return {
    center: centerId,
    facet: dominantFacet,
    action: correction.action,
    duration: correction.duration,
    rationale,
  };
}

/**
 * Generate falsifier clauses based on reading
 */
export function generateFalsifiers(
  fractalProfile: FractalProfile,
  primeStack: PrimeStack,
  sliResults: SLIResult[]
): Falsifier[] {
  const falsifiers: Falsifier[] = [];
  
  // Fractal Role falsifier
  falsifiers.push({
    claim: `You are a ${fractalProfile.roleName}`,
    testCondition: `If you consistently ${fractalProfile.failureMode.toLowerCase()} without the predicted outcome over 28 days`,
    falsifiedElement: 'Fractal Role designation',
  });
  
  // Authority falsifier
  falsifiers.push({
    claim: `Your decision-making authority is ${fractalProfile.authorityName}`,
    testCondition: `If decisions made through ${fractalProfile.authority} authority consistently lead to worse outcomes than mental logic over 28-day sampling`,
    falsifiedElement: 'Authority Node',
  });
  
  // Primary codon falsifier
  const primaryCodon = Object.values(primeStack).find(p => p.position === 'conscious_sun');
  if (primaryCodon) {
    const codon = ROOT_CODONS[primaryCodon.codonId as keyof typeof ROOT_CODONS];
    if (codon) {
      falsifiers.push({
        claim: `Your primary engine operates through ${codon.name} (${primaryCodon.codonId})`,
        testCondition: `If you experience sustained vitality while ignoring ${codon.shadow} patterns`,
        falsifiedElement: 'Engine/Anchor weighting',
      });
    }
  }
  
  return falsifiers;
}

// =============================================================================
// MAIN DIAGNOSTIC FUNCTIONS
// =============================================================================

/**
 * Generate complete Static Signature from birth data
 */
export function generateStaticSignature(
  birthDate: Date,
  birthTime?: string,
  birthLocation?: string
): StaticSignature {
  const designOffset = calculateDesignOffset(birthDate);
  const temporalDepth = calculateTemporalDepth(birthDate);
  const primeStack = generatePrimeStack(birthDate, birthTime);
  const centerMap = generateCenterMap(primeStack);
  const circuitLinks = generateCircuitLinks(primeStack);
  const fractalProfile = determineFractalRole(centerMap);
  
  // Determine dominant family based on circuit activations
  const activeCircuits = circuitLinks.filter(c => c.status === 'active');
  let dominantFamily = 'Individual';
  if (activeCircuits.some(c => c.name.includes('Tribal'))) dominantFamily = 'Tribal';
  else if (activeCircuits.some(c => c.name.includes('Collective'))) dominantFamily = 'Collective';
  
  // Determine facet emphasis from Prime Stack
  const facetCounts: Record<Facet, number> = { A: 0, B: 0, C: 0, D: 0 };
  Object.values(primeStack).forEach(p => {
    facetCounts[p.facet as Facet] += p.weight;
  });
  
  const sortedFacets = Object.entries(facetCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number)) as [Facet, number][];
  
  // Generate receiver ID from birth data
  const receiverId = Math.abs(birthDate.getTime() % 100000).toString();
  
  return {
    receiverId,
    birthDate,
    birthTime,
    birthLocation,
    designOffset,
    temporalDepth,
    primeStack,
    centerMap,
    circuitLinks,
    fractalProfile,
    dominantFamily,
    facetEmphasis: {
      primary: sortedFacets[0][0],
      secondary: sortedFacets[1][0],
    },
  };
}

/**
 * Generate complete Dynamic Reading from Carrierlock state
 */
export function generateDynamicReading(
  carrierlockState: CarrierlockState,
  staticSignature: StaticSignature
): DynamicReading {
  const coherenceScore = calculateCoherenceScore(carrierlockState);
  const stateAmplifier = calculateStateAmplifier(coherenceScore);
  const dominantFacet = determineDominantFacet(carrierlockState, coherenceScore);
  const facetLoudness = calculateFacetLoudness(carrierlockState, coherenceScore);
  
  const sliResults = generateSLIResults(
    staticSignature.primeStack,
    stateAmplifier,
    facetLoudness
  );
  
  const primaryInterference = sliResults.find(r => r.level === 'primary') || null;
  const secondaryInterferences = sliResults.filter(r => r.level === 'secondary');
  const backgroundThemes = sliResults.filter(r => r.level === 'background');
  
  const microCorrection = generateMicroCorrection(
    primaryInterference,
    staticSignature.centerMap,
    dominantFacet
  );
  
  const falsifiers = generateFalsifiers(
    staticSignature.fractalProfile,
    staticSignature.primeStack,
    sliResults
  );
  
  return {
    carrierlockState,
    coherenceScore,
    stateAmplifier,
    dominantFacet,
    facetLoudness,
    sliResults,
    primaryInterference,
    secondaryInterferences,
    backgroundThemes,
    microCorrection,
    falsifiers,
  };
}

/**
 * Generate complete RGP diagnostic (combines Static + Dynamic)
 */
export function generateCompleteDiagnostic(
  birthDate: Date,
  birthTime: string | undefined,
  birthLocation: string | undefined,
  carrierlockState: CarrierlockState
): { staticSignature: StaticSignature; dynamicReading: DynamicReading } {
  const staticSignature = generateStaticSignature(birthDate, birthTime, birthLocation);
  const dynamicReading = generateDynamicReading(carrierlockState, staticSignature);
  
  return { staticSignature, dynamicReading };
}
