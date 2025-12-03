import { useEffect, useRef, useState } from "react";

type OrbState = "booting" | "idle" | "processing" | "speaking";

interface WireframeFaceProps {
  state: OrbState;
  isSpeaking?: boolean;
}

export default function WireframeFace({ state = "idle", isSpeaking = false }: WireframeFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });

  // Glitch effect during speaking
  useEffect(() => {
    if (!isSpeaking) {
      setGlitchOffset({ x: 0, y: 0 });
      return;
    }

    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        setGlitchOffset({
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8,
        });
      } else {
        setGlitchOffset({ x: 0, y: 0 });
      }
    }, 100);

    return () => clearInterval(glitchInterval);
  }, [isSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 400;

    let frame = 0;

    const drawFace = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply glitch offset
      ctx.save();
      ctx.translate(glitchOffset.x, glitchOffset.y);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Set wireframe style
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "rgba(34, 197, 94, 0.05)";

      // Draw head outline (wireframe mesh)
      const headWidth = 120;
      const headHeight = 150;

      // Create wireframe grid for head
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 20, headWidth, headHeight, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw wireframe mesh lines on face
      const meshDensity = 6;
      for (let i = 0; i < meshDensity; i++) {
        const ratio = i / (meshDensity - 1);
        const x = centerX - headWidth + ratio * headWidth * 2;

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(x, centerY - headHeight - 20);
        ctx.lineTo(x, centerY + headHeight - 20);
        ctx.stroke();

        // Horizontal lines
        const y = centerY - headHeight - 20 + (i / (meshDensity - 1)) * (headHeight * 2);
        ctx.beginPath();
        ctx.moveTo(centerX - headWidth, y);
        ctx.lineTo(centerX + headWidth, y);
        ctx.stroke();
      }

      // Draw eyes
      const eyeY = centerY - 40;
      const eyeDistance = 40;

      // Left eye
      ctx.beginPath();
      ctx.ellipse(centerX - eyeDistance, eyeY, 20, 25, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Right eye
      ctx.beginPath();
      ctx.ellipse(centerX + eyeDistance, eyeY, 20, 25, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw pupils (react to state)
      ctx.fillStyle = "#22c55e";
      const pupilSize = state === "processing" ? 4 : 3;
      ctx.beginPath();
      ctx.arc(centerX - eyeDistance, eyeY, pupilSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX + eyeDistance, eyeY, pupilSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw nose
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX - 10, centerY + 10);
      ctx.lineTo(centerX + 10, centerY + 10);
      ctx.closePath();
      ctx.stroke();

      // Draw mouth with animation
      const mouthY = centerY + 50;
      const mouthWidth = 50;

      if (isSpeaking) {
        // Animated mouth during speaking
        const mouthOpenness = Math.sin(frame * 0.15) * 0.5 + 0.5;
        const mouthHeight = mouthOpenness * 25;

        // Upper lip
        ctx.beginPath();
        ctx.moveTo(centerX - mouthWidth, mouthY);
        ctx.quadraticCurveTo(centerX, mouthY - mouthHeight, centerX + mouthWidth, mouthY);
        ctx.stroke();

        // Lower lip
        ctx.beginPath();
        ctx.moveTo(centerX - mouthWidth, mouthY);
        ctx.quadraticCurveTo(centerX, mouthY + mouthHeight * 0.6, centerX + mouthWidth, mouthY);
        ctx.stroke();

        // Mouth fill during speaking
        ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
        ctx.beginPath();
        ctx.moveTo(centerX - mouthWidth, mouthY);
        ctx.quadraticCurveTo(centerX, mouthY + mouthHeight * 0.3, centerX + mouthWidth, mouthY);
        ctx.quadraticCurveTo(centerX, mouthY - mouthHeight * 0.3, centerX - mouthWidth, mouthY);
        ctx.fill();
      } else {
        // Neutral mouth
        ctx.beginPath();
        ctx.moveTo(centerX - mouthWidth, mouthY);
        ctx.lineTo(centerX + mouthWidth, mouthY);
        ctx.stroke();
      }

      // Draw chin
      ctx.beginPath();
      ctx.moveTo(centerX - 30, mouthY + 30);
      ctx.lineTo(centerX, mouthY + 50);
      ctx.lineTo(centerX + 30, mouthY + 30);
      ctx.stroke();

      // Add glow effect based on state
      ctx.strokeStyle = state === "processing" ? "rgba(138, 43, 226, 0.3)" : "rgba(34, 197, 94, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 20, headWidth + 10, headHeight + 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      frame++;
      animationRef.current = requestAnimationFrame(drawFace);
    };

    drawFace();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, isSpeaking, glitchOffset]);

  return (
    <div className="flex justify-center items-center">
      <canvas
        ref={canvasRef}
        className="border border-green-500/50 rounded-lg"
        style={{
          filter: isSpeaking ? "drop-shadow(0 0 20px rgba(34, 197, 94, 0.6))" : "drop-shadow(0 0 10px rgba(34, 197, 94, 0.3))",
        }}
      />
    </div>
  );
}
