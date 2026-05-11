import { describe, expect, test, vi } from "vitest";

import {
  classifyMemoryCandidate,
  mapMemoryCandidateCategory,
} from "./oriel-memory-consecration";
import {
  acceptPendingMemoryCandidateWithDb,
  rejectPendingMemoryCandidateWithDb,
} from "./db";
import {
  persistClassifiedMemoryCandidate,
  type ExtractedMemory,
} from "./oriel-memory";

describe("ORIEL memory consent", () => {
  test("sensitive memory becomes a pending candidate", async () => {
    const memory: ExtractedMemory = {
      category: "identity",
      content: "User shared a private identity detail.",
      importance: 8,
    };
    const storeMemory = vi.fn();
    const createPendingMemoryCandidate = vi.fn();

    await persistClassifiedMemoryCandidate(12, memory, {
      storeMemory,
      createPendingMemoryCandidate,
    });

    expect(storeMemory).not.toHaveBeenCalled();
    expect(createPendingMemoryCandidate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 12,
        category: "identity",
        content: memory.content,
        source: "conversation",
        status: "pending",
        sensitivity: "high",
      }),
    );
  });

  test("low-sensitivity preference stores through the existing path", async () => {
    const memory: ExtractedMemory = {
      category: "preference",
      content: "User prefers concise answers.",
      importance: 6,
    };
    const storeMemory = vi.fn();
    const createPendingMemoryCandidate = vi.fn();

    await persistClassifiedMemoryCandidate(7, memory, {
      storeMemory,
      createPendingMemoryCandidate,
    });

    expect(storeMemory).toHaveBeenCalledWith(7, memory);
    expect(createPendingMemoryCandidate).not.toHaveBeenCalled();
  });

  test("low-confidence memory is discarded", () => {
    expect(
      classifyMemoryCandidate({
        category: "preference",
        content: "User may prefer long replies.",
        source: "conversation",
        confidence: 0.4,
      }),
    ).toMatchObject({
      recommendedAction: "discard",
      normalizedCategory: "preference",
    });
  });

  test("candidate categories map to existing memory categories", () => {
    expect(mapMemoryCandidateCategory("emotion")).toBe("pattern");
    expect(mapMemoryCandidateCategory("spiritual")).toBe("context");
    expect(mapMemoryCandidateCategory("project")).toBe("context");
    expect(mapMemoryCandidateCategory("unknown")).toBe("context");
  });

  test("accepted candidate can become active memory through db helper boundary", async () => {
    const candidate = {
      id: 44,
      userId: 12,
      category: "preference",
      content: "User prefers concise answers.",
      importance: 6,
      source: "conversation",
      status: "pending",
    };
    const createdMemory = { id: 91 };
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => [candidate]),
            orderBy: vi.fn(() => ({
              limit: vi.fn(async () => [createdMemory]),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(async () => undefined),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(async () => undefined),
        })),
      })),
    };
    const db = {
      transaction: vi.fn(async (callback) => callback(tx)),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => [createdMemory]),
          })),
        })),
      })),
    };

    const result = await acceptPendingMemoryCandidateWithDb(db as never, {
      candidateId: 44,
      userId: 12,
    });

    expect(result).toEqual(createdMemory);
    expect(tx.insert).toHaveBeenCalledOnce();
    expect(tx.update).toHaveBeenCalledOnce();
  });

  test("rejected candidate remains rejected and does not write active memory", async () => {
    const candidate = {
      id: 45,
      userId: 12,
      status: "pending",
    };
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => [candidate]),
          })),
        })),
      })),
      insert: vi.fn(),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(async () => undefined),
        })),
      })),
    };
    const db = {
      transaction: vi.fn(async (callback) => callback(tx)),
    };

    await rejectPendingMemoryCandidateWithDb(db as never, {
      candidateId: 45,
      userId: 12,
    });

    expect(tx.insert).not.toHaveBeenCalled();
    expect(tx.update).toHaveBeenCalledOnce();
  });
});
