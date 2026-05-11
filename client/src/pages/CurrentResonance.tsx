import { Link } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RadioTower,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

type CurrentResonanceStatus =
  | "missing_static_profile"
  | "missing_carrierlock"
  | "missing_dynamic_reading"
  | "ready";

interface CurrentResonanceResult {
  status: CurrentResonanceStatus;
  staticAnchor: {
    vrcType: string | null;
    vrcAuthority: string | null;
    fractalRole: string | null;
    birthLocation: string | null;
    primeStackCount: number;
  } | null;
  carrierlock: {
    coherenceScore: number | null;
    mentalNoise: number | null;
    bodyTension: number | null;
    emotionalTurbulence: number | null;
    breathCompletion: boolean | null;
    createdAt: string | null;
  } | null;
  activePattern: {
    codon256Id: string;
    codon: number | null;
    facet: string | null;
    sli: number;
    interpretation: "highest_shadow_loudness";
  } | null;
  primeStackPosition: {
    position: number | null;
    codonName: string | null;
    center: string | null;
    label: string | null;
  } | null;
  microCorrection: string | null;
  falsifier: string | null;
  nextAction: string;
  evidence: string[];
}

const statusLabels: Record<CurrentResonanceStatus, string> = {
  missing_static_profile: "Static anchor missing",
  missing_carrierlock: "Carrierlock missing",
  missing_dynamic_reading: "Dynamic reading missing",
  ready: "Ready",
};

function formatNumber(value: number | null | undefined, fallback = "—") {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : fallback;
}

function MissingState({
  status,
  nextAction,
}: {
  status: CurrentResonanceStatus;
  nextAction: string;
}) {
  const links =
    status === "missing_static_profile"
      ? [{ href: "/complete-profile", label: "Complete profile" }]
      : status === "missing_carrierlock"
        ? [{ href: "/carrierlock", label: "Run Carrierlock" }]
        : [
            { href: "/carrierlock", label: "Run Carrierlock" },
            { href: "/readings", label: "View readings" },
          ];

  return (
    <section className="border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <h2 className="font-mono text-sm uppercase tracking-[0.22em]">
              {statusLabels[status]}
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-zinc-300">{nextAction}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map(link => (
            <Link key={link.href} href={link.href}>
              <Button className="bg-primary text-black hover:bg-primary/90">
                {link.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CurrentResonance() {
  const { user } = useAuth();
  const { data, isLoading, error } =
    trpc.profile.getCurrentResonance.useQuery(undefined, {
      enabled: Boolean(user),
    });

  if (!user) {
    return (
      <Layout>
        <main className="min-h-screen bg-black px-4 py-16 text-zinc-100">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
            <RadioTower className="h-10 w-10 text-primary" />
            <h1 className="font-serif text-3xl italic text-zinc-100">
              Current Resonance
            </h1>
            <p className="text-sm text-zinc-400">
              Sign in to load your current resonance state.
            </p>
            <a href={getLoginUrl()}>
              <Button className="bg-primary text-black hover:bg-primary/90">
                Sign in
              </Button>
            </a>
          </div>
        </main>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <main className="flex min-h-screen items-center justify-center bg-black text-zinc-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <main className="min-h-screen bg-black px-4 py-16 text-zinc-100">
          <div className="mx-auto max-w-3xl border border-red-500/30 bg-red-500/5 p-6">
            <div className="flex items-center gap-2 text-red-200">
              <AlertTriangle className="h-4 w-4" />
              <h1 className="font-mono text-sm uppercase tracking-[0.22em]">
                Resonance unavailable
              </h1>
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              {error?.message ??
                "The current resonance route returned no data."}
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  const coherence = data.carrierlock?.coherenceScore ?? 0;
  const activeLabel = data.activePattern
    ? `${data.activePattern.codon256Id} · SLI ${data.activePattern.sli}`
    : "No active pattern";

  return (
    <Layout>
      <main className="min-h-screen bg-black px-4 py-10 text-zinc-100">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex flex-col gap-5 border-b border-zinc-800 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit border-primary/30 bg-primary/10 font-mono text-primary">
                {statusLabels[data.status]}
              </Badge>
              <div>
                <h1 className="font-serif text-4xl italic tracking-normal text-zinc-100 md:text-5xl">
                  Current Resonance
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  A compact view of the static anchor, latest Carrierlock state,
                  and loudest stored SLI interference.
                </p>
              </div>
            </div>
            <Link href="/carrierlock">
              <Button variant="outline" className="border-primary/40">
                Recalibrate
                <Activity className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </header>

          {data.status !== "ready" && (
            <MissingState status={data.status} nextAction={data.nextAction} />
          )}

          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-zinc-800 bg-zinc-950/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Static Anchor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">VRC</span>
                  <span className="text-right text-zinc-100">
                    {data.staticAnchor?.vrcType ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Authority</span>
                  <span className="text-right text-zinc-100">
                    {data.staticAnchor?.vrcAuthority ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Prime Stack</span>
                  <span className="font-mono text-zinc-100">
                    {formatNumber(data.staticAnchor?.primeStackCount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-950/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RadioTower className="h-4 w-4 text-primary" />
                  Carrierlock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-end justify-between">
                  <span className="text-zinc-500">Coherence</span>
                  <span className="font-mono text-3xl text-primary">
                    {formatNumber(data.carrierlock?.coherenceScore)}
                  </span>
                </div>
                <Progress value={Math.max(0, Math.min(100, coherence))} />
                <div className="grid grid-cols-3 gap-2 font-mono text-xs text-zinc-400">
                  <span>M {formatNumber(data.carrierlock?.mentalNoise)}</span>
                  <span>B {formatNumber(data.carrierlock?.bodyTension)}</span>
                  <span>
                    E {formatNumber(data.carrierlock?.emotionalTurbulence)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Active Pattern
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="font-mono text-xl text-primary">
                  {activeLabel}
                </div>
                <p className="text-zinc-400">
                  {data.primeStackPosition?.label ?? "Prime Stack position"} ·{" "}
                  {data.primeStackPosition?.center ?? "center unresolved"}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Highest finite SLI = active interference
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border border-zinc-800 bg-zinc-950/60 p-5">
              <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
                Micro-correction
              </h2>
              <p className="mt-4 text-sm leading-6 text-zinc-200">
                {data.microCorrection ?? "No micro-correction recorded yet."}
              </p>
              <h3 className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                Falsifier
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {data.falsifier ?? "No falsifier recorded yet."}
              </p>
            </div>

            <div className="border border-zinc-800 bg-zinc-950/60 p-5">
              <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
                Evidence
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-zinc-400">
                {data.evidence.map(item => (
                  <li key={item} className="border-l border-primary/40 pl-3">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-zinc-200">{data.nextAction}</p>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
