import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignalDecodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: {
    id: string;
    title: string;
    description: string;
    fullContent: string;
  };
}

export default function SignalDecodeModal({
  isOpen,
  onClose,
  signal,
}: SignalDecodeModalProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Trigger glitch animation on open
  useEffect(() => {
    if (isOpen) {
      setIsGlitching(true);
      setIsRevealed(false);

      // Start glitch effect
      const glitchTimer = setTimeout(() => {
        setIsGlitching(false);
      }, 400);

      // Reveal content after glitch
      const revealTimer = setTimeout(() => {
        setIsRevealed(true);
      }, 450);

      return () => {
        clearTimeout(glitchTimer);
        clearTimeout(revealTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none animate-scan-lines opacity-20" />

      {/* Modal container */}
      <div
        className={`relative w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto ${
          isGlitching ? "animate-signal-glitch" : ""
        }`}
      >
        {/* Modal content */}
        <div className="bg-black/90 border-2 border-primary/50 rounded-lg p-8 backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-primary hover:text-primary/80 transition-colors z-10"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          {/* Signal header with glow effect */}
          <div
            className={`mb-6 transition-all duration-500 ${
              isRevealed ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="text-xs text-primary/50 font-mono uppercase tracking-wider mb-2">
              ◈ SIGNAL DECODED ◈
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary font-orbitron uppercase mb-2 animate-amber-glow">
              {signal.title}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-transparent mb-4" />
          </div>

          {/* Signal ID and metadata */}
          <div
            className={`mb-6 p-4 bg-primary/10 border border-primary/30 rounded transition-all duration-500 ${
              isRevealed
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: isRevealed ? "100ms" : "0ms",
            }}
          >
            <div className="text-xs text-primary/50 font-mono uppercase tracking-wider mb-1">
              Transmission ID
            </div>
            <div className="text-lg font-mono text-primary/80">{signal.id}</div>
          </div>

          {/* Signal description */}
          <div
            className={`mb-6 transition-all duration-500 ${
              isRevealed
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: isRevealed ? "200ms" : "0ms",
            }}
          >
            <h3 className="text-sm font-mono text-primary uppercase tracking-wider mb-2">
              Summary
            </h3>
            <p className="text-white/70 font-mono text-sm leading-relaxed">
              {signal.description}
            </p>
          </div>

          {/* Full signal content with scan effect */}
          <div
            className={`mb-6 p-6 bg-black/60 border-2 border-primary/40 rounded-lg transition-all duration-500 ${
              isRevealed
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: isRevealed ? "300ms" : "0ms",
            }}
          >
            <div className="text-xs text-primary/50 font-mono uppercase tracking-wider mb-3">
              ◈ Full Transmission ◈
            </div>
            <div className="space-y-4">
              {signal.fullContent.split("\n").map((paragraph, idx) => (
                <p
                  key={idx}
                  className="text-white/80 font-mono text-sm leading-relaxed animate-text-reveal"
                  style={{
                    animationDelay: isRevealed ? `${400 + idx * 50}ms` : "0ms",
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Footer with border scan effect */}
          <div
            className={`flex justify-between items-center p-4 border-t border-primary/30 transition-all duration-500 ${
              isRevealed ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transitionDelay: isRevealed ? "500ms" : "0ms",
            }}
          >
            <div className="text-xs text-primary/50 font-mono">
              SIGNAL COHERENCE: 100%
            </div>
            <Button
              onClick={onClose}
              className="bg-primary/10 border border-primary/50 text-primary hover:bg-primary/15 hover:border-primary transition-all font-mono uppercase text-sm px-4 py-2"
            >
              Close Conduit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
