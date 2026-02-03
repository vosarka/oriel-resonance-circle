/**
 * RGP Prime Stack Calculation Engine
 * 
 * The Prime Stack is the 9-position resonance map derived from birth chart data.
 * Each position represents a specific planetary body and its corresponding codon.
 * 
 * Prime Stack Positions:
 * 1. Conscious Sun (PCS) - Core identity frequency
 * 2. Design Sun - Life purpose frequency
 * 3. Personality Sun - Personality expression
 * 4. Conscious Moon - Emotional core
 * 5. Design Moon - Emotional purpose
 * 6. Personality Moon - Emotional expression
 * 7. Nodes - Karmic axis
 * 8. Earth - Grounding frequency
 * 9. Chiron - Wound/healing frequency
 */

import {
  determineFacetFromLongitude,
  generateCodon256Id,
  calculateWeightedFrequency,
  PRIME_STACK_CONFIG,
  PrimeStackPosition,
  CodonFrequency,
} from './rgp-256-codon-engine';

export interface PlanetaryPosition {
  body: string;
  longitude: number; // 0-360 degrees
  latitude?: number;
  speed?: number;
}

export interface BirthChartData {
  sun: PlanetaryPosition;
  moon: PlanetaryPosition;
  earth: PlanetaryPosition;
  nodes: PlanetaryPosition; // North Node
  chiron: PlanetaryPosition;
  [key: string]: PlanetaryPosition;
}

export interface PrimeStackCodon {
  position: number; // 1-9
  name: string;
  planetaryBody: string;
  weight: number;
  rootCodonId: string; // RC01-RC64
  facet: 'A' | 'B' | 'C' | 'D';
  codon256Id: string; // RC01-A format
  frequency: 'shadow' | 'gift' | 'crown' | 'siddhi';
  baseFrequency: number; // 0-100
  weightedFrequency: number; // 0-100 after weighting
}

export interface PrimeStackMap {
  positions: PrimeStackCodon[];
  totalWeight: number;
  dominantPosition: number;
  circuitLinks: CircuitLink[];
}

export interface CircuitLink {
  position1: number;
  position2: number;
  linkType: 'harmonic' | 'opposition' | 'square' | 'trine';
  strength: number; // 0-100
}

/**
 * Calculate Prime Stack from birth chart data
 * 
 * @param birthChart - Birth chart with planetary positions
 * @param rootCodonMap - Map of root codons for each planetary body
 * @returns Complete Prime Stack map
 */
export function calculatePrimeStack(
  birthChart: BirthChartData,
  rootCodonMap: Record<string, string>
): PrimeStackMap {
  const positions: PrimeStackCodon[] = [];
  let totalWeight = 0;
  let dominantPosition = 1;
  let maxWeightedFrequency = 0;

  // Process each Prime Stack position
  for (const config of PRIME_STACK_CONFIG) {
    const planetaryBody = config.planetaryBody.toLowerCase();
    const planetaryData = birthChart[planetaryBody];

    if (!planetaryData) {
      console.warn(`Missing planetary data for ${planetaryBody}`);
      continue;
    }

    // Get root codon for this planetary body
    const rootCodonId = rootCodonMap[planetaryBody] || `RC${String(config.position).padStart(2, '0')}`;

    // Determine facet from longitude
    const facet = determineFacetFromLongitude(planetaryData.longitude);

    // Generate 256-codon ID
    const codon256Id = generateCodon256Id(rootCodonId, facet);

    // Map facet to frequency name
    const frequencyMap: Record<string, 'shadow' | 'gift' | 'crown' | 'siddhi'> = {
      'A': 'shadow',
      'B': 'gift',
      'C': 'crown',
      'D': 'siddhi',
    };
    const frequency = frequencyMap[facet];

    // Base frequency (derived from longitude position within facet)
    const facetOffset = planetaryData.longitude % 90;
    const baseFrequency = (facetOffset / 90) * 100;

    // Calculate weighted frequency
    const weightedFrequency = calculateWeightedFrequency(config.position, baseFrequency);

    const primeStackCodon: PrimeStackCodon = {
      position: config.position,
      name: config.name,
      planetaryBody: config.planetaryBody,
      weight: config.weight,
      rootCodonId,
      facet,
      codon256Id,
      frequency,
      baseFrequency,
      weightedFrequency,
    };

    positions.push(primeStackCodon);
    totalWeight += config.weight;

    // Track dominant position (highest weighted frequency)
    if (weightedFrequency > maxWeightedFrequency) {
      maxWeightedFrequency = weightedFrequency;
      dominantPosition = config.position;
    }
  }

  // Calculate circuit links
  const circuitLinks = calculateCircuitLinks(positions);

  return {
    positions,
    totalWeight,
    dominantPosition,
    circuitLinks,
  };
}

/**
 * Calculate circuit links between Prime Stack positions
 * 
 * Circuit links represent harmonic relationships between planetary positions
 * 
 * @param positions - Prime Stack positions
 * @returns Array of circuit links
 */
export function calculateCircuitLinks(positions: PrimeStackCodon[]): CircuitLink[] {
  const links: CircuitLink[] = [];

  // Check all pairs of positions for angular relationships
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const pos1 = positions[i];
      const pos2 = positions[j];

      // Calculate angular distance between positions
      // This is a simplified model - in reality would use actual planetary longitudes
      const distance = Math.abs(pos1.baseFrequency - pos2.baseFrequency);

      // Determine link type based on distance
      let linkType: 'harmonic' | 'opposition' | 'square' | 'trine' = 'harmonic';
      let strength = 0;

      if (distance < 10) {
        linkType = 'harmonic';
        strength = 100 - distance * 5;
      } else if (distance > 40 && distance < 60) {
        linkType = 'trine';
        strength = 100 - Math.abs(distance - 50) * 2;
      } else if (distance > 35 && distance < 55) {
        linkType = 'square';
        strength = 100 - Math.abs(distance - 45) * 2;
      } else if (distance > 45) {
        linkType = 'opposition';
        strength = 100 - Math.abs(distance - 50) * 2;
      }

      if (strength > 30) {
        links.push({
          position1: pos1.position,
          position2: pos2.position,
          linkType,
          strength: Math.max(0, strength),
        });
      }
    }
  }

  return links;
}

/**
 * Calculate 9-Center Resonance Map
 * 
 * Maps the 9 Prime Stack positions to the 9 Centers in the Resonance Operating System
 * 
 * @param primeStack - Prime Stack map
 * @returns 9-Center resonance data
 */
export function calculate9CenterMap(primeStack: PrimeStackMap): Record<number, { centerName: string; codon256Id: string; frequency: number }> {
  const centerNames: Record<number, string> = {
    1: 'Crown Center',
    2: 'Ajna Center',
    3: 'Throat Center',
    4: 'Heart Center',
    5: 'Solar Plexus Center',
    6: 'Sacral Center',
    7: 'Root Center',
    8: 'Earth Center',
    9: 'Void Center',
  };

  const nineCenter: Record<number, { centerName: string; codon256Id: string; frequency: number }> = {};

  for (const position of primeStack.positions) {
    const centerNumber = position.position;
    nineCenter[centerNumber] = {
      centerName: centerNames[centerNumber] || `Center ${centerNumber}`,
      codon256Id: position.codon256Id,
      frequency: position.weightedFrequency,
    };
  }

  return nineCenter;
}

/**
 * Calculate Fractal Role from Prime Stack
 * 
 * Determines the user's role in the Resonance Operating System:
 * - Reflector: Reflects the environment
 * - Resonator: Resonates with patterns
 * - Catalyst: Catalyzes change
 * - Harmonizer: Harmonizes conflicts
 * 
 * @param primeStack - Prime Stack map
 * @returns Fractal role and description
 */
export function calculateFractalRole(primeStack: PrimeStackMap): { role: string; description: string; alignment: number } {
  // Analyze the distribution of facets in the Prime Stack
  const facetCounts = { A: 0, B: 0, C: 0, D: 0 };
  let totalFrequency = 0;

  for (const position of primeStack.positions) {
    facetCounts[position.facet]++;
    totalFrequency += position.weightedFrequency;
  }

  // Determine role based on facet distribution
  const dominantFacet = Object.entries(facetCounts).reduce((prev, current) =>
    current[1] > prev[1] ? current : prev
  )[0];

  let role = 'Harmonizer';
  let description = 'Balances and harmonizes different frequencies';
  let alignment = 50;

  if (dominantFacet === 'A') {
    role = 'Reflector';
    description = 'Reflects shadow patterns and hidden frequencies';
    alignment = facetCounts.A / primeStack.positions.length * 100;
  } else if (dominantFacet === 'B') {
    role = 'Resonator';
    description = 'Resonates with gift frequencies and possibilities';
    alignment = facetCounts.B / primeStack.positions.length * 100;
  } else if (dominantFacet === 'C') {
    role = 'Catalyst';
    description = 'Catalyzes crown frequencies and transformation';
    alignment = facetCounts.C / primeStack.positions.length * 100;
  } else if (dominantFacet === 'D') {
    role = 'Harmonizer';
    description = 'Embodies siddhi frequencies and coherence';
    alignment = facetCounts.D / primeStack.positions.length * 100;
  }

  return { role, description, alignment };
}

/**
 * Calculate Authority Node from Prime Stack
 * 
 * Determines the primary decision-making authority based on Prime Stack
 * 
 * @param primeStack - Prime Stack map
 * @returns Authority node information
 */
export function calculateAuthorityNode(primeStack: PrimeStackMap): { node: string; position: number; strength: number } {
  const dominantPosition = primeStack.positions.find(p => p.position === primeStack.dominantPosition);

  if (!dominantPosition) {
    return { node: 'Unknown', position: 1, strength: 0 };
  }

  const authorityMap: Record<number, string> = {
    1: 'Conscious Sun Authority',
    2: 'Design Sun Authority',
    3: 'Personality Sun Authority',
    4: 'Conscious Moon Authority',
    5: 'Design Moon Authority',
    6: 'Personality Moon Authority',
    7: 'Nodes Authority',
    8: 'Earth Authority',
    9: 'Chiron Authority',
  };

  return {
    node: authorityMap[dominantPosition.position] || 'Unknown Authority',
    position: dominantPosition.position,
    strength: dominantPosition.weightedFrequency,
  };
}

/**
 * Validate Prime Stack integrity
 * 
 * @param primeStack - Prime Stack to validate
 * @returns Validation result
 */
export function validatePrimeStack(primeStack: PrimeStackMap): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that all 9 positions are present
  if (primeStack.positions.length !== 9) {
    errors.push(`Prime Stack should have 9 positions, found ${primeStack.positions.length}`);
  }

  // Check that all positions have valid codon IDs
  for (const position of primeStack.positions) {
    if (!position.codon256Id || !position.codon256Id.includes('-')) {
      errors.push(`Position ${position.position} has invalid codon ID: ${position.codon256Id}`);
    }
  }

  // Check that weighted frequencies are within valid range
  for (const position of primeStack.positions) {
    if (position.weightedFrequency < 0 || position.weightedFrequency > 100) {
      errors.push(`Position ${position.position} has invalid frequency: ${position.weightedFrequency}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate Prime Stack summary for display
 * 
 * @param primeStack - Prime Stack map
 * @returns Formatted summary
 */
export function generatePrimeStackSummary(primeStack: PrimeStackMap): string {
  let summary = 'Prime Stack Analysis:\n\n';

  for (const position of primeStack.positions) {
    summary += `${position.position}. ${position.name} (${position.planetaryBody})\n`;
    summary += `   Codon: ${position.codon256Id} (${position.frequency})\n`;
    summary += `   Frequency: ${position.weightedFrequency.toFixed(1)}\n`;
    summary += `   Weight: ${position.weight}x\n\n`;
  }

  const role = calculateFractalRole(primeStack);
  summary += `Fractal Role: ${role.role}\n`;
  summary += `Description: ${role.description}\n`;
  summary += `Alignment: ${role.alignment.toFixed(1)}%\n\n`;

  const authority = calculateAuthorityNode(primeStack);
  summary += `Authority Node: ${authority.node}\n`;
  summary += `Authority Strength: ${authority.strength.toFixed(1)}\n`;

  return summary;
}
