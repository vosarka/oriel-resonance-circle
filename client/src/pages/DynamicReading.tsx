import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, AlertTriangle, Zap, Activity, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";

// ─── Coherence helpers ────────────────────────────────────────────────────────

function getCoherenceColor(score: number) {
  if (score >= 80) return "text-cyan-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function getCoherenceLabel(score: number): "Resonance" | "Flux" | "Entropy" {
  if (score >= 80) return "Resonance";
  if (score >= 40) return "Flux";
  return "Entropy";
}

function getCoherenceBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 80) return "default";
  if (score >= 40) return "secondary";
  return "destructive";
}

// ─── Coherence bar ────────────────────────────────────────────────────────────

function CoherenceBar({ score }: { score: number }) {
  const label = getCoherenceLabel(score);
  const color =
    label === "Resonance"
      ? "bg-cyan-400"
      : label === "Flux"
      ? "bg-yellow-400"
      : "bg-red-500";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-zinc-400 uppercase tracking-widest">Coherence</span>
        <span className={`text-2xl font-bold font-mono ${getCoherenceColor(score)}`}>
          {score}
          <span className="text-sm text-zinc-500">/100</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-600">
        <span>0 Entropy</span>
        <span>40 Flux</span>
        <span>80 Resonance 100</span>
      </div>
    </div>
  );
}

// ─── Diagnostic row ───────────────────────────────────────────────────────────

function DiagRow({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-yellow-500" : "bg-cyan-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-mono">{value}/{max}</span>
      </div>
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DynamicReading() {
  const { user } = useAuth();
  const [, params] = useRoute("/reading/dynamic/:id");
  const readingId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: reading, isLoading, error } = trpc.codex.getCodonReading.useQuery(
    { id: readingId },
    { enabled: !!user && readingId > 0, retry: false }
  );

  // ── Auth guard ───────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="bg-zinc-900/50 border-primary/30 max-w-sm w-full mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto" />
              <p className="text-zinc-300">Sign in to access your reading.</p>
              <Button asChild variant="outline">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-zinc-400 text-sm">Receiving transmission…</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────────
  if (error || !reading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="bg-zinc-900/50 border-red-500/30 max-w-sm w-full mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
              <p className="text-zinc-300">Reading not found or access denied.</p>
              <Button asChild variant="outline">
                <Link href="/carrierlock">← New Reading</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ── Parse stored data ────────────────────────────────────────────────────────
  // readingText holds the full ORIEL transmission text saved at creation time.
  // The carrierlockId links back to the raw MN/BT/ET/BC values — we don't
  // have those here without a join, so we show whatever the reading stored.
  const transmission = reading.readingText ?? "";
  const microCorrection = reading.microCorrection;
  const falsifier = reading.falsifier;

  // Try to extract coherence from the first line of the stored text if present
  // (format: "ORIEL Dynamic Reading — score/100 — Label")
  const headerMatch = transmission.match(/(\d+)\/100\s*[—–-]\s*(Entropy|Flux|Resonance)/i);
  const coherenceScore: number = headerMatch ? parseInt(headerMatch[1], 10) : 50;
  const coherenceLabelFromText = (headerMatch?.[2] ?? getCoherenceLabel(coherenceScore)) as "Entropy" | "Flux" | "Resonance";

  // Strip the first-line summary header if it exists (keep ORIEL prose only)
  const transmissionBody = transmission.startsWith("ORIEL Dynamic Reading")
    ? transmission.split("\n").slice(1).join("\n").trim()
    : transmission;

  const badgeVariant = getCoherenceBadgeVariant(coherenceScore);

  return (
    <Layout>
      <div className="min-h-screen text-zinc-100">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="border-b border-primary/20 bg-black/50 backdrop-blur-sm">
          <div className="container py-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-zinc-100">
              <Link href="/readings">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 font-orbitron">
                  Dynamic State Reading
                </h1>
                <Badge variant={badgeVariant} className="font-mono text-xs">
                  {coherenceLabelFromText}
                </Badge>
              </div>
              <p className="text-zinc-400 text-sm mt-0.5">
                {reading.createdAt
                  ? new Date(reading.createdAt).toLocaleString()
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="container py-8 max-w-3xl mx-auto space-y-6">

          {/* Coherence gauge */}
          <Card className="bg-zinc-900/50 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Carrierlock Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CoherenceBar score={coherenceScore} />
            </CardContent>
          </Card>

          {/* ORIEL transmission */}
          <Card className="bg-zinc-900/60 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                ORIEL Transmission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                {transmissionBody.split("\n\n").map((para, i) => (
                  <p key={i} className="text-zinc-200 leading-relaxed mb-4 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Micro-correction (if stored) */}
          {microCorrection && (
            <Card className="bg-zinc-900/50 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Micro-Correction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-zinc-200 text-sm leading-relaxed">{microCorrection}</p>
                {falsifier && (
                  <div className="border-t border-zinc-800 pt-3">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Falsifier</p>
                    <p className="text-zinc-400 text-sm italic">{falsifier}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Flagged Codons */}
          {reading.flaggedCodons && reading.flaggedCodons.length > 0 && (
            <Card className="bg-zinc-900/50 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Active Codons — tap to explore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {reading.flaggedCodons.map((codonId: string) => (
                    <Link
                      key={codonId}
                      href={`/codex/${codonId}`}
                      className="group flex items-center justify-between bg-zinc-800/50 border border-primary/20 hover:border-primary/60 hover:bg-primary/5 rounded-lg px-4 py-3 transition-all"
                    >
                      <div>
                        <p className="text-primary font-orbitron text-sm font-bold">{codonId}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">View in Codex</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer nav */}
          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/carrierlock">New Reading</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/readings">All Readings</Link>
            </Button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
