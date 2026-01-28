import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, Calendar, Zap, Info } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import BreathProtocol from "@/components/BreathProtocol";
import Layout from "@/components/Layout";

// Reading types
type ReadingType = "dynamic" | "static";

export default function Carrierlock() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Reading type selection
  const [readingType, setReadingType] = useState<ReadingType>("dynamic");
  
  // Static Signature fields (birth data)
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  
  // Dynamic State fields (current moment)
  const [mentalNoise, setMentalNoise] = useState(5);
  const [bodyTension, setBodyTension] = useState(5);
  const [emotionalTurbulence, setEmotionalTurbulence] = useState(5);
  const [breathCompletion, setBreathCompletion] = useState(false);

  // Mutations
  const saveCarrierlockMutation = trpc.codex.saveCarrierlock.useMutation();
  const saveReadingMutation = trpc.codex.saveReading.useMutation();
  
  // New RGP endpoints
  const staticSignatureMutation = trpc.rgp.staticSignature.useMutation();
  const dynamicStateMutation = trpc.rgp.dynamicState.useMutation();

  // Calculate Coherence Score: CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)
  const coherenceScore = Math.max(
    0,
    Math.min(
      100,
      100 - (mentalNoise * 3 + bodyTension * 3 + emotionalTurbulence * 3) + (breathCompletion ? 10 : 0)
    )
  );

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

  // Handle breath protocol completion
  const handleBreathComplete = () => {
    setBreathCompletion(true);
  };

  const handleGetReading = async () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    try {
      if (readingType === "static") {
        // Static Signature reading using new RGP engine
        const result = await staticSignatureMutation.mutateAsync({
          birthDate,
          birthTime: birthTime || undefined,
          birthLocation: birthLocation || undefined,
        });

        if (result.success && result.data) {
          const data = result.data;
          
          // Save carrierlock state (minimal for static readings)
          const carrierlockResult = await saveCarrierlockMutation.mutateAsync({
            mentalNoise: 0,
            bodyTension: 0,
            emotionalTurbulence: 0,
            breathCompletion: true,
          });

          // Format flagged codons from Prime Stack
          const flaggedCodons = data.primeStack.map(p => p.codonId);
          const sliScores: Record<string, number> = {};
          const activeFacets: Record<string, string> = {};
          const confidenceLevels: Record<string, number> = {};
          
          data.primeStack.forEach(p => {
            sliScores[p.codonId] = p.weight;
            activeFacets[p.codonId] = p.facet;
            confidenceLevels[p.codonId] = 0.95; // High confidence for static readings
          });

          // Generate reading text
          const birthDateObj = new Date(birthDate);
          const formattedDate = birthDateObj.toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          });
          
          const readingText = `YOUR STATIC SIGNATURE
Receiver ID: ${data.receiverId}
Encoded: ${formattedDate}
Design Offset: 88° solar-arc (${new Date(data.designOffset).toLocaleDateString()})

═══════════════════════════════════════════════════════════

PRIMARY CODON: ${data.primaryCodon.id} - ${data.primaryCodon.name}
"${data.primaryCodon.title}"
Facet: ${data.primaryCodon.facet} (${data.primaryCodon.facet === 'A' ? 'Somatic Seed' : data.primaryCodon.facet === 'B' ? 'Relational Current' : data.primaryCodon.facet === 'C' ? 'Mental Architect' : 'Transcendent Witness'})

Shadow Pattern: ${data.primaryCodon.shadow}
Gift Expression: ${data.primaryCodon.gift}
Crown Potential: ${data.primaryCodon.crown}

═══════════════════════════════════════════════════════════

FRACTAL PROFILE
Role: ${data.fractalProfile.roleName}
${data.fractalProfile.description}

Authority: ${data.fractalProfile.authorityName}
${data.fractalProfile.authorityDescription}

Operational Truth: ${data.fractalProfile.operationalTruth}
Mastery Mode: ${data.fractalProfile.masteryMode}
Failure Mode: ${data.fractalProfile.failureMode}

═══════════════════════════════════════════════════════════

PRIME STACK (9 Positions)
${data.primeStack.map(p => `• ${p.position.replace(/_/g, ' ').toUpperCase()}: ${p.codonId} - ${p.codonName} (Facet ${p.facet})`).join('\n')}

═══════════════════════════════════════════════════════════

9-CENTER RESONANCE MAP
${data.centerMap.map(c => `• ${c.name}: ${c.status.toUpperCase()} (${c.codons.length} codons)`).join('\n')}

═══════════════════════════════════════════════════════════

CIRCUIT ACTIVATIONS
${data.circuitLinks.filter(c => c.status === 'active').map(c => `• ${c.name}: ${c.description}`).join('\n') || 'No active circuits detected'}

═══════════════════════════════════════════════════════════

FALSIFIERS (Verification Clauses)
${data.falsifiers.map((f, i) => `${i + 1}. Claim: "${f.claim}"
   Test: ${f.testCondition}
   Falsifies: ${f.falsifiedElement}`).join('\n\n')}`;

          // Save the reading
          const savedReading = await saveReadingMutation.mutateAsync({
            carrierlockId: carrierlockResult.id,
            readingText,
            flaggedCodons,
            sliScores,
            activeFacets,
            confidenceLevels,
            microCorrection: undefined,
            correctionFacet: undefined,
            falsifier: data.falsifiers.map(f => f.claim).join('; '),
          });
          
          setLocation(`/reading/${savedReading.id}`);
        }
      } else {
        // Dynamic State reading using new RGP engine
        // First we need birth data for personalized reading
        if (!birthDate) {
          // If no birth data, use simplified dynamic reading
          const carrierlockResult = await saveCarrierlockMutation.mutateAsync({
            mentalNoise,
            bodyTension,
            emotionalTurbulence,
            breathCompletion,
          });

          // Use old diagnostic endpoint for now (without birth data)
          const result = await dynamicStateMutation.mutateAsync({
            mentalNoise,
            bodyTension,
            emotionalTurbulence,
            breathCompletion: breathCompletion ? 1 : 0,
            birthDate: new Date().toISOString(), // Use current date as fallback
          });

          if (result.success && result.data) {
            const data = result.data;
            
            const flaggedCodons = data.sliResults.map(s => s.codonId);
            const sliScores: Record<string, number> = {};
            const activeFacets: Record<string, string> = {};
            const confidenceLevels: Record<string, number> = {};
            
            data.sliResults.forEach(s => {
              sliScores[s.codonId] = s.sliScore;
              activeFacets[s.codonId] = s.facet;
              confidenceLevels[s.codonId] = 0.85;
            });

            const readingText = `DYNAMIC STATE READING
Timestamp: ${new Date(data.timestamp).toLocaleString()}
Coherence Score: ${data.coherenceScore}
State Amplifier: ${(data.stateAmplifier * 100).toFixed(1)}%
Dominant Facet: ${data.dominantFacet} (${data.dominantFacet === 'A' ? 'Somatic' : data.dominantFacet === 'B' ? 'Relational' : data.dominantFacet === 'C' ? 'Mental' : 'Transcendent'})

═══════════════════════════════════════════════════════════

CARRIERLOCK STATE
• Mental Noise (MN): ${data.carrierlock.mentalNoise}/10
• Body Tension (BT): ${data.carrierlock.bodyTension}/10
• Emotional Turbulence (ET): ${data.carrierlock.emotionalTurbulence}/10
• Breath Completion (BC): ${data.carrierlock.breathCompletion ? 'Yes' : 'No'}

═══════════════════════════════════════════════════════════

FACET LOUDNESS
• Somatic (A): ${(data.facetLoudness.A * 100).toFixed(1)}%
• Relational (B): ${(data.facetLoudness.B * 100).toFixed(1)}%
• Mental (C): ${(data.facetLoudness.C * 100).toFixed(1)}%
• Transcendent (D): ${(data.facetLoudness.D * 100).toFixed(1)}%

═══════════════════════════════════════════════════════════

PRIMARY INTERFERENCE
${data.primaryInterference ? `${data.primaryInterference.codonId} - ${data.primaryInterference.codonName}
SLI Score: ${(data.primaryInterference.sliScore * 100).toFixed(1)}%
Shadow Pattern: ${data.primaryInterference.shadow}` : 'No primary interference detected'}

═══════════════════════════════════════════════════════════

SECONDARY INTERFERENCES
${data.secondaryInterferences.length > 0 ? data.secondaryInterferences.map(s => `• ${s.codonId} - ${s.codonName}: ${(s.sliScore * 100).toFixed(1)}%`).join('\n') : 'None detected'}

═══════════════════════════════════════════════════════════

MICRO-CORRECTION
Center: ${data.microCorrection.center}
Facet: ${data.microCorrection.facet}
Action: ${data.microCorrection.action}
Duration: ${data.microCorrection.duration}
Rationale: ${data.microCorrection.rationale}

═══════════════════════════════════════════════════════════

FALSIFIERS
${data.falsifiers.map((f, i) => `${i + 1}. "${f.claim}"
   Test: ${f.testCondition}`).join('\n\n')}`;

            const savedReading = await saveReadingMutation.mutateAsync({
              carrierlockId: carrierlockResult.id,
              readingText,
              flaggedCodons,
              sliScores,
              activeFacets,
              confidenceLevels,
              microCorrection: data.microCorrection.action,
              correctionFacet: data.microCorrection.facet as "A" | "B" | "C" | "D",
              falsifier: data.falsifiers.map(f => f.claim).join('; '),
            });
            
            setLocation(`/reading/${savedReading.id}`);
          }
        } else {
          // With birth data, use full dynamic reading
          const carrierlockResult = await saveCarrierlockMutation.mutateAsync({
            mentalNoise,
            bodyTension,
            emotionalTurbulence,
            breathCompletion,
          });

          const result = await dynamicStateMutation.mutateAsync({
            mentalNoise,
            bodyTension,
            emotionalTurbulence,
            breathCompletion: breathCompletion ? 1 : 0,
            birthDate,
            birthTime: birthTime || undefined,
            birthLocation: birthLocation || undefined,
          });

          if (result.success && result.data) {
            const data = result.data;
            
            const flaggedCodons = data.sliResults.map(s => s.codonId);
            const sliScores: Record<string, number> = {};
            const activeFacets: Record<string, string> = {};
            const confidenceLevels: Record<string, number> = {};
            
            data.sliResults.forEach(s => {
              sliScores[s.codonId] = s.sliScore;
              activeFacets[s.codonId] = s.facet;
              confidenceLevels[s.codonId] = 0.9;
            });

            const readingText = `PERSONALIZED DYNAMIC STATE READING
Timestamp: ${new Date(data.timestamp).toLocaleString()}
Coherence Score: ${data.coherenceScore}
State Amplifier: ${(data.stateAmplifier * 100).toFixed(1)}%
Dominant Facet: ${data.dominantFacet}

═══════════════════════════════════════════════════════════

CARRIERLOCK STATE
• Mental Noise (MN): ${data.carrierlock.mentalNoise}/10
• Body Tension (BT): ${data.carrierlock.bodyTension}/10
• Emotional Turbulence (ET): ${data.carrierlock.emotionalTurbulence}/10
• Breath Completion (BC): ${data.carrierlock.breathCompletion ? 'Yes' : 'No'}

═══════════════════════════════════════════════════════════

SLI RESULTS (Shadow Loudness Index)
${data.sliResults.slice(0, 5).map(s => `• ${s.codonId} - ${s.codonName} (${s.codonTitle})
  SLI: ${(s.sliScore * 100).toFixed(1)}% | Level: ${s.level} | Facet: ${s.facetName}
  Shadow: ${s.shadow}
  Gift: ${s.gift}`).join('\n\n')}

═══════════════════════════════════════════════════════════

MICRO-CORRECTION
Center: ${data.microCorrection.center}
Facet: ${data.microCorrection.facet}
Action: ${data.microCorrection.action}
Duration: ${data.microCorrection.duration}
Rationale: ${data.microCorrection.rationale}

═══════════════════════════════════════════════════════════

FALSIFIERS
${data.falsifiers.map((f, i) => `${i + 1}. "${f.claim}"
   Test: ${f.testCondition}`).join('\n\n')}`;

            const savedReading = await saveReadingMutation.mutateAsync({
              carrierlockId: carrierlockResult.id,
              readingText,
              flaggedCodons,
              sliScores,
              activeFacets,
              confidenceLevels,
              microCorrection: data.microCorrection.action,
              correctionFacet: data.microCorrection.facet as "A" | "B" | "C" | "D",
              falsifier: data.falsifiers.map(f => f.claim).join('; '),
            });
            
            setLocation(`/reading/${savedReading.id}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate reading:", error);
    }
  };

  const isLoading = saveCarrierlockMutation.isPending || 
                    staticSignatureMutation.isPending || 
                    dynamicStateMutation.isPending || 
                    saveReadingMutation.isPending;
  const canSubmitStatic = birthDate.length > 0;

  return (
    <Layout>
      <div className="min-h-screen text-zinc-100">
        {/* Header */}
        <div className="border-b border-primary/20 bg-black/50 backdrop-blur-sm">
          <div className="container py-6">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 font-orbitron">
              Resonance Diagnostic
            </h1>
            <p className="text-zinc-400 mt-1">Choose your reading type and measure your coherence state</p>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Reading Type Selector */}
            <Card className="bg-zinc-900/50 border-primary/30 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-primary font-orbitron">Select Reading Type</CardTitle>
                <CardDescription>
                  Choose between your permanent blueprint or current moment state
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setReadingType("dynamic")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      readingType === "dynamic"
                        ? "border-primary bg-primary/10"
                        : "border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    <Zap className={`w-8 h-8 mx-auto mb-2 ${readingType === "dynamic" ? "text-primary" : "text-zinc-500"}`} />
                    <h3 className="font-semibold text-center">Dynamic State</h3>
                    <p className="text-xs text-zinc-400 text-center mt-1">Current moment Carrierlock</p>
                  </button>
                  
                  <button
                    onClick={() => setReadingType("static")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      readingType === "static"
                        ? "border-primary bg-primary/10"
                        : "border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    <Calendar className={`w-8 h-8 mx-auto mb-2 ${readingType === "static" ? "text-primary" : "text-zinc-500"}`} />
                    <h3 className="font-semibold text-center">Static Signature</h3>
                    <p className="text-xs text-zinc-400 text-center mt-1">Birth-based blueprint</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Static Signature Form */}
            {readingType === "static" && (
              <Card className="bg-zinc-900/50 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-primary font-orbitron flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Static Signature Reading
                  </CardTitle>
                  <CardDescription>
                    Your birth data encodes your permanent resonance blueprint—the 9-position Prime Stack that defines your unique archetypal signature.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Birth Date *</label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Birth Time (optional)</label>
                    <Input
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Improves facet accuracy for time-sensitive positions</p>
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">Birth Location (optional)</label>
                    <Input
                      type="text"
                      value={birthLocation}
                      onChange={(e) => setBirthLocation(e.target.value)}
                      placeholder="City, Country"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-zinc-400">
                        <p className="font-medium text-zinc-300 mb-1">What you'll receive:</p>
                        <ul className="space-y-1">
                          <li>• 9-Position Prime Stack with facet assignments</li>
                          <li>• 9-Center Resonance Map</li>
                          <li>• Fractal Role and Authority Node</li>
                          <li>• Circuit Link activations</li>
                          <li>• Falsifier verification clauses</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dynamic State Form */}
            {readingType === "dynamic" && (
              <>
                {/* Breath Protocol */}
                <BreathProtocol onComplete={handleBreathComplete} isCompleted={breathCompletion} />

                {/* Carrierlock Sliders */}
                <Card className="bg-zinc-900/50 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-primary font-orbitron flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Carrierlock Assessment
                    </CardTitle>
                    <CardDescription>
                      Rate your current state on each axis. These values determine your Coherence Score and Facet Loudness.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mental Noise */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm text-zinc-400">Mental Noise (MN)</label>
                        <span className="text-sm font-mono text-primary">{mentalNoise}/10</span>
                      </div>
                      <Slider
                        value={[mentalNoise]}
                        onValueChange={([v]) => setMentalNoise(v)}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-zinc-500">Racing thoughts, mental chatter, cognitive overwhelm</p>
                    </div>

                    {/* Body Tension */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm text-zinc-400">Body Tension (BT)</label>
                        <span className="text-sm font-mono text-primary">{bodyTension}/10</span>
                      </div>
                      <Slider
                        value={[bodyTension]}
                        onValueChange={([v]) => setBodyTension(v)}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-zinc-500">Physical tightness, somatic stress, nervous system activation</p>
                    </div>

                    {/* Emotional Turbulence */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm text-zinc-400">Emotional Turbulence (ET)</label>
                        <span className="text-sm font-mono text-primary">{emotionalTurbulence}/10</span>
                      </div>
                      <Slider
                        value={[emotionalTurbulence]}
                        onValueChange={([v]) => setEmotionalTurbulence(v)}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-zinc-500">Emotional reactivity, mood instability, feeling overwhelmed</p>
                    </div>

                    {/* Coherence Score Display */}
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Coherence Score</span>
                        <div className="text-right">
                          <span className={`text-2xl font-bold font-mono ${getCoherenceColor(coherenceScore)}`}>
                            {coherenceScore}
                          </span>
                          <span className="text-zinc-500 text-sm ml-1">/100</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              coherenceScore >= 70 ? 'bg-green-500' : 
                              coherenceScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${coherenceScore}%` }}
                          />
                        </div>
                        <p className={`text-xs mt-1 ${getCoherenceColor(coherenceScore)}`}>
                          {getCoherenceLabel(coherenceScore)}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        Formula: CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)
                      </p>
                    </div>

                    {/* Optional: Birth data for personalized reading */}
                    <div className="border-t border-zinc-700 pt-4">
                      <p className="text-sm text-zinc-400 mb-3">Optional: Add birth data for personalized reading</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">Birth Date</label>
                          <Input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">Birth Time</label>
                          <Input
                            type="time"
                            value={birthTime}
                            onChange={(e) => setBirthTime(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleGetReading}
              disabled={isLoading || (readingType === "static" && !canSubmitStatic)}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary via-emerald-500 to-teal-500 hover:from-primary/90 hover:via-emerald-500/90 hover:to-teal-500/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Reading...
                </>
              ) : (
                <>
                  {readingType === "static" ? "Generate Static Signature" : "Generate Dynamic Reading"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {readingType === "static" && !canSubmitStatic && (
              <p className="text-center text-sm text-zinc-500">
                Please enter your birth date to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
