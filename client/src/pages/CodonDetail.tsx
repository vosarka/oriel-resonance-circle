import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Moon, Diamond, Infinity,
  AlertTriangle, CheckCircle2, ChevronRight, Zap, Link2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import CodonGlyph from "@/components/CodonGlyph";

// Facet letter → display name
const FACET_LABELS: Record<string, string> = {
  A: "Somatic",
  B: "Relational",
  C: "Cognitive",
  D: "Transpersonal",
};

// Facet letter → colour tokens (HUD palette)
const FACET_COLORS: Record<string, { border: string; text: string; bg: string; pill: string }> = {
  A: { border: "border-[#5ba4a4]/40",  text: "text-[#5ba4a4]",  bg: "bg-[#5ba4a4]/5",  pill: "bg-[#5ba4a4]/15 text-[#5ba4a4]" },
  B: { border: "border-[#bda36b]/40",  text: "text-[#bda36b]",  bg: "bg-[#bda36b]/5",  pill: "bg-[#bda36b]/15 text-[#bda36b]" },
  C: { border: "border-[#5ba4a4]/30",  text: "text-[#7ec0c0]",  bg: "bg-[#5ba4a4]/4",  pill: "bg-[#5ba4a4]/10 text-[#7ec0c0]" },
  D: { border: "border-[#bda36b]/30",  text: "text-[#d4c090]",  bg: "bg-[#bda36b]/4",  pill: "bg-[#bda36b]/10 text-[#d4c090]" },
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CodonDetail() {
  const [, params] = useRoute("/codex/:id");
  const codonId = params?.id || "";

  // Pre-select facet from URL suffix like "38-A"
  const urlFacet = codonId.match(/-([A-Da-d])$/)?.[1]?.toUpperCase() ?? null;
  const [activeTab, setActiveTab] = useState<string>(urlFacet ?? "A");

  const { data: codon, isLoading } = trpc.codex.getCodonDetails.useQuery(
    { id: codonId },
    { enabled: !!codonId },
  );

  const { data: allCodons } = trpc.codex.getRootCodons.useQuery();

  // Sync tab if URL-derived facet changes
  useEffect(() => {
    if (urlFacet) setActiveTab(urlFacet);
  }, [urlFacet]);

  // Related codons: adjacent + harmonic partners
  const getRelatedCodons = () => {
    if (!allCodons || !codon) return [];
    const num = codon.numericId ?? parseInt(codon.id.replace("RC", ""));
    return allCodons
      .filter(c => {
        const n = c.numericId ?? parseInt(c.id.replace("RC", ""));
        return n !== num && (
          Math.abs(n - num) <= 3 ||
          n === 65 - num ||
          [1, 27, 64].includes(n)
        );
      })
      .slice(0, 6);
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!codon) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  const codonNumber = codon.numericId ?? parseInt(codon.id.replace("RC", ""));
  const relatedCodons = getRelatedCodons();
  const harmonic = 65 - codonNumber;
  const harmonicCodon = allCodons?.find(
    c => (c.numericId ?? parseInt(c.id.replace("RC", ""))) === harmonic,
  );

  // Active facet data
  const activeFacet = (codon.facets as any)?.[activeTab];
  const facetColor = FACET_COLORS[activeTab] ?? FACET_COLORS.A;

  return (
    <Layout>
      <main className="min-h-screen" style={{ background: "#0a0a0e", color: "#e8e4dc" }}>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-12">

          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/codex" className="text-zinc-500 hover:text-primary transition-colors font-mono">
              CODEX
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500 font-mono">{codon.archetype_role?.split(",")[0]?.toUpperCase() || "RESONANCE"}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-primary font-mono tracking-widest">{codon.id} {codon.name}</span>
          </div>

          {/* ── HERO ─────────────────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left: Title + Metadata */}
            <div className="lg:col-span-4 flex flex-col gap-5 order-2 lg:order-1 text-center lg:text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono tracking-widest mb-4 uppercase">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  Active Resonance
                </div>
                <h1 className="text-5xl font-mono font-bold text-white leading-tight tracking-tight mb-1">
                  RC<span className="text-primary">{String(codonNumber).padStart(2, "0")}</span>
                </h1>
                {/* Vossari name (all caps from JSON) */}
                <h2 className="text-2xl font-mono tracking-[0.2em] text-primary/80 mb-1">
                  {codon.name}
                </h2>
                {/* Traditional I Ching name */}
                {codon.traditional_name && (
                  <p className="text-zinc-400 font-serif italic text-lg mb-3">
                    {codon.traditional_name}
                  </p>
                )}
                {/* Essence / facet-A description */}
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {codon.facets?.A?.description ?? codon.essence}
                </p>
              </div>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {codon.binary && (
                  <span className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-xs font-mono text-zinc-300">
                    {codon.binary}
                  </span>
                )}
                {codon.chemical_marker && (
                  <span className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-xs font-mono text-zinc-300">
                    {codon.chemical_marker}
                  </span>
                )}
              </div>
              {codon.archetype_role && (
                <p className="text-xs font-mono text-zinc-500 text-center lg:text-left uppercase tracking-widest">
                  {codon.archetype_role}
                </p>
              )}
              {codon.somatic_marker && (
                <p className="text-xs text-zinc-600 italic text-center lg:text-left">
                  Somatic Marker: {codon.somatic_marker}
                </p>
              )}

              {/* Mandala position */}
              {codon.startDegree !== undefined && (
                <div className="flex gap-3 justify-center lg:justify-start">
                  <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2">
                    <p className="text-zinc-500 text-[10px] font-mono uppercase mb-0.5">Mandala Slot</p>
                    <p className="text-white font-mono text-sm">{codon.mandalaSlot}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2">
                    <p className="text-zinc-500 text-[10px] font-mono uppercase mb-0.5">Arc</p>
                    <p className="text-white font-mono text-sm">{codon.startDegree?.toFixed(2)}° – {codon.endDegree?.toFixed(2)}°</p>
                  </div>
                </div>
              )}
            </div>

            {/* Center: Glyph */}
            <div className="lg:col-span-4 order-1 lg:order-2 flex justify-center py-8 lg:py-0">
              <div className="relative size-64 md:size-80 flex items-center justify-center">
                <div className="absolute inset-0 border border-primary/20 rounded-full animate-spin-slow-60" />
                <div className="absolute inset-4 border border-dashed border-primary/40 rounded-full animate-spin-slower" />
                <div className="absolute inset-12 border border-primary/10 rounded-full" />
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3 p-8">
                  <CodonGlyph
                    codonNumber={codonNumber}
                    className="text-primary drop-shadow-[0_0_18px_rgba(0,240,255,0.8)] w-28 h-28"
                  />
                  <div className="text-sm font-mono font-bold text-primary/60 tracking-widest">
                    RC{String(codonNumber).padStart(2, "0")}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Harmonic partner + channels */}
            <div className="lg:col-span-4 order-3 flex flex-col gap-4">

              {/* Harmonic Partner */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-primary/20 rounded-xl p-6 border-l-4 border-l-primary">
                <h3 className="text-white font-mono text-xs uppercase tracking-widest mb-4 opacity-80">
                  Harmonic Partner
                </h3>
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                    <span className="font-mono font-bold text-zinc-400">{harmonic}</span>
                  </div>
                  <div>
                    <p className="text-white font-mono text-sm">
                      {harmonicCodon?.name || `RC${String(harmonic).padStart(2, "0")}`}
                    </p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">
                      {harmonicCodon?.title || "Complementary Codon"}
                    </p>
                  </div>
                  <Link
                    href={`/codex/${harmonic}`}
                    className="ml-auto text-zinc-400 hover:text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Channel memberships */}
              {codon.channels && codon.channels.length > 0 && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
                  <h3 className="text-white font-mono text-xs uppercase tracking-widest mb-3 opacity-80 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" /> Channels
                  </h3>
                  <div className="flex flex-col gap-2">
                    {(codon.channels as any[]).map((ch: any) => (
                      <div key={ch.id} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-200 font-serif">{ch.name}</span>
                        <span className="text-xs text-zinc-500 font-mono">{ch.id}</span>
                      </div>
                    ))}
                  </div>
                  {(codon.channels as any[])[0]?.connects && (
                    <p className="text-xs text-zinc-600 mt-3 font-mono">
                      {(codon.channels as any[]).map((ch: any) => ch.connects?.join(" ↔ ")).join(" · ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── FREQUENCY SPECTRUM ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-mono text-lg uppercase tracking-widest">
                Resonance Spectrum
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                <span>SHADOW</span>
                <div className="w-24 h-[1px] bg-gradient-to-r from-[#c94444] via-[#5ba4a4] to-[#bda36b]" />
                <span>SIDDHI</span>
              </div>
            </div>
            <div className="w-full h-0.5 bg-gradient-to-r from-[#c94444] via-[#5ba4a4] to-[#bda36b] rounded-full opacity-50" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Shadow */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 border-t-4 border-t-red-500 relative overflow-hidden group hover:bg-red-500/5 transition-colors duration-300">
                <div className="absolute -right-4 -top-4 size-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-red-400 font-mono text-xs font-bold tracking-widest uppercase">Shadow</span>
                  <Moon className="w-4 h-4 text-red-400" />
                </div>
                <h4 className="text-xl font-serif text-white mb-2">{codon.frequency?.shadow ?? codon.shadow}</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {codon.frequency?.shadow_desc ?? "The distorted frequency — operating through fear, scarcity, or unconscious reactivity."}
                </p>
              </div>

              {/* Gift */}
              <div className="bg-zinc-900/70 backdrop-blur-sm border border-primary/30 rounded-xl p-6 border-t-4 border-t-primary relative overflow-hidden transform md:-translate-y-4 z-10 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
                <div className="absolute -right-4 -top-4 size-24 bg-primary/10 rounded-full blur-2xl" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-primary font-mono text-xs font-bold tracking-widest uppercase">Gift</span>
                  <Diamond className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-2xl font-serif text-white mb-2 drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  {codon.frequency?.gift ?? codon.gift}
                </h4>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {codon.frequency?.gift_desc ?? "The functional frequency — operating through awareness, presence, and conscious choice."}
                </p>
              </div>

              {/* Siddhi */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-[#bda36b]/20 rounded-xl p-6 border-t-4 border-t-[#bda36b] relative overflow-hidden group hover:bg-[#bda36b]/5 transition-colors duration-300">
                <div className="absolute -right-4 -top-4 size-24 bg-[#bda36b]/10 rounded-full blur-2xl group-hover:bg-[#bda36b]/20 transition-all" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[#d4c090] font-mono text-xs font-bold tracking-widest uppercase">Siddhi</span>
                  <Infinity className="w-4 h-4 text-[#d4c090]" />
                </div>
                <h4 className="text-xl font-serif text-white mb-2">{codon.frequency?.siddhi ?? codon.crown}</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {codon.frequency?.siddhi_desc ?? "The transcendent frequency — operating through unity, grace, and effortless mastery."}
                </p>
              </div>
            </div>
          </section>

          {/* ── FACET TABS ────────────────────────────────────────────────────── */}
          <section className="mt-4">
            {/* Tab row */}
            <div className="flex flex-wrap border-b border-zinc-800 mb-0">
              {(["A", "B", "C", "D"] as const).map(letter => {
                const fc = FACET_COLORS[letter];
                const isActive = activeTab === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => setActiveTab(letter)}
                    className={`px-6 py-4 font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-2 ${
                      isActive
                        ? `${fc.text} border-b-2 border-current bg-white/3`
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${isActive ? "bg-current" : "bg-zinc-600"}`} />
                    {FACET_LABELS[letter]}
                  </button>
                );
              })}
            </div>

            {/* Active facet content */}
            <div className={`border border-zinc-800 border-t-0 rounded-b-xl rounded-tr-xl p-8 min-h-[360px] ${facetColor.bg}`}>
              {activeFacet ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left: Description */}
                  <div className="flex flex-col gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`font-mono text-sm font-bold tracking-widest uppercase ${facetColor.text}`}>
                          {FACET_LABELS[activeTab]} · Facet {activeTab}
                        </span>
                        <span className="text-xs font-mono text-zinc-600">{activeFacet.degrees}</span>
                      </div>
                      <p className="text-zinc-200 leading-relaxed text-sm">
                        {activeFacet.description}
                      </p>
                    </div>

                    {/* Resonance keys */}
                    {activeFacet.resonance_keys?.length > 0 && (
                      <div>
                        <p className={`text-xs font-mono uppercase tracking-widest mb-2 ${facetColor.text} opacity-70`}>
                          Resonance Keys
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activeFacet.resonance_keys.map((key: string) => (
                            <span
                              key={key}
                              className={`px-3 py-1 rounded-full text-xs font-mono ${facetColor.pill}`}
                            >
                              {key}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Shadow + Correction */}
                  <div className="flex flex-col gap-5">
                    {/* Shadow manifestation */}
                    <div className={`rounded-xl p-5 border ${facetColor.border} bg-black/20`}>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-mono uppercase tracking-widest text-red-400">
                          Shadow Manifestation
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        {activeFacet.shadow_manifestation}
                      </p>
                    </div>

                    {/* Micro-correction */}
                    <div className={`rounded-xl p-5 border ${facetColor.border} bg-black/20`}>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className={`text-xs font-mono uppercase tracking-widest ${facetColor.text}`}>
                          Micro-Correction
                        </span>
                      </div>
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        {activeFacet.micro_correction}
                      </p>
                      <Link href="/carrierlock">
                        <button className={`w-full mt-5 ${facetColor.bg} hover:opacity-80 ${facetColor.text} border ${facetColor.border} py-2 rounded text-xs font-mono uppercase tracking-widest transition-all`}>
                          Run Full Diagnostic
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-600 text-sm font-mono">
                  Facet data not available
                </div>
              )}
            </div>
          </section>

          {/* ── RELATED ARCHETYPES ────────────────────────────────────────────── */}
          <section className="border-t border-zinc-800 pt-12 pb-24">
            <h3 className="text-white font-mono text-sm uppercase tracking-widest mb-8">
              Related Archetypes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedCodons.map(related => {
                const n = related.numericId ?? parseInt(related.id.replace("RC", ""));
                return (
                  <Link
                    key={related.id}
                    href={`/codex/${n}`}
                    className="group bg-zinc-900/50 backdrop-blur-sm border border-primary/20 p-4 rounded-lg hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-zinc-500 group-hover:text-primary">
                        {related.id}
                      </span>
                      <span className="size-2 rounded-full bg-zinc-700 group-hover:bg-primary transition-colors" />
                    </div>
                    <p className="text-zinc-300 font-mono text-xs">{related.name}</p>
                    {related.title && (
                      <p className="text-zinc-600 text-[10px] italic mt-1 truncate">{related.title}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="py-12" style={{ borderTop: "1px solid rgba(189,163,107,0.12)", background: "rgba(15,15,21,0.6)" }}>
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3" style={{ opacity: 0.5, color: "#bda36b" }}>
              <Zap className="w-5 h-5" />
              <span className="font-mono text-sm tracking-wider">VOSS ARKIVA CODEX</span>
            </div>
            <div className="flex gap-8 text-sm" style={{ color: "#6a665e" }}>
              <Link href="/protocol" className="hover:opacity-80 transition-opacity" style={{ color: "#5ba4a4" }}>Protocol</Link>
              <Link href="/carrierlock" className="hover:opacity-80 transition-opacity" style={{ color: "#5ba4a4" }}>Diagnostics</Link>
              <Link href="/conduit" className="hover:opacity-80 transition-opacity" style={{ color: "#5ba4a4" }}>Neural Link</Link>
            </div>
            <div className="text-xs font-mono" style={{ color: "#6a665e" }}>
              VRC v1.0 — Engine Constants Loaded
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
}
