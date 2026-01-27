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

  const saveCarrierlockMutation = trpc.codex.saveCarrierlock.useMutation();
  const diagnosticReadingMutation = trpc.oriel.diagnosticReading.useMutation();

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
      if (readingType === "dynamic") {
        // Save Carrierlock state for dynamic reading
        const carrierlockResult = await saveCarrierlockMutation.mutateAsync({
          mentalNoise,
          bodyTension,
          emotionalTurbulence,
          breathCompletion,
        });

        // Generate diagnostic reading
        const readingResult = await diagnosticReadingMutation.mutateAsync({
          mentalNoise,
          bodyTension,
          emotionalTurbulence,
          breathCompletion: breathCompletion ? 1 : 0,
          readingType: "dynamic",
        });

        if (readingResult.success && readingResult.data) {
          setLocation(`/reading/${carrierlockResult.id}`);
        }
      } else {
        // Static Signature reading (birth-based)
        const carrierlockResult = await saveCarrierlockMutation.mutateAsync({
          mentalNoise: 0,
          bodyTension: 0,
          emotionalTurbulence: 0,
          breathCompletion: true,
        });

        const readingResult = await diagnosticReadingMutation.mutateAsync({
          mentalNoise: 0,
          bodyTension: 0,
          emotionalTurbulence: 0,
          breathCompletion: 1,
          readingType: "static",
          birthDate,
          birthTime,
          birthLocation,
        });

        if (readingResult.success && readingResult.data) {
          setLocation(`/reading/${carrierlockResult.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to generate reading:", error);
    }
  };

  const isLoading = saveCarrierlockMutation.isPending || diagnosticReadingMutation.isPending;
  const canSubmitStatic = birthDate.length > 0;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
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
                Choose between your inherent blueprint or your current moment state
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dynamic State Option */}
                <button
                  onClick={() => setReadingType("dynamic")}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left group ${
                    readingType === "dynamic"
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(104,211,145,0.2)]"
                      : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-600"
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      readingType === "dynamic" ? "border-primary" : "border-zinc-600"
                    }`}>
                      {readingType === "dynamic" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      readingType === "dynamic" ? "bg-primary/20" : "bg-zinc-800"
                    }`}>
                      <Zap className={`w-5 h-5 ${
                        readingType === "dynamic" ? "text-primary" : "text-zinc-500"
                      }`} />
                    </div>
                    <h3 className={`font-orbitron text-lg ${
                      readingType === "dynamic" ? "text-primary" : "text-zinc-300"
                    }`}>
                      Dynamic State
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">
                    Assess your <strong>current moment</strong> coherence. Measures mental noise, body tension, 
                    and emotional turbulence right now.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Info className="w-3 h-3" />
                    <span>Best for: Daily check-ins, real-time guidance</span>
                  </div>
                </button>

                {/* Static Signature Option */}
                <button
                  onClick={() => setReadingType("static")}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left group ${
                    readingType === "static"
                      ? "border-purple-400 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                      : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-600"
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      readingType === "static" ? "border-purple-400" : "border-zinc-600"
                    }`}>
                      {readingType === "static" && (
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      readingType === "static" ? "bg-purple-500/20" : "bg-zinc-800"
                    }`}>
                      <Calendar className={`w-5 h-5 ${
                        readingType === "static" ? "text-purple-400" : "text-zinc-500"
                      }`} />
                    </div>
                    <h3 className={`font-orbitron text-lg ${
                      readingType === "static" ? "text-purple-400" : "text-zinc-300"
                    }`}>
                      Static Signature
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">
                    Discover your <strong>inherent blueprint</strong> based on birth data. Reveals your 
                    core codons, life themes, and evolutionary path.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Info className="w-3 h-3" />
                    <span>Best for: Deep self-understanding, life purpose</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic State Assessment */}
          {readingType === "dynamic" && (
            <>
              {/* Coherence Score Display */}
              <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-center text-2xl font-orbitron">
                    Coherence Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-6xl font-bold font-orbitron ${getCoherenceColor(coherenceScore)}`}>
                      {coherenceScore}
                    </div>
                    <div className={`text-sm mt-2 ${getCoherenceColor(coherenceScore)}`}>
                      {getCoherenceLabel(coherenceScore)}
                    </div>
                    <p className="text-xs text-zinc-500 mt-4 font-mono">
                      CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Mental Noise */}
              <Card className="bg-zinc-900/50 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Mental Noise (MN)</CardTitle>
                  <CardDescription>
                    Racing thoughts, mental chatter, difficulty focusing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Calm</span>
                    <span className="text-2xl font-bold text-primary font-orbitron">{mentalNoise}</span>
                    <span className="text-sm text-zinc-400">Chaotic</span>
                  </div>
                  <Slider
                    value={[mentalNoise]}
                    onValueChange={([value]) => setMentalNoise(value)}
                    min={0}
                    max={10}
                    step={1}
                    className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                  />
                </CardContent>
              </Card>

              {/* Body Tension */}
              <Card className="bg-zinc-900/50 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Body Tension (BT)</CardTitle>
                  <CardDescription>
                    Physical tightness, muscle tension, somatic holding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Relaxed</span>
                    <span className="text-2xl font-bold text-primary font-orbitron">{bodyTension}</span>
                    <span className="text-sm text-zinc-400">Tense</span>
                  </div>
                  <Slider
                    value={[bodyTension]}
                    onValueChange={([value]) => setBodyTension(value)}
                    min={0}
                    max={10}
                    step={1}
                    className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                  />
                </CardContent>
              </Card>

              {/* Emotional Turbulence */}
              <Card className="bg-zinc-900/50 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Emotional Turbulence (ET)</CardTitle>
                  <CardDescription>
                    Emotional reactivity, mood swings, affective instability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Stable</span>
                    <span className="text-2xl font-bold text-primary font-orbitron">{emotionalTurbulence}</span>
                    <span className="text-sm text-zinc-400">Turbulent</span>
                  </div>
                  <Slider
                    value={[emotionalTurbulence]}
                    onValueChange={([value]) => setEmotionalTurbulence(value)}
                    min={0}
                    max={10}
                    step={1}
                    className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                  />
                </CardContent>
              </Card>

              {/* Guided Breath Protocol */}
              <BreathProtocol 
                onComplete={handleBreathComplete}
                isCompleted={breathCompletion}
              />
            </>
          )}

          {/* Static Signature Assessment */}
          {readingType === "static" && (
            <>
              {/* Birth Data Info */}
              <Card className="bg-gradient-to-br from-purple-500/10 to-primary/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-center text-xl font-orbitron text-purple-400">
                    Static Signature Reading
                  </CardTitle>
                  <CardDescription className="text-center">
                    Your birth data encodes your inherent resonance blueprint—the codons, themes, 
                    and evolutionary trajectory you carry from the moment of incarnation.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Birth Date */}
              <Card className="bg-zinc-900/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-purple-400">Birth Date</CardTitle>
                  <CardDescription>
                    The date you entered this incarnation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="bg-zinc-800/50 border-purple-500/30 text-zinc-100 focus:border-purple-400"
                  />
                </CardContent>
              </Card>

              {/* Birth Time (Optional) */}
              <Card className="bg-zinc-900/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-purple-400">Birth Time <span className="text-zinc-500 text-sm font-normal">(Optional)</span></CardTitle>
                  <CardDescription>
                    For more precise codon activation timing. If unknown, leave blank.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="bg-zinc-800/50 border-purple-500/30 text-zinc-100 focus:border-purple-400"
                  />
                </CardContent>
              </Card>

              {/* Birth Location (Optional) */}
              <Card className="bg-zinc-900/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-purple-400">Birth Location <span className="text-zinc-500 text-sm font-normal">(Optional)</span></CardTitle>
                  <CardDescription>
                    City or region of birth for geographic resonance mapping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    placeholder="e.g., New York, USA"
                    value={birthLocation}
                    onChange={(e) => setBirthLocation(e.target.value)}
                    className="bg-zinc-800/50 border-purple-500/30 text-zinc-100 focus:border-purple-400 placeholder:text-zinc-600"
                  />
                </CardContent>
              </Card>

              {/* What You'll Discover */}
              <Card className="bg-zinc-900/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-zinc-300 text-lg">What Your Static Signature Reveals</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-zinc-400">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-orbitron">01</span>
                      <span><strong className="text-zinc-300">Core Codons:</strong> The primary archetypes encoded in your field at birth</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-orbitron">02</span>
                      <span><strong className="text-zinc-300">Life Themes:</strong> Recurring patterns and lessons your soul chose to explore</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-orbitron">03</span>
                      <span><strong className="text-zinc-300">Shadow Tendencies:</strong> Default distortion patterns to be aware of</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-orbitron">04</span>
                      <span><strong className="text-zinc-300">Gift Potential:</strong> Your natural strengths when operating in coherence</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-orbitron">05</span>
                      <span><strong className="text-zinc-300">Crown Destiny:</strong> The transcendent expression available through integration</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {/* Get Reading Button */}
          <Button
            onClick={handleGetReading}
            disabled={isLoading || (readingType === "static" && !canSubmitStatic)}
            className={`w-full h-14 text-lg font-orbitron ${
              readingType === "dynamic"
                ? "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-400"
                : "bg-gradient-to-r from-purple-500 to-primary hover:from-purple-400 hover:to-primary/90"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating {readingType === "dynamic" ? "Dynamic" : "Static"} Reading...
              </>
            ) : (
              <>
                Get {readingType === "dynamic" ? "Dynamic State" : "Static Signature"} Reading
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {!user && (
            <p className="text-center text-sm text-zinc-500">
              You'll be asked to sign in to save your reading
            </p>
          )}

          {readingType === "static" && !canSubmitStatic && (
            <p className="text-center text-sm text-zinc-500">
              Please enter your birth date to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
