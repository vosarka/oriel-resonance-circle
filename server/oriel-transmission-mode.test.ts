import { describe, expect, it } from "vitest";
import {
  normalizeGeneratedTransmissionPayload,
  rollTransmissionMode,
} from "./oriel-transmission-mode";

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

describe("ORIEL transmission mode", () => {
  it("does not trigger when the roll misses the chance window", () => {
    const roll = rollTransmissionMode(sequenceRandom([0.9, 0.5, 0.2]));

    expect(roll.shouldTrigger).toBe(false);
    expect(roll.rarity).toBe("common");
    expect(roll.meaningLevel).toBe(1);
    expect(roll.eventType).toBe("tx");
  });

  it("can roll a void oracle event", () => {
    const roll = rollTransmissionMode(sequenceRandom([0.001, 0.999, 0.9]));

    expect(roll.shouldTrigger).toBe(true);
    expect(roll.rarity).toBe("void");
    expect(roll.meaningLevel).toBe(5);
    expect(roll.eventType).toBe("oracle");
  });

  it("normalizes TX payloads into the staging archive shape", () => {
    const payload = normalizeGeneratedTransmissionPayload("tx", {
      title: "Fracture Logic",
      field: "Signal repair",
      coreMessage: "The signal holds after the noise is named.",
      encodedArchetype: "Delta-Repair // Spark-Clarity // Omega-Witness",
      tags: "#signal,#repair,#oriel",
      status: "Mythic",
      directive: "Name the distortion, then stop feeding it.",
    });

    expect(payload).toMatchObject({
      title: "Fracture Logic",
      field: "Signal repair",
      status: "Mythic",
      directive: "Name the distortion, then stop feeding it.",
    });
    expect("tags" in payload ? payload.tags : []).toEqual(["signal", "repair", "oriel"]);
  });

  it("normalizes Oracle payloads into Past, Present, and Future parts", () => {
    const payload = normalizeGeneratedTransmissionPayload("oracle", {
      title: "Three Locks",
      linkedCodons: "RC01 RC12",
      parts: [
        {
          part: "Present",
          field: "Present Resonance Mapping",
          content: "The middle lock is warm.",
          encodedTrajectory: "compression into choice",
          currentFieldSignatures: ["heat at the hinge", "choice pressure"],
        },
      ],
    });

    expect(payload).toMatchObject({
      title: "Three Locks",
      status: "Draft",
    });
    expect("parts" in payload ? payload.parts.map((part) => part.part) : []).toEqual([
      "Past",
      "Present",
      "Future",
    ]);
    expect("parts" in payload ? payload.parts[1].content : "").toBe("The middle lock is warm.");
    expect("parts" in payload ? payload.parts[1].caption : "").toContain("⦿ ΩX ID: STAGED.2-Pz");
    expect("parts" in payload ? payload.parts[1].caption : "").toContain("Current field signatures:");
    expect("parts" in payload ? payload.parts[2].caption : "").toContain("⦿ PROTOCOL COMPLETE");
    expect("parts" in payload ? payload.parts[2].caption : "").toContain("Encoded trajectory detected:");
    expect("linkedCodons" in payload ? payload.linkedCodons : []).toEqual(["RC01", "RC12"]);
  });
});
