import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { checkRateLimit, type RateLimitBucket } from "./rate-limit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

function setRateLimitHeaders(
  ctx: TrpcContext,
  result: ReturnType<typeof checkRateLimit>
) {
  ctx.res?.setHeader?.("X-RateLimit-Bucket", result.bucket);
  ctx.res?.setHeader?.("X-RateLimit-Limit", String(result.limit));
  ctx.res?.setHeader?.("X-RateLimit-Remaining", String(result.remaining));
  ctx.res?.setHeader?.(
    "X-RateLimit-Reset",
    String(Math.ceil(result.resetAt / 1000))
  );
  if (!result.allowed) {
    ctx.res?.setHeader?.("Retry-After", String(result.retryAfterSeconds));
  }
}

const rateLimitMiddleware = (bucket: RateLimitBucket) =>
  t.middleware(async opts => {
    const result = checkRateLimit(opts.ctx, bucket);
    setRateLimitHeaders(opts.ctx, result);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `${result.label} quota reached. Try again in ${result.retryAfterSeconds} seconds.`,
      });
    }

    return opts.next();
  });

export const rateLimitedProcedure = (bucket: RateLimitBucket) =>
  publicProcedure.use(rateLimitMiddleware(bucket));

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
