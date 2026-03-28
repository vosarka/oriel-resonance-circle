export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  appBaseUrl: process.env.APP_BASE_URL ?? "",

  // ─── Better Auth ────────────────────────────────────────────────────────
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "",

  // ─── Resend (Email OTP) ────────────────────────────────────────────────
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFrom: process.env.RESEND_FROM ?? "",

  // ─── Twilio (Phone SMS) ────────────────────────────────────────────────
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",

  // ─── Inworld (TTS & Realtime) ─────────────────────────────────────────
  inworldApiKey: process.env.INWORLD_API_KEY ?? "",
};
