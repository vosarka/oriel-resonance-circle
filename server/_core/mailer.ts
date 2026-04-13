import nodemailer from "nodemailer";
import { ENV } from "./env";

const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 15_000;
const SMTP_SEND_TIMEOUT_MS = 20_000;

function requireMailConfig() {
  if (!ENV.smtpHost || !ENV.smtpPort || !ENV.smtpUser || !ENV.smtpPass || !ENV.authEmailFrom) {
    throw new Error(
      "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and AUTH_EMAIL_FROM are required for password recovery",
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

async function sendMailWithTimeout(message: nodemailer.SendMailOptions) {
  const transporter = createTransport();

  await Promise.race([
    transporter.sendMail(message),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("SMTP send timeout")), SMTP_SEND_TIMEOUT_MS);
    }),
  ]);
}

export async function sendPasswordResetCodeEmail(email: string, code: string) {
  await sendMailWithTimeout({
    from: ENV.authEmailFrom,
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
  await sendMailWithTimeout({
    from: ENV.authEmailFrom,
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
