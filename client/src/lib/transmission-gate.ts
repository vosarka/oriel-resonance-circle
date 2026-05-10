export interface TransmissionGatePlanInput {
  forceTransmissionMode: boolean;
  hasTransmissionEvent: boolean;
}

export interface TransmissionGatePlan {
  startBeforeRequest: boolean;
  lockBeforeReveal: boolean;
  cancelAfterResult: boolean;
}

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
