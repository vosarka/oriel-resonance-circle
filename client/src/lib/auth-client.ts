/**
 * Better Auth client — used for all authentication flows.
 *
 * Three auth methods:
 *   1. Google OAuth — authClient.signIn.social({ provider: "google" })
 *   2. Email OTP — authClient.emailOtp.sendVerificationOtp / verifyEmail
 *   3. Phone SMS — authClient.phoneNumber.sendOtp / verify
 */

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [emailOTPClient(), phoneNumberClient()],
});
