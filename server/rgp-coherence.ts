export interface CarrierlockState {
  mentalNoise: number;
  bodyTension: number;
  emotionalTurbulence: number;
  breathCompletion: 0 | 1;
}

/**
 * Consciousness Lattice Unified Specification v1:
 * CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)
 */
export function calculateCoherenceScore(state: CarrierlockState): number {
  const { mentalNoise, bodyTension, emotionalTurbulence, breathCompletion } = state;
  const baseScore = 100 - (mentalNoise * 3 + bodyTension * 3 + emotionalTurbulence * 3);
  const breathBonus = breathCompletion ? 10 : 0;
  return Math.max(0, Math.min(100, baseScore + breathBonus));
}
