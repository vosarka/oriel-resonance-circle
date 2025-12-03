import { useEffect, useRef } from "react";

type OrbState = "booting" | "idle" | "processing" | "speaking";

interface AmbientBackgroundProps {
  state: OrbState;
}

export default function AmbientBackground({ state = "idle" }: AmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas to full window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let frame = 0;
    const particles = particlesRef.current;

    // Rainbow/indigo color palette
    const rainbowColors = [
      { r: 102, g: 51, b: 153 },   // Indigo
      { r: 75, g: 0, b: 130 },     // Indigo
      { r: 138, g: 43, b: 226 },   // Blue Violet
      { r: 75, g: 0, b: 130 },     // Indigo
      { r: 102, g: 51, b: 153 },   // Indigo
    ];

    const createParticles = (count: number, useRainbow: boolean) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const x = canvas.width / 2 + Math.cos(angle) * 100;
        const y = canvas.height / 2 + Math.sin(angle) * 100;

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: Math.random() * 60 + 40,
          size: Math.random() * 3 + 1,
        });
      }
    };

    const draw = () => {
      // Semi-transparent fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let pulseIntensity = 0;
      let glowIntensity = 0;
      let particleEmissionRate = 0;
      let useRainbow = false;
      let waveIntensity = 0;

      // State-dependent parameters
      switch (state) {
        case "booting":
          pulseIntensity = 0.3;
          glowIntensity = 0.4;
          particleEmissionRate = 3;
          waveIntensity = 0.2;
          break;
        case "idle":
          pulseIntensity = 0.05;
          glowIntensity = 0.15;
          particleEmissionRate = 0.5;
          waveIntensity = 0.05;
          break;
        case "processing":
          pulseIntensity = 0.25;
          glowIntensity = 0.6;
          particleEmissionRate = 5;
          useRainbow = true;
          waveIntensity = 0.4;
          break;
        case "speaking":
          pulseIntensity = 0.2;
          glowIntensity = 0.7;
          particleEmissionRate = 4;
          waveIntensity = 0.3;
          break;
      }

      // Create expanding energy waves
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        const waveRadius = ((frame * 2 + w * 60) % 800) + 50;
        const waveAlpha = Math.max(0, 1 - (waveRadius - 50) / 750);

        if (useRainbow) {
          const colorIndex = (frame / 10 + w) % rainbowColors.length;
          const color = rainbowColors[Math.floor(colorIndex)];
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${waveAlpha * waveIntensity * 0.3})`;
        } else {
          ctx.strokeStyle = `rgba(34, 197, 94, ${waveAlpha * waveIntensity * 0.2})`;
        }

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw radial energy beams
      const beamCount = 8;
      const pulse = Math.sin(frame * 0.05) * pulseIntensity;

      for (let b = 0; b < beamCount; b++) {
        const angle = (b * Math.PI * 2) / beamCount;
        const beamLength = 300 + pulse * 200;

        const gradient = ctx.createLinearGradient(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2 + Math.cos(angle) * beamLength,
          canvas.height / 2 + Math.sin(angle) * beamLength
        );

        if (useRainbow) {
          const colorIndex = (frame / 8 + b) % rainbowColors.length;
          const color = rainbowColors[Math.floor(colorIndex)];
          gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowIntensity * 0.4})`);
          gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowIntensity * 0.15})`);
          gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        } else {
          gradient.addColorStop(0, `rgba(34, 197, 94, ${glowIntensity * 0.3})`);
          gradient.addColorStop(0.5, `rgba(34, 197, 94, ${glowIntensity * 0.1})`);
          gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(
          canvas.width / 2 + Math.cos(angle) * beamLength,
          canvas.height / 2 + Math.sin(angle) * beamLength
        );
        ctx.lineTo(
          canvas.width / 2 + Math.cos(angle + 0.1) * beamLength * 0.8,
          canvas.height / 2 + Math.sin(angle + 0.1) * beamLength * 0.8
        );
        ctx.closePath();
        ctx.fill();
      }

      // Emit particles based on state
      if (Math.random() < particleEmissionRate / 100) {
        createParticles(1, useRainbow);
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeRatio = p.life / p.maxLife;
        const alpha = Math.max(0, 1 - lifeRatio) * glowIntensity;

        if (useRainbow) {
          const colorIndex = (frame / 5 + i) % rainbowColors.length;
          const color = rainbowColors[Math.floor(colorIndex)];
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.6})`;
        } else {
          ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.4})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - lifeRatio), 0, Math.PI * 2);
        ctx.fill();

        // Remove dead particles
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // Draw central glow
      const centralGlowRadius = 200 + pulse * 100;
      const centralGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        centralGlowRadius
      );

      if (useRainbow) {
        const colorIndex = Math.floor((frame / 10) % rainbowColors.length);
        const color = rainbowColors[colorIndex];
        centralGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowIntensity * 0.3})`);
        centralGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowIntensity * 0.1})`);
        centralGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      } else {
        centralGradient.addColorStop(0, `rgba(34, 197, 94, ${glowIntensity * 0.2})`);
        centralGradient.addColorStop(0.5, `rgba(34, 197, 94, ${glowIntensity * 0.05})`);
        centralGradient.addColorStop(1, "rgba(34, 197, 94, 0)");
      }

      ctx.fillStyle = centralGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      frame++;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        mixBlendMode: "screen",
      }}
    />
  );
}
