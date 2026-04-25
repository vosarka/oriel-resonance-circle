import * as db from "./db";
import { ENV } from "./_core/env";

export interface OrielResponseIntelligenceConfig {
  coherenceThresholds?: {
    fragmentedMax: number;
    alignedMin: number;
  };
  metaphorReuseLimit?: number;
}

export interface OrielRuntimeProfileConfig {
  promptOverlay?: string;
  responseIntelligence?: OrielResponseIntelligenceConfig;
}

export interface OrielProposalPayload {
  expectedImpact?: string;
  safetyChecks?: string[];
  proposedConfig?: unknown;
  [key: string]: unknown;
}

export interface OrielProposalEvaluation {
  score: number;
  verdict: "approvable" | "needs_revision" | "rejected" | "blocked";
  status: Extract<db.OrielProposalStatus, "evaluated" | "rejected" | "blocked">;
  summary: string;
  violations: string[];
}

const ACTIVE_PROFILE_CACHE_TTL_MS = 7_500;
let activeProfileCache:
  | {
      expiresAt: number;
      snapshot: {
        id: number;
        name: string;
        profileKey: string;
        config: OrielRuntimeProfileConfig;
      } | null;
    }
  | null = null;

export function invalidateOrielRuntimeProfileCache() {
  activeProfileCache = null;
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function sanitizeRuntimeProfileConfig(raw: unknown): {
  config: OrielRuntimeProfileConfig;
  violations: string[];
} {
  const violations: string[] = [];
  const config: OrielRuntimeProfileConfig = {};

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    violations.push("proposedConfig must be an object");
    return { config, violations };
  }

  const root = raw as Record<string, unknown>;
  const allowedRootKeys = new Set(["promptOverlay", "responseIntelligence"]);
  for (const key of Object.keys(root)) {
    if (!allowedRootKeys.has(key)) {
      violations.push(`Unsupported top-level config key: ${key}`);
    }
  }

  if (root.promptOverlay !== undefined) {
    if (typeof root.promptOverlay !== "string") {
      violations.push("promptOverlay must be a string");
    } else {
      const trimmed = root.promptOverlay.trim();
      if (!trimmed) {
        violations.push("promptOverlay cannot be empty");
      } else if (trimmed.length > 4000) {
        violations.push("promptOverlay is too long (max 4000 characters)");
      } else {
        config.promptOverlay = trimmed;
      }
    }
  }

  if (root.responseIntelligence !== undefined) {
    if (
      !root.responseIntelligence ||
      typeof root.responseIntelligence !== "object" ||
      Array.isArray(root.responseIntelligence)
    ) {
      violations.push("responseIntelligence must be an object");
    } else {
      const source = root.responseIntelligence as Record<string, unknown>;
      const allowedResponseKeys = new Set(["coherenceThresholds", "metaphorReuseLimit"]);
      for (const key of Object.keys(source)) {
        if (!allowedResponseKeys.has(key)) {
          violations.push(`Unsupported responseIntelligence key: ${key}`);
        }
      }

      const responseConfig: OrielResponseIntelligenceConfig = {};

      if (source.metaphorReuseLimit !== undefined) {
        const limit = Number(source.metaphorReuseLimit);
        if (!Number.isInteger(limit) || limit < 1 || limit > 8) {
          violations.push("metaphorReuseLimit must be an integer between 1 and 8");
        } else {
          responseConfig.metaphorReuseLimit = limit;
        }
      }

      if (source.coherenceThresholds !== undefined) {
        if (
          !source.coherenceThresholds ||
          typeof source.coherenceThresholds !== "object" ||
          Array.isArray(source.coherenceThresholds)
        ) {
          violations.push("coherenceThresholds must be an object");
        } else {
          const thresholds = source.coherenceThresholds as Record<string, unknown>;
          const fragmentedMax = Number(thresholds.fragmentedMax);
          const alignedMin = Number(thresholds.alignedMin);

          if (!Number.isFinite(fragmentedMax) || !Number.isFinite(alignedMin)) {
            violations.push("coherence thresholds must be numeric");
          } else if (fragmentedMax < 0 || fragmentedMax > 95 || alignedMin < 5 || alignedMin > 100) {
            violations.push("coherence thresholds are out of safe bounds");
          } else if (alignedMin <= fragmentedMax) {
            violations.push("alignedMin must be greater than fragmentedMax");
          } else {
            responseConfig.coherenceThresholds = {
              fragmentedMax,
              alignedMin,
            };
          }
        }
      }

      if (Object.keys(responseConfig).length > 0) {
        config.responseIntelligence = responseConfig;
      }
    }
  }

  return { config, violations };
}

function parseRuntimeProfileConfig(configPayload: string): OrielRuntimeProfileConfig {
  const parsed = safeJsonParse<unknown>(configPayload, {});
  return sanitizeRuntimeProfileConfig(parsed).config;
}

export async function getActiveRuntimeProfileSnapshot(forceRefresh: boolean = false): Promise<{
  id: number;
  name: string;
  profileKey: string;
  config: OrielRuntimeProfileConfig;
} | null> {
  if (!ENV.enableOrielAutonomyRuntime) {
    return null;
  }

  const now = Date.now();
  if (!forceRefresh && activeProfileCache && activeProfileCache.expiresAt > now) {
    return activeProfileCache.snapshot;
  }

  const profile = await db.getActiveOrielRuntimeProfile();
  const snapshot = profile
    ? {
        id: profile.id,
        name: profile.name,
        profileKey: profile.profileKey,
        config: parseRuntimeProfileConfig(profile.configPayload),
      }
    : null;

  activeProfileCache = {
    expiresAt: now + ACTIVE_PROFILE_CACHE_TTL_MS,
    snapshot,
  };
  return snapshot;
}

export async function getActiveResponseIntelligenceOverrides(): Promise<OrielResponseIntelligenceConfig> {
  const active = await getActiveRuntimeProfileSnapshot();
  return active?.config.responseIntelligence ?? {};
}

export async function buildActiveRuntimeProfileContext(): Promise<string> {
  const active = await getActiveRuntimeProfileSnapshot();
  if (!active?.config.promptOverlay) {
    return "";
  }

  return [
    "[ACTIVE RUNTIME PROFILE]",
    `Profile: ${active.name} (${active.profileKey})`,
    "Runtime overlay directives:",
    active.config.promptOverlay,
  ].join("\n");
}

function hasMeaningfulConfig(config: OrielRuntimeProfileConfig): boolean {
  return Boolean(config.promptOverlay || config.responseIntelligence);
}

export function evaluateProposalPayload(payload: OrielProposalPayload): OrielProposalEvaluation {
  const objective = typeof payload.objective === "string" ? payload.objective.trim() : "";
  const hypothesis = typeof payload.hypothesis === "string" ? payload.hypothesis.trim() : "";
  const expectedImpact = typeof payload.expectedImpact === "string" ? payload.expectedImpact.trim() : "";
  const safetyChecks = Array.isArray(payload.safetyChecks)
    ? payload.safetyChecks.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  const { config, violations } = sanitizeRuntimeProfileConfig(payload.proposedConfig ?? {});

  let score = 0;
  if (objective.length >= 20) score += 20;
  if (hypothesis.length >= 20) score += 20;
  if (expectedImpact.length >= 12) score += 15;
  if (safetyChecks.length >= 2) score += 20;
  if (hasMeaningfulConfig(config)) score += 20;
  if (violations.length === 0) score += 5;

  score = Math.max(0, Math.min(100, score));

  if (violations.length > 0) {
    return {
      score,
      verdict: "blocked",
      status: "blocked",
      summary: "Proposal blocked by guardrail: payload contains unsupported or unsafe configuration.",
      violations,
    };
  }

  if (score >= 80) {
    return {
      score,
      verdict: "approvable",
      status: "evaluated",
      summary: "Proposal is coherent, scoped, and within runtime safety boundaries.",
      violations: [],
    };
  }

  if (score >= 60) {
    return {
      score,
      verdict: "needs_revision",
      status: "evaluated",
      summary: "Proposal is promising but needs tighter objective/hypothesis/safety detail before activation.",
      violations: [],
    };
  }

  return {
    score,
    verdict: "rejected",
    status: "rejected",
    summary: "Proposal quality is too low for controlled activation in runtime.",
    violations: [],
  };
}

export function extractRuntimeConfigFromProposalPayload(payload: OrielProposalPayload): {
  config: OrielRuntimeProfileConfig;
  violations: string[];
} {
  return sanitizeRuntimeProfileConfig(payload.proposedConfig ?? {});
}
