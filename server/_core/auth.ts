/**
 * Better Auth Configuration
 *
 * Provides Google OAuth and Email+Password authentication.
 * Uses a separate ba_* table set — bridged to the legacy `users` table
 * via email in context.ts so all existing user data (conversations,
 * readings, subscriptions) is preserved.
 */

import { betterAuth } from "better-auth";
import { verifyPassword as verifyScryptPassword } from "better-auth/crypto";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import * as schema from "../../drizzle/schema";
import { ENV } from "./env";

// ─── Drizzle instance for Better Auth ────────────────────────────────────────

function createBetterAuthDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Better Auth");
  }
  return drizzle(process.env.DATABASE_URL);
}

async function hashCredentialPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function verifyCredentialPassword({
  password,
  hash,
}: {
  password: string;
  hash: string;
}) {
  // Legacy and reset passwords are stored as bcrypt hashes.
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    return bcrypt.compare(password, hash);
  }

  // Better Auth defaults to scrypt for accounts created before this override.
  if (hash.includes(":")) {
    return verifyScryptPassword({ password, hash });
  }

  return false;
}

// ─── Better Auth instance ────────────────────────────────────────────────────

export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:*",
    ...(ENV.appBaseUrl ? [ENV.appBaseUrl] : []),
  ],
  baseURL: ENV.appBaseUrl || `http://localhost:${process.env.PORT || 3000}`,
  basePath: "/api/auth",
  secret: ENV.betterAuthSecret || ENV.cookieSecret || (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BETTER_AUTH_SECRET or COOKIE_SECRET must be set in production");
    }
    return "dev-only-insecure-fallback-" + Date.now();
  })(),

  database: drizzleAdapter(createBetterAuthDb(), {
    provider: "mysql",
    schema: {
      user: schema.baUser,
      session: schema.baSession,
      account: schema.baAccount,
      verification: schema.baVerification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: hashCredentialPassword,
      verify: verifyCredentialPassword,
    },
  },

  socialProviders: {
    google: {
      clientId: ENV.googleClientId,
      clientSecret: ENV.googleClientSecret,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session daily
  },
});

export type BetterAuthSession = typeof auth.$Infer.Session;
