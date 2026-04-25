const nodeEnv = process.env.NODE_ENV ?? "development";
const runMigrationsEnv = process.env.RUN_MIGRATIONS?.toLowerCase();
const autonomyRuntimeEnv = process.env.ORIEL_AUTONOMY_RUNTIME?.toLowerCase();

const resolveRunMigrations = () => {
  if (runMigrationsEnv === "true") return true;
  if (runMigrationsEnv === "false") return false;
  return false;
};

const resolveAutonomyRuntimeEnabled = () => autonomyRuntimeEnv === "true";

export const ENV = {
  nodeEnv,
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: nodeEnv === "production",
  runMigrations: resolveRunMigrations(),
  // OFF by default: autonomy runtime overlays only activate when explicitly enabled.
  enableOrielAutonomyRuntime: resolveAutonomyRuntimeEnabled(),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  appBaseUrl: process.env.APP_BASE_URL ?? "",

  // ─── Better Auth ────────────────────────────────────────────────────────
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "",

  // ─── SMTP (Password Recovery Email) ────────────────────────────────────
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: process.env.SMTP_PORT ?? "",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpSecure: process.env.SMTP_SECURE ?? "",
  authEmailFrom: process.env.AUTH_EMAIL_FROM ?? "",

  // ─── Resend (Email OTP) ────────────────────────────────────────────
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFrom: process.env.RESEND_FROM ?? "",

  // ─── Twilio (Phone SMS) ────────────────────────────────────────────
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",

  // ─── Inworld (TTS & Realtime) ─────────────────────────────────────────
  inworldApiKey: process.env.INWORLD_API_KEY ?? "",
};
