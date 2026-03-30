import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Returns the user's Prime Stack codon IDs (if they have a static signature)
<<<<<<< HEAD
<<<<<<< HEAD
=======
 * and helpers to check if an oracle's linkedCodons overlap with their codons.
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
 * and helper functions to check if an oracle's linkedCodons overlap.
 *
 * The Prime Stack is a structured object with 9 positions (conscious_sun, design_sun, etc.),
 * each containing a CodonPosition with a codonId like "RC34".
<<<<<<< HEAD
=======
 * and helpers to check if an oracle's linkedCodons overlap with their codons.
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
 */
export function usePersonalResonance() {
  const { user } = useAuth();

<<<<<<< HEAD
<<<<<<< HEAD
=======
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======
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
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
      }
      return [];
    } catch {
      return [];
    }
<<<<<<< HEAD
<<<<<<< HEAD
=======
  }, [readings]);

  const getMatchingCodons = (linkedCodons: string[]): string[] => {
    if (!linkedCodons || !userCodons.length) return [];
    return linkedCodons.filter((codon) => userCodons.includes(codon));
  };

  const hasResonance = (linkedCodons: string[]): boolean => {
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======
  }, [readings]);

  const getMatchingCodons = (linkedCodons: string[]): string[] => {
    if (!linkedCodons || !userCodons.length) return [];
    return linkedCodons.filter((codon) => userCodons.includes(codon));
  };

  const hasResonance = (linkedCodons: string[]): boolean => {
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
    return getMatchingCodons(linkedCodons).length > 0;
  };

  return {
    userCodons,
    hasSignature: userCodons.length > 0,
    getMatchingCodons,
    hasResonance,
  };
}
