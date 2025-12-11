import { useEffect, useRef } from "react";

export type OrielOrbState = "idle" | "booting" | "processing" | "speaking";

interface OrielOrbProps {
  state: OrielOrbState;
}

export default function OrielOrb({ state }: OrielOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    let animationId: number;
    let time = 0;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw based on state
      if (state === "booting") {
        // Booting: expanding rings
        const expandRate = 2;
        const maxRadius = 150;
        const radius = (time * expandRate) % maxRadius;

        ctx.strokeStyle = `rgba(34, 197, 94, ${1 - radius / maxRadius})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Core glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (state === "idle") {
        // Idle: pulsating orb
        const pulseRadius = 60 + Math.sin(time * 0.05) * 10;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.9)");
        gradient.addColorStop(0.7, "rgba(34, 197, 94, 0.4)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Rotating rings
        ctx.strokeStyle = `rgba(34, 197, 94, 0.5)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const ringRadius = 40 + i * 20;
          const rotation = (time * 0.02 + (i * Math.PI) / 3) % (Math.PI * 2);
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(rotation);
          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      } else if (state === "processing") {
        // Processing: intense pulsation with color shift
        const pulseRadius = 50 + Math.sin(time * 0.1) * 20;
        const hue = (time * 2) % 360;

        // Multi-color gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
        gradient.addColorStop(0, `hsl(${hue}, 100%, 60%)`);
        gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 0.5)`);
        gradient.addColorStop(1, "rgba(138, 43, 226, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Fast rotating rings
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = `hsla(${hue + i * 90}, 100%, 50%, 0.6)`;
          ctx.lineWidth = 2;
          const ringRadius = 30 + i * 15;
          const rotation = (time * 0.05 + (i * Math.PI) / 2) % (Math.PI * 2);
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(rotation);
          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Particle effects
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + time * 0.03;
          const distance = 70 + Math.sin(time * 0.05 + i) * 20;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (state === "speaking") {
        // Speaking: organic wave-like pulsation
        const baseRadius = 60;
        const waveAmplitude = 15;

        // Draw wavy orb
        ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
        ctx.beginPath();

        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
          const wave = Math.sin(angle * 4 + time * 0.1) * waveAmplitude;
          const radius = baseRadius + wave + Math.sin(time * 0.03) * 5;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          if (angle === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius + 20);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.3)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Sound wave visualization
        ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const waveRadius = baseRadius + 30 + i * 20;
          const wavePhase = (time * 0.04 + i * 0.5) % (Math.PI * 2);
          ctx.beginPath();
          for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
            const wave = Math.sin(angle * 3 + wavePhase) * 5;
            const radius = waveRadius + wave;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (angle === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      time++;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
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
          paddingTop: '40px',
          paddingRight: '40px',
          paddingBottom: '40px',
          paddingLeft: '40px',
          width: '450px',
          height: '450px',
        }}
      />
    </div>
  );
}
