/**
 * Better Auth Configuration
 *
 * Provides Google OAuth, Email OTP, and Phone SMS authentication.
 * Uses a separate ba_* table set — bridged to the legacy `users` table
 * via email in context.ts so all existing user data (conversations,
 * readings, subscriptions) is preserved.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { phoneNumber } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../../drizzle/schema";
import { ENV } from "./env";

// ─── Drizzle instance for Better Auth ────────────────────────────────────────

function createBetterAuthDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Better Auth");
  }
  return drizzle(process.env.DATABASE_URL);
}

// ─── Email transport ─────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, text: string) {
  // Dynamic import to avoid loading nodemailer if not configured
  try {
    const nodemailer = await import("nodemailer");

    if (!ENV.smtpHost) {
      console.warn("[Auth] SMTP not configured — logging OTP instead");
      console.log(`[Auth] EMAIL to ${to}: ${text}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: parseInt(ENV.smtpPort || "587"),
      secure: ENV.smtpPort === "465",
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });

    await transporter.sendMail({
      from: ENV.smtpFrom || `"Vossari Codex" <noreply@vossari.com>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("[Auth] Failed to send email:", err);
    // In dev, log the OTP so testing isn't blocked
    console.log(`[Auth] FALLBACK — EMAIL to ${to}: ${text}`);
  }
}

// ─── SMS transport ───────────────────────────────────────────────────────────

async function sendSMS(phoneNumber: string, message: string) {
  if (!ENV.twilioAccountSid || !ENV.twilioAuthToken) {
    console.warn("[Auth] Twilio not configured — logging SMS OTP instead");
    console.log(`[Auth] SMS to ${phoneNumber}: ${message}`);
    return;
  }

  try {
    // Twilio REST API — no SDK dependency needed
    const credentials = Buffer.from(
      `${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`
    ).toString("base64");

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ENV.twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: ENV.twilioPhoneNumber,
          Body: message,
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Auth] Twilio error:", errBody);
    }
  } catch (err) {
    console.error("[Auth] Failed to send SMS:", err);
    console.log(`[Auth] FALLBACK — SMS to ${phoneNumber}: ${message}`);
  }
}

// ─── Better Auth instance ────────────────────────────────────────────────────

export const auth = betterAuth({
  baseURL: ENV.appBaseUrl || "http://localhost:3000",
  basePath: "/api/auth",
  secret: ENV.betterAuthSecret || ENV.cookieSecret || "dev-fallback-secret-change-me",

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
    requireEmailVerification: false, // Users can also use OTP flow
  },

  socialProviders: {
    google: {
      clientId: ENV.googleClientId,
      clientSecret: ENV.googleClientSecret,
    },
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      async sendVerificationOTP({ email, otp, type }) {
        const subjects: Record<string, string> = {
          "sign-in": "Your Vossari Access Code",
          "email-verification": "Verify Your Vossari Email",
          "forget-password": "Reset Your Vossari Password",
        };

        const subject = subjects[type] || "Vossari Codex — Verification Code";
        const text = [
          `Your verification code is: ${otp}`,
          "",
          `This code expires in 5 minutes.`,
          "",
          "If you didn't request this, you can safely ignore this message.",
          "",
          "— ORIEL, Vossari Codex",
        ].join("\n");

        // Don't await — avoids timing attacks
        sendEmail(email, subject, text);
      },
    }),

    phoneNumber({
      sendOTP({ phoneNumber: phone, code }) {
        const message = `Your Vossari access code is: ${code}. Expires in 5 minutes.`;
        // Don't await — avoids timing attacks
        sendSMS(phone, message);
      },
      signUpOnVerification: {
        getTempEmail: (phone: string) =>
          `${phone.replace(/[^0-9]/g, "")}@phone.vossari.com`,
        getTempName: (phone: string) => phone,
      },
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session daily
  },
});

export type BetterAuthSession = typeof auth.$Infer.Session;
