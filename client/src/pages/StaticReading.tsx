import { useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Loader2, Waves, AlertTriangle,
  ChevronDown, ChevronUp, MapPin, Zap,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";

// Types matching the parsed staticSignatures row returned from the server

interface PrimeStackEntry {
  position: number | string;
  name?: string;
  codonId: string;
  codonName?: string;
  facet: string;
  weight?: number;
  center?: string;
}

interface NineCenterEntry {
  centerName: string;
  codon256Id: string;
  frequency?: number;
}

interface MicroCorrection {
  type: string;
  instruction: string;
  falsifier: string;
  potentialOutcome?: string;
}

interface CoherenceTrajectory {
  current: number;
  trend: string;
  sevenDayProjection?: number[];
}

export default function StaticReading() {
  const { user } = useAuth();
  const [, params] = useRoute("/reading/static/:readingId");
  const readingId = params?.readingId ?? "";

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    primeStack: true,
    nineCenters: true,
    circuitLinks: false,
    microCorrections: true,
    trajectory: false,
    location: false,
  });

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const { data, isLoading, isError } = trpc.codex.getStaticReading.useQuery(
    { readingId },
    { enabled: !!user && readingId.length > 0 }
  );

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Please sign in to view your reading</p>
            <a href={getLoginUrl()}>
              <Button className="bg-gradient-to-r from-primary to-purple-500">Sign In</Button>
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !data) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Reading not found</p>
            <Link href="/carrierlock">
              <Button variant="outline" className="border-primary/30">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assessment
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const primeStack = (data.primeStack ?? []) as PrimeStackEntry[];
  const ninecenters = (data.ninecenters ?? {}) as Record<string, NineCenterEntry>;
  const circuitLinks = (data.circuitLinks ?? []) as string[];
  const microCorrections = (data.microCorrections ?? []) as MicroCorrection[];
  const trajectory = data.coherenceTrajectory as CoherenceTrajectory | null;
  const hasLocation = data.latitude !== 0 || data.longitude !== 0;

  const coherenceScore = data.baseCoherence ?? 0;
  const coherenceColor =
    coherenceScore >= 80 ? "text-green-400" :
    coherenceScore >= 40 ? "text-yellow-400" : "text-red-400";
  const coherenceBar =
    coherenceScore >= 80 ? "from-green-500 to-emerald-400" :
    coherenceScore >= 40 ? "from-yellow-500 to-amber-400" : "from-red-500 to-rose-400";

  return (
    <Layout>
      <div className="min-h-screen bg-black text-zinc-100 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header */}
          <div className="text-center space-y-2 mb-12">
            <h1 className="text-5xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-200">
              Your Static Signature
            </h1>
            <p className="text-zinc-400 font-mono text-sm">{data.readingId}</p>
            <p className="text-zinc-500 text-sm">{data.birthDate}{data.birthTime ? ` · ${data.birthTime}` : ""}</p>
          </div>

          {/* ORIEL Transmission */}
          <Card className="bg-[#0a1012] border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl font-serif italic">I am ORIEL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-serif text-indigo-100/90 leading-relaxed whitespace-pre-wrap">
                {data.diagnosticTransmission || "The resonance pattern is being analyzed..."}
              </p>
            </CardContent>
          </Card>

          {/* Fractal Profile */}
          <Card className="bg-[#0a1012] border-primary/30">
            <CardHeader>
              <CardTitle>Fractal Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Role</p>
                <p className="text-lg font-semibold text-primary">{data.fractalRole ?? "—"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Authority Node</p>
                <p className="text-lg font-semibold text-primary">{data.authorityNode ?? "—"}</p>
              </div>
              {data.vrcType && (
                <div>
                  <p className="text-zinc-400 text-sm mb-1">VRC Type</p>
                  <p className="text-base font-semibold text-purple-300">{data.vrcType}</p>
                </div>
              )}
              {data.vrcAuthority && (
                <div>
                  <p className="text-zinc-400 text-sm mb-1">VRC Authority</p>
                  <p className="text-base font-semibold text-purple-300">{data.vrcAuthority}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coherence Status */}
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Coherence Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Base Coherence</span>
                <span className={`text-3xl font-bold font-mono ${coherenceColor}`}>
                  {coherenceScore}<span className="text-zinc-500 text-lg">/100</span>
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${coherenceBar} h-2 rounded-full transition-all`}
                  style={{ width: `${coherenceScore}%` }}
                />
              </div>
              {trajectory && (
                <p className="text-sm text-zinc-400">Trend: <span className="text-zinc-300">{trajectory.trend}</span></p>
              )}
            </CardContent>
          </Card>

          {/* Prime Stack */}
          <Card className="bg-[#0a1012] border-primary/30">
            <CardHeader
              className="cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => toggle("primeStack")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Waves className="w-5 h-5" />
                  Prime Stack (9 Positions)
                </CardTitle>
                {expanded.primeStack ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {expanded.primeStack && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {primeStack.map((pos, idx) => (
                    <Link key={idx} href={`/codex/${pos.codonId}`}>
                      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 hover:border-primary/50 hover:bg-zinc-900/70 transition-all cursor-pointer group">
                        <p className="text-xs text-zinc-500 mb-1">Position {pos.position}</p>
                        <p className="text-lg font-bold text-primary group-hover:text-primary/80 transition-colors mb-1">
                          {pos.codonId}
                        </p>
                        {pos.codonName && (
                          <p className="text-xs text-zinc-400 mb-2 truncate">{pos.codonName}</p>
                        )}
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 group-hover:border-primary/50">
                          Facet {pos.facet}
                        </Badge>
                        {pos.center && (
                          <p className="text-xs text-zinc-500 mt-1">{pos.center}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* 9-Center Resonance Map */}
          <Card className="bg-[#0a1012] border-primary/30">
            <CardHeader
              className="cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => toggle("nineCenters")}
            >
              <div className="flex items-center justify-between">
                <CardTitle>9-Center Resonance Map</CardTitle>
                {expanded.nineCenters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {expanded.nineCenters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(ninecenters).map(([centerId, center]) => (
                    <Link key={centerId} href={`/codex/${center.codon256Id}`}>
                      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 hover:border-primary/50 hover:bg-zinc-900/70 transition-all cursor-pointer group">
                        <p className="text-xs text-zinc-500 mb-1">Center {centerId}</p>
                        <p className="text-lg font-bold text-primary group-hover:text-primary/80 transition-colors mb-1">
                          {center.centerName}
                        </p>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                          {center.codon256Id}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Circuit Links */}
          {circuitLinks.length > 0 && (
            <Card className="bg-[#0a1012] border-primary/30">
              <CardHeader
                className="cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => toggle("circuitLinks")}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Circuit Links</CardTitle>
                  {expanded.circuitLinks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              {expanded.circuitLinks && (
                <CardContent>
                  <ul className="space-y-2">
                    {circuitLinks.map((link, idx) => (
                      <li key={idx} className="text-zinc-300 flex items-start gap-2">
                        <span className="text-primary mt-1">→</span>
                        <span>{link}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          {/* Micro-Corrections */}
          {microCorrections.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
              <CardHeader
                className="cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => toggle("microCorrections")}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Micro-Corrections
                  </CardTitle>
                  {expanded.microCorrections ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              {expanded.microCorrections && (
                <CardContent className="space-y-6">
                  {microCorrections.map((mc, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-4">
                      <p className="text-sm text-zinc-500 mb-1">Correction {idx + 1}</p>
                      <p className="font-semibold text-white mb-2">{mc.type}</p>
                      <p className="text-zinc-300 mb-3">{mc.instruction}</p>
                      {mc.potentialOutcome && (
                        <p className="text-sm text-zinc-400 mb-2 italic">{mc.potentialOutcome}</p>
                      )}
                      <p className="text-xs text-zinc-500">
                        <span className="font-semibold">Falsifier:</span> {mc.falsifier}
                      </p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          {/* Birth Location (only shown when geocoded) */}
          {hasLocation && (
            <Card className="bg-[#0a1012] border-zinc-700/50">
              <CardHeader
                className="cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => toggle("location")}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-zinc-300">
                    <MapPin className="w-4 h-4" />
                    Birth Location
                  </CardTitle>
                  {expanded.location ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
              {expanded.location && (
                <CardContent className="space-y-2 text-sm text-zinc-400">
                  {data.birthCity && <p>{data.birthCity}</p>}
                  <p className="font-mono">
                    {data.latitude?.toFixed(4)}° · {data.longitude?.toFixed(4)}°
                    {data.timezoneId ? ` · ${data.timezoneId}` : ""}
                    {data.timezoneOffset != null
                      ? ` (UTC${data.timezoneOffset >= 0 ? "+" : ""}${data.timezoneOffset})`
                      : ""}
                  </p>
                </CardContent>
              )}
            </Card>
          )}

          {/* Back Button */}
          <div className="flex justify-center pt-8">
            <Link href="/carrierlock">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assessment
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
