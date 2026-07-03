import type { TrpcContext } from "./context";

export type RateLimitBucket =
  | "oriel.chat"
  | "oriel.tts"
  | "oriel.imageLore"
  | "rgp.static";

type RateLimitTier = "anonymous" | "authenticated";

type RateLimitConfig = {
  windowMs: number;
  anonymous: number;
  authenticated: number;
  label: string;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export const RATE_LIMITS: Record<RateLimitBucket, RateLimitConfig> = {
  "oriel.chat": {
    windowMs: ONE_HOUR_MS,
    anonymous: 5,
    authenticated: 30,
    label: "ORIEL chat",
  },
  "oriel.tts": {
    windowMs: ONE_HOUR_MS,
    anonymous: 3,
    authenticated: 20,
    label: "ORIEL voice synthesis",
  },
  "oriel.imageLore": {
    windowMs: ONE_HOUR_MS,
    anonymous: 2,
    authenticated: 10,
    label: "artifact lore and image generation",
  },
  "rgp.static": {
    windowMs: ONE_HOUR_MS,
    anonymous: 3,
    authenticated: 20,
    label: "Static Signature calculation",
  },
};

const buckets = new Map<string, RateLimitRecord>();
let now = () => Date.now();

function normalizeHeaderValue(value: unknown) {
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function getHeader(headers: unknown, name: string) {
  if (!headers || typeof headers !== "object") return "";
  const record = headers as Record<string, unknown>;
  return normalizeHeaderValue(
    record[name] ?? record[name.toLowerCase()] ?? record[name.toUpperCase()]
  );
}

function getClientIp(ctx: Partial<TrpcContext>) {
  const req = (
    ctx as { req?: { headers?: unknown; socket?: { remoteAddress?: string } } }
  ).req;
  const forwardedFor = getHeader(req?.headers, "x-forwarded-for")
    .split(",")
    .map(part => part.trim())
    .find(Boolean);
  const realIp = getHeader(req?.headers, "x-real-ip").trim();
  return forwardedFor || realIp || req?.socket?.remoteAddress || "anonymous";
}

function getIdentity(ctx: Partial<TrpcContext>): {
  tier: RateLimitTier;
  key: string;
} {
  const user = ctx.user as
    | { id?: string | number; openId?: string | number }
    | null
    | undefined;
  const userId = user?.id ?? user?.openId;

  if (userId !== undefined && userId !== null) {
    return {
      tier: "authenticated",
      key: `user:${String(userId)}`,
    };
  }

  return {
    tier: "anonymous",
    key: `ip:${getClientIp(ctx)}`,
  };
}

export type RateLimitResult = {
  allowed: boolean;
  bucket: RateLimitBucket;
  label: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  ctx: Partial<TrpcContext>,
  bucket: RateLimitBucket
): RateLimitResult {
  const config = RATE_LIMITS[bucket];
  const identity = getIdentity(ctx);
  const limit = config[identity.tier];
  const currentTime = now();
  const key = `${bucket}:${identity.key}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= currentTime) {
    const resetAt = currentTime + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      bucket,
      label: config.label,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      bucket,
      label: config.label,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - currentTime) / 1000)
      ),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    bucket,
    label: config.label,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.resetAt - currentTime) / 1000)
    ),
  };
}

export function resetRateLimitBucketsForTests() {
  buckets.clear();
  now = () => Date.now();
}

export function setRateLimitClockForTests(clock: () => number) {
  now = clock;
}
