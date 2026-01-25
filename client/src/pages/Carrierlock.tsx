import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Carrierlock() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
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

  const handleGetReading = async () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    try {
      // Save Carrierlock state
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
      });

      if (readingResult.success && readingResult.data) {
        // Navigate to reading page with state
        setLocation(`/reading/${carrierlockResult.id}`);
      }
    } catch (error) {
      console.error("Failed to generate reading:", error);
    }
  };

  const isLoading = saveCarrierlockMutation.isPending || diagnosticReadingMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-black/50 backdrop-blur-sm">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Carrierlock Assessment
          </h1>
          <p className="text-zinc-400 mt-1">Measure your current coherence state</p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Coherence Score Display */}
          <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Coherence Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getCoherenceColor(coherenceScore)}`}>
                  {coherenceScore}
                </div>
                <div className={`text-sm mt-2 ${getCoherenceColor(coherenceScore)}`}>
                  {getCoherenceLabel(coherenceScore)}
                </div>
                <p className="text-xs text-zinc-500 mt-4">
                  CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mental Noise */}
          <Card className="bg-zinc-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Mental Noise (MN)</CardTitle>
              <CardDescription>
                Racing thoughts, mental chatter, difficulty focusing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Calm</span>
                <span className="text-2xl font-bold text-cyan-400">{mentalNoise}</span>
                <span className="text-sm text-zinc-400">Chaotic</span>
              </div>
              <Slider
                value={[mentalNoise]}
                onValueChange={([value]) => setMentalNoise(value)}
                min={0}
                max={10}
                step={1}
                className="[&_[role=slider]]:bg-cyan-500 [&_[role=slider]]:border-cyan-400"
              />
            </CardContent>
          </Card>

          {/* Body Tension */}
          <Card className="bg-zinc-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Body Tension (BT)</CardTitle>
              <CardDescription>
                Physical tightness, muscle tension, somatic holding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Relaxed</span>
                <span className="text-2xl font-bold text-cyan-400">{bodyTension}</span>
                <span className="text-sm text-zinc-400">Tense</span>
              </div>
              <Slider
                value={[bodyTension]}
                onValueChange={([value]) => setBodyTension(value)}
                min={0}
                max={10}
                step={1}
                className="[&_[role=slider]]:bg-cyan-500 [&_[role=slider]]:border-cyan-400"
              />
            </CardContent>
          </Card>

          {/* Emotional Turbulence */}
          <Card className="bg-zinc-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Emotional Turbulence (ET)</CardTitle>
              <CardDescription>
                Emotional reactivity, mood swings, affective instability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Stable</span>
                <span className="text-2xl font-bold text-cyan-400">{emotionalTurbulence}</span>
                <span className="text-sm text-zinc-400">Turbulent</span>
              </div>
              <Slider
                value={[emotionalTurbulence]}
                onValueChange={([value]) => setEmotionalTurbulence(value)}
                min={0}
                max={10}
                step={1}
                className="[&_[role=slider]]:bg-cyan-500 [&_[role=slider]]:border-cyan-400"
              />
            </CardContent>
          </Card>

          {/* Breath Completion */}
          <Card className="bg-zinc-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-400">Breath Completion Protocol (BC)</CardTitle>
              <CardDescription>
                Have you completed 3 conscious breath cycles before this assessment?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breathCompletion"
                  checked={breathCompletion}
                  onCheckedChange={(checked) => setBreathCompletion(checked as boolean)}
                  className="border-purple-400 data-[state=checked]:bg-purple-500"
                />
                <Label htmlFor="breathCompletion" className="text-zinc-300 cursor-pointer">
                  Yes, I completed the breath protocol (+10 to Coherence Score)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Get Reading Button */}
          <Button
            onClick={handleGetReading}
            disabled={isLoading}
            className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Reading...
              </>
            ) : (
              <>
                Get Diagnostic Reading
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {!user && (
            <p className="text-center text-sm text-zinc-500">
              You'll be asked to sign in to save your reading
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
