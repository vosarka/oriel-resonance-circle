/**
 * Better Auth client — used for all authentication flows.
 *
 * Auth methods:
 *   1. Google OAuth — authClient.signIn.social({ provider: "google" })
 *   2. Email + Password — authClient.signIn.email / authClient.signUp.email
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: window.location.origin,
});
