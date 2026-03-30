import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Returns the user's Prime Stack codon IDs (if they have a static signature)
 * and helpers to check if an oracle's linkedCodons overlap with their codons.
 */
export function usePersonalResonance() {
  const { user } = useAuth();

  // Fetch user's latest static reading (contains primeStack)
  const { data: readings } = trpc.codex.getStaticReadings.useQuery(
    undefined,
    { enabled: !!user },
  );

  // Extract codon IDs from the most recent primeStack
  const userCodons = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const latest = readings[0];
    if (!latest?.primeStack) return [];
    try {
      const stack =
        typeof latest.primeStack === "string"
          ? JSON.parse(latest.primeStack)
          : latest.primeStack;
      if (Array.isArray(stack)) {
        return stack
          .map((item: any) => {
            if (typeof item === "string") return item;
            return item?.codonId || item?.id || item?.rc || "";
          })
          .filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  }, [readings]);

  const getMatchingCodons = (linkedCodons: string[]): string[] => {
    if (!linkedCodons || !userCodons.length) return [];
    return linkedCodons.filter((codon) => userCodons.includes(codon));
  };

  const hasResonance = (linkedCodons: string[]): boolean => {
    return getMatchingCodons(linkedCodons).length > 0;
  };

  return {
    userCodons,
    hasSignature: userCodons.length > 0,
    getMatchingCodons,
    hasResonance,
  };
}
