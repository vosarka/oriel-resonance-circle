import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { SignJWT } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import * as db from "../db";

// ─── JWT helpers ────────────────────────────────────────────────────────────

function getSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret || "fallback-dev-secret");
}

async function createSessionCookie(openId: string, name: string): Promise<string> {
  const expiresAt = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);
  return new SignJWT({ openId, appId: ENV.appId || "vossari", name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());
}

function setAuthCookie(req: Request, res: Response, token: string) {
  const cookieOpts = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOpts, maxAge: ONE_YEAR_MS });
}

// ─── Email + Password ───────────────────────────────────────────────────────

async function handleRegister(req: Request, res: Response) {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const existing = await db.getUserByEmail(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const openId = nanoid(21);

  await db.upsertUser({
    openId,
    email: email.toLowerCase().trim(),
    name: name?.trim() || null,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  await db.setUserPasswordHash(openId, passwordHash);

  const user = await db.getUserByOpenId(openId);
  if (!user) return res.status(500).json({ error: "Failed to create account." });

  const token = await createSessionCookie(openId, user.name || "Seeker");
  setAuthCookie(req, res, token);
  return res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

async function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await db.getUserByEmail(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const hash = (user as any).passwordHash as string | null;
  if (!hash) {
    return res.status(401).json({ error: "This account uses Google sign-in. Please continue with Google." });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

  const token = await createSessionCookie(user.openId, user.name || "Seeker");
  setAuthCookie(req, res, token);
  return res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

// ─── Google OAuth ────────────────────────────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getGoogleRedirectUri(req: Request) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3002";
  return `${proto}://${host}/api/auth/google/callback`;
}

async function handleGoogleStart(req: Request, res: Response) {
  if (!ENV.googleClientId) {
    return res.status(503).json({ error: "Google OAuth is not configured." });
  }

  const redirectUri = getGoogleRedirectUri(req);
  const state = Buffer.from(JSON.stringify({ ts: Date.now() })).toString("base64url");

  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return res.redirect(`${GOOGLE_AUTH_URL}?${params}`);
}

async function handleGoogleCallback(req: Request, res: Response) {
  const { code, error } = req.query as { code?: string; error?: string };

  if (error || !code) {
    return res.redirect("/auth?error=google_denied");
  }

  try {
    const redirectUri = getGoogleRedirectUri(req);

    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[Google OAuth] Token exchange failed:", await tokenRes.text());
      return res.redirect("/auth?error=google_token_failed");
    }

    const tokens = await tokenRes.json() as { access_token: string };

    // Get user info
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return res.redirect("/auth?error=google_userinfo_failed");
    }

    const info = await userInfoRes.json() as {
      sub: string;
      email: string;
      name?: string;
      given_name?: string;
    };

    const googleId = info.sub;
    const email = info.email?.toLowerCase().trim();
    const name = info.name || info.given_name || null;

    // Find existing user by googleId, or by email (link accounts)
    let user = await db.getUserByGoogleId(googleId);
    if (!user && email) {
      user = await db.getUserByEmail(email) ?? undefined;
    }

    if (user) {
      // Update googleId if not yet linked
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date(), loginMethod: "google" });
      if (!(user as any).googleId) {
        await db.setUserGoogleId(user.openId, googleId);
      }
    } else {
      // New user via Google
      const openId = googleId; // Google sub is stable & unique
      await db.upsertUser({
        openId,
        email: email || null,
        name: name || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      await db.setUserGoogleId(openId, googleId);
      user = await db.getUserByOpenId(openId) ?? undefined;
    }

    if (!user) return res.redirect("/auth?error=user_creation_failed");

    const token = await createSessionCookie(user.openId, user.name || "Seeker");
    setAuthCookie(req, res, token);
    return res.redirect("/");
  } catch (err) {
    console.error("[Google OAuth] Callback error:", err);
    return res.redirect("/auth?error=google_error");
  }
}

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/google", handleGoogleStart);
  app.get("/api/auth/google/callback", handleGoogleCallback);
}
