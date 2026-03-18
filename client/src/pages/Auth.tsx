import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2, Mail, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { authClient } from "@/lib/auth-client";
import { CyberpunkBackground } from "@/components/CyberpunkBackground";

// ─── Shared UI ───────────────────────────────────────────────────────────────

function ErrorMsg({ msg }: { msg: string }) {
  return <p className="text-sm text-[#FF2A2A] font-mono mt-1">{msg}</p>;
}

function SuccessMsg({ msg }: { msg: string }) {
  return <p className="text-sm text-[#00FF88] font-mono mt-1">{msg}</p>;
}

function Divider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[#00F0FF]/20" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#050505] px-3 text-xs font-mono text-gray-500">OR</span>
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
      className="flex items-center justify-center gap-3 w-full rounded-md border border-[#00F0FF]/30 bg-black/40 px-4 py-2.5 text-sm font-mono text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:border-[#00F0FF] transition-all disabled:opacity-50"
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

// ─── OTP Code Input ──────────────────────────────────────────────────────────

function OtpInput({ length = 6, onComplete }: { length?: number; onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[idx] = value;
    setDigits(next);

    if (value && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }

    const code = next.join("");
    if (code.length === length && next.every(d => d)) {
      onComplete(code);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const next = [...digits];
    for (let i = 0; i < text.length; i++) {
      next[i] = text[i];
    }
    setDigits(next);
    if (text.length === length) {
      onComplete(text);
    } else {
      refs.current[text.length]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-11 h-13 text-center text-xl font-mono bg-black/60 border border-[#00F0FF]/30 text-[#00F0FF] rounded-md focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
        />
      ))}
    </div>
  );
}

// ─── Email OTP Flow ──────────────────────────────────────────────────────────

function EmailOtpFlow({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (res.error) {
        setError(res.error.message || "Failed to send code.");
      } else {
        setSuccess("Code sent — check your inbox.");
        setStep("verify");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });
      if (res.error) {
        setError(res.error.message || "Invalid code. Try again.");
      } else {
        onSuccess();
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => { setStep("email"); setError(""); setSuccess(""); }}
          className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-[#00F0FF] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>

        <div className="text-center space-y-2">
          <p className="text-sm font-mono text-gray-400">
            Enter the 6-digit code sent to
          </p>
          <p className="text-sm font-mono text-[#00F0FF]">{email}</p>
        </div>

        <OtpInput onComplete={handleVerify} />

        {error && <ErrorMsg msg={error} />}
        {loading && (
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 text-[#00F0FF] animate-spin" />
          </div>
        )}

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full text-xs font-mono text-gray-500 hover:text-[#00F0FF] transition-colors disabled:opacity-50"
        >
          Resend code
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email-otp" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
          Email Address
        </Label>
        <Input
          id="email-otp"
          type="email"
          placeholder="seeker@signal.io"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="bg-black/60 border-[#00F0FF]/30 text-[#00F0FF] placeholder:text-gray-600 font-mono focus:border-[#00F0FF]"
        />
      </div>

      {error && <ErrorMsg msg={error} />}
      {success && <SuccessMsg msg={success} />}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] font-mono hover:bg-[#00F0FF]/20 hover:border-[#00F0FF] transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
        SEND ACCESS CODE
      </Button>
    </form>
  );
}

// ─── Phone SMS Flow ──────────────────────────────────────────────────────────

function PhoneSmsFlow({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/[^0-9+]/g, "");
    if (cleaned.length < 8) {
      setError("Enter a valid phone number with country code (e.g., +1...).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await authClient.phoneNumber.sendOtp({
        phoneNumber: cleaned,
      });
      if (res.error) {
        setError(res.error.message || "Failed to send SMS.");
      } else {
        setSuccess("SMS code sent.");
        setStep("verify");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setError("");
    setLoading(true);
    try {
      const cleaned = phone.replace(/[^0-9+]/g, "");
      const res = await authClient.phoneNumber.verify({
        phoneNumber: cleaned,
        code,
      });
      if (res.error) {
        setError(res.error.message || "Invalid code. Try again.");
      } else {
        onSuccess();
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => { setStep("phone"); setError(""); setSuccess(""); }}
          className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-[#FFD700] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>

        <div className="text-center space-y-2">
          <p className="text-sm font-mono text-gray-400">
            Enter the 6-digit code sent to
          </p>
          <p className="text-sm font-mono text-[#FFD700]">{phone}</p>
        </div>

        <OtpInput onComplete={handleVerify} />

        {error && <ErrorMsg msg={error} />}
        {loading && (
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 text-[#FFD700] animate-spin" />
          </div>
        )}

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full text-xs font-mono text-gray-500 hover:text-[#FFD700] transition-colors disabled:opacity-50"
        >
          Resend code
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone-otp" className="font-mono text-xs text-gray-400 uppercase tracking-widest">
          Phone Number
        </Label>
        <Input
          id="phone-otp"
          type="tel"
          placeholder="+1 555 000 0000"
          autoComplete="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="bg-black/60 border-[#FFD700]/30 text-[#FFD700] placeholder:text-gray-600 font-mono focus:border-[#FFD700]"
        />
        <p className="text-[10px] font-mono text-gray-600">Include country code (e.g., +1 for US)</p>
      </div>

      {error && <ErrorMsg msg={error} />}
      {success && <SuccessMsg msg={success} />}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FFD700]/10 border border-[#FFD700]/50 text-[#FFD700] font-mono hover:bg-[#FFD700]/20 hover:border-[#FFD700] transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
        SEND SMS CODE
      </Button>
    </form>
  );
}

// ─── Auth Method Selector ────────────────────────────────────────────────────

type AuthMethod = "select" | "email" | "phone";

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const handleSuccess = () => {
    // Give Better Auth a moment to set the session cookie, then redirect
    setTimeout(() => setLocation("/"), 300);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505]">
      <CyberpunkBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs font-mono text-[#00F0FF]/60 tracking-[0.3em] uppercase mb-2">
            VOSS ARKIVA
          </div>
          <h1 className="text-2xl font-mono text-[#00F0FF] tracking-wider uppercase">
            Enter as Static.
          </h1>
          <p className="text-sm font-mono text-gray-500 mt-1">Leave as a Signal.</p>
        </div>

        {urlError && (
          <div className="mb-4 rounded-md border border-[#FF2A2A]/40 bg-[#FF2A2A]/10 px-4 py-3">
            <p className="text-sm font-mono text-[#FF2A2A]">
              {errorMessages[urlError] ?? "An error occurred. Please try again."}
            </p>
          </div>
        )}

        <Card className="bg-black/80 border-[#00F0FF]/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#00F0FF] font-mono text-lg tracking-wider">ACCESS NODE</CardTitle>
            <CardDescription className="font-mono text-gray-500 text-xs">
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

                {/* Email OTP */}
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className="flex items-center justify-center gap-3 w-full rounded-md border border-[#00F0FF]/30 bg-black/40 px-4 py-2.5 text-sm font-mono text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:border-[#00F0FF] transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Continue with Email
                </button>

                {/* Phone SMS */}
                <button
                  type="button"
                  onClick={() => setMethod("phone")}
                  className="flex items-center justify-center gap-3 w-full rounded-md border border-[#FFD700]/30 bg-black/40 px-4 py-2.5 text-sm font-mono text-[#FFD700] hover:bg-[#FFD700]/10 hover:border-[#FFD700] transition-all"
                >
                  <Phone className="w-5 h-5" />
                  Continue with Phone
                </button>
              </div>
            ) : method === "email" ? (
              <div>
                <button
                  type="button"
                  onClick={() => setMethod("select")}
                  className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-[#00F0FF] transition-colors mb-4"
                >
                  <ArrowLeft className="w-3 h-3" /> All sign-in options
                </button>
                <EmailOtpFlow onSuccess={handleSuccess} />
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setMethod("select")}
                  className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-[#FFD700] transition-colors mb-4"
                >
                  <ArrowLeft className="w-3 h-3" /> All sign-in options
                </button>
                <PhoneSmsFlow onSuccess={handleSuccess} />
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs font-mono text-gray-600 mt-6">
          Enter as Static. Leave as a Signal.
        </p>
      </div>
    </div>
  );
}
