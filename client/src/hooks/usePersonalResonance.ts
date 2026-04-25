import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  extractPrimeStackCodonIds,
  parseLinkedCodons,
} from "@/lib/oracle-utils";
import { trpc } from "@/lib/trpc";

/**
 * Returns the user's Prime Stack codon IDs (if they have a canonical natal profile)
 * and helpers to check if an oracle's linkedCodons overlap with their codons.
 */
export function usePersonalResonance() {
  const { user } = useAuth();

  const { data: profile } = trpc.profile.getStaticProfile.useQuery(
    undefined,
    { enabled: !!user },
  );

  const userCodons = useMemo(() => {
    if (!profile?.primeStack) return [];
    return extractPrimeStackCodonIds(profile.primeStack);
  }, [profile]);

  const getMatchingCodons = (
    linkedCodons: string[] | null | undefined,
  ): string[] => {
    if (!userCodons.length) return [];

    const normalized = parseLinkedCodons(linkedCodons);
    if (!normalized.length) return [];

    return normalized.filter((codon) => userCodons.includes(codon));
  };

  const hasResonance = (
    linkedCodons: string[] | null | undefined,
  ): boolean => {
    return getMatchingCodons(linkedCodons).length > 0;
  };

  return {
    userCodons,
    hasSignature: userCodons.length > 0,
    getMatchingCodons,
    hasResonance,
  };
}
