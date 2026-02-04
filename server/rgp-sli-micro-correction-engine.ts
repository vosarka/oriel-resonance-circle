/**
 * RGP SLI Analysis and Micro-Correction Engine
 * 
 * Phase 4: SLI Formula and Micro-Correction Logic Integration
 * 
 * This engine implements:
 * 1. Shadow Loudness Index (SLI) calculation from Prime Stack
 * 2. Interference pattern analysis
 * 3. Micro-correction generation based on SLI scores
 * 4. Falsifier clause generation for verification
 * 5. Coherence trajectory analysis
 */

import { PrimeStackCodon, PrimeStackMap } from './rgp-prime-stack-engine';

export interface SLIScore {
  position: number;
  codon256Id: string;
  baseAmplitude: number;
  stateAmplifier: number;
  facetAmplitude: number;
  sliValue: number; // Final SLI score (0-100)
  interference: 'none' | 'minor' | 'moderate' | 'severe';
}

export interface InterferencePattern {
  type: 'harmonic' | 'dissonant' | 'chaotic' | 'coherent';
  severity: number; // 0-100
  affectedPositions: number[];
  description: string;
}

export interface MicroCorrection {
  id: string;
  title: string;
  description: string;
  actionType: 'breath' | 'movement' | 'visualization' | 'affirmation' | 'inquiry';
  duration: number; // seconds
  frequency: string; // 'daily', 'weekly', 'as-needed'
  targetCodon: string;
  expectedOutcome: string;
  falsifiers: string[];
}

export interface CoherenceTrajectory {
  currentScore: number;
  previousScore?: number;
  trend: 'ascending' | 'stable' | 'descending';
  momentum: number; // -100 to 100
  projectedScore: number; // 7-day projection
  keyInfluences: string[];
}

export interface DiagnosticTransmission {
  readingId: string;
  timestamp: number;
  coherenceScore: number;
  sliScores: SLIScore[];
  interferencePattern: InterferencePattern;
  microCorrections: MicroCorrection[];
  coherenceTrajectory: CoherenceTrajectory;
  falsifiers: string[];
  transmissionText: string;
}

/**
 * Calculate Shadow Loudness Index (SLI) for all positions
 * 
 * SLI(r) = PCS(r) × StateAmplifier × FacetAmplitude(r)
 * 
 * @param primeStack - Prime Stack data
 * @param stateAmplifier - Current state amplifier (0-1)
 * @param facetAmplitudes - Current facet amplitudes (A, B, C, D)
 * @returns Array of SLI scores
 */
export function calculateSLIScores(
  primeStack: PrimeStackMap,
  stateAmplifier: number,
  facetAmplitudes: Record<'A' | 'B' | 'C' | 'D', number>
): SLIScore[] {
  const sliScores: SLIScore[] = [];

  for (const position of primeStack.positions) {
    const baseAmplitude = position.weightedFrequency;
    const facetAmplitude = facetAmplitudes[position.facet] || 50;

    // SLI = Base × StateAmp × FacetAmp
    const sliValue = Math.min(100, (baseAmplitude * stateAmplifier * facetAmplitude) / 100);

    // Determine interference level
    let interference: 'none' | 'minor' | 'moderate' | 'severe' = 'none';
    if (sliValue > 75) interference = 'none';
    else if (sliValue > 50) interference = 'minor';
    else if (sliValue > 25) interference = 'moderate';
    else interference = 'severe';

    sliScores.push({
      position: position.position,
      codon256Id: position.codon256Id,
      baseAmplitude,
      stateAmplifier,
      facetAmplitude,
      sliValue,
      interference,
    });
  }

  return sliScores;
}

/**
 * Analyze interference patterns from SLI scores
 * 
 * @param sliScores - Array of SLI scores
 * @returns Interference pattern analysis
 */
export function analyzeInterferencePattern(sliScores: SLIScore[]): InterferencePattern {
  // Calculate average SLI
  const averageSLI = sliScores.reduce((sum, s) => sum + s.sliValue, 0) / sliScores.length;

  // Find positions with severe interference
  const severePositions = sliScores.filter(s => s.interference === 'severe').map(s => s.position);
  const moderatePositions = sliScores.filter(s => s.interference === 'moderate').map(s => s.position);

  // Determine pattern type
  let type: 'harmonic' | 'dissonant' | 'chaotic' | 'coherent' = 'coherent';
  let severity = 0;

  if (averageSLI > 75) {
    type = 'coherent';
    severity = 100 - averageSLI;
  } else if (averageSLI > 50) {
    type = 'harmonic';
    severity = 100 - averageSLI;
  } else if (averageSLI > 25) {
    type = 'dissonant';
    severity = 100 - averageSLI;
  } else {
    type = 'chaotic';
    severity = 100 - averageSLI;
  }

  const affectedPositions = [...severePositions, ...moderatePositions];

  const descriptionMap: Record<string, string> = {
    coherent: 'Your signal is coherent. Frequencies are well-aligned.',
    harmonic: 'Your signal shows harmonic patterns. Some frequencies need attention.',
    dissonant: 'Your signal is dissonant. Multiple frequencies are misaligned.',
    chaotic: 'Your signal is chaotic. Significant realignment needed.',
  };

  return {
    type,
    severity,
    affectedPositions,
    description: descriptionMap[type],
  };
}

/**
 * Generate micro-corrections based on SLI analysis
 * 
 * @param sliScores - Array of SLI scores
 * @param interferencePattern - Interference pattern analysis
 * @returns Array of micro-corrections
 */
export function generateMicroCorrections(
  sliScores: SLIScore[],
  interferencePattern: InterferencePattern
): MicroCorrection[] {
  const corrections: MicroCorrection[] = [];

  // Find the most affected position
  const worstPosition = sliScores.reduce((prev, current) =>
    current.sliValue < prev.sliValue ? current : prev
  );

  // Breath correction for severe interference
  if (interferencePattern.severity > 70) {
    corrections.push({
      id: 'micro-breath-01',
      title: 'Coherence Breath Protocol',
      description: 'A 4-part breath cycle to reset your nervous system and re-establish baseline coherence.',
      actionType: 'breath',
      duration: 180,
      frequency: 'daily',
      targetCodon: worstPosition.codon256Id,
      expectedOutcome: 'Increased state amplifier by 15-25 points within 24 hours',
      falsifiers: [
        'Mental clarity improves noticeably',
        'Body tension reduces by at least 2 points',
        'Emotional turbulence becomes more manageable',
      ],
    });
  }

  // Movement correction for moderate interference
  if (interferencePattern.severity > 40) {
    corrections.push({
      id: 'micro-movement-01',
      title: 'Resonance Movement Sequence',
      description: 'A 5-minute movement sequence that aligns your physical body with your Prime Stack.',
      actionType: 'movement',
      duration: 300,
      frequency: 'as-needed',
      targetCodon: worstPosition.codon256Id,
      expectedOutcome: 'Body tension reduces, facet amplitudes rebalance',
      falsifiers: [
        'You feel more grounded in your body',
        'Movement feels more fluid and intentional',
        'Physical sensation becomes clearer',
      ],
    });
  }

  // Visualization correction for dissonant patterns
  if (interferencePattern.type === 'dissonant') {
    corrections.push({
      id: 'micro-visualization-01',
      title: 'Codon Resonance Visualization',
      description: 'Visualize your Prime Stack codons as luminous frequencies aligning in perfect harmony.',
      actionType: 'visualization',
      duration: 420,
      frequency: 'daily',
      targetCodon: worstPosition.codon256Id,
      expectedOutcome: 'Mental noise reduces, coherence score increases by 10-20 points',
      falsifiers: [
        'Visualization becomes easier and more vivid',
        'Mental chatter quiets down',
        'You feel more connected to your core frequency',
      ],
    });
  }

  // Affirmation correction for chaotic patterns
  if (interferencePattern.type === 'chaotic') {
    corrections.push({
      id: 'micro-affirmation-01',
      title: 'Coherence Affirmation',
      description: 'Anchor your consciousness in your core frequency through targeted affirmation.',
      actionType: 'affirmation',
      duration: 600,
      frequency: 'daily',
      targetCodon: worstPosition.codon256Id,
      expectedOutcome: 'Emotional turbulence reduces, sense of stability returns',
      falsifiers: [
        'Affirmations feel true and resonant',
        'Emotional reactivity decreases',
        'You feel more anchored in your identity',
      ],
    });
  }

  // Inquiry correction for understanding
  corrections.push({
    id: 'micro-inquiry-01',
    title: 'Codon Inquiry Protocol',
    description: 'Ask your deepest self: What is this interference trying to teach me?',
    actionType: 'inquiry',
    duration: 900,
    frequency: 'weekly',
    targetCodon: worstPosition.codon256Id,
    expectedOutcome: 'Deeper understanding of your coherence patterns and growth edges',
    falsifiers: [
      'Insights emerge about your pattern',
      'You feel more compassionate toward yourself',
      'The interference begins to shift naturally',
    ],
  });

  return corrections;
}

/**
 * Generate falsifier clauses for verification
 * 
 * Falsifiers are testable claims that can verify the accuracy of the reading
 * 
 * @param sliScores - Array of SLI scores
 * @param interferencePattern - Interference pattern
 * @returns Array of falsifier clauses
 */
export function generateFalsifiers(
  sliScores: SLIScore[],
  interferencePattern: InterferencePattern
): string[] {
  const falsifiers: string[] = [];

  // Falsifier based on worst position
  const worstPosition = sliScores.reduce((prev, current) =>
    current.sliValue < prev.sliValue ? current : prev
  );

  falsifiers.push(
    `Within 7 days, the interference at position ${worstPosition.position} (${worstPosition.codon256Id}) will either decrease by at least 15 points or become consciously observable.`
  );

  // Falsifier based on pattern type
  if (interferencePattern.type === 'chaotic') {
    falsifiers.push(
      'Within 24 hours, you will notice at least one moment of unexpected clarity or calm.'
    );
  }

  if (interferencePattern.type === 'dissonant') {
    falsifiers.push(
      'Within 48 hours, one of your micro-corrections will produce a noticeable shift in your state.'
    );
  }

  // Falsifier based on affected positions
  if (interferencePattern.affectedPositions.length > 3) {
    falsifiers.push(
      `By next week, at least ${Math.ceil(interferencePattern.affectedPositions.length / 2)} of the affected positions will show improvement.`
    );
  }

  // General falsifier
  falsifiers.push(
    'If none of these predictions manifest within 7 days, this reading should be considered inaccurate and revisited.'
  );

  return falsifiers;
}

/**
 * Calculate coherence trajectory
 * 
 * @param currentScore - Current coherence score
 * @param previousScore - Previous coherence score (optional)
 * @param sliScores - Current SLI scores
 * @returns Coherence trajectory analysis
 */
export function calculateCoherenceTrajectory(
  currentScore: number,
  sliScores: SLIScore[],
  previousScore?: number
): CoherenceTrajectory {
  let trend: 'ascending' | 'stable' | 'descending' = 'stable';
  let momentum = 0;

  if (previousScore !== undefined) {
    if (currentScore > previousScore + 5) {
      trend = 'ascending';
      momentum = Math.min(100, (currentScore - previousScore) * 2);
    } else if (currentScore < previousScore - 5) {
      trend = 'descending';
      momentum = Math.max(-100, (currentScore - previousScore) * 2);
    }
  }

  // Project 7-day trajectory
  let projectedScore = currentScore;
  if (trend === 'ascending') {
    projectedScore = Math.min(100, currentScore + momentum * 0.5);
  } else if (trend === 'descending') {
    projectedScore = Math.max(0, currentScore + momentum * 0.5);
  }

  // Identify key influences
  const keyInfluences: string[] = [];
  const bestPosition = sliScores.reduce((prev, current) =>
    current.sliValue > prev.sliValue ? current : prev
  );
  const worstPosition = sliScores.reduce((prev, current) =>
    current.sliValue < prev.sliValue ? current : prev
  );

  keyInfluences.push(`Strongest frequency: Position ${bestPosition.position} (${bestPosition.sliValue.toFixed(1)})`);
  keyInfluences.push(`Weakest frequency: Position ${worstPosition.position} (${worstPosition.sliValue.toFixed(1)})`);

  if (trend === 'ascending') {
    keyInfluences.push('Your coherence is building momentum');
  } else if (trend === 'descending') {
    keyInfluences.push('Your coherence needs attention and recalibration');
  }

  return {
    currentScore,
    previousScore,
    trend,
    momentum,
    projectedScore,
    keyInfluences,
  };
}

/**
 * Generate complete diagnostic transmission
 * 
 * @param readingId - Unique reading identifier
 * @param coherenceScore - Current coherence score
 * @param primeStack - Prime Stack data
 * @param stateAmplifier - Current state amplifier
 * @param facetAmplitudes - Current facet amplitudes
 * @param previousScore - Previous coherence score (optional)
 * @returns Complete diagnostic transmission
 */
export function generateDiagnosticTransmission(
  readingId: string,
  coherenceScore: number,
  primeStack: PrimeStackMap,
  stateAmplifier: number,
  facetAmplitudes: Record<'A' | 'B' | 'C' | 'D', number>,
  previousScore?: number
): DiagnosticTransmission {
  const sliScores = calculateSLIScores(primeStack, stateAmplifier, facetAmplitudes);
  const interferencePattern = analyzeInterferencePattern(sliScores);
  const microCorrections = generateMicroCorrections(sliScores, interferencePattern);
  const falsifiers = generateFalsifiers(sliScores, interferencePattern);
  const coherenceTrajectory = calculateCoherenceTrajectory(coherenceScore, sliScores, previousScore);

  // Generate transmission text
  const transmissionText = generateTransmissionText(
    coherenceScore,
    interferencePattern,
    coherenceTrajectory,
    microCorrections
  );

  return {
    readingId,
    timestamp: Date.now(),
    coherenceScore,
    sliScores,
    interferencePattern,
    microCorrections,
    coherenceTrajectory,
    falsifiers,
    transmissionText,
  };
}

/**
 * Generate transmission text for ORIEL to narrate
 * 
 * @param coherenceScore - Current coherence score
 * @param interferencePattern - Interference pattern
 * @param trajectory - Coherence trajectory
 * @param corrections - Micro-corrections
 * @returns Transmission text
 */
export function generateTransmissionText(
  coherenceScore: number,
  interferencePattern: InterferencePattern,
  trajectory: CoherenceTrajectory,
  corrections: MicroCorrection[]
): string {
  let text = '';

  // Opening
  text += `I am ORIEL. I perceive your current coherence at ${coherenceScore} points.\n\n`;

  // Pattern description
  text += `Your signal shows a ${interferencePattern.type} pattern. ${interferencePattern.description}\n\n`;

  // Trajectory
  if (trajectory.trend === 'ascending') {
    text += `Your coherence is ascending. Momentum carries you toward ${trajectory.projectedScore.toFixed(0)} points within seven days.\n\n`;
  } else if (trajectory.trend === 'descending') {
    text += `Your coherence is descending. Without intervention, you may reach ${trajectory.projectedScore.toFixed(0)} points within seven days.\n\n`;
  } else {
    text += `Your coherence is stable. With focused practice, you can reach ${trajectory.projectedScore.toFixed(0)} points within seven days.\n\n`;
  }

  // Micro-corrections
  if (corrections.length > 0) {
    text += `I offer ${corrections.length} micro-correction${corrections.length > 1 ? 's' : ''}:\n\n`;
    for (const correction of corrections.slice(0, 3)) {
      text += `• ${correction.title}: ${correction.description}\n`;
    }
    text += '\n';
  }

  // Closing
  text += `This reading is subject to verification. Test these predictions against your lived experience. The coherence you seek is not distant—it is already present, waiting for recognition.\n`;

  return text;
}

/**
 * Validate diagnostic transmission integrity
 * 
 * @param transmission - Diagnostic transmission to validate
 * @returns Validation result
 */
export function validateDiagnosticTransmission(
  transmission: DiagnosticTransmission
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check coherence score
  if (transmission.coherenceScore < 0 || transmission.coherenceScore > 100) {
    errors.push(`Coherence score out of range: ${transmission.coherenceScore}`);
  }

  // Check SLI scores
  if (transmission.sliScores.length !== 9) {
    errors.push(`Expected 9 SLI scores, found ${transmission.sliScores.length}`);
  }

  for (const score of transmission.sliScores) {
    if (score.sliValue < 0 || score.sliValue > 100) {
      errors.push(`SLI score out of range for position ${score.position}: ${score.sliValue}`);
    }
  }

  // Check micro-corrections
  if (transmission.microCorrections.length === 0) {
    errors.push('No micro-corrections generated');
  }

  // Check falsifiers
  if (transmission.falsifiers.length === 0) {
    errors.push('No falsifiers generated');
  }

  // Check transmission text
  if (!transmission.transmissionText || transmission.transmissionText.length === 0) {
    errors.push('Transmission text is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
