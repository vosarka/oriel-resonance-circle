import { describe, expect, it } from "vitest";

import {
  extractPrimeStackCodonIds,
  parseLinkedCodons,
} from "@/lib/oracle-utils";

describe("oracle stream evolution utilities", () => {
  it("extracts codons from keyed-object prime stacks", () => {
    const primeStack = {
      conscious_sun: { codonId: "RC38", codonName: "Opposition" },
      design_sun: { fullId: "RC57-B", codonName: "Intuition" },
      conscious_earth: { rc: "rc12" },
      design_earth: null,
    };

    expect(extractPrimeStackCodonIds(primeStack)).toEqual([
      "RC38",
      "RC57",
      "RC12",
    ]);
  });

  it("extracts codons from JSON-string prime stacks", () => {
    const primeStack = JSON.stringify([
      { codonId: "RC22" },
      { fullId: "RC51-D" },
      "rc60",
    ]);

    expect(extractPrimeStackCodonIds(primeStack)).toEqual([
      "RC22",
      "RC51",
      "RC60",
    ]);
  });

  it("normalizes and deduplicates linked codons", () => {
    expect(parseLinkedCodons("  RC38, rc57  RC38\nrc22 ")).toEqual([
      "RC38",
      "RC57",
      "RC22",
    ]);
  });

  it("returns an empty list when no signature data exists", () => {
    expect(extractPrimeStackCodonIds(undefined)).toEqual([]);
    expect(extractPrimeStackCodonIds("not-json")).toEqual([]);
  });
});
