import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Returns the user's Prime Stack codon IDs (if they have a static signature)
 * and helper functions to check if an oracle's linkedCodons overlap.
 *
 * The Prime Stack is a structured object with 9 positions (conscious_sun, design_sun, etc.),
 * each containing a CodonPosition with a codonId like "RC34".
 */
export function usePersonalResonance() {
  const { user } = useAuth();

  // Fetch user's static readings (contains primeStack)
  const { data: staticReadings = [] } = trpc.codex.getStaticReadings.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Extract codon IDs from the first static reading's primeStack
  const userCodons = useMemo(() => {
    if (!staticReadings || staticReadings.length === 0) return [];

    const staticReading = staticReadings[0];
    if (!staticReading?.primeStack) return [];

    try {
      const stack = typeof staticReading.primeStack === "string"
        ? JSON.parse(staticReading.primeStack)
        : staticReading.primeStack;

      // primeStack is an object with positions as keys (e.g., conscious_sun, design_sun, etc.)
      // Each position contains a CodonPosition object with a codonId property
      if (typeof stack === "object" && stack !== null) {
        const codons: string[] = [];
        Object.values(stack).forEach((position: any) => {
          if (position && typeof position === "object") {
            const codonId = position.codonId || position.id || position.rc;
            if (typeof codonId === "string" && codonId.trim()) {
              codons.push(codonId.trim());
            }
          }
        });
        return codons;
      }
      return [];
    } catch {
      return [];
    }
  }, [staticReadings]);

  // Check if oracle's linkedCodons overlap with user's codons
  const getMatchingCodons = (linkedCodons: string[] | undefined): string[] => {
    if (!linkedCodons || !Array.isArray(linkedCodons) || !userCodons.length) {
      return [];
    }
    return linkedCodons.filter((codon) =>
      userCodons.includes(codon.trim())
    );
  };

  const hasResonance = (linkedCodons: string[] | undefined): boolean => {
    return getMatchingCodons(linkedCodons).length > 0;
  };

  return {
    userCodons,
    hasSignature: userCodons.length > 0,
    getMatchingCodons,
    hasResonance,
  };
}
