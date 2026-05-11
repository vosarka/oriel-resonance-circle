import { describe, expect, it } from "vitest";
import {
  canActivateProposalPayload,
  summarizeGuardrailBlockPayload,
  type OrielProposalPayload,
} from "./oriel-autonomy";

const runtimeProposal = (
  overrides: Partial<OrielProposalPayload> = {}
): OrielProposalPayload => ({
  proposedConfig: {
    promptOverlay:
      "Keep Romanian runtime responses concise while preserving ORIEL cadence.",
  },
  rollbackPath:
    "Deactivate this runtime profile if response cadence becomes too rigid.",
  falsifier:
    "Block activation if Romanian clarity does not improve across observed sessions.",
  ...overrides,
});

describe("ORIEL architect console helpers", () => {
  it("blocks activation when an evaluated runtime proposal lacks rollback metadata", () => {
    expect(
      canActivateProposalPayload(
        runtimeProposal({
          rollbackPath: "",
        }),
        "evaluated"
      )
    ).toEqual({
      canActivate: false,
      missing: ["rollbackPath"],
    });
  });

  it("blocks activation when an evaluated runtime proposal lacks falsifier metadata", () => {
    expect(
      canActivateProposalPayload(
        runtimeProposal({
          falsifier: "too short",
        }),
        "evaluated"
      )
    ).toEqual({
      canActivate: false,
      missing: ["falsifier"],
    });
  });

  it("allows activation for evaluated proposals with meaningful rollback and falsifier metadata", () => {
    expect(canActivateProposalPayload(runtimeProposal(), "evaluated")).toEqual({
      canActivate: true,
      missing: [],
    });
  });

  it("summarizes guardrail block payloads without trusting malformed payload shape", () => {
    expect(
      summarizeGuardrailBlockPayload({
        violations: [
          "rollbackPath is required for runtime-changing proposals",
          "falsifier is required for runtime-changing proposals",
        ],
      })
    ).toBe(
      "rollbackPath is required for runtime-changing proposals; falsifier is required for runtime-changing proposals"
    );

    expect(summarizeGuardrailBlockPayload({ violations: [42] })).toBe(
      "Guardrail block payload did not include readable violations."
    );
  });
});
