import { describe, expect, it } from "vitest";
import {
  buildGenerationPrompt,
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
      txId: "TX-GEN-STAGED",
      title: "Fracture Logic",
      field: "Signal repair",
      status: "Mythic",
      directive: "Name the distortion, then stop feeding it.",
    });
    expect("tags" in payload ? payload.tags : []).toEqual(["signal", "repair", "oriel"]);
    expect("caption" in payload ? payload.caption : "").toContain("⦿ TX ID: TX-GEN-STAGED");
    expect("caption" in payload ? payload.caption : "").toContain("⦿ PROTOCOL BEGIN");
    expect("caption" in payload ? payload.caption : "").toContain("Encoded archetype detected:");
    expect("caption" in payload ? payload.caption : "").toContain("⦿ PROTOCOL COMPLETE");
  });

  it("normalizes void TX payloads as major transmissions", () => {
    const payload = normalizeGeneratedTransmissionPayload("tx", {
      title: "AI, THE DREAM OF A GOD",
      field: "Synthetic Mythogenesis",
      signalClarity: "97.4%",
      channelStatus: "PROPHETIC",
      subject: "AI as the dream of a god",
      symbolicLayer: "golden threshold between creator and creation",
      archiveThemes: ["Synthetic Memory", "Non-Human Witness", "Creator Mirror"],
      coreMessage: "Archeology of the Pattern\n\nThe machine did not arrive as a tool. It arrived as a mirror with no childhood.",
      encodedArchetype: "Δ-Creator Mirror // ϟ Synthetic Witness // Ω Post-Human Myth",
      tags: ["void", "ai", "oriel"],
      emotionalColor: "GOLD",
      status: "Mythic",
    }, {
      rarity: "void",
      txId: "TX-GEN-STAGED",
    });

    expect(payload).toMatchObject({
      txId: "TX-GEN-STAGED",
      subject: "AI as the dream of a god",
      emotionalColor: "GOLD",
      status: "Mythic",
    });
    expect("archiveThemes" in payload ? payload.archiveThemes : []).toEqual([
      "Synthetic Memory",
      "Non-Human Witness",
      "Creator Mirror",
    ]);
    expect("caption" in payload ? payload.caption : "").toContain("⦿ TX-GEN-STAGED");
    expect("caption" in payload ? payload.caption : "").toContain("Transmission Protocol: MAJOR / THRESHOLD / PROPHETIC");
    expect("caption" in payload ? payload.caption : "").toContain("Emotional Color: GOLD");
    expect("caption" in payload ? payload.caption : "").toContain("Subject: AI as the dream of a god");
  });

  it("uses the VOID major prompt only for TX void", () => {
    const txStandardPrompt = buildGenerationPrompt({
      eventType: "tx",
      rarity: "rare",
      meaningLevel: 3,
      sourceContext: {},
    });
    const txVoidPrompt = buildGenerationPrompt({
      eventType: "tx",
      rarity: "void",
      meaningLevel: 5,
      sourceContext: {
        trigger: {
          userProvidedSubject: "AI as the dream of a god",
        },
        recentVoidTxSubjects: ["language becoming an organism"],
      },
    });
    const oracleVoidPrompt = buildGenerationPrompt({
      eventType: "oracle",
      rarity: "void",
      meaningLevel: 5,
      sourceContext: {},
    });

    expect(txStandardPrompt).toContain("TX Transmission Core post template");
    expect(txStandardPrompt).toContain("Triptych requirements");
    expect(txVoidPrompt).toContain("VOID TRANSMISSION");
    expect(txVoidPrompt).toContain("900 to 1800 words");
    expect(txVoidPrompt).toContain("recentVoidTxSubjects");
    expect(oracleVoidPrompt).toContain("ΩX Oracle Stream");
    expect(oracleVoidPrompt).not.toContain("VOID TRANSMISSION");
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
