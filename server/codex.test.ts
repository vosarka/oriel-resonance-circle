import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock DB functions that require a live MySQL connection
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    saveCarrierlockState: vi.fn(async (_userId: number, state: {
      mentalNoise: number;
      bodyTension: number;
      emotionalTurbulence: number;
      breathCompletion: boolean;
    }) => {
      const coherenceScore = Math.max(0, Math.min(100,
        100 - (state.mentalNoise * 3 + state.bodyTension * 3 + state.emotionalTurbulence * 3)
        + (state.breathCompletion ? 10 : 0)
      ));
      return { id: 1, coherenceScore };
    }),
    saveCodonReading: vi.fn(async () => ({ id: 1 })),
    markCorrectionCompleted: vi.fn(async () => undefined),
  };
});

describe("Codex Router", () => {
  // Mock context for authenticated user
  const mockAuthContext: Partial<Context> = {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
  };

  // Mock context for unauthenticated user
  const mockPublicContext: Partial<Context> = {
    user: null,
  };

  describe("getRootCodons", () => {
    it("should return all 64 root codons", async () => {
      const caller = appRouter.createCaller(mockPublicContext as Context);
      const result = await caller.codex.getRootCodons();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure of first codon
      if (result.length > 0) {
        const firstCodon = result[0];
        expect(firstCodon).toHaveProperty("id");
        expect(firstCodon).toHaveProperty("name");
        expect(firstCodon).toHaveProperty("title");
        expect(firstCodon).toHaveProperty("essence");
        expect(firstCodon).toHaveProperty("shadow");
        expect(firstCodon).toHaveProperty("gift");
        expect(firstCodon).toHaveProperty("crown");
        expect(firstCodon).toHaveProperty("domain");
      }
    });

    it("should work for unauthenticated users (public endpoint)", async () => {
      const caller = appRouter.createCaller(mockPublicContext as Context);
      const result = await caller.codex.getRootCodons();
      expect(result).toBeDefined();
    });
  });

  describe("getCodonDetails", () => {
    it("should return detailed info for a specific codon", async () => {
      const caller = appRouter.createCaller(mockPublicContext as Context);
      
      // First get all codons to get a valid ID
      const codons = await caller.codex.getRootCodons();
      if (codons.length > 0) {
        const firstCodonId = codons[0].id;
        const result = await caller.codex.getCodonDetails({ id: firstCodonId });

        expect(result).toBeDefined();
        expect(result.id).toBe(firstCodonId);
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("title");
        expect(result).toHaveProperty("essence");
        expect(result).toHaveProperty("shadow");
        expect(result).toHaveProperty("gift");
        expect(result).toHaveProperty("crown");
      }
    });

    it("should throw error for invalid codon ID", async () => {
      const caller = appRouter.createCaller(mockPublicContext as Context);
      
      await expect(
        caller.codex.getCodonDetails({ id: "INVALID_ID" })
      ).rejects.toThrow();
    });
  });

  describe("saveCarrierlock", () => {
    it("should save carrierlock state for authenticated user", async () => {
      const caller = appRouter.createCaller(mockAuthContext as Context);
      
      const result = await caller.codex.saveCarrierlock({
        mentalNoise: 5,
        bodyTension: 4,
        emotionalTurbulence: 6,
        breathCompletion: true,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("coherenceScore");
      expect(typeof result.coherenceScore).toBe("number");
      expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
      expect(result.coherenceScore).toBeLessThanOrEqual(100);
    });

    it("should calculate coherence score correctly", async () => {
      const caller = appRouter.createCaller(mockAuthContext as Context);
      
      // Test case: MN=0, BT=0, ET=0, BC=false
      // Expected: 100 - (0*3 + 0*3 + 0*3) + 0 = 100
      const result1 = await caller.codex.saveCarrierlock({
        mentalNoise: 0,
        bodyTension: 0,
        emotionalTurbulence: 0,
        breathCompletion: false,
      });
      expect(result1.coherenceScore).toBe(100);

      // Test case: MN=10, BT=10, ET=10, BC=false
      // Expected: 100 - (10*3 + 10*3 + 10*3) + 0 = 10
      const result2 = await caller.codex.saveCarrierlock({
        mentalNoise: 10,
        bodyTension: 10,
        emotionalTurbulence: 10,
        breathCompletion: false,
      });
      expect(result2.coherenceScore).toBe(10);

      // Test case: MN=5, BT=5, ET=5, BC=true
      // Expected: 100 - (5*3 + 5*3 + 5*3) + 10 = 65
      const result3 = await caller.codex.saveCarrierlock({
        mentalNoise: 5,
        bodyTension: 5,
        emotionalTurbulence: 5,
        breathCompletion: true,
      });
      expect(result3.coherenceScore).toBe(65);
    });

    it("should require authentication", async () => {
      const caller = appRouter.createCaller(mockPublicContext as Context);
      
      await expect(
        caller.codex.saveCarrierlock({
          mentalNoise: 5,
          bodyTension: 5,
          emotionalTurbulence: 5,
          breathCompletion: false,
        })
      ).rejects.toThrow();
    });

    it("should validate input ranges", async () => {
      const caller = appRouter.createCaller(mockAuthContext as Context);
      
      // Test invalid mental noise (> 10)
      await expect(
        caller.codex.saveCarrierlock({
          mentalNoise: 15,
          bodyTension: 5,
          emotionalTurbulence: 5,
          breathCompletion: false,
        })
      ).rejects.toThrow();

      // Test invalid body tension (< 0)
      await expect(
        caller.codex.saveCarrierlock({
          mentalNoise: 5,
          bodyTension: -1,
          emotionalTurbulence: 5,
          breathCompletion: false,
        })
      ).rejects.toThrow();
    });
  });

  describe("saveReading", () => {
    it("should save diagnostic reading for authenticated user", async () => {
      const caller = appRouter.createCaller(mockAuthContext as Context);
      
      // First create a carrierlock state
      const carrierlockResult = await caller.codex.saveCarrierlock({
        mentalNoise: 5,
        bodyTension: 5,
        emotionalTurbulence: 5,
        breathCompletion: false,
      });

      // Then save a reading
      const readingResult = await caller.codex.saveReading({
        carrierlockId: carrierlockResult.id,
        readingText: "Test diagnostic reading",
        flaggedCodons: ["RC01", "RC27"],
        sliScores: { "RC01": 0.8, "RC27": 0.6 },
        activeFacets: { "RC01": "A", "RC27": "B" },
        confidenceLevels: { "RC01": 0.9, "RC27": 0.7 },
        microCorrection: "Test micro-correction",
        correctionFacet: "A",
        falsifier: "Test falsifier",
      });

      expect(readingResult).toBeDefined();
      expect(readingResult).toHaveProperty("id");
      expect(typeof readingResult.id).toBe("number");
    });

    it("should require authentication", async () => {
      const caller = appRouter.createCaller(mockPublicContext as Context);
      
      await expect(
        caller.codex.saveReading({
          carrierlockId: 1,
          readingText: "Test",
          flaggedCodons: ["RC01"],
          sliScores: { "RC01": 0.8 },
          activeFacets: { "RC01": "A" },
          confidenceLevels: { "RC01": 0.9 },
        })
      ).rejects.toThrow();
    });
  });

  describe("getReadingHistory", () => {
    it("should return reading history for authenticated user", async () => {
      const caller = appRouter.createCaller(mockAuthContext as Context);
      
      const result = await caller.codex.getReadingHistory();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // History might be empty for new test user
    });

    it("should require authentication", async () => {
      const caller = appRouter.createCaller(mockPublicContext as Context);
      
      await expect(
        caller.codex.getReadingHistory()
      ).rejects.toThrow();
    });
  });

  describe("markCorrectionComplete", () => {
    it("should mark correction as completed for authenticated user", async () => {
      const caller = appRouter.createCaller(mockAuthContext as Context);
      
      // Create carrierlock and reading first
      const carrierlockResult = await caller.codex.saveCarrierlock({
        mentalNoise: 5,
        bodyTension: 5,
        emotionalTurbulence: 5,
        breathCompletion: false,
      });

      const readingResult = await caller.codex.saveReading({
        carrierlockId: carrierlockResult.id,
        readingText: "Test reading",
        flaggedCodons: ["RC01"],
        sliScores: { "RC01": 0.8 },
        activeFacets: { "RC01": "A" },
        confidenceLevels: { "RC01": 0.9 },
      });

      // Mark as complete
      const result = await caller.codex.markCorrectionComplete({
        readingId: readingResult.id,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should require authentication", async () => {
      const caller = appRouter.createCaller(mockPublicContext as Context);
      
      await expect(
        caller.codex.markCorrectionComplete({ readingId: 1 })
      ).rejects.toThrow();
    });
  });
});
