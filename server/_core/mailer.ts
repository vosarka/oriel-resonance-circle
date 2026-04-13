import nodemailer from "nodemailer";
import { ENV } from "./env";

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
    auth: {
      user: ENV.smtpUser,
      pass: ENV.smtpPass,
    },
  });
}

export async function sendPasswordResetCodeEmail(email: string, code: string) {
  const transporter = createTransport();

  await transporter.sendMail({
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
  const transporter = createTransport();

  await transporter.sendMail({
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
