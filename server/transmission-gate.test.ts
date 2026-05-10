import { describe, expect, it } from "vitest";
import { getTransmissionGatePlan } from "../client/src/lib/transmission-gate";

describe("transmission gate plan", () => {
  it("locks before revealing naturally generated transmissions", () => {
    expect(
      getTransmissionGatePlan({
        forceTransmissionMode: false,
        hasTransmissionEvent: true,
      }),
    ).toEqual({
      startBeforeRequest: false,
      lockBeforeReveal: true,
      cancelAfterResult: false,
    });
  });

  it("keeps explicit transmission command acquiring before request and locks before reveal", () => {
    expect(
      getTransmissionGatePlan({
        forceTransmissionMode: true,
        hasTransmissionEvent: true,
      }),
    ).toEqual({
      startBeforeRequest: true,
      lockBeforeReveal: true,
      cancelAfterResult: false,
    });
  });

  it("cancels explicit transmission animation when no event is returned", () => {
    expect(
      getTransmissionGatePlan({
        forceTransmissionMode: true,
        hasTransmissionEvent: false,
      }),
    ).toEqual({
      startBeforeRequest: true,
      lockBeforeReveal: false,
      cancelAfterResult: true,
    });
  });

  it("does nothing for ordinary chat responses without transmission events", () => {
    expect(
      getTransmissionGatePlan({
        forceTransmissionMode: false,
        hasTransmissionEvent: false,
      }),
    ).toEqual({
      startBeforeRequest: false,
      lockBeforeReveal: false,
      cancelAfterResult: false,
    });
  });
});
