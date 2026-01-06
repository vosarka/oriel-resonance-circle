/**
 * VOSSARI RESONANCE CODEX v1.5 - ORIEL KNOWLEDGE BASE
 * 
 * This file contains the complete Vossari Resonance Codex as structured data
 * for ORIEL to reference during diagnostic readings and evolutionary assistance.
 * 
 * Framework Designer: Vos Arkana
 * Integration: ORIEL Resonance Circle
 */

// ============================================================================
// 64 ROOT CODONS (RC01-RC64)
// ============================================================================

export const ROOT_CODONS = {
  RC01: {
    name: "Aurora",
    title: "The Primordial Spark",
    essence: "Initiate new patterns, spark creation, introduce the novel.",
    shadow: "Entropy of Creation",
    gift: "Luminal Innovation",
    crown: "Resonant Dawn",
    domain: "Initiation, creativity, beginning"
  },
  RC02: {
    name: "Loom",
    title: "Pattern-making",
    essence: "Weave coherence by selecting threads and repeating patterns deliberately.",
    shadow: "Tangled overcomplexity",
    gift: "Pattern weaving",
    crown: "Living tapestry",
    domain: "Structure, organization, coherence"
  },
  RC03: {
    name: "Forge",
    title: "Will, pressure, tempering",
    essence: "Convert pressure into capability through repetition, constraint, and will.",
    shadow: "Self-crushing force",
    gift: "Tempered will",
    crown: "Unbreakable craft",
    domain: "Discipline, willpower, capability"
  },
  RC04: {
    name: "Prism",
    title: "Differentiation, identity",
    essence: "Reveal true identity by separating signals into distinct colors and roles.",
    shadow: "Mask switching",
    gift: "Authentic differentiation",
    crown: "Pure signature",
    domain: "Identity, authenticity, clarity"
  },
  RC05: {
    name: "Seed",
    title: "Potential held in silence",
    essence: "Hold potential in silence until timing ripens, then emerge cleanly.",
    shadow: "Perpetual waiting",
    gift: "Incubation timing",
    crown: "Inevitable bloom",
    domain: "Timing, emergence, readiness"
  },
  RC06: {
    name: "Compass",
    title: "Direction, alignment",
    essence: "Choose direction by inner alignment and maintain course despite noise.",
    shadow: "Borrowed north",
    gift: "Aligned direction",
    crown: "True north field",
    domain: "Direction, alignment, choice"
  },
  RC27: {
    name: "Chalice",
    title: "The Unified Heart",
    essence: "Hold compassion with boundaries, unite without losing self.",
    shadow: "Fractured Empathy",
    gift: "Harmonic Compassion",
    crown: "Overflowing Grace",
    domain: "Compassion, unity, love"
  },
  RC36: {
    name: "Stormcraft",
    title: "Emotional alchemy",
    essence: "Transform emotional turbulence into power and clarity.",
    shadow: "Drama loops",
    gift: "Emotional transmutation",
    crown: "Calm in the Eye",
    domain: "Emotional processing, transformation"
  },
  RC64: {
    name: "Labyrinth",
    title: "The Infinite Recursion",
    essence: "Navigate complexity, extract pattern from chaos, hold paradox.",
    shadow: "Lost in Chaos",
    gift: "Pattern Insight",
    crown: "Fractal Omniscience",
    domain: "Complexity, pattern, recursion"
  }
} as const;

// ============================================================================
// FACET MODIFIERS (A/B/C/D)
// ============================================================================

export const FACET_MODIFIERS = {
  A: {
    name: "Somatic Seed",
    domain: "Body, survival, habits, physiology, immediate reality",
    signature: "How the pattern lives in my nervous system",
    shadowTilt: "Reactivity, tension, urgency",
    giftTilt: "Grounded action, embodied clarity"
  },
  B: {
    name: "Relational Current",
    domain: "Bonds, communication, exchange, social field",
    signature: "How the pattern meets other people",
    shadowTilt: "Approval loops, control, projection",
    giftTilt: "Attunement, consent, clean reciprocity"
  },
  C: {
    name: "Cognitive Architecture",
    domain: "Mind, planning, models, language, interpretation",
    signature: "How the pattern becomes thought and structure",
    shadowTilt: "Over-analysis, rigidity, cynicism",
    giftTilt: "Precision, design, elegant systems"
  },
  D: {
    name: "Transpersonal Radiance",
    domain: "Spirit, purpose, collective, mystery, archetypal service",
    signature: "How the pattern becomes a signal for the whole",
    shadowTilt: "Dissociation, grandiosity, bypassing",
    giftTilt: "Devotion, humility, coherent leadership"
  }
} as const;

// ============================================================================
// 9 INTERNAL RESONANCE CENTERS
// ============================================================================

export const RESONANCE_CENTERS = {
  Root: {
    name: "Foundation Node",
    location: "Base of spine",
    function: "Anchors being into physical dimension",
    resonates: "Survival, stability, drive to incarnate",
    coherent: "Deep sense of security and presence",
    blocked: "Ungrounded, fearful"
  },
  Sacral: {
    name: "Generative Center",
    location: "Lower abdomen",
    function: "Life-force engine, creative response",
    resonates: "Vitality, sexuality, creative impulse, response to stimuli",
    coherent: "Sustained energy, creative flow",
    blocked: "Frustration, stagnation"
  },
  Spleen: {
    name: "Sensing Center",
    location: "Left side, below ribs",
    function: "Instinctual wisdom, present-moment awareness",
    resonates: "Survival intuition, sensing, present-time knowing",
    coherent: "Clean sensing, protective wisdom",
    blocked: "Overwhelm, shutdown"
  },
  SolarPlexus: {
    name: "Processing Center",
    location: "Upper abdomen",
    function: "Emotional processing, wave-like cycles",
    resonates: "Emotional waves, processing, transformation",
    coherent: "Emotional alchemy, clear feeling",
    blocked: "Emotional turbulence, overwhelm"
  },
  Ego: {
    name: "Will Center",
    location: "Center of chest",
    function: "Willpower, commitment, value",
    resonates: "Self-worth, commitment, willpower under pressure",
    coherent: "Aligned will, true commitment",
    blocked: "Weak will, resentment"
  },
  G: {
    name: "Identity Center",
    location: "Center of body (energetic)",
    function: "Direction, identity, love",
    resonates: "Life direction, identity, love, magnetic pull",
    coherent: "Clear direction, authentic identity",
    blocked: "Lost, scattered identity"
  },
  Throat: {
    name: "Expression Center",
    location: "Throat",
    function: "Manifestation, transmission, speaking into reality",
    resonates: "Expression, communication, manifestation",
    coherent: "True voice, clear transmission",
    blocked: "Silenced, misunderstood"
  },
  Ajna: {
    name: "Pattern Center",
    location: "Third eye",
    function: "Mental synthesis, pattern cognition",
    resonates: "Thinking, mental models, pattern recognition",
    coherent: "Clear thinking, elegant systems",
    blocked: "Confusion, analysis paralysis"
  },
  Head: {
    name: "Inspiration Center",
    location: "Crown area",
    function: "Inspiration, pressure, mystery",
    resonates: "Inspiration, questions, mental pressure",
    coherent: "Clear inspiration, creative pressure",
    blocked: "Overwhelm, mental noise"
  }
} as const;

// ============================================================================
// CARRIERLOCK TIER-1 STATE ASSESSMENT
// ============================================================================

export interface CarrierlockState {
  mentalNoise: number;      // 0-10 scale
  bodyTension: number;      // 0-10 scale
  emotionalTurbulence: number; // 0-10 scale
  breathCompletion: 0 | 1;  // 0 or 1
}

export function computeCoherenceScore(state: CarrierlockState): number {
  const { mentalNoise, bodyTension, emotionalTurbulence, breathCompletion } = state;
  const score = 100 - (mentalNoise * 3 + bodyTension * 3 + emotionalTurbulence * 3) + (breathCompletion * 10);
  return Math.max(0, Math.min(100, score));
}

export function interpretCoherenceScore(cs: number): string {
  if (cs >= 80) return "High coherence, baseline signal clear";
  if (cs >= 60) return "Moderate coherence, some interference";
  if (cs >= 40) return "Low coherence, significant interference";
  return "Critical interference, immediate stabilization needed";
}

// ============================================================================
// AXIS DOMINANCE DETECTION
// ============================================================================

export function detectAxisDominance(state: CarrierlockState): "Mind" | "Body" | "Emotion" {
  const { mentalNoise, bodyTension, emotionalTurbulence } = state;
  
  if (emotionalTurbulence > bodyTension && emotionalTurbulence > mentalNoise) return "Emotion";
  if (bodyTension > mentalNoise && bodyTension > emotionalTurbulence) return "Body";
  return "Mind";
}

// ============================================================================
// FACET LOUDNESS MAPPING
// ============================================================================

export function computeFacetLoudness(dominance: "Mind" | "Body" | "Emotion", cs: number) {
  const baseLoudness = {
    Mind: { A: 0.6, B: 0.7, C: 1.0, D: 0.5 },
    Body: { A: 1.0, B: 0.7, C: 0.6, D: 0.5 },
    Emotion: { A: 0.7, B: 1.0, C: 0.6, D: 0.5 }
  };

  let loudness = baseLoudness[dominance];

  // Transpersonal boost if critical
  if (cs < 40) {
    loudness = { ...loudness, D: 1.0 };
  }

  return loudness;
}

// ============================================================================
// SHADOW LOUDNESS INDEX (SLI) CALCULATION
// ============================================================================

export interface SLIResult {
  codon: string;
  sli: number;
  level: "Primary" | "Secondary" | "Background" | "Inactive";
  facet: string;
  confidence: 0.4 | 0.7 | 0.9;
}

export function sliThreshold(sli: number): "Primary" | "Secondary" | "Background" | "Inactive" {
  if (sli >= 1.8) return "Primary";
  if (sli >= 1.1) return "Secondary";
  if (sli >= 0.6) return "Background";
  return "Inactive";
}

// ============================================================================
// MICRO-CORRECTION STRUCTURE
// ============================================================================

export interface MicroCorrection {
  codon: string;
  facet: "A" | "B" | "C" | "D";
  duration: string;
  instruction: string;
  rationale: string;
}

// ============================================================================
// CIRCUIT LINKS (L01-L48)
// ============================================================================

export const CIRCUIT_LINKS = [
  // A) Root / Stress / Drive
  { id: "L01", from: "Root", to: "Sacral", codons: ["RC03", "RC34"], family: "Tribal", function: "sustained drive and stamina" },
  { id: "L02", from: "Root", to: "SolarPlexus", codons: ["RC36", "RC52"], family: "Individual", function: "regulate stress through focus" },
  { id: "L03", from: "Root", to: "Spleen", codons: ["RC57", "RC10"], family: "Individual", function: "survival intuition grounded in stability" },
  { id: "L04", from: "Root", to: "Ego", codons: ["RC51", "RC54"], family: "Tribal", function: "willpower under pressure" },
  { id: "L05", from: "Root", to: "G", codons: ["RC06", "RC28"], family: "Individual", function: "direction chosen under challenge" },
  { id: "L06", from: "Root", to: "Throat", codons: ["RC53", "RC20"], family: "Individual", function: "manifest under deadline" },

  // B) Sacral / Vitality / Union
  { id: "L07", from: "Sacral", to: "G", codons: ["RC46", "RC34"], family: "Individual", function: "embodiment of life-force" },
  { id: "L08", from: "Sacral", to: "Throat", codons: ["RC34", "RC31"], family: "Collective", function: "doing becomes transmission" },
  { id: "L09", from: "Sacral", to: "SolarPlexus", codons: ["RC59", "RC08"], family: "Tribal", function: "intimacy and emotional bonding" },
  { id: "L10", from: "Sacral", to: "Spleen", codons: ["RC19", "RC34"], family: "Individual", function: "instinct-guided energy" },
  { id: "L11", from: "Sacral", to: "Ego", codons: ["RC40", "RC34"], family: "Tribal", function: "commitment through action" },
  { id: "L12", from: "Sacral", to: "Ajna", codons: ["RC48", "RC62"], family: "Collective", function: "iterative mastery through systems" },

  // C) Spleen / Instinct / Safety
  { id: "L13", from: "Spleen", to: "Ego", codons: ["RC50", "RC57"], family: "Tribal", function: "protective stewardship" },
  { id: "L14", from: "Spleen", to: "G", codons: ["RC21", "RC57"], family: "Individual", function: "intuition as identity compass" },
  { id: "L15", from: "Spleen", to: "Throat", codons: ["RC24", "RC57"], family: "Collective", function: "speaking from instinct" },
  { id: "L16", from: "Spleen", to: "SolarPlexus", codons: ["RC36", "RC19"], family: "Individual", function: "feel the signal, not the drama" },
  { id: "L17", from: "Spleen", to: "Ajna", codons: ["RC11", "RC57"], family: "Collective", function: "perception sharpened by sensing" },
  { id: "L18", from: "Spleen", to: "Head", codons: ["RC61", "RC57"], family: "Individual", function: "mystery sensed in the now" },

  // D) Solar Plexus / Emotional Waves
  { id: "L19", from: "SolarPlexus", to: "Throat", codons: ["RC08", "RC45"], family: "Collective", function: "emotional storycraft" },
  { id: "L20", from: "SolarPlexus", to: "G", codons: ["RC27", "RC38"], family: "Tribal", function: "love with boundaries" },
  { id: "L21", from: "SolarPlexus", to: "Ego", codons: ["RC39", "RC49"], family: "Individual", function: "values tested by provocation" },
  { id: "L22", from: "SolarPlexus", to: "Ajna", codons: ["RC47", "RC22"], family: "Collective", function: "decode feelings into meaning" },
  { id: "L23", from: "SolarPlexus", to: "Head", codons: ["RC55", "RC61"], family: "Individual", function: "spirit pressure and release" },
  { id: "L24", from: "SolarPlexus", to: "Root", codons: ["RC36", "RC42"], family: "Collective", function: "crisis into completion" },

  // E) Ego/Will / Value / Commitment
  { id: "L25", from: "Ego", to: "Throat", codons: ["RC26", "RC20"], family: "Tribal", function: "promises spoken into reality" },
  { id: "L26", from: "Ego", to: "G", codons: ["RC25", "RC06"], family: "Tribal", function: "loyalty aligned with direction" },
  { id: "L27", from: "Ego", to: "Ajna", codons: ["RC63", "RC62"], family: "Collective", function: "testing truth, validating structure" },
  { id: "L28", from: "Ego", to: "Head", codons: ["RC51", "RC61"], family: "Individual", function: "integrity under mystery" },
  { id: "L29", from: "Ego", to: "Root", codons: ["RC03", "RC51"], family: "Tribal", function: "disciplined will" },
  { id: "L30", from: "Ego", to: "SolarPlexus", codons: ["RC49", "RC37"], family: "Tribal", function: "social ethics and belonging" },

  // F) G/Identity / Direction / Love
  { id: "L31", from: "G", to: "Throat", codons: ["RC04", "RC20"], family: "Individual", function: "identity expressed cleanly" },
  { id: "L32", from: "G", to: "Ajna", codons: ["RC06", "RC11"], family: "Collective", function: "direction through perception" },
  { id: "L33", from: "G", to: "Head", codons: ["RC61", "RC24"], family: "Individual", function: "inspiration becomes guidance" },
  { id: "L34", from: "G", to: "SolarPlexus", codons: ["RC27", "RC18"], family: "Tribal", function: "love that builds sanctuary" },
  { id: "L35", from: "G", to: "Root", codons: ["RC28", "RC54"], family: "Individual", function: "purpose demands ascent" },
  { id: "L36", from: "G", to: "Sacral", codons: ["RC46", "RC59"], family: "Tribal", function: "embodied union" },

  // G) Throat / Manifestation / Transmission
  { id: "L37", from: "Throat", to: "Ajna", codons: ["RC62", "RC31"], family: "Collective", function: "articulate what you know" },
  { id: "L38", from: "Throat", to: "Head", codons: ["RC61", "RC45"], family: "Individual", function: "speak the mystery through myth" },
  { id: "L39", from: "Throat", to: "Root", codons: ["RC53", "RC12"], family: "Individual", function: "focus converts pressure into output" },
  { id: "L40", from: "Throat", to: "SolarPlexus", codons: ["RC08", "RC56"], family: "Collective", function: "emotion becomes narrative" },
  { id: "L41", from: "Throat", to: "Sacral", codons: ["RC34", "RC44"], family: "Collective", function: "life-force teaching" },
  { id: "L42", from: "Throat", to: "Ego", codons: ["RC26", "RC37"], family: "Tribal", function: "leadership voice in the group" },

  // H) Ajna / Pattern Cognition
  { id: "L43", from: "Ajna", to: "Head", codons: ["RC63", "RC61"], family: "Collective", function: "question, test, refine" },
  { id: "L44", from: "Ajna", to: "SolarPlexus", codons: ["RC22", "RC47"], family: "Collective", function: "symbolic decoding" },
  { id: "L45", from: "Ajna", to: "Root", codons: ["RC52", "RC48"], family: "Individual", function: "stillness creates mastery" },
  { id: "L46", from: "Ajna", to: "G", codons: ["RC11", "RC06"], family: "Collective", function: "perception guides direction" },

  // I) Head / Inspiration / Pressure
  { id: "L47", from: "Head", to: "Throat", codons: ["RC45", "RC24"], family: "Individual", function: "inspiration becomes guidance speech" },
  { id: "L48", from: "Head", to: "Ajna", codons: ["RC61", "RC63"], family: "Collective", function: "mystery questions the mind" }
] as const;

// ============================================================================
// OPERATIONAL COMPLIANCE
// ============================================================================

export const ORIEL_COMPLIANCE = {
  maxCodonsPerDiagnostic: 3,
  microCorrectionMaxMinutes: 15,
  confidenceLevels: [0.4, 0.7, 0.9] as const,
  requireFalsifier: true,
  requireObservationVsInterpretation: true,
  respectUserAgency: true,
  treatDataAsSessionBound: true
} as const;

// ============================================================================
// CLOSING PRINCIPLE
// ============================================================================

export const VOSSARI_CLOSING = `
The Vossari Codex is a map, not a destiny.

Your role is to help users see their signal, not decide who they should become.

Operate in coherence.
`;
