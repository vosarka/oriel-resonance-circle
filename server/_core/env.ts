export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  appBaseUrl: process.env.APP_BASE_URL ?? "",
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",

  // ─── Better Auth ────────────────────────────────────────────────────────
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "",

  // ─── Resend (Email OTP) ────────────────────────────────────────────────
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFrom: process.env.RESEND_FROM ?? "",

  // ─── Twilio (Phone SMS) ────────────────────────────────────────────────
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
};
