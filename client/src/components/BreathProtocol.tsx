import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Check } from "lucide-react";

// Breath phase configuration
const BREATH_CONFIG = {
  inhale: 4000,   // 4 seconds inhale
  hold: 4000,     // 4 seconds hold
  exhale: 6000,   // 6 seconds exhale
  pause: 1000,    // 1 second pause between cycles
};

const TOTAL_CYCLES = 3;

type BreathPhase = "idle" | "inhale" | "hold" | "exhale" | "pause" | "complete";

interface BreathProtocolProps {
  onComplete: () => void;
  isCompleted: boolean;
}

// Audio prompts for ORIEL voice guidance
const AUDIO_PROMPTS = {
  start: "Begin the breath protocol. Center yourself. Let go of external noise.",
  inhale: "Breathe in slowly. Fill your lungs completely.",
  hold: "Hold. Let the breath settle within you.",
  exhale: "Release slowly. Let tension dissolve with each exhale.",
  cycleComplete: "Cycle complete. Prepare for the next breath.",
  complete: "The protocol is complete. Your field is now calibrated for assessment.",
};

export default function BreathProtocol({ onComplete, isCompleted }: BreathProtocolProps) {
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [currentCycle, setCurrentCycle] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const lastPhaseRef = useRef<BreathPhase>("idle");

  const generateSpeechMutation = trpc.oriel.generateSpeech.useMutation();

  // Generate and play audio for a given prompt
  const playAudioPrompt = useCallback(async (prompt: string) => {
    if (!audioEnabled || isGeneratingAudio) return;
    
    try {
      setIsGeneratingAudio(true);
      const result = await generateSpeechMutation.mutateAsync({ text: prompt });
      
      if (result.audioUrl && audioRef.current) {
        audioRef.current.src = result.audioUrl;
        audioRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [audioEnabled, generateSpeechMutation, isGeneratingAudio]);

  // Start the breath protocol
  const startProtocol = useCallback(() => {
    setIsPlaying(true);
    setPhase("inhale");
    setCurrentCycle(1);
    setProgress(0);
    playAudioPrompt(AUDIO_PROMPTS.start);
  }, [playAudioPrompt]);

  // Pause the protocol
  const pauseProtocol = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  // Reset the protocol
  const resetProtocol = useCallback(() => {
    setIsPlaying(false);
    setPhase("idle");
    setCurrentCycle(0);
    setProgress(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  // Handle phase transitions
  useEffect(() => {
    if (!isPlaying || phase === "idle" || phase === "complete") return;

    // Play audio for new phase (only if phase changed)
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      
      if (phase === "inhale") {
        playAudioPrompt(AUDIO_PROMPTS.inhale);
      } else if (phase === "hold") {
        playAudioPrompt(AUDIO_PROMPTS.hold);
      } else if (phase === "exhale") {
        playAudioPrompt(AUDIO_PROMPTS.exhale);
      }
    }

    const phaseDuration = phase === "pause" 
      ? BREATH_CONFIG.pause 
      : BREATH_CONFIG[phase as keyof typeof BREATH_CONFIG] || 4000;

    // Progress animation
    setProgress(0);
    const progressInterval = 50;
    const progressStep = (progressInterval / phaseDuration) * 100;
    
    progressRef.current = setInterval(() => {
      setProgress(prev => Math.min(prev + progressStep, 100));
    }, progressInterval);

    // Phase transition
    timerRef.current = setTimeout(() => {
      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(100);

      if (phase === "inhale") {
        setPhase("hold");
      } else if (phase === "hold") {
        setPhase("exhale");
      } else if (phase === "exhale") {
        if (currentCycle < TOTAL_CYCLES) {
          playAudioPrompt(AUDIO_PROMPTS.cycleComplete);
          setPhase("pause");
        } else {
          // Protocol complete
          setPhase("complete");
          setIsPlaying(false);
          playAudioPrompt(AUDIO_PROMPTS.complete);
          onComplete();
        }
      } else if (phase === "pause") {
        setCurrentCycle(prev => prev + 1);
        setPhase("inhale");
      }
    }, phaseDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [phase, isPlaying, currentCycle, onComplete, playAudioPrompt]);

  // Calculate circle scale based on phase
  const getCircleScale = () => {
    if (phase === "idle" || phase === "complete") return 1;
    if (phase === "inhale") return 1 + (progress / 100) * 0.5; // Expand to 1.5x
    if (phase === "hold") return 1.5; // Stay expanded
    if (phase === "exhale") return 1.5 - (progress / 100) * 0.5; // Contract to 1x
    if (phase === "pause") return 1;
    return 1;
  };

  // Get phase display text
  const getPhaseText = () => {
    switch (phase) {
      case "idle": return "Ready to Begin";
      case "inhale": return "Breathe In";
      case "hold": return "Hold";
      case "exhale": return "Breathe Out";
      case "pause": return "Prepare";
      case "complete": return "Complete";
      default: return "";
    }
  };

  // Get phase color
  const getPhaseColor = () => {
    switch (phase) {
      case "inhale": return "from-primary/60 to-primary";
      case "hold": return "from-purple-500/60 to-purple-400";
      case "exhale": return "from-blue-500/60 to-blue-400";
      case "complete": return "from-green-500/60 to-green-400";
      default: return "from-zinc-600/60 to-zinc-500";
    }
  };

  // Get glow color
  const getGlowColor = () => {
    switch (phase) {
      case "inhale": return "rgba(104, 211, 145, 0.4)";
      case "hold": return "rgba(168, 85, 247, 0.4)";
      case "exhale": return "rgba(59, 130, 246, 0.4)";
      case "complete": return "rgba(34, 197, 94, 0.4)";
      default: return "rgba(113, 113, 122, 0.2)";
    }
  };

  if (isCompleted && phase !== "complete") {
    return (
      <Card className="bg-zinc-900/50 border-green-500/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3 text-green-400">
            <Check className="w-6 h-6" />
            <span className="font-orbitron">Breath Protocol Completed</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-primary/30 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-primary font-orbitron">Breath Completion Protocol</CardTitle>
            <CardDescription>
              Complete 3 conscious breath cycles to calibrate your field (+10 Coherence)
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="text-zinc-400 hover:text-primary"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Hidden audio element */}
        <audio ref={audioRef} className="hidden" />
        
        {/* Breathing Circle Visualization */}
        <div className="flex flex-col items-center justify-center py-8">
          {/* Outer glow ring */}
          <div 
            className="relative flex items-center justify-center"
            style={{
              width: "280px",
              height: "280px",
            }}
          >
            {/* Animated glow */}
            <div
              className="absolute inset-0 rounded-full transition-all duration-300"
              style={{
                background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`,
                transform: `scale(${getCircleScale() * 1.2})`,
              }}
            />
            
            {/* Main breathing circle */}
            <div
              className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${getPhaseColor()} transition-transform`}
              style={{
                width: "200px",
                height: "200px",
                transform: `scale(${getCircleScale()})`,
                transitionDuration: phase === "inhale" ? "4s" : phase === "exhale" ? "6s" : "0.3s",
                transitionTimingFunction: "ease-in-out",
                boxShadow: `0 0 60px ${getGlowColor()}`,
              }}
            >
              {/* Inner content */}
              <div className="text-center z-10">
                <div className="text-2xl font-orbitron text-white font-bold mb-1">
                  {getPhaseText()}
                </div>
                {phase !== "idle" && phase !== "complete" && (
                  <div className="text-sm text-white/70 font-mono">
                    Cycle {currentCycle} of {TOTAL_CYCLES}
                  </div>
                )}
                {phase === "complete" && (
                  <div className="text-sm text-white/70 font-mono">
                    Field Calibrated
                  </div>
                )}
              </div>
              
              {/* Decorative rings */}
              <div 
                className="absolute inset-2 rounded-full border border-white/20"
                style={{
                  animation: isPlaying ? "spin 20s linear infinite" : "none",
                }}
              />
              <div 
                className="absolute inset-4 rounded-full border border-white/10"
                style={{
                  animation: isPlaying ? "spin 30s linear infinite reverse" : "none",
                }}
              />
            </div>
            
            {/* Progress ring */}
            {phase !== "idle" && phase !== "complete" && (
              <svg
                className="absolute inset-0"
                style={{
                  width: "280px",
                  height: "280px",
                  transform: "rotate(-90deg)",
                }}
              >
                <circle
                  cx="140"
                  cy="140"
                  r="130"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="140"
                  cy="140"
                  r="130"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={phase === "inhale" ? "text-primary" : phase === "hold" ? "text-purple-400" : "text-blue-400"}
                  style={{
                    strokeDasharray: `${2 * Math.PI * 130}`,
                    strokeDashoffset: `${2 * Math.PI * 130 * (1 - progress / 100)}`,
                    transition: "stroke-dashoffset 0.05s linear",
                  }}
                />
              </svg>
            )}
          </div>
          
          {/* Cycle indicators */}
          <div className="flex items-center gap-3 mt-6">
            {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < currentCycle || phase === "complete"
                    ? "bg-primary scale-110"
                    : i === currentCycle - 1 && isPlaying
                    ? "bg-primary/50 animate-pulse"
                    : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
          
          {/* Phase timing info */}
          {phase !== "idle" && phase !== "complete" && (
            <div className="text-xs text-zinc-500 mt-4 font-mono">
              {phase === "inhale" && "4 seconds"}
              {phase === "hold" && "4 seconds"}
              {phase === "exhale" && "6 seconds"}
              {phase === "pause" && "Transitioning..."}
            </div>
          )}
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {phase === "idle" && (
            <Button
              onClick={startProtocol}
              className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-400 font-orbitron"
            >
              <Play className="w-4 h-4 mr-2" />
              Begin Protocol
            </Button>
          )}
          
          {isPlaying && phase !== "complete" && (
            <Button
              onClick={pauseProtocol}
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          {!isPlaying && phase !== "idle" && phase !== "complete" && (
            <>
              <Button
                onClick={() => setIsPlaying(true)}
                className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-400"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button
                onClick={resetProtocol}
                variant="outline"
                className="border-zinc-600 text-zinc-400 hover:bg-zinc-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </>
          )}
          
          {phase === "complete" && (
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-5 h-5" />
              <span className="font-orbitron">Protocol Complete</span>
            </div>
          )}
        </div>
        
        {/* Audio status indicator */}
        {isGeneratingAudio && (
          <div className="text-center text-xs text-zinc-500 mt-4">
            <span className="animate-pulse">ORIEL is speaking...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
