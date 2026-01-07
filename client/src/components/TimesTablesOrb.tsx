import { useEffect, useRef, useState } from "react";

interface TimesTablesOrbProps {
  size?: number;
  multiplier?: number;
  speed?: number;
  points?: number;
  className?: string;
}

export function TimesTablesOrb({
  size = 300,
  multiplier: initialMultiplier = 1,
  speed: initialSpeed = 0.008,
  points: initialPoints = 160,
  className = ""
}: TimesTablesOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [multiplier, setMultiplier] = useState(initialMultiplier);
  const [speed, setSpeed] = useState(initialSpeed);
  const [points, setPoints] = useState(initialPoints);
  const animationRef = useRef<number | undefined>(undefined);

  const distance = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const map = (value: number, minA: number, maxA: number, minB: number, maxB: number) =>
    (1 - (value - minA) / (maxA - minA)) * minB + ((value - minA) / (maxA - minA)) * maxB;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sizeHalf = Math.floor(size * 0.5);
    const pointR = 2;
    const radius = Math.floor((size - pointR * 2 - 2) * 0.5);

    canvas.width = size;
    canvas.height = size;

    const line = (c: any, hue: number, alpha: number) => {
      ctx.strokeStyle = `hsla(${hue}, 100%, 85%, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x2, c.y2);
      ctx.stroke();
    };

    const circle = (c: any, color: string = "#fff") => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    const calculateCoordinates = (fraction: number) => {
      const calculateCoordinate = (value: number) => Math.sin(value) * radius + sizeHalf;
      const calculateX = (value: number) => calculateCoordinate(value - Math.PI * 0.5);
      const calculateY = (value: number) => calculateCoordinate(value);
      return {
        x: calculateX(fraction),
        y: calculateY(fraction),
        x2: calculateX(fraction * multiplier),
        y2: calculateY(fraction * multiplier)
      };
    };

    const drawGraph = () => {
      const numberOfPoints = points;
      let currentMultiplier = multiplier;
      currentMultiplier >= 999 ? (currentMultiplier = 0) : (currentMultiplier += speed);
      setMultiplier(currentMultiplier);

      const hue = currentMultiplier * 100 % 360;

      ctx.clearRect(0, 0, size, size);
      circle({ x: sizeHalf, y: sizeHalf, radius }, "#333");

      for (let i = 0; i < numberOfPoints; i++) {
        const { x, y, x2, y2 } = calculateCoordinates((Math.PI * 2 / numberOfPoints) * i);
        const mapA = map(distance(x, y, x2, y2), 0, radius * 1.73, 1, 0.25);
        const alpha = mapA > 1 ? 1 : +mapA.toFixed(2);

        circle({ x, y, radius: pointR });
        line({ x, y, x2, y2 }, hue, alpha);
      }

      animationRef.current = requestAnimationFrame(drawGraph);
    };

    animationRef.current = requestAnimationFrame(drawGraph);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, multiplier, speed, points]);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-primary/30 rounded-lg"
        style={{
          width: size,
          height: size,
          maxWidth: "100%"
        }}
      />

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Speed: {speed.toFixed(4)}</label>
          <input
            type="range"
            min="0"
            max="0.02"
            step="0.0001"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Points: {points}</label>
          <input
            type="range"
            min="2"
            max="200"
            step="1"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Multiplier: {multiplier.toFixed(2)}</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMultiplier((m) => m + 1)}
              className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
            >
              +1
            </button>
            <button
              onClick={() => setMultiplier((m) => m + 10)}
              className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
            >
              +10
            </button>
            <button
              onClick={() => setMultiplier(0)}
              className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
