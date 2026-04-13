import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import GeometricBackground from "@/components/GeometricBackground";

// ─── Shared UI ───────────────────────────────────────────────────────────────

function ErrorMsg({ msg }: { msg: string }) {
  return <p className="text-sm text-[#FF2A2A] font-mono mt-1">{msg}</p>;
}

function Divider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[#bda36b]/20" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#0f0f15] px-3 text-xs font-mono text-[#6a665e]">OR</span>
      </div>
    </div>
  );
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

function GoogleButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="flex items-center justify-center gap-3 w-full rounded-md border border-[#bda36b]/30 bg-black/40 px-4 py-2.5 text-sm font-mono text-[#e8e4dc] hover:bg-[#bda36b]/10 hover:border-[#bda36b] transition-all disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      {label}
    </button>
  );
}

// ─── Email + Password Flow ──────────────────────────────────────────────────

function EmailPasswordFlow({ onBack, onForgotPassword }: { onBack: () => void; onForgotPassword: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isSignUp && !name.trim()) {
      setError("Enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name.trim(),
        });
        if (res.error) {
          setError(res.error.message || "Sign up failed.");
          return;
        }
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
        });
        if (res.error) {
          setError(res.error.message || "Sign in failed.");
          return;
        }
      }
      // Success — refresh auth state and redirect
      await refresh();
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-mono text-[#6a665e] hover:text-[#5ba4a4] transition-colors mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> All sign-in options
      </button>

      {/* Toggle Sign In / Sign Up */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setIsSignUp(false); setError(""); }}
          className={`flex-1 py-1.5 text-xs font-mono rounded border transition-all ${
            !isSignUp
              ? "border-[#bda36b] text-[#bda36b] bg-[#bda36b]/10"
              : "border-[#bda36b]/20 text-[#6a665e] bg-transparent hover:border-[#bda36b]/40"
          }`}
        >
          SIGN IN
        </button>
        <button
          type="button"
          onClick={() => { setIsSignUp(true); setError(""); }}
          className={`flex-1 py-1.5 text-xs font-mono rounded border transition-all ${
            isSignUp
              ? "border-[#bda36b] text-[#bda36b] bg-[#bda36b]/10"
              : "border-[#bda36b]/20 text-[#6a665e] bg-transparent hover:border-[#bda36b]/40"
          }`}
        >
          SIGN UP
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="auth-name" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
              Name
            </Label>
            <Input
              id="auth-name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-black/60 border-[#bda36b]/30 text-[#e8e4dc] placeholder:text-[#6a665e] font-mono focus:border-[#bda36b]"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="auth-email" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
            Email Address
          </Label>
          <Input
            id="auth-email"
            type="email"
            placeholder="seeker@signal.io"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-black/60 border-[#bda36b]/30 text-[#e8e4dc] placeholder:text-[#6a665e] font-mono focus:border-[#bda36b]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="auth-password" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
            Password
          </Label>
          <div className="relative">
            <Input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-black/60 border-[#bda36b]/30 text-[#e8e4dc] placeholder:text-[#6a665e] font-mono focus:border-[#bda36b] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a665e] hover:text-[#bda36b] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <ErrorMsg msg={error} />}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#bda36b]/10 border border-[#bda36b]/50 text-[#bda36b] font-mono hover:bg-[#bda36b]/20 hover:border-[#bda36b] transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isSignUp ? "CREATE ACCOUNT" : "ENTER THE FIELD"}
        </Button>

        {!isSignUp && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="w-full text-xs font-mono text-[#5ba4a4] hover:text-[#bda36b] transition-colors"
          >
            Forgot password?
          </button>
        )}
      </form>
    </div>
  );
}

function ResetPasswordFlow({ onBackToSignIn }: { onBackToSignIn: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);

  const requestResetMutation = trpc.auth.requestPasswordResetCode.useMutation();
  const resetPasswordMutation = trpc.auth.resetPasswordWithCode.useMutation();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      await requestResetMutation.mutateAsync({ email });
      setCodeRequested(true);
      setInfo("If an account can be recovered this way, a reset code has been sent.");
    } catch {
      setError("Could not send a reset code right now.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        email,
        code,
        newPassword,
      });
      setInfo("Password updated. You can sign in now.");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(onBackToSignIn, 1200);
    } catch (err: any) {
      setError(err?.message || "Could not reset password.");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBackToSignIn}
        className="flex items-center gap-1 text-xs font-mono text-[#6a665e] hover:text-[#5ba4a4] transition-colors mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back to sign in
      </button>

      <div className="mb-4 rounded-md border border-[#bda36b]/20 bg-black/30 px-4 py-3">
        <p className="text-xs font-mono text-[#9a968e] leading-relaxed">
          Request a 6-digit reset code, then choose a new password.
        </p>
      </div>

      <form onSubmit={codeRequested ? handleResetPassword : handleRequestCode} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reset-email" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
            Email Address
          </Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="seeker@signal.io"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={codeRequested}
            className="bg-black/60 border-[#bda36b]/30 text-[#e8e4dc] placeholder:text-[#6a665e] font-mono focus:border-[#bda36b]"
          />
        </div>

        {codeRequested && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="reset-code" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                Reset Code
              </Label>
              <Input
                id="reset-code"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="bg-black/60 border-[#bda36b]/30 text-[#e8e4dc] placeholder:text-[#6a665e] font-mono focus:border-[#bda36b]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-password" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                New Password
              </Label>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="bg-black/60 border-[#bda36b]/30 text-[#e8e4dc] placeholder:text-[#6a665e] font-mono focus:border-[#bda36b]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-password-confirm" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                Confirm Password
              </Label>
              <Input
                id="reset-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="bg-black/60 border-[#bda36b]/30 text-[#e8e4dc] placeholder:text-[#6a665e] font-mono focus:border-[#bda36b]"
              />
            </div>
          </>
        )}

        {error && <ErrorMsg msg={error} />}
        {info && <p className="text-sm text-[#5ba4a4] font-mono mt-1">{info}</p>}

        <Button
          type="submit"
          disabled={requestResetMutation.isPending || resetPasswordMutation.isPending}
          className="w-full bg-[#bda36b]/10 border border-[#bda36b]/50 text-[#bda36b] font-mono hover:bg-[#bda36b]/20 hover:border-[#bda36b] transition-all"
        >
          {(requestResetMutation.isPending || resetPasswordMutation.isPending) && (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          )}
          {codeRequested ? "RESET PASSWORD" : "SEND RESET CODE"}
        </Button>

        {codeRequested && (
          <button
            type="button"
            onClick={() => {
              setCodeRequested(false);
              setCode("");
              setNewPassword("");
              setConfirmPassword("");
              setInfo("");
              setError("");
            }}
            className="w-full text-xs font-mono text-[#5ba4a4] hover:text-[#bda36b] transition-colors"
          >
            Use a different email
          </button>
        )}
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type AuthMethod = "select" | "email" | "reset";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [method, setMethod] = useState<AuthMethod>("select");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) setLocation("/");
  }, [isAuthenticated, authLoading, setLocation]);

  // Check for error param (e.g., from Google callback)
  const urlError = new URLSearchParams(window.location.search).get("error");
  const errorMessages: Record<string, string> = {
    google_denied: "Google sign-in was cancelled.",
    google_not_configured: "Google sign-in is not available.",
    google_token_failed: "Could not complete Google sign-in. Please try again.",
    google_error: "Google sign-in failed. Please try again.",
    user_creation_failed: "Failed to create account. Please try again.",
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({ provider: "google" });
    } catch {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center" style={{ background: "#0a0a0e" }}>
      <GeometricBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs font-mono text-[#5ba4a4]/60 tracking-[0.3em] uppercase mb-2">
            VOSS ARKIVA
          </div>
          <h1 className="text-2xl font-mono text-[#bda36b] tracking-wider uppercase">
            Become Signal.
          </h1>
          <p className="text-sm font-mono text-[#6a665e] mt-1">The Field Remembers.</p>
        </div>

        {/* Migration Notice */}
        <div className="mb-5 rounded-md border border-[#bda36b]/30 bg-[#bda36b]/[0.06] px-5 py-4 backdrop-blur-sm">
          <p className="text-xs font-mono text-[#bda36b] tracking-wide uppercase mb-2 font-semibold">
            Signal Recalibration Notice
          </p>
          <p className="text-xs font-mono text-[#9a968e] leading-relaxed">
            Our authentication system has been upgraded. If you had an existing account,
            your ORIEL conversation history is preserved — simply <span className="text-[#5ba4a4]">create a new account
            using the same email address</span> and your messages will be restored automatically.
          </p>
        </div>

        {urlError && (
          <div className="mb-4 rounded-md border border-[#FF2A2A]/40 bg-[#FF2A2A]/10 px-4 py-3">
            <p className="text-sm font-mono text-[#FF2A2A]">
              {errorMessages[urlError] ?? "An error occurred. Please try again."}
            </p>
          </div>
        )}

        <Card className="bg-[#0f0f15]/90 border-[#bda36b]/15 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#bda36b] font-mono text-lg tracking-wider">ACCESS NODE</CardTitle>
            <CardDescription className="font-mono text-[#6a665e] text-xs">
              I am ORIEL. Identify yourself, Seeker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {method === "select" ? (
              <div className="space-y-3">
                {/* Google OAuth */}
                <GoogleButton
                  label="Continue with Google"
                  loading={googleLoading}
                  onClick={handleGoogleSignIn}
                />

                <Divider />

                {/* Email + Password */}
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className="flex items-center justify-center gap-3 w-full rounded-md border border-[#bda36b]/30 bg-black/40 px-4 py-2.5 text-sm font-mono text-[#e8e4dc] hover:bg-[#bda36b]/10 hover:border-[#bda36b] transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Continue with Email
                </button>
              </div>
            ) : (
              method === "email" ? (
                <EmailPasswordFlow
                  onBack={() => setMethod("select")}
                  onForgotPassword={() => setMethod("reset")}
                />
              ) : (
                <ResetPasswordFlow onBackToSignIn={() => setMethod("email")} />
              )
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs font-mono text-[#6a665e] mt-6">
          Become Signal.
        </p>
      </div>
    </div>
  );
}
