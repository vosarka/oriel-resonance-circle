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

    // Rainbow/indigo color palette for processing state
    const rainbowColors = [
      { r: 102, g: 51, b: 153 },   // Indigo
      { r: 75, g: 0, b: 130 },     // Indigo
      { r: 138, g: 43, b: 226 },   // Blue Violet
      { r: 75, g: 0, b: 130 },     // Indigo
      { r: 102, g: 51, b: 153 },   // Indigo
    ];

    const getProcessingColor = (index: number, alpha: number) => {
      const colorIndex = Math.floor((frame / 10 + index) % rainbowColors.length);
      const color = rainbowColors[colorIndex];
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    };

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // State-dependent animation parameters
      let pulseSpeed = 0.02;
      let pulseIntensity = 0.1;
      let rotationSpeed = 0.005;
      let glowIntensity = 0.3;
      let particleCount = 8;
      let useRainbow = false;
      let lightReflectionIntensity = 0;

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
          pulseIntensity = 0.25;
          rotationSpeed = 0.015;
          glowIntensity = 0.7;
          particleCount = 18;
          useRainbow = true;
          lightReflectionIntensity = 0.4 + Math.sin(frame * 0.05) * 0.2;
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

      // Draw outer glow with rainbow effect during processing
      if (useRainbow) {
        // Create multiple gradient layers for rainbow effect
        for (let layer = 0; layer < 3; layer++) {
          const layerOffset = layer * 0.15;
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            currentRadius * (0.5 - layerOffset),
            centerX,
            centerY,
            currentRadius * (1.5 + layerOffset)
          );
          
          const colorIndex = (frame / 5 + layer) % rainbowColors.length;
          const color = rainbowColors[Math.floor(colorIndex)];
          
          gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowIntensity * 0.4})`);
          gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowIntensity * 0.15})`);
          gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, currentRadius * (1.5 + layerOffset), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Standard green glow
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
      }

      // Draw light reflections during processing
      if (useRainbow && lightReflectionIntensity > 0) {
        const reflectionAngle = (frame * 0.02) % (Math.PI * 2);
        const reflectionX = centerX + Math.cos(reflectionAngle) * currentRadius * 0.6;
        const reflectionY = centerY + Math.sin(reflectionAngle) * currentRadius * 0.6;

        // Create organic light reflection
        const reflectionGradient = ctx.createRadialGradient(
          reflectionX,
          reflectionY,
          0,
          reflectionX,
          reflectionY,
          currentRadius * 0.4
        );
        reflectionGradient.addColorStop(0, `rgba(200, 150, 255, ${lightReflectionIntensity * 0.6})`);
        reflectionGradient.addColorStop(0.7, `rgba(138, 43, 226, ${lightReflectionIntensity * 0.2})`);
        reflectionGradient.addColorStop(1, "rgba(138, 43, 226, 0)");

        ctx.fillStyle = reflectionGradient;
        ctx.beginPath();
        ctx.arc(reflectionX, reflectionY, currentRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw main orb
      if (useRainbow) {
        const rainbowIndex = Math.floor((frame / 8) % rainbowColors.length);
        const rainbowColor = rainbowColors[rainbowIndex];
        ctx.strokeStyle = `rgba(${rainbowColor.r}, ${rainbowColor.g}, ${rainbowColor.b}, ${0.8 + pulse})`;
      } else {
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.8 + pulse})`;
      }
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw rotating particles/nodes
      for (let i = 0; i < particleCount; i++) {
        const angle = (frame * rotationSpeed + (i * Math.PI * 2) / particleCount);
        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;

        if (useRainbow) {
          const particleColor = getProcessingColor(i, 0.6 + pulse);
          ctx.fillStyle = particleColor;
        } else {
          ctx.fillStyle = `rgba(34, 197, 94, ${0.6 + pulse})`;
        }
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines to center
        if (useRainbow) {
          const lineColor = getProcessingColor(i, 0.3 + pulse * 0.3);
          ctx.strokeStyle = lineColor;
        } else {
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.2 + pulse * 0.5})`;
        }
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Draw inner rings
      for (let i = 1; i <= 3; i++) {
        const ringRadius = currentRadius * (i / 4);
        if (useRainbow) {
          const ringColor = getProcessingColor(i, 0.4 - i * 0.08);
          ctx.strokeStyle = ringColor;
        } else {
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 - i * 0.08})`;
        }
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw center core
      let coreGradient;
      if (useRainbow) {
        const coreColorIndex = Math.floor((frame / 10) % rainbowColors.length);
        const coreColor = rainbowColors[coreColorIndex];
        coreGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          20
        );
        coreGradient.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, 1)`);
        coreGradient.addColorStop(1, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, 0)`);
      } else {
        coreGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          20
        );
        coreGradient.addColorStop(0, "rgba(34, 197, 94, 1)");
        coreGradient.addColorStop(1, "rgba(34, 197, 94, 0)");
      }
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
        style={{
          filter: state === "processing"
            ? "drop-shadow(0 0 30px rgba(138, 43, 226, 0.5))"
            : "drop-shadow(0 0 20px rgba(34, 197, 94, 0.3))",
          transition: "filter 0.3s ease-in-out",
        }}
      />
    </div>
  );
}
