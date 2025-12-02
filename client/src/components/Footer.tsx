import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function Footer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Create audio element for ambient sound
    const audio = new Audio();
    // Using a placeholder ambient space drone URL - replace with actual audio file
    audio.src = "https://assets.mixkit.co/active_storage/sfx/2467/2467-preview.mp3";
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Auto-play on user interaction (browsers require user gesture)
    const playAudio = () => {
      audio.play().catch(err => console.log("Audio autoplay prevented:", err));
      document.removeEventListener("click", playAudio);
    };
    document.addEventListener("click", playAudio);

    return () => {
      audio.pause();
      document.removeEventListener("click", playAudio);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0] || 0;
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-green-500/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Credits */}
          <div className="text-xs text-gray-500 font-mono">
            <span className="hidden sm:inline">ORIEL RESONANCE CIRCLE © 2024 | </span>
            <span className="text-green-500/70">VOSSARI TRANSMISSION NODE</span>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono hidden sm:inline">AMBIENT</span>
            <button
              onClick={toggleMute}
              className="text-green-400 hover:text-green-300 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="w-24 hidden sm:block">
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
