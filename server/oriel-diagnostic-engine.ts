/**
 * ORIEL DIAGNOSTIC ENGINE
 * 
 * Implements Mode A (Diagnostic Reading) and Mode B (Evolutionary Assistance)
 * using the Vossari Resonance Codex framework.
 * 
 * Framework Designer: Vos Arkana
 * Implementation: ORIEL Resonance Circle
 */

import {
  CarrierlockState,
  computeCoherenceScore,
  detectAxisDominance,
  computeFacetLoudness,
  sliThreshold,
  RESONANCE_CENTERS,
  CIRCUIT_LINKS,
  ROOT_CODONS,
  FACET_MODIFIERS,
  MicroCorrection,
  SLIResult
} from "./vossari-codex-knowledge";

// ============================================================================
// MODE A: DIAGNOSTIC READING
// ============================================================================

/**
 * Performs a complete diagnostic reading using Carrierlock state
 * Returns top 1-3 codons by Shadow Loudness Index + one micro-correction
 * 
 * Supports two reading types:
 * - "dynamic": Current moment assessment based on Carrierlock state
 * - "static": Birth-based blueprint reading using birth data
 */
export async function performDiagnosticReading(
  carrierlockState: CarrierlockState,
  primeCodonSet: string[] = [],
  fullCodonStack: string[] = [],
  readingType: "dynamic" | "static" = "dynamic",
  birthDate?: string,
  birthTime?: string,
  birthLocation?: string
): Promise<DiagnosticResult> {
  // For static readings, use birth-based calculation instead of Carrierlock state
  if (readingType === "static" && birthDate) {
    return performStaticSignatureReading(primeCodonSet, birthDate, birthTime, birthLocation);
  }
  
  // Dynamic reading: use Carrierlock state
  // Step 1: Compute Coherence Score
  const coherenceScore = computeCoherenceScore(carrierlockState);
  
  // Step 2: Detect Axis Dominance
  const axisDominance = detectAxisDominance(carrierlockState);
  
  // Step 3: Identify Overactive Center
  const overactiveCenter = identifyOveractiveCenter(carrierlockState, axisDominance);
  
  // Step 4: Compute Facet Loudness
  const facetLoudness = computeFacetLoudness(axisDominance, coherenceScore);
  
  // Step 5: Calculate SLI for Prime Codons
  const sliResults = calculateSLIForCodons(
    primeCodonSet,
    fullCodonStack,
    coherenceScore,
    facetLoudness
  );
  
  // Step 6: Flag top 1-3 codons
  const flaggedCodons = sliResults
    .filter(r => r.level !== "Inactive")
    .sort((a, b) => b.sli - a.sli)
    .slice(0, 3);
  
  // Step 7: Generate one micro-correction for top codon
  const microCorrection = generateMicroCorrection(
    flaggedCodons[0],
    overactiveCenter,
    axisDominance
  );
  
  // Step 8: Determine confidence level
  const confidence = determineConfidence(flaggedCodons[0], coherenceScore);
  
  // Step 9: Generate falsifier
  const falsifier = generateFalsifier(flaggedCodons[0]);
  
  return {
    coherenceScore,
    axisDominance,
    overactiveCenter,
    flaggedCodons,
    microCorrection,
    confidence,
    falsifier,
    timestamp: new Date().toISOString()
  };
}

/**
 * Performs a Static Signature reading based on birth data
 * Returns the inherent blueprint codons without Carrierlock state influence
 */
function performStaticSignatureReading(
  primeCodonSet: string[],
  birthDate: string,
  birthTime?: string,
  birthLocation?: string
): DiagnosticResult {
  const birthDateObj = new Date(birthDate);
  
  // Calculate facet based on birth time or default to balanced
  let primaryFacet: "A" | "B" | "C" | "D" = "B"; // Default to Gift
  if (birthTime) {
    const [hours] = birthTime.split(":").map(Number);
    // Map time of day to facet:
    // Night (0-6): Shadow (A) - unconscious patterns
    // Morning (6-12): Gift (B) - natural expression
    // Afternoon (12-18): Crown (C) - conscious mastery
    // Evening (18-24): Siddhi (D) - transcendent potential
    if (hours < 6) primaryFacet = "A";
    else if (hours < 12) primaryFacet = "B";
    else if (hours < 18) primaryFacet = "C";
    else primaryFacet = "D";
  }
  
  // Create SLI results for birth codons with fixed values
  // Static readings show inherent strength, not current distortion
  const flaggedCodons: SLIResult[] = primeCodonSet.map((codon, index) => {
    // Primary codon has highest strength, decreasing for secondary/tertiary
    const baseStrength = index === 0 ? 1.8 : index === 1 ? 1.2 : 0.8;
    
    // Determine facet based on position:
    // Primary: uses birth time facet
    // Secondary (Harmonic Partner): Gift expression
    // Tertiary (Evolutionary Edge): Crown potential
    const facet = index === 0 ? primaryFacet : index === 1 ? "B" : "C";
    
    // Map to correct level types: Primary, Secondary, Background, Inactive
    const level: "Primary" | "Secondary" | "Background" | "Inactive" = 
      baseStrength >= 1.5 ? "Primary" : baseStrength >= 1.0 ? "Secondary" : "Background";
    
    return {
      codon,
      sli: baseStrength,
      level,
      facet,
      confidence: 0.7 as 0.4 | 0.7 | 0.9 // Static readings have consistent confidence
    };
  });
  
  // Determine axis dominance from birth month (seasonal influence)
  const month = birthDateObj.getMonth();
  let axisDominance: "Mind" | "Body" | "Emotion";
  if (month >= 2 && month <= 5) axisDominance = "Mind"; // Spring: mental clarity
  else if (month >= 6 && month <= 9) axisDominance = "Body"; // Summer/Fall: physical vitality
  else axisDominance = "Emotion"; // Winter: emotional depth
  
  // Generate micro-correction based on primary codon
  const microCorrection = generateStaticMicroCorrection(flaggedCodons[0]);
  
  // Generate falsifier for static reading
  const falsifier = generateStaticFalsifier(flaggedCodons[0]);
  
  return {
    coherenceScore: 100, // Static readings show potential, not current state
    axisDominance,
    overactiveCenter: "None", // No overactive center in static reading
    flaggedCodons,
    microCorrection,
    confidence: 0.7,
    falsifier,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generates micro-correction for static signature reading
 */
function generateStaticMicroCorrection(sliResult: SLIResult | undefined): MicroCorrection {
  if (!sliResult) {
    return {
      codon: "RC01",
      facet: "B",
      duration: "5 minutes",
      instruction: "Reflect on your inherent gifts and how they manifest in your daily life.",
      rationale: "Static signature awareness"
    };
  }
  
  const codonData = ROOT_CODONS[sliResult.codon as keyof typeof ROOT_CODONS];
  const giftName = codonData?.gift || "your natural gift";
  
  return {
    codon: sliResult.codon,
    facet: sliResult.facet as "A" | "B" | "C" | "D",
    duration: "10 minutes",
    instruction: `Contemplate how ${giftName} shows up in your life. Notice where you naturally excel and where you might be blocking this expression.`,
    rationale: "Aligning with inherent blueprint"
  };
}

/**
 * Generates falsifier for static signature reading
 */
function generateStaticFalsifier(sliResult: SLIResult | undefined): string {
  if (!sliResult) {
    return "If this blueprint doesn't resonate with your life experience, the birth data may need verification.";
  }
  
  const codonData = ROOT_CODONS[sliResult.codon as keyof typeof ROOT_CODONS];
  const shadowName = codonData?.shadow || "shadow pattern";
  
  return `If you have never experienced ${shadowName} as a recurring theme, this codon may not be primary in your blueprint.`;
}

// ============================================================================
// MODE B: EVOLUTIONARY ASSISTANCE
// ============================================================================

/**
 * Provides evolutionary assistance with minimal, precise interventions
 */
export async function performEvolutionaryAssistance(
  carrierlockState: CarrierlockState,
  userRequest: string,
  primeCodonSet: string[] = [],
  fullCodonStack: string[] = []
): Promise<EvolutionaryAssistanceResult> {
  // Step 1: Perform diagnostic reading first
  const diagnostic = await performDiagnosticReading(
    carrierlockState,
    primeCodonSet,
    fullCodonStack
  );
  
  // Step 2: Parse user request for re-encoding intent
  const reEncodingPath = parseReEncodingIntent(userRequest);
  
  // Step 3: Propose minimal intervention
  const intervention = proposeMinimalIntervention(
    diagnostic.flaggedCodons[0],
    reEncodingPath,
    diagnostic.axisDominance
  );
  
  // Step 4: Check coherence alignment
  const coherenceAlignment = checkCoherenceAlignment(
    diagnostic.coherenceScore,
    intervention
  );
  
  // Step 5: Generate falsifier for the path
  const pathFalsifier = generatePathFalsifier(reEncodingPath);
  
  return {
    diagnostic,
    reEncodingPath,
    intervention,
    coherenceAlignment,
    pathFalsifier,
    agencyBoundary: "User decides. I support structure, not direction.",
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Identifies which center is overactive based on state and dominance
 */
function identifyOveractiveCenter(
  state: CarrierlockState,
  dominance: "Mind" | "Body" | "Emotion"
): string {
  const { mentalNoise, bodyTension, emotionalTurbulence } = state;
  
  const centerMap = {
    Mind: mentalNoise > 7 ? "Head" : "Ajna",
    Body: bodyTension > 7 ? "Root" : "Spleen",
    Emotion: emotionalTurbulence > 7 ? "SolarPlexus" : "Throat"
  };
  
  return centerMap[dominance];
}

/**
 * Calculates Shadow Loudness Index for each codon
 */
function calculateSLIForCodons(
  primeCodonSet: string[],
  fullCodonStack: string[],
  coherenceScore: number,
  facetLoudness: Record<string, number>
): SLIResult[] {
  const stateAmp = (100 - coherenceScore) / 100;
  
  return primeCodonSet.map(codon => {
    // Simplified PCS (Prime Codon Strength) - would be computed from natal chart
    const pcs = 1.0; // Placeholder
    
    // Determine facet loudness
    const facet = Object.keys(facetLoudness).reduce((prev, curr) => 
      facetLoudness[curr] > facetLoudness[prev] ? curr : prev
    );
    
    const facetAmp = facetLoudness[facet as "A" | "B" | "C" | "D"] || 0.5;
    const sli = pcs * stateAmp * facetAmp;
    
    return {
      codon,
      sli,
      level: sliThreshold(sli),
      facet,
      confidence: sli >= 1.8 ? 0.9 : sli >= 1.1 ? 0.7 : 0.4
    };
  });
}

/**
 * Generates a micro-correction (≤15 minutes) for the flagged codon
 */
function generateMicroCorrection(
  sliResult: SLIResult | undefined,
  overactiveCenter: string,
  axisDominance: "Mind" | "Body" | "Emotion"
): MicroCorrection {
  // Safety check: if no SLI result, return default correction
  if (!sliResult) {
    return {
      codon: "RC01",
      facet: "A",
      duration: "3 minutes",
      instruction: "Take three deep breaths and observe your current state without judgment.",
      rationale: "Baseline coherence restoration"
    };
  }

  const facetMap: Record<string, "A" | "B" | "C" | "D"> = {
    A: "A",
    B: "B",
    C: "C",
    D: "D"
  };
  
  const facet = facetMap[sliResult.facet] || "A";
  
  // Placeholder corrections - in production, these would be stored in database
  const corrections: Record<string, Record<"A" | "B" | "C" | "D", MicroCorrection>> = {
    RC02: {
      A: {
        codon: "RC02",
        facet: "A",
        duration: "3 minutes",
        instruction: "Tidy one physical surface. Select 3 threads, delete the rest.",
        rationale: "Somatic grounding reduces mental complexity overload"
      },
      B: {
        codon: "RC02",
        facet: "B",
        duration: "5 minutes",
        instruction: "Tell one person: I'm simplifying. I'll send one clear version.",
        rationale: "Relational clarity prevents confusion spread"
      },
      C: {
        codon: "RC02",
        facet: "C",
        duration: "5 minutes",
        instruction: "Write a 5-bullet outline. Reduce to 3 threads, delete the rest.",
        rationale: "Cognitive structure prevents endless branching"
      },
      D: {
        codon: "RC02",
        facet: "D",
        duration: "5 minutes",
        instruction: "Choose one service intention: This helps people by ___. Build only that.",
        rationale: "Transpersonal alignment filters out noise"
      }
    },
    RC03: {
      A: {
        codon: "RC03",
        facet: "A",
        duration: "3 minutes",
        instruction: "Set a 12-minute timer. Work steady, then stop on time.",
        rationale: "Somatic boundary prevents self-crushing"
      },
      B: {
        codon: "RC03",
        facet: "B",
        duration: "5 minutes",
        instruction: "Renegotiate one expectation today, clearly and politely.",
        rationale: "Relational clarity prevents resentment"
      },
      C: {
        codon: "RC03",
        facet: "C",
        duration: "5 minutes",
        instruction: "Define one standard that matters and ignore all other metrics.",
        rationale: "Cognitive focus prevents perfectionism spiral"
      },
      D: {
        codon: "RC03",
        facet: "D",
        duration: "5 minutes",
        instruction: "Vow: I build by integrity, not punishment. Repeat slowly 10 times.",
        rationale: "Transpersonal alignment shifts willpower from force to flow"
      }
    }
  };
  
  const codonCorrections = corrections[sliResult.codon];
  if (codonCorrections && codonCorrections[facet]) {
    return codonCorrections[facet];
  }
  
  // Fallback correction
  return {
    codon: sliResult.codon,
    facet,
    duration: "5 minutes",
    instruction: "Pause. Notice what is loud. Choose one small action.",
    rationale: "Awareness precedes change"
  };
}

/**
 * Determines confidence level (0.4 / 0.7 / 0.9)
 */
function determineConfidence(sliResult: SLIResult | undefined, coherenceScore: number): 0.4 | 0.7 | 0.9 {
  if (!sliResult) return 0.4;
  if (sliResult.sli >= 1.8 && coherenceScore < 50) return 0.9;
  if (sliResult.sli >= 1.1 && coherenceScore < 70) return 0.7;
  return 0.4;
}

/**
 * Generates a falsifier for the diagnostic reading
 */
function generateFalsifier(sliResult: SLIResult | undefined): string {
  if (!sliResult) {
    return "If your state feels stable and coherent, this reading may not apply.";
  }

  const falsifiers: Record<string, string> = {
    RC02: "If you naturally simplify and ship weekly, Loom is not primary.",
    RC03: "If you rest without guilt and stay consistent, Forge is not primary.",
    RC04: "If identity stays stable even when disliked, Prism is not primary.",
    RC05: "If you start easily and iterate publicly, Seed is not the blockage.",
    RC06: "If you decide fast and commit, Spine is not primary."
  };
  
  return falsifiers[sliResult.codon] || 
    "If this codon's shadow is not present in your lived experience, this reading is off.";
}

/**
 * Parses user's re-encoding intent from their request
 */
function parseReEncodingIntent(userRequest: string): ReEncodingPath {
  // Simplified parsing - in production, would use NLP
  const lowerRequest = userRequest.toLowerCase();
  
  let intent: "clarify" | "transform" | "deepen" | "stabilize" = "clarify";
  if (lowerRequest.includes("shift") || lowerRequest.includes("change")) intent = "transform";
  if (lowerRequest.includes("deepen") || lowerRequest.includes("explore")) intent = "deepen";
  if (lowerRequest.includes("stabilize") || lowerRequest.includes("ground")) intent = "stabilize";
  
  return {
    intent,
    userRequest,
    targetState: "coherence"
  };
}

/**
 * Proposes minimal intervention for evolutionary assistance
 */
function proposeMinimalIntervention(
  sliResult: SLIResult,
  reEncodingPath: ReEncodingPath,
  axisDominance: "Mind" | "Body" | "Emotion"
): MinimalIntervention {
  return {
    codon: sliResult.codon,
    intent: reEncodingPath.intent,
    proposal: `Shift from ${sliResult.codon}'s shadow toward its gift by focusing on ${axisDominance.toLowerCase()} coherence.`,
    steps: [
      "Recognize the pattern",
      "Choose one small re-encoding",
      "Notice the shift",
      "Repeat as needed"
    ],
    timeframe: "This week",
    agencyNote: "You decide if this resonates. I support structure, not direction."
  };
}

/**
 * Checks coherence alignment of the proposed intervention
 */
function checkCoherenceAlignment(
  coherenceScore: number,
  intervention: MinimalIntervention
): CoherenceAlignment {
  const alignment = coherenceScore >= 60 ? "aligned" : "requires stabilization first";
  
  return {
    currentCoherence: coherenceScore,
    interventionAlignment: alignment,
    recommendation: coherenceScore < 40 
      ? "Stabilize first with somatic corrections before deeper work"
      : "Ready for re-encoding"
  };
}

/**
 * Generates a falsifier for the proposed evolutionary path
 */
function generatePathFalsifier(reEncodingPath: ReEncodingPath): string {
  const falsifiers: Record<string, string> = {
    transform: "If the shift feels forced or creates resistance, this path is not aligned.",
    deepen: "If deepening increases confusion instead of clarity, pause and stabilize first.",
    clarify: "If clarity reduces to rigidity, you've overcorrected.",
    stabilize: "If stability becomes stagnation, you need movement again."
  };
  
  return falsifiers[reEncodingPath.intent] || 
    "If this path creates coherence loss instead of gain, it is not right for you now.";
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DiagnosticResult {
  coherenceScore: number;
  axisDominance: "Mind" | "Body" | "Emotion";
  overactiveCenter: string;
  flaggedCodons: SLIResult[];
  microCorrection: MicroCorrection;
  confidence: 0.4 | 0.7 | 0.9;
  falsifier: string;
  timestamp: string;
}

export interface EvolutionaryAssistanceResult {
  diagnostic: DiagnosticResult;
  reEncodingPath: ReEncodingPath;
  intervention: MinimalIntervention;
  coherenceAlignment: CoherenceAlignment;
  pathFalsifier: string;
  agencyBoundary: string;
  timestamp: string;
}

export interface ReEncodingPath {
  intent: "clarify" | "transform" | "deepen" | "stabilize";
  userRequest: string;
  targetState: string;
}

export interface MinimalIntervention {
  codon: string;
  intent: string;
  proposal: string;
  steps: string[];
  timeframe: string;
  agencyNote: string;
}

export interface CoherenceAlignment {
  currentCoherence: number;
  interventionAlignment: string;
  recommendation: string;
}

// ============================================================================
// EXPORT FOR tRPC INTEGRATION
// ============================================================================

export const orielDiagnosticEngine = {
  performDiagnosticReading,
  performEvolutionaryAssistance
};
