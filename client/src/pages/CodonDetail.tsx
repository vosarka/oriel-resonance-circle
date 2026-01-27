import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Moon, Diamond, Infinity, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useState } from "react";

// Tab types for the detail section
type TabType = "dynamics" | "repressive" | "reactive" | "corrections";

export default function CodonDetail() {
  const [, params] = useRoute("/codex/:id");
  const codonId = params?.id || "";
  const [activeTab, setActiveTab] = useState<TabType>("dynamics");
  
  const { data: codon, isLoading } = trpc.codex.getCodonDetails.useQuery(
    { id: codonId },
    { enabled: !!codonId }
  );

  const { data: allCodons } = trpc.codex.getRootCodons.useQuery();

  // Get related codons (adjacent numbers and some random ones)
  const getRelatedCodons = () => {
    if (!allCodons || !codon) return [];
    const currentNum = parseInt(codon.id.replace("RC", ""));
    const related = allCodons.filter(c => {
      const num = parseInt(c.id.replace("RC", ""));
      return num !== currentNum && (
        Math.abs(num - currentNum) <= 3 || 
        num === 64 - currentNum ||
        [1, 27, 64].includes(num)
      );
    }).slice(0, 6);
    return related;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!codon) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Codon not found</p>
          <Link href="/codex">
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Codex
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const codonNumber = codon.id.replace("RC", "");
  const relatedCodons = getRelatedCodons();

  return (
    <main className="relative min-h-screen bg-black text-zinc-100">
      {/* Background Decor */}
      <div 
        className="absolute inset-0 z-0 opacity-10" 
        style={{
          backgroundSize: "40px 40px",
          backgroundImage: "linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)"
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-12">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/codex" className="text-zinc-500 hover:text-primary transition-colors font-orbitron">
            CODEX
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500 font-orbitron">{codon.domain?.split(",")[0]?.toUpperCase() || "RESONANCE"}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-primary font-orbitron tracking-widest">{codon.id} {codon.name.toUpperCase()}</span>
        </div>

        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Title & Context */}
          <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1 text-center lg:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-orbitron tracking-widest mb-4 uppercase">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Active Resonance
              </div>
              <h1 className="text-6xl font-orbitron font-bold text-white leading-tight tracking-tight mb-2">
                RC<span className="text-primary">{codonNumber}</span>
              </h1>
              <h2 className="text-4xl font-serif text-zinc-200 tracking-wide mb-4">
                The {codon.name}
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                {codon.essence}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-primary/20 p-4 rounded-lg min-w-[140px]">
                <p className="text-zinc-500 text-xs font-orbitron uppercase tracking-wider mb-1">Coherence</p>
                <p className="text-2xl font-orbitron font-bold text-white">—</p>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-primary/20 p-4 rounded-lg min-w-[140px]">
                <p className="text-zinc-500 text-xs font-orbitron uppercase tracking-wider mb-1">Frequency</p>
                <p className="text-2xl font-orbitron font-bold text-primary">432 Hz</p>
              </div>
            </div>
          </div>

          {/* Center: Glyph */}
          <div className="lg:col-span-4 order-1 lg:order-2 flex justify-center py-8 lg:py-0">
            <div className="relative size-64 md:size-80 flex items-center justify-center">
              {/* Decorative Rings */}
              <div className="absolute inset-0 border border-primary/20 rounded-full animate-spin-slow-60" />
              <div className="absolute inset-4 border border-dashed border-primary/40 rounded-full animate-spin-slower" />
              <div className="absolute inset-12 border border-primary/10 rounded-full" />
              {/* Main Glyph Symbol */}
              <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
                <div className="text-8xl font-orbitron font-bold text-primary drop-shadow-[0_0_15px_rgba(104,211,145,0.6)]">
                  {codonNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Stats/Map */}
          <div className="lg:col-span-4 order-3 flex flex-col gap-4">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-primary/20 rounded-xl p-6 border-l-4 border-l-primary">
              <h3 className="text-white font-orbitron text-sm uppercase tracking-widest mb-4 opacity-80">Harmonic Partner</h3>
              <div className="flex items-center gap-4">
                <div className="size-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                  <span className="font-orbitron font-bold text-zinc-400">
                    {65 - parseInt(codonNumber)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-serif text-lg">
                    {allCodons?.find(c => c.id === `RC${String(65 - parseInt(codonNumber)).padStart(2, "0")}`)?.name || "Partner"}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Complementary Codon</p>
                </div>
                <Link href={`/codex/RC${String(65 - parseInt(codonNumber)).padStart(2, "0")}`} className="ml-auto text-zinc-400 hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-primary/20 rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Diamond className="w-8 h-8" />
              </div>
              <h3 className="text-white font-orbitron text-sm uppercase tracking-widest mb-2 opacity-80">Domain</h3>
              <p className="text-xl text-white font-serif">{codon.domain?.split(",")[0] || "Resonance"}</p>
              <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-purple-500 w-3/4" />
              </div>
              <p className="text-right text-xs text-primary mt-1">Active Connection</p>
            </div>
          </div>
        </section>

        {/* Frequency Spectrum */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-orbitron text-xl uppercase tracking-widest">Resonance Spectrum</h3>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span>LOW FREQ</span>
              <div className="w-24 h-[1px] bg-gradient-to-r from-red-500 via-green-500 to-purple-500" />
              <span>HIGH FREQ</span>
            </div>
          </div>
          
          {/* Gradient Bar Connector */}
          <div className="w-full h-1 bg-gradient-to-r from-red-500 via-green-500 to-purple-500 rounded-full opacity-50 mb-2" />
          
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Shadow */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 border-t-4 border-t-red-500 relative overflow-hidden group hover:bg-red-500/5 transition-colors duration-300">
              <div className="absolute -right-4 -top-4 size-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-red-400 font-orbitron text-sm font-bold tracking-widest uppercase">Shadow</span>
                <Moon className="w-5 h-5 text-red-400" />
              </div>
              <h4 className="text-2xl font-serif text-white mb-2">{codon.shadow}</h4>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                The distorted frequency. The pattern operating through fear, scarcity, or unconscious reactivity.
              </p>
              <div className="mt-auto pt-4 border-t border-white/5">
                <p className="text-xs text-red-400 uppercase font-bold mb-1">Trigger</p>
                <p className="text-zinc-300 text-sm">Fear of losing control</p>
              </div>
            </div>

            {/* Gift */}
            <div className="bg-zinc-900/70 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 border-t-4 border-t-green-500 relative overflow-hidden transform md:-translate-y-4 z-10 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
              <div className="absolute -right-4 -top-4 size-24 bg-green-500/10 rounded-full blur-2xl" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-green-400 font-orbitron text-sm font-bold tracking-widest uppercase">Gift</span>
                <Diamond className="w-5 h-5 text-green-400" />
              </div>
              <h4 className="text-3xl font-serif text-white mb-2 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">{codon.gift}</h4>
              <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                The functional frequency. The pattern operating through awareness, presence, and conscious choice.
              </p>
              <div className="mt-auto pt-4 border-t border-white/5">
                <p className="text-xs text-green-400 uppercase font-bold mb-1">Breakthrough</p>
                <p className="text-white text-sm">Conscious integration</p>
              </div>
            </div>

            {/* Crown */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 border-t-4 border-t-purple-500 relative overflow-hidden group hover:bg-purple-500/5 transition-colors duration-300">
              <div className="absolute -right-4 -top-4 size-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-purple-400 font-orbitron text-sm font-bold tracking-widest uppercase">Crown</span>
                <Infinity className="w-5 h-5 text-purple-400" />
              </div>
              <h4 className="text-2xl font-serif text-white mb-2">{codon.crown}</h4>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                The transcendent frequency. The pattern operating through unity, grace, and effortless mastery.
              </p>
              <div className="mt-auto pt-4 border-t border-white/5">
                <p className="text-xs text-purple-400 uppercase font-bold mb-1">State</p>
                <p className="text-zinc-300 text-sm">Pure presence</p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Info Tabs */}
        <section className="mt-8">
          {/* Tab Headers */}
          <div className="flex flex-wrap border-b border-zinc-800 mb-0">
            <button 
              onClick={() => setActiveTab("dynamics")}
              className={`px-6 py-4 font-orbitron text-sm tracking-widest uppercase transition-colors ${
                activeTab === "dynamics" 
                  ? "text-primary border-b-2 border-primary bg-primary/5" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Dynamics & Triggers
            </button>
            <button 
              onClick={() => setActiveTab("repressive")}
              className={`px-6 py-4 font-orbitron text-sm tracking-widest uppercase transition-colors ${
                activeTab === "repressive" 
                  ? "text-primary border-b-2 border-primary bg-primary/5" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Repressive Nature
            </button>
            <button 
              onClick={() => setActiveTab("reactive")}
              className={`px-6 py-4 font-orbitron text-sm tracking-widest uppercase transition-colors ${
                activeTab === "reactive" 
                  ? "text-primary border-b-2 border-primary bg-primary/5" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Reactive Nature
            </button>
            <button 
              onClick={() => setActiveTab("corrections")}
              className={`px-6 py-4 font-orbitron text-sm tracking-widest uppercase transition-colors ${
                activeTab === "corrections" 
                  ? "text-primary border-b-2 border-primary bg-primary/5" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Corrections
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-primary/20 rounded-b-xl rounded-tr-xl p-8 min-h-[300px]">
            {activeTab === "dynamics" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h5 className="text-white font-serif text-xl mb-4 border-l-2 border-primary pl-3">The Core Pattern</h5>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    {codon.name} ({codon.id}) operates through the domain of {codon.domain?.toLowerCase()}. 
                    At its essence, this codon governs how we {codon.essence?.toLowerCase()}.
                  </p>
                  <h5 className="text-white font-serif text-xl mb-4 border-l-2 border-primary pl-3">The Transmutation</h5>
                  <p className="text-zinc-400 leading-relaxed">
                    To move from Shadow ({codon.shadow}) to Gift ({codon.gift}), one must recognize the pattern 
                    when it arises and consciously choose the higher frequency response. This requires 
                    awareness, patience, and the willingness to sit with discomfort.
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-6 border border-white/5">
                  <h6 className="text-primary font-orbitron text-xs uppercase tracking-widest mb-4">Diagnostic Markers</h6>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-1" />
                      <div>
                        <span className="block text-zinc-200 text-sm font-medium">Shadow Indicator</span>
                        <span className="block text-zinc-500 text-xs">When {codon.shadow?.toLowerCase()} dominates</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-1" />
                      <div>
                        <span className="block text-zinc-200 text-sm font-medium">Pattern Recognition</span>
                        <span className="block text-zinc-500 text-xs">Recurring themes in {codon.domain?.split(",")[0]?.toLowerCase()}</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-1" />
                      <div>
                        <span className="block text-zinc-200 text-sm font-medium">Gift Emergence</span>
                        <span className="block text-zinc-500 text-xs">Sign of rising frequency</span>
                      </div>
                    </li>
                  </ul>
                  <Link href="/carrierlock">
                    <button className="w-full mt-6 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 py-2 rounded text-xs font-orbitron uppercase tracking-widest transition-all">
                      Run Full Diagnostic
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "repressive" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h5 className="text-white font-serif text-xl mb-4 border-l-2 border-red-400 pl-3">Repressive Expression</h5>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    When the {codon.name} codon operates repressively, the shadow of {codon.shadow?.toLowerCase()} 
                    manifests as internalized patterns. The energy turns inward, creating self-limiting beliefs 
                    and behaviors that restrict natural expression.
                  </p>
                  <h5 className="text-white font-serif text-xl mb-4 border-l-2 border-red-400 pl-3">Signs of Repression</h5>
                  <ul className="text-zinc-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Withdrawal from {codon.domain?.split(",")[0]?.toLowerCase()} situations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Self-doubt around natural abilities
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Avoiding opportunities for growth
                    </li>
                  </ul>
                </div>
                <div className="bg-red-500/5 rounded-lg p-6 border border-red-500/20">
                  <h6 className="text-red-400 font-orbitron text-xs uppercase tracking-widest mb-4">Repressive Pattern</h6>
                  <p className="text-zinc-300 leading-relaxed">
                    The repressive nature creates a contraction in the field. Rather than expressing the 
                    shadow outwardly, it becomes internalized as shame, doubt, or self-sabotage. 
                    Recognition is the first step toward liberation.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "reactive" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h5 className="text-white font-serif text-xl mb-4 border-l-2 border-orange-400 pl-3">Reactive Expression</h5>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    When the {codon.name} codon operates reactively, the shadow of {codon.shadow?.toLowerCase()} 
                    manifests as externalized patterns. The energy projects outward, creating conflict, 
                    drama, or forceful attempts to control circumstances.
                  </p>
                  <h5 className="text-white font-serif text-xl mb-4 border-l-2 border-orange-400 pl-3">Signs of Reactivity</h5>
                  <ul className="text-zinc-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Aggressive pursuit of {codon.domain?.split(",")[0]?.toLowerCase()}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Blaming others for limitations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Forcing outcomes through will
                    </li>
                  </ul>
                </div>
                <div className="bg-orange-500/5 rounded-lg p-6 border border-orange-500/20">
                  <h6 className="text-orange-400 font-orbitron text-xs uppercase tracking-widest mb-4">Reactive Pattern</h6>
                  <p className="text-zinc-300 leading-relaxed">
                    The reactive nature creates an expansion in the field that lacks coherence. 
                    Energy disperses outward without direction, often creating more chaos than resolution. 
                    The key is to channel this energy consciously toward the Gift frequency.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "corrections" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h5 className="text-white font-serif text-xl mb-4 border-l-2 border-green-400 pl-3">Micro-Corrections</h5>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    Small, consistent adjustments that shift the {codon.name} pattern from Shadow to Gift. 
                    These are not dramatic interventions but gentle recalibrations of awareness and behavior.
                  </p>
                  <ul className="text-zinc-400 space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 font-orbitron text-sm">01</span>
                      <span>Pause before reacting to {codon.domain?.split(",")[0]?.toLowerCase()} triggers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 font-orbitron text-sm">02</span>
                      <span>Notice when {codon.shadow?.toLowerCase()} arises without judgment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 font-orbitron text-sm">03</span>
                      <span>Choose one small action aligned with {codon.gift?.toLowerCase()}</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-green-500/5 rounded-lg p-6 border border-green-500/20">
                  <h6 className="text-green-400 font-orbitron text-xs uppercase tracking-widest mb-4">Integration Protocol</h6>
                  <p className="text-zinc-300 leading-relaxed mb-4">
                    The path from {codon.shadow} to {codon.gift} is walked one step at a time. 
                    Each conscious choice strengthens the neural pathways of the Gift frequency.
                  </p>
                  <div className="bg-black/30 rounded p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-2">Daily Practice</p>
                    <p className="text-zinc-300 text-sm">
                      "Today I notice {codon.shadow?.toLowerCase()} and choose {codon.gift?.toLowerCase()}."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Related Codons */}
        <section className="border-t border-zinc-800 pt-12 pb-24">
          <h3 className="text-white font-orbitron text-lg uppercase tracking-widest mb-8">Related Archetypes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedCodons.map((related) => (
              <Link 
                key={related.id} 
                href={`/codex/${related.id}`}
                className="group bg-zinc-900/50 backdrop-blur-sm border border-primary/20 p-4 rounded-lg hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-orbitron text-zinc-500 group-hover:text-primary">{related.id}</span>
                  <span className="size-2 rounded-full bg-zinc-700 group-hover:bg-primary transition-colors" />
                </div>
                <p className="text-zinc-300 font-serif text-sm">{related.name}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-900/50 py-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <Diamond className="w-5 h-5" />
            <span className="font-orbitron text-sm tracking-wider">VOSSARI GENETICS</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <Link href="/protocol" className="hover:text-primary transition-colors">Protocol</Link>
            <Link href="/carrierlock" className="hover:text-primary transition-colors">Diagnostics</Link>
            <Link href="/conduit" className="hover:text-primary transition-colors">Neural Link</Link>
          </div>
          <div className="text-xs text-zinc-600">
            System Version 4.0.2 © 2024
          </div>
        </div>
      </footer>
    </main>
  );
}
