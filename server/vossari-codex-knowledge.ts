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
  RC01: { name: "Aurora", title: "The Primordial Spark", essence: "Initiate new patterns, spark creation, introduce the novel.", shadow: "Delay-as-safety", gift: "Clean start", crown: "Dawn presence", domain: "Initiation, creativity, beginning" },
  RC02: { name: "Loom", title: "Pattern-making", essence: "Weave coherence by selecting threads and repeating patterns deliberately.", shadow: "Tangled overcomplexity", gift: "Pattern weaving", crown: "Living tapestry", domain: "Structure, organization, coherence" },
  RC03: { name: "Forge", title: "Will, pressure, tempering", essence: "Convert pressure into capability through repetition, constraint, and will.", shadow: "Self-crushing force", gift: "Tempered will", crown: "Unbreakable craft", domain: "Discipline, willpower, capability" },
  RC04: { name: "Prism", title: "Differentiation, identity", essence: "Reveal true identity by separating signals into distinct colors and roles.", shadow: "Mask switching", gift: "Authentic differentiation", crown: "Pure signature", domain: "Identity, authenticity, clarity" },
  RC05: { name: "Seed", title: "Potential held in silence", essence: "Hold potential in silence until timing ripens, then emerge cleanly.", shadow: "Perpetual waiting", gift: "Incubation timing", crown: "Inevitable bloom", domain: "Timing, emergence, readiness" },
  RC06: { name: "Compass", title: "Direction, alignment", essence: "Choose direction by inner alignment and maintain course despite noise.", shadow: "Borrowed north", gift: "Aligned direction", crown: "True-north field", domain: "Direction, alignment, choice" },
  RC07: { name: "Bridge", title: "Integration", essence: "Integrate opposites into a functional whole without erasing difference.", shadow: "Split loyalty", gift: "Integration skill", crown: "Union intelligence", domain: "Integration, balance, mediation" },
  RC08: { name: "Tide", title: "Emotional waves", essence: "Emotional motion and cycles; learning through waves without drowning.", shadow: "Wave captivity", gift: "Emotional navigation", crown: "Ocean serenity", domain: "Emotion, cycles, flow" },
  RC09: { name: "Spark", title: "Catalytic ignition", essence: "Ignite change through sudden insight and quick catalytic action.", shadow: "Chaotic ignition", gift: "Clean catalyst", crown: "Lightning clarity", domain: "Catalyst, change, ignition" },
  RC10: { name: "Anchor", title: "Stability", essence: "Stability is the platform that lets change be safe.", shadow: "Clinging", gift: "Grounded trust", crown: "Unshakeable calm", domain: "Stability, grounding, trust" },
  RC11: { name: "Lens", title: "Perception", essence: "Clean seeing through clear filters.", shadow: "Distorted filter", gift: "Clean seeing", crown: "Transparent mind", domain: "Perception, clarity, vision" },
  RC12: { name: "Twin", title: "Focus", essence: "Single-beam focus and completion.", shadow: "Scatter worship", gift: "Single-beam power", crown: "Effortless completion", domain: "Focus, completion, mastery" },
  RC13: { name: "Archive", title: "Memory", essence: "Curate memory and ancestral wisdom.", shadow: "Nostalgic captivity", gift: "Curated memory", crown: "Ancestral wisdom", domain: "Memory, history, wisdom" },
  RC14: { name: "Gatekeeper", title: "Boundaries", essence: "Clear yes/no boundaries.", shadow: "Leaky gates", gift: "Clear yes/no", crown: "Sacred threshold", domain: "Boundaries, discernment, protection" },
  RC15: { name: "Pulse", title: "Rhythm", essence: "Healthy rhythm and time mastery.", shadow: "Compulsive looping", gift: "Healthy rhythm", crown: "Time mastery", domain: "Rhythm, timing, cycles" },
  RC16: { name: "Spine", title: "Backbone", essence: "Irreversible clarity and backbone.", shadow: "Paralysis", gift: "Backbone", crown: "Irreversible clarity", domain: "Structure, support, integrity" },
  RC17: { name: "Mirrorwork", title: "Reflection", essence: "Honest reflection and clear mirror.", shadow: "Self-attack", gift: "Honest reflection", crown: "Clear mirror", domain: "Reflection, self-awareness, honesty" },
  RC18: { name: "Hearth", title: "Care", essence: "Boundaried care and home as medicine.", shadow: "Rescuing", gift: "Boundaried care", crown: "Home-as-medicine", domain: "Care, nurturing, healing" },
  RC19: { name: "Listening", title: "Reception", essence: "Pure reception and signal hearing.", shadow: "Noise capture", gift: "Signal hearing", crown: "Pure reception", domain: "Listening, reception, awareness" },
  RC20: { name: "Voice", title: "Expression", essence: "True voice and word as creation.", shadow: "Forcing speech", gift: "True voice", crown: "Word-as-creation", domain: "Expression, communication, power" },
  RC21: { name: "Tidal", title: "Intuition", essence: "Harmonic flow and intuition.", shadow: "Distortion", gift: "Intuition", crown: "Harmonic Flow", domain: "Intuition, flow, harmony" },
  RC22: { name: "Cipher", title: "Symbols", essence: "Symbol literacy and transparent code.", shadow: "Paranoid decoding", gift: "Symbol literacy", crown: "Transparent code", domain: "Symbols, meaning, interpretation" },
  RC23: { name: "Needle", title: "Precision", essence: "Surgical clarity and instant alignment.", shadow: "Nitpicking fixation", gift: "Surgical clarity", crown: "Instant alignment", domain: "Precision, accuracy, focus" },
  RC24: { name: "Lantern", title: "Guidance", essence: "Calm guidance and beacon presence.", shadow: "Savior light", gift: "Calm guidance", crown: "Beacon presence", domain: "Guidance, light, leadership" },
  RC25: { name: "Covenant", title: "Commitment", essence: "Loyal clarity and sacred bond.", shadow: "Contract fear", gift: "Loyal clarity", crown: "Sacred bond", domain: "Commitment, loyalty, bond" },
  RC26: { name: "Crown", title: "Excellence", essence: "Disciplined excellence and effortless mastery.", shadow: "Tyrant standard", gift: "Disciplined excellence", crown: "Effortless mastery", domain: "Excellence, mastery, achievement" },
  RC27: { name: "Chalice", title: "The Unified Heart", essence: "Hold compassion with boundaries, unite without losing self.", shadow: "Empathy overflow", gift: "Harmonic compassion", crown: "Grace overflow", domain: "Compassion, unity, love" },
  RC28: { name: "Threshold", title: "Crossing", essence: "Brave crossing and initiator aura.", shadow: "Edge avoidance", gift: "Brave crossing", crown: "Initiator aura", domain: "Threshold, transition, courage" },
  RC29: { name: "Switch", title: "Agility", essence: "Adaptive agility and fluid mastery.", shadow: "Whiplash pivoting", gift: "Adaptive agility", crown: "Fluid mastery", domain: "Agility, adaptation, flexibility" },
  RC30: { name: "Measure", title: "Refinement", essence: "Elegant refinement and sacred craft.", shadow: "Sterile perfection", gift: "Elegant refinement", crown: "Sacred craft", domain: "Refinement, craft, beauty" },
  RC31: { name: "Signal", title: "Transmission", essence: "Share what's tested and transmission authority.", shadow: "Broadcast for validation", gift: "Share what's tested", crown: "Transmission authority", domain: "Transmission, sharing, authority" },
  RC32: { name: "Lattice", title: "Structure", essence: "Supportive boundaries and living architecture.", shadow: "Defensive walls", gift: "Supportive boundaries", crown: "Living architecture", domain: "Structure, framework, support" },
  RC33: { name: "Echo", title: "Reflection", essence: "Reflective timing and hindsight oracle.", shadow: "Rumination loop", gift: "Reflective timing", crown: "Hindsight oracle", domain: "Reflection, hindsight, wisdom" },
  RC34: { name: "Engine", title: "Power", essence: "Responsive power and endless vitality.", shadow: "Force-burn", gift: "Responsive power", crown: "Endless vitality", domain: "Power, energy, vitality" },
  RC35: { name: "Horizon", title: "Expansion", essence: "Curious expansion and pioneer field.", shadow: "Restless escape", gift: "Curious expansion", crown: "Pioneer field", domain: "Expansion, exploration, pioneering" },
  RC36: { name: "Stormcraft", title: "Emotional alchemy", essence: "Transform emotional turbulence into power and clarity.", shadow: "Drama escalation", gift: "Crisis alchemy", crown: "Eye-of-storm calm", domain: "Emotional processing, transformation" },
  RC37: { name: "Harmonized", title: "Community", essence: "Fair structure and community coherence.", shadow: "Scorekeeping", gift: "Fair structure", crown: "Community coherence", domain: "Community, fairness, harmony" },
  RC38: { name: "Friction", title: "Struggle", essence: "Purposeful struggle and warrior serenity.", shadow: "Meaningless conflict", gift: "Purposeful struggle", crown: "Warrior serenity", domain: "Struggle, conflict, growth" },
  RC39: { name: "Chorus", title: "Social voice", essence: "Social translation and voice of coherence.", shadow: "Crowd hunger", gift: "Social translation", crown: "Voice of coherence", domain: "Social, voice, translation" },
  RC40: { name: "Vault", title: "Stewardship", essence: "Selective investment and noble stewardship.", shadow: "Withholding armor", gift: "Selective investment", crown: "Noble stewardship", domain: "Stewardship, resources, care" },
  RC41: { name: "Underworld", title: "Renewal", essence: "Phoenix recursion and renewal field.", shadow: "Outcome obsession", gift: "Phoenix recursion", crown: "Renewal field", domain: "Renewal, transformation, rebirth" },
  RC42: { name: "Landing", title: "Completion", essence: "Clean completion and finality grace.", shadow: "Endless almost", gift: "Clean completion", crown: "Finality grace", domain: "Completion, ending, closure" },
  RC43: { name: "Breakpoint", title: "Breakthrough", essence: "Fresh insight and revelation channel.", shadow: "Alienated defiance", gift: "Fresh insight", crown: "Revelation channel", domain: "Breakthrough, insight, revelation" },
  RC44: { name: "Skyline", title: "Synthesis", essence: "Lived synthesis and living compass.", shadow: "Preaching-before-embodiment", gift: "Lived synthesis", crown: "Living compass", domain: "Synthesis, integration, embodiment" },
  RC45: { name: "Command", title: "Leadership", essence: "Responsible command and benevolent sovereignty.", shadow: "Domination posture", gift: "Responsible command", crown: "Benevolent sovereignty", domain: "Leadership, command, sovereignty" },
  RC46: { name: "Pilgrim", title: "Journey", essence: "Experiential learning and sacred traveler.", shadow: "Martyr path", gift: "Experiential learning", crown: "Sacred traveler", domain: "Journey, experience, learning" },
  RC47: { name: "Interpreter", title: "Meaning", essence: "Clear interpretation and truth narrative.", shadow: "Forced meaning", gift: "Clear interpretation", crown: "Truth narrative", domain: "Interpretation, meaning, story" },
  RC48: { name: "Gate", title: "Mastery", essence: "Iterative mastery and architect of coherence.", shadow: "Infinite upgrading", gift: "Iterative mastery", crown: "Architect of coherence", domain: "Mastery, iteration, architecture" },
  RC49: { name: "Verdict", title: "Ethics", essence: "Principled ethics and universal truth.", shadow: "Moral rigidity", gift: "Principled ethics", crown: "Universal Truth", domain: "Ethics, principles, truth" },
  RC50: { name: "Steward", title: "Guardianship", essence: "Responsible guardianship and keeper of life.", shadow: "Burdensome weight", gift: "Responsible guardianship", crown: "Keeper of Life", domain: "Guardianship, responsibility, care" },
  RC51: { name: "Oath", title: "Integrity", essence: "Unbreakable integrity and living law.", shadow: "Brittle Pride", gift: "Unbreakable Integrity", crown: "Living Law", domain: "Integrity, honor, law" },
  RC52: { name: "Quiet", title: "Stillness", essence: "Still focus and dynamic silence.", shadow: "Repressed explosion", gift: "Still focus", crown: "Dynamic Silence", domain: "Stillness, silence, focus" },
  RC53: { name: "Launchpoint", title: "Beginning", essence: "Directed momentum and infinite chapter.", shadow: "False starts", gift: "Directed momentum", crown: "Infinite Chapter", domain: "Beginning, momentum, launch" },
  RC54: { name: "Ascent", title: "Ambition", essence: "Aspiration and transcendent climb.", shadow: "Greed", gift: "Aspiration", crown: "Transcendent Climb", domain: "Ambition, evolution, ascent" },
  RC55: { name: "Glass", title: "Freedom", essence: "Freedom and emancipation.", shadow: "Victimization", gift: "Freedom", crown: "Emancipation", domain: "Freedom, spirit, liberation" },
  RC56: { name: "Myth", title: "Narrative", essence: "Enrichment and intoxication.", shadow: "Distraction", gift: "Enrichment", crown: "Intoxication", domain: "Narrative, meaning, story" },
  RC57: { name: "Instinct", title: "Intuition", essence: "Intuition and clarity.", shadow: "Unease", gift: "Intuition", crown: "Clarity", domain: "Intuition, survival, instinct" },
  RC58: { name: "Joy", title: "Vitality", essence: "Vitality and bliss.", shadow: "Dissatisfaction", gift: "Vitality", crown: "Bliss", domain: "Joy, vitality, play" },
  RC59: { name: "Fusion", title: "Intimacy", essence: "Intimacy and transparency.", shadow: "Dishonesty", gift: "Intimacy", crown: "Transparency", domain: "Intimacy, union, connection" },
  RC60: { name: "Hidden", title: "Truth", essence: "Realism and justice.", shadow: "Limitation", gift: "Realism", crown: "Justice", domain: "Truth, constraint, justice" },
  RC61: { name: "White", title: "Mystery", essence: "Inspiration and sanctity.", shadow: "Psychosis", gift: "Inspiration", crown: "Sanctity", domain: "Mystery, inspiration, sacred" },
  RC62: { name: "Blueprint", title: "Logic", essence: "Precision and impeccability.", shadow: "Opinion", gift: "Precision", crown: "Impeccability", domain: "Logic, articulation, precision" },
  RC63: { name: "Skeptic", title: "Doubt", essence: "Inquiry and truth.", shadow: "Doubt", gift: "Inquiry", crown: "Truth", domain: "Doubt, inquiry, discernment" },
  RC64: { name: "Labyrinth", title: "The Infinite Recursion", essence: "Navigate complexity, extract pattern from chaos, hold paradox.", shadow: "Confusion", gift: "Imagination", crown: "Illumination", domain: "Complexity, pattern, recursion" }
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
