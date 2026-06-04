import { describe, expect, it } from "vitest";
import {
  getPendingTransmissionPollPlan,
  getTransmissionGatePlan,
} from "../client/src/lib/transmission-gate";

describe("transmission gate plan", () => {
  it("locks before revealing naturally generated transmissions", () => {
    expect(
      getTransmissionGatePlan({
        forceTransmissionMode: false,
        hasTransmissionEvent: true,
      })
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
      })
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
      })
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
      })
    ).toEqual({
      startBeforeRequest: false,
      lockBeforeReveal: false,
      cancelAfterResult: false,
    });
  });

  it("polls authenticated pending natural transmissions without starting the gate immediately", () => {
    expect(
      getPendingTransmissionPollPlan({
        isAuthenticated: true,
        hasPendingTransmission: true,
        conversationId: 42,
      })
    ).toEqual({
      shouldPoll: true,
      intervalMs: 1500,
      timeoutMs: 45000,
      maxAttempts: 30,
    });
  });

  it("does not poll pending transmissions when there is no authenticated conversation", () => {
    expect(
      getPendingTransmissionPollPlan({
        isAuthenticated: false,
        hasPendingTransmission: true,
        conversationId: null,
      })
    ).toEqual({
      shouldPoll: false,
      intervalMs: 1500,
      timeoutMs: 45000,
      maxAttempts: 30,
    });
  });
});
