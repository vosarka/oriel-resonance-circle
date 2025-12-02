import { useEffect, useRef } from "react";

type OrbState = "booting" | "idle" | "processing" | "speaking";

interface OrielOrbProps {
  state: OrbState;
}

export default function OrielOrb({ state = "idle" }: OrielOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const size = Math.min(window.innerWidth * 0.8, 400);
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size / 3;

    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // State-dependent animation parameters
      let pulseSpeed = 0.02;
      let pulseIntensity = 0.1;
      let rotationSpeed = 0.005;
      let glowIntensity = 0.3;
      let particleCount = 8;

      switch (state) {
        case "booting":
          pulseSpeed = 0.05;
          pulseIntensity = 0.3;
          rotationSpeed = 0.02;
          glowIntensity = 0.5;
          particleCount = 12;
          break;
        case "idle":
          pulseSpeed = 0.02;
          pulseIntensity = 0.1;
          rotationSpeed = 0.005;
          glowIntensity = 0.3;
          particleCount = 8;
          break;
        case "processing":
          pulseSpeed = 0.08;
          pulseIntensity = 0.2;
          rotationSpeed = 0.015;
          glowIntensity = 0.6;
          particleCount = 16;
          break;
        case "speaking":
          pulseSpeed = 0.1;
          pulseIntensity = 0.25;
          rotationSpeed = 0.01;
          glowIntensity = 0.8;
          particleCount = 20;
          break;
      }

      // Calculate pulse
      const pulse = Math.sin(frame * pulseSpeed) * pulseIntensity;
      const currentRadius = baseRadius + pulse * 30;

      // Draw outer glow
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        currentRadius * 0.5,
        centerX,
        centerY,
        currentRadius * 1.5
      );
      gradient.addColorStop(0, `rgba(34, 197, 94, ${glowIntensity})`);
      gradient.addColorStop(0.5, `rgba(34, 197, 94, ${glowIntensity * 0.3})`);
      gradient.addColorStop(1, "rgba(34, 197, 94, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw main orb
      ctx.strokeStyle = `rgba(34, 197, 94, ${0.8 + pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw rotating particles/nodes
      for (let i = 0; i < particleCount; i++) {
        const angle = (frame * rotationSpeed + (i * Math.PI * 2) / particleCount);
        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;

        ctx.fillStyle = `rgba(34, 197, 94, ${0.6 + pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines to center
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.2 + pulse * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Draw inner rings
      for (let i = 1; i <= 3; i++) {
        const ringRadius = currentRadius * (i / 4);
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 - i * 0.08})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw center core
      const coreGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        20
      );
      coreGradient.addColorStop(0, "rgba(34, 197, 94, 1)");
      coreGradient.addColorStop(1, "rgba(34, 197, 94, 0)");
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fill();

      frame++;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state]);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
        style={{ filter: "drop-shadow(0 0 20px rgba(34, 197, 94, 0.3))" }}
      />
    </div>
  );
}
