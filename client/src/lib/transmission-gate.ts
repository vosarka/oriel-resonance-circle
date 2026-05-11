export interface TransmissionGatePlanInput {
  forceTransmissionMode: boolean;
  hasTransmissionEvent: boolean;
}

export interface TransmissionGatePlan {
  startBeforeRequest: boolean;
  lockBeforeReveal: boolean;
  cancelAfterResult: boolean;
}

export interface PendingTransmissionPollPlanInput {
  isAuthenticated: boolean;
  hasPendingTransmission: boolean;
  conversationId: number | null | undefined;
}

export interface PendingTransmissionPollPlan {
  shouldPoll: boolean;
  intervalMs: number;
  timeoutMs: number;
  maxAttempts: number;
}

const PENDING_TRANSMISSION_POLL_INTERVAL_MS = 1500;
const PENDING_TRANSMISSION_POLL_TIMEOUT_MS = 45000;

export function getTransmissionGatePlan({
  forceTransmissionMode,
  hasTransmissionEvent,
}: TransmissionGatePlanInput): TransmissionGatePlan {
  return {
    startBeforeRequest: forceTransmissionMode,
    lockBeforeReveal: hasTransmissionEvent,
    cancelAfterResult: forceTransmissionMode && !hasTransmissionEvent,
  };
}

export function getPendingTransmissionPollPlan({
  isAuthenticated,
  hasPendingTransmission,
  conversationId,
}: PendingTransmissionPollPlanInput): PendingTransmissionPollPlan {
  const maxAttempts = Math.ceil(
    PENDING_TRANSMISSION_POLL_TIMEOUT_MS / PENDING_TRANSMISSION_POLL_INTERVAL_MS,
  );

  return {
    shouldPoll: Boolean(isAuthenticated && hasPendingTransmission && conversationId),
    intervalMs: PENDING_TRANSMISSION_POLL_INTERVAL_MS,
    timeoutMs: PENDING_TRANSMISSION_POLL_TIMEOUT_MS,
    maxAttempts,
  };
}
