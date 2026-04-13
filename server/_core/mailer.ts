import nodemailer from "nodemailer";
import { ENV } from "./env";

const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 15_000;
const SMTP_SEND_TIMEOUT_MS = 20_000;
const RESEND_SEND_TIMEOUT_MS = 15_000;

type MailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

function hasResendConfig() {
  return Boolean(ENV.resendApiKey && ENV.resendFrom);
}

function requireMailConfig() {
  if (hasResendConfig()) return;

  if (!ENV.smtpHost || !ENV.smtpPort || !ENV.smtpUser || !ENV.smtpPass || !ENV.authEmailFrom) {
    throw new Error(
      "Either RESEND_API_KEY + RESEND_FROM or SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and AUTH_EMAIL_FROM are required for password recovery",
    );
  }
}

function createTransport() {
  requireMailConfig();

  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: Number(ENV.smtpPort),
    secure: ENV.smtpSecure === "true",
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
    auth: {
      user: ENV.smtpUser,
      pass: ENV.smtpPass,
    },
  });
}

async function sendViaResend(message: MailMessage) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESEND_SEND_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.resendFrom,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend API error ${response.status}: ${body.slice(0, 300)}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function sendViaSmtp(message: MailMessage) {
  const transporter = createTransport();

  await Promise.race([
    transporter.sendMail(message),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("SMTP send timeout")), SMTP_SEND_TIMEOUT_MS);
    }),
  ]);
}

async function sendMail(message: MailMessage) {
  requireMailConfig();

  if (hasResendConfig()) {
    await sendViaResend(message);
    return;
  }

  await sendViaSmtp(message);
}

export async function sendPasswordResetCodeEmail(email: string, code: string) {
  await sendMail({
    from: ENV.authEmailFrom || ENV.resendFrom,
    to: email,
    subject: "Your ORIEL password reset code",
    text: [
      "A password reset was requested for your ORIEL account.",
      "",
      `Reset code: ${code}`,
      "",
      "This code expires in 15 minutes.",
      "If you did not request this reset, you can ignore this email.",
    ].join("\n"),
  });
}

export async function sendPasswordRecoveryGuidanceEmail(email: string) {
  await sendMail({
    from: ENV.authEmailFrom || ENV.resendFrom,
    to: email,
    subject: "ORIEL account sign-in guidance",
    text: [
      "A password reset was requested for your ORIEL account.",
      "",
      "This account does not currently use email-password sign-in.",
      "Please return to the sign-in page and use your original sign-in method.",
    ].join("\n"),
  });
}
