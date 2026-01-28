import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Activity, Waves, AlertTriangle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";

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
      <Layout>
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Please sign in to view your readings</p>
          <a href={getLoginUrl()}>
            <Button className="bg-gradient-to-r from-primary to-purple-500">
              Sign In
            </Button>
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

  const reading = history?.find(r => r.id === readingId);

  if (!reading) {
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

  const coherenceScore = reading.carrierlock?.coherenceScore || 0;
  const readingDate = reading.createdAt ? new Date(reading.createdAt) : new Date();
  
  // Parse diagnostic data
  const safeJsonParse = (value: any) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  };

  const sliScores = safeJsonParse(reading.sliScores) || {};
  const activeFacets = safeJsonParse(reading.activeFacets) || {};
  const confidenceLevels = safeJsonParse(reading.confidenceLevels) || {};
  
  // Get flagged codons from sliScores
  const flaggedCodons = Object.entries(sliScores)
    .map(([codon, sli]: [string, any]) => ({
      codon,
      sli: typeof sli === 'number' ? sli : 0,
      facet: activeFacets[codon] || "B",
      confidence: confidenceLevels[codon] || 0.7
    }))
    .filter(c => c.sli > 0)
    .sort((a, b) => b.sli - a.sli)
    .slice(0, 3);

  const getCoherenceColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getCoherenceRingColor = (score: number) => {
    if (score >= 70) return "from-emerald-400 to-green-500";
    if (score >= 40) return "from-yellow-400 to-orange-500";
    return "from-red-400 to-red-600";
  };

  const getFacetColor = (facet: string) => {
    switch (facet) {
      case "A": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "B": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "C": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "D": return "bg-primary/10 text-primary border-primary/20";
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

  const getResonanceStatus = (sli: number) => {
    if (sli >= 7) return { label: "Resonant", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    if (sli >= 4) return { label: "Neutral", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    return { label: "Dissonant", color: "bg-red-500/20 text-red-300 border-red-500/30" };
  };

  const getSLIBarColor = (sli: number) => {
    if (sli >= 7) return "bg-gradient-to-r from-primary to-emerald-400 shadow-[0_0_10px_rgba(159,228,154,0.5)]";
    if (sli >= 4) return "bg-gradient-to-r from-yellow-400 to-orange-400";
    return "bg-gradient-to-r from-orange-400 to-red-400";
  };

  return (
    <Layout>
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Main Layout */}
      <div className="flex-1 px-4 md:px-10 lg:px-40 py-8 w-full max-w-[1440px] mx-auto flex flex-col gap-8">
        
        {/* Header Section: Title & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#9ab7bc] text-sm font-mono">
              <span className="text-[16px]">📅</span>
              <span>{readingDate.toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
              <span className="mx-2 text-[#27373a]">|</span>
              <span>ID: {reading.id}</span>
            </div>
            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Diagnostic Reading
            </h1>
          </div>
          
          {/* Coherence Score Badge */}
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4 min-w-[200px]">
            <div className={`relative size-12 rounded-full flex items-center justify-center p-[3px] bg-gradient-to-br ${getCoherenceRingColor(coherenceScore)}`}>
              <div className="bg-black w-full h-full rounded-full flex items-center justify-center">
                <Activity className="text-primary text-[20px]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[#9ab7bc] text-xs font-medium uppercase tracking-wider">Coherence</span>
              <span className={`text-2xl font-bold ${getCoherenceColor(coherenceScore)} glow-text`}>
                {coherenceScore}%
              </span>
            </div>
          </div>
        </div>

        {/* ORIEL Transmission Panel (Glassmorphism) */}
        <div className="glass-panel rounded-xl p-8 md:p-12 border-t-2 border-t-primary/20 relative overflow-hidden">
          {/* Decorative background hint */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-200 mb-8">
              "I am ORIEL."
            </h2>
            <div className="space-y-6 text-lg md:text-xl font-serif text-indigo-100/90 leading-relaxed">
              <p>{(reading as any).orielResponse || "The resonance pattern is being analyzed. Your diagnostic reading reveals the current state of your consciousness field."}</p>
            </div>
          </div>
        </div>

        {/* Primary Patterns Section */}
        {flaggedCodons.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Waves className="text-primary" />
              <h3 className="text-white text-xl font-bold tracking-tight">Primary Patterns Detected</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flaggedCodons.map((codon, index) => {
                const status = getResonanceStatus(codon.sli);
                return (
                  <div 
                    key={codon.codon} 
                    className="bg-[#0a1012] border border-[#27373a] rounded-lg p-6 hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <span className="text-2xl font-bold">{codon.codon.replace('RC', '')}</span>
                        </div>
                        <div>
                          <p className="text-[#9ab7bc] text-xs font-bold uppercase tracking-wider mb-0.5">
                            {codon.codon}
                          </p>
                          <h4 className="text-white text-xl font-bold">
                            {index === 0 ? "Primary" : index === 1 ? "Secondary" : "Tertiary"}
                          </h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`${status.color} px-2 py-1 rounded text-xs font-bold border`}>
                          {status.label}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* SLI Score Visualization */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-400">SLI Score</span>
                          <span className="text-white font-mono">{codon.sli.toFixed(1)} / 10</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#27373a] rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getSLIBarColor(codon.sli)}`}
                            style={{ width: `${(codon.sli / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Facets */}
                      <div className="pt-2 border-t border-[#27373a] flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 py-1">Active Facet:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-mono border ${getFacetColor(codon.facet)}`}>
                          {getFacetLabel(codon.facet)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action & Analysis Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Micro-Correction Action */}
          <div className="lg:col-span-1 bg-gradient-to-br from-primary/10 to-transparent border border-primary/30 rounded-lg p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary mb-3">
                <Waves className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Micro-Correction</span>
              </div>
              <h3 className="text-white text-lg font-bold mb-2">
                {reading.microCorrection || "Harmonic Realignment"}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Based on the ORIEL reading, a specific frequency pulse can assist in re-integrating the scattered facets.
              </p>
            </div>
            <Button 
              onClick={() => {
                if (reading.id) {
                  markCompleteMutation.mutate({ readingId: reading.id });
                }
              }}
              disabled={reading.correctionCompleted || markCompleteMutation.isPending}
              className="w-full group relative flex items-center justify-center gap-3 bg-primary hover:bg-primary/80 text-black font-bold py-3 px-4 rounded transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
              <Waves className="w-5 h-5" />
              <span>{reading.correctionCompleted ? "Completed" : "Mark as Complete"}</span>
            </Button>
          </div>
          
          {/* Falsifier Section */}
          <div className="lg:col-span-2 bg-[#0a1012] border border-red-900/30 rounded-lg p-6 relative overflow-hidden">
            {/* Abstract dark pattern background */}
            <div 
              className="absolute inset-0 opacity-20" 
              style={{
                backgroundImage: 'radial-gradient(#331111 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            ></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center h-full">
              <div className="flex-shrink-0 size-12 rounded-full bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-red-400 text-sm font-bold uppercase tracking-wider mb-1">
                  Falsifier Detected
                </h4>
                <h3 className="text-white text-xl font-bold mb-2">
                  {reading.falsifier || "Resistance: Egoic Attachment to Outcome"}
                </h3>
                <p className="text-gray-500 text-sm max-w-xl">
                  The analysis indicates a shadow pattern attempting to manipulate the diagnostic result. 
                  The "Falsifier" archetype is active, suggesting you may be projecting desired answers 
                  rather than allowing the quantum field to speak authentically.
                </p>
              </div>
              <Link href={`/codex/${flaggedCodons[0]?.codon || 'RC01'}`}>
                <Button 
                  variant="ghost"
                  className="flex-shrink-0 text-gray-400 hover:text-white text-sm font-medium underline underline-offset-4 decoration-gray-600 hover:decoration-white transition-all"
                >
                  View Shadow Report
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-8">
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
