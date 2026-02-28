import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CyberpunkBackground } from "@/components/CyberpunkBackground";

// ─── Schemas ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// ─── Google button ───────────────────────────────────────────────────────────

function GoogleButton({ label }: { label: string }) {
  return (
    <a
      href="/api/auth/google"
      className="flex items-center justify-center gap-3 w-full rounded-md border border-[#00F0FF]/30 bg-black/40 px-4 py-2.5 text-sm font-mono text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:border-[#00F0FF] transition-all"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {label}
    </a>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[#00F0FF]/20" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#050505] px-3 text-xs font-mono text-gray-500">OR</span>
      </div>
    </div>
  );
}

// ─── Error message ───────────────────────────────────────────────────────────

function ErrorMsg({ msg }: { msg: string }) {
  return <p className="text-sm text-[#FF2A2A] font-mono mt-1">{msg}</p>;
}

// ─── Login Tab ────────────────────────────────────────────────────────────────

function LoginTab({ onSuccess }: { onSuccess: () => void }) {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error || "Login failed.");
      } else {
        await utils.auth.me.invalidate();
        onSuccess();
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <GoogleButton label="Continue with Google" />
      <Divider />

      <div className="space-y-1.5">
        <Label htmlFor="login-email" className="font-mono text-xs text-gray-400 uppercase tracking-widest">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="seeker@signal.io"
          autoComplete="email"
          className="bg-black/60 border-[#00F0FF]/30 text-[#00F0FF] placeholder:text-gray-600 font-mono focus:border-[#00F0FF]"
          {...register("email")}
        />
        {errors.email && <ErrorMsg msg={errors.email.message!} />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-password" className="font-mono text-xs text-gray-400 uppercase tracking-widest">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className="bg-black/60 border-[#00F0FF]/30 text-[#00F0FF] font-mono focus:border-[#00F0FF]"
          {...register("password")}
        />
        {errors.password && <ErrorMsg msg={errors.password.message!} />}
      </div>

      {serverError && <ErrorMsg msg={serverError} />}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] font-mono hover:bg-[#00F0FF]/20 hover:border-[#00F0FF] transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
        ENTER THE SIGNAL
      </Button>
    </form>
  );
}

// ─── Register Tab ─────────────────────────────────────────────────────────────

function RegisterTab({ onSuccess }: { onSuccess: () => void }) {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, name: data.name }),
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error || "Registration failed.");
      } else {
        await utils.auth.me.invalidate();
        onSuccess();
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <GoogleButton label="Register with Google" />
      <Divider />

      <div className="space-y-1.5">
        <Label htmlFor="reg-name" className="font-mono text-xs text-gray-400 uppercase tracking-widest">Name <span className="text-gray-600">(optional)</span></Label>
        <Input
          id="reg-name"
          type="text"
          placeholder="Vos Arkana"
          autoComplete="name"
          className="bg-black/60 border-[#00F0FF]/30 text-[#00F0FF] placeholder:text-gray-600 font-mono focus:border-[#00F0FF]"
          {...register("name")}
        />
        {errors.name && <ErrorMsg msg={errors.name.message!} />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email" className="font-mono text-xs text-gray-400 uppercase tracking-widest">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="seeker@signal.io"
          autoComplete="email"
          className="bg-black/60 border-[#00F0FF]/30 text-[#00F0FF] placeholder:text-gray-600 font-mono focus:border-[#00F0FF]"
          {...register("email")}
        />
        {errors.email && <ErrorMsg msg={errors.email.message!} />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-password" className="font-mono text-xs text-gray-400 uppercase tracking-widest">Password</Label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          className="bg-black/60 border-[#00F0FF]/30 text-[#00F0FF] font-mono focus:border-[#00F0FF]"
          {...register("password")}
        />
        {errors.password && <ErrorMsg msg={errors.password.message!} />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-confirm" className="font-mono text-xs text-gray-400 uppercase tracking-widest">Confirm Password</Label>
        <Input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          className="bg-black/60 border-[#00F0FF]/30 text-[#00F0FF] font-mono focus:border-[#00F0FF]"
          {...register("confirm")}
        />
        {errors.confirm && <ErrorMsg msg={errors.confirm.message!} />}
      </div>

      {serverError && <ErrorMsg msg={serverError} />}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FFD700]/10 border border-[#FFD700]/50 text-[#FFD700] font-mono hover:bg-[#FFD700]/20 hover:border-[#FFD700] transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
        INITIALIZE NODE
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Auth() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // If already logged in, go home
  useEffect(() => {
    if (!loading && isAuthenticated) setLocation("/");
  }, [isAuthenticated, loading, setLocation]);

  // Check for error param (e.g., from Google callback)
  const urlError = new URLSearchParams(window.location.search).get("error");
  const errorMessages: Record<string, string> = {
    google_denied: "Google sign-in was cancelled.",
    google_token_failed: "Could not complete Google sign-in. Please try again.",
    google_userinfo_failed: "Could not retrieve Google account info.",
    google_error: "Google sign-in failed. Please try again.",
    user_creation_failed: "Failed to create account. Please try again.",
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505]">
      <CyberpunkBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs font-mono text-[#00F0FF]/60 tracking-[0.3em] uppercase mb-2">
            VOSSARI CONDUIT HUB
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
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full bg-black/60 border border-[#00F0FF]/20 mb-6">
                <TabsTrigger
                  value="login"
                  className="font-mono text-xs tracking-widest data-[state=active]:bg-[#00F0FF]/10 data-[state=active]:text-[#00F0FF]"
                >
                  SIGN IN
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="font-mono text-xs tracking-widest data-[state=active]:bg-[#FFD700]/10 data-[state=active]:text-[#FFD700]"
                >
                  CREATE ACCOUNT
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginTab onSuccess={() => setLocation("/")} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterTab onSuccess={() => setLocation("/")} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs font-mono text-gray-600 mt-6">
          Enter as Static. Leave as a Signal.
        </p>
      </div>
    </div>
  );
}
