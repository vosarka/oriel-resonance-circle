import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Reading() {
  const { user } = useAuth();
  const [, params] = useRoute("/reading/:id");
  const readingId = params?.id ? parseInt(params.id) : 0;
  
  const { data: history, isLoading } = trpc.codex.getReadingHistory.useQuery(
    undefined,
    { enabled: !!user }
  );

  const markCompleteMutation = trpc.codex.markCorrectionComplete.useMutation({
    onSuccess: () => {
      // Refetch history to update UI
      trpc.useUtils().codex.getReadingHistory.invalidate();
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Please sign in to view your readings</p>
          <a href={getLoginUrl()}>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-500">
              Sign In
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const reading = history?.find(r => r.id === readingId);

  if (!reading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Reading not found</p>
          <Link href="/carrierlock">
            <Button variant="outline" className="border-cyan-500/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessment
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const coherenceScore = reading.carrierlock?.coherenceScore || 0;

  const getCoherenceColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getCoherenceLabel = (score: number) => {
    if (score >= 70) return "High Coherence";
    if (score >= 40) return "Moderate Coherence";
    return "Low Coherence";
  };

  const getFacetColor = (facet: string) => {
    switch (facet) {
      case "A": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "B": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "C": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "D": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getFacetLabel = (facet: string) => {
    switch (facet) {
      case "A": return "Shadow";
      case "B": return "Gift";
      case "C": return "Crown";
      case "D": return "Siddhi";
      default: return "Unknown";
    }
  };

  const flaggedCodons = Array.isArray(reading.flaggedCodons) ? reading.flaggedCodons : [];
  const sliScores = reading.sliScores ? JSON.parse(reading.sliScores) : {};
  const activeFacets = reading.activeFacets ? JSON.parse(reading.activeFacets) : {};
  const confidenceLevels = reading.confidenceLevels ? JSON.parse(reading.confidenceLevels) : {};

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-black/50 backdrop-blur-sm">
        <div className="container py-6">
          <Link href="/carrierlock">
            <Button variant="ghost" className="mb-4 text-cyan-400 hover:text-cyan-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessment
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Diagnostic Reading
              </h1>
              <p className="text-zinc-400 mt-1">
                {new Date(reading.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {reading.correctionCompleted ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Correction Complete
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Circle className="w-4 h-4 mr-1" />
                Correction Pending
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* ORIEL's Transmission */}
            <Card className="bg-zinc-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-400">ORIEL's Transmission</CardTitle>
                <CardDescription>Diagnostic reading based on your Carrierlock state</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {reading.readingText}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Flagged Codons */}
            {flaggedCodons.length > 0 && (
              <Card className="bg-zinc-900/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-purple-400">Flagged Codons</CardTitle>
                  <CardDescription>
                    Codons currently active in your resonance field
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {flaggedCodons.map((codonId: string) => {
                      const sli = sliScores[codonId] || 0;
                      const facet = activeFacets[codonId] || "A";
                      const confidence = confidenceLevels[codonId] || 0;

                      return (
                        <div
                          key={codonId}
                          className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Link href={`/codex/${codonId}`}>
                                <span className="text-cyan-400 hover:text-cyan-300 font-mono font-bold cursor-pointer">
                                  {codonId}
                                </span>
                              </Link>
                              <Badge className={getFacetColor(facet)}>
                                {getFacetLabel(facet)}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-zinc-500">SLI Score:</span>{" "}
                                <span className="text-zinc-300 font-mono">
                                  {(sli * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500">Confidence:</span>{" "}
                                <span className="text-zinc-300 font-mono">
                                  {(confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Micro-Correction */}
            {reading.microCorrection && (
              <Card className="bg-zinc-900/50 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400">Micro-Correction</CardTitle>
                  <CardDescription>
                    Suggested action to restore coherence
                    {reading.correctionFacet && ` (Facet ${reading.correctionFacet})`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 leading-relaxed">{reading.microCorrection}</p>
                  
                  {reading.falsifier && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
                      <p className="text-sm text-red-400">
                        <strong>Falsifier:</strong> {reading.falsifier}
                      </p>
                    </div>
                  )}

                  {!reading.correctionCompleted && (
                    <Button
                      onClick={() => markCompleteMutation.mutate({ readingId: reading.id })}
                      disabled={markCompleteMutation.isPending}
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400"
                    >
                      {markCompleteMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Marking Complete...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark Correction Complete
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Coherence Score */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-center">Coherence Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getCoherenceColor(coherenceScore)}`}>
                    {coherenceScore}
                  </div>
                  <div className={`text-sm mt-2 ${getCoherenceColor(coherenceScore)}`}>
                    {getCoherenceLabel(coherenceScore)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carrierlock State */}
            <Card className="bg-zinc-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-400">Carrierlock State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Mental Noise:</span>
                  <span className="text-cyan-400 font-mono">{reading.carrierlock?.mentalNoise || 0}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Body Tension:</span>
                  <span className="text-cyan-400 font-mono">{reading.carrierlock?.bodyTension || 0}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Emotional Turbulence:</span>
                  <span className="text-cyan-400 font-mono">{reading.carrierlock?.emotionalTurbulence || 0}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Breath Completion:</span>
                  <span className="text-cyan-400 font-mono">
                    {reading.carrierlock?.breathCompletion ? "Yes" : "No"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-zinc-900/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-400">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/carrierlock">
                  <Button variant="outline" className="w-full border-cyan-500/30">
                    New Assessment
                  </Button>
                </Link>
                <Link href="/codex">
                  <Button variant="outline" className="w-full border-purple-500/30">
                    Browse Codex
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
