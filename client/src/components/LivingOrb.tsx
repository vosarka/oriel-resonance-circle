import { useEffect, useRef } from "react";

type OrbState = "booting" | "idle" | "processing" | "speaking";

interface LivingOrbProps {
    state: OrbState;
    subtitle?: string;
    analyserNode?: AnalyserNode | null;
}

// --- Tentacle line data ---
interface LineData {
    x: number;
    y: number;
    endAngle: number;
    endSpeed: number;
    endDir: number;
    endChangeFreq: number;
    c1Angle: number;
    c1Speed: number;
    c1Dir: number;
    c1ChangeFreq: number;
    c2Angle: number;
    c2Speed: number;
    c2Dir: number;
    c2ChangeFreq: number;
    baseEndSpeed: number;
    baseC1Speed: number;
    baseC2Speed: number;
}

function createLine(cx: number, cy: number): LineData {
    const endSpeed = (Math.floor(Math.random() * 10) + 1) / 50;
    const c1Speed = (Math.floor(Math.random() * 10) + 1) / 20;
    const c2Speed = (Math.floor(Math.random() * 10) + 1) / 20;
    return {
        x: cx, y: cy,
        endAngle: Math.floor(Math.random() * 360),
        endSpeed, endDir: Math.random() < 0.5 ? -1 : 1,
        endChangeFreq: Math.floor(Math.random() * 200) + 1,
        c1Angle: Math.floor(Math.random() * 360),
        c1Speed, c1Dir: Math.random() < 0.5 ? -1 : 1,
        c1ChangeFreq: Math.floor(Math.random() * 200) + 1,
        c2Angle: Math.floor(Math.random() * 360),
        c2Speed, c2Dir: Math.random() < 0.5 ? -1 : 1,
        c2ChangeFreq: Math.floor(Math.random() * 200) + 1,
        baseEndSpeed: endSpeed, baseC1Speed: c1Speed, baseC2Speed: c2Speed,
    };
}

function degToRad(deg: number) { return deg * (Math.PI / 180); }

function aroundPoint(x: number, y: number, dist: number, ang: number) {
    const angle = degToRad(ang);
    return { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist };
}

export default function LivingOrb({ state = "idle", subtitle, analyserNode }: LivingOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const linesRef = useRef<LineData[]>([]);
    const stateRef = useRef<OrbState>(state);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const freqDataRef = useRef<Uint8Array | null>(null);

    // Keep refs in sync
    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => {
        analyserRef.current = analyserNode || null;
        if (analyserNode) {
            freqDataRef.current = new Uint8Array(analyserNode.frequencyBinCount);
        }
    }, [analyserNode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let W = container.clientWidth;
        let H = container.clientHeight;

        const resize = () => {
            W = container.clientWidth;
            H = container.clientHeight;
            canvas.width = W;
            canvas.height = H;
            const cx = W / 2, cy = H / 2;
            for (const line of linesRef.current) { line.x = cx; line.y = cy; }
        };
        resize();
        window.addEventListener("resize", resize);

        // Initialize tentacles
        const TOTAL = 200;
        if (linesRef.current.length === 0) {
            for (let i = 0; i < TOTAL; i++) {
                linesRef.current.push(createLine(W / 2, H / 2));
            }
        }
        const lines = linesRef.current;

        // Smoothed audio values for organic feel
        let smoothBass = 0;
        let smoothMid = 0;
        let smoothHigh = 0;
        let smoothVolume = 0;

        const animate = () => {
            const currentState = stateRef.current;

            // === READ AUDIO DATA ===
            let rawBass = 0, rawMid = 0, rawHigh = 0, rawVolume = 0;

            if (analyserRef.current && freqDataRef.current && currentState === "speaking") {
                analyserRef.current.getByteFrequencyData(freqDataRef.current as Uint8Array<ArrayBuffer>);
                const data = freqDataRef.current;
                const len = data.length;

                // Split into bass (0-15%), mid (15-50%), high (50-100%)
                const bassEnd = Math.floor(len * 0.15);
                const midEnd = Math.floor(len * 0.5);

                let bassSum = 0, midSum = 0, highSum = 0;
                for (let i = 0; i < len; i++) {
                    const v = data[i] / 255;
                    if (i < bassEnd) bassSum += v;
                    else if (i < midEnd) midSum += v;
                    else highSum += v;
                }
                rawBass = bassSum / bassEnd;
                rawMid = midSum / (midEnd - bassEnd);
                rawHigh = highSum / (len - midEnd);
                rawVolume = (rawBass + rawMid + rawHigh) / 3;
            }

            // Smooth values (lerp toward target for organic feel)
            const smoothing = 0.15;
            smoothBass += (rawBass - smoothBass) * smoothing;
            smoothMid += (rawMid - smoothMid) * smoothing;
            smoothHigh += (rawHigh - smoothHigh) * smoothing;
            smoothVolume += (rawVolume - smoothVolume) * smoothing;

            // === STATE PARAMS ===
            let baseSpeedMult = 1;
            let baseReach = 1;
            let glowColor = "rgba(43, 205, 255, 1)";
            let lineColor = "rgba(43, 205, 255, .1)";
            let baseGlowBlur = 10;

            switch (currentState) {
                case "booting":
                    baseSpeedMult = 2.0; baseReach = 1.2;
                    glowColor = "rgba(43, 205, 255, 1)";
                    lineColor = "rgba(43, 205, 255, .15)";
                    baseGlowBlur = 15;
                    break;
                case "idle":
                    baseSpeedMult = 1; baseReach = 1;
                    glowColor = "rgba(43, 205, 255, 1)";
                    lineColor = "rgba(43, 205, 255, .1)";
                    baseGlowBlur = 10;
                    break;
                case "processing":
                    baseSpeedMult = 2.5; baseReach = 1.3;
                    glowColor = "rgba(138, 43, 226, 1)";
                    lineColor = "rgba(138, 43, 226, .12)";
                    baseGlowBlur = 18;
                    break;
                case "speaking":
                    // Audio-reactive: modulate based on voice
                    baseSpeedMult = 1.2 + smoothVolume * 2.5;    // speed up with volume
                    baseReach = 1.0 + smoothBass * 0.8;           // bass drives reach
                    baseGlowBlur = 10 + smoothVolume * 25;        // louder = more glow

                    // Dynamic line color — brighter with volume
                    const alpha = 0.08 + smoothVolume * 0.18;
                    const g = Math.round(205 + smoothHigh * 50);  // higher freq = greener tint
                    lineColor = `rgba(43, ${g}, 255, ${alpha})`;
                    glowColor = `rgba(43, ${g}, 255, 1)`;
                    break;
            }

            const scale = Math.min(W, H) / 600;

            // Audio-reactive reach modulation — bass makes tentacles expand, mid adds wobble
            const audioReach = currentState === "speaking"
                ? 1 + smoothBass * 0.5 + Math.sin(Date.now() * 0.005) * smoothMid * 0.15
                : 1;

            const effectiveReach = baseReach * audioReach;
            const c1Dist = 100 * scale * effectiveReach;
            const endDist = 150 * scale * effectiveReach;
            const c2Dist = 100 * scale * effectiveReach;

            ctx.clearRect(0, 0, W, H);
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = baseGlowBlur * scale;

            // === DRAW TENTACLES ===
            for (const line of lines) {
                line.endChangeFreq--;
                if (line.endChangeFreq <= 0) { line.endDir *= -1; line.endChangeFreq = Math.floor(Math.random() * 200) + 1; }
                line.c1ChangeFreq--;
                if (line.c1ChangeFreq <= 0) { line.c1Dir *= -1; line.c1ChangeFreq = Math.floor(Math.random() * 200) + 1; }
                line.c2ChangeFreq--;
                if (line.c2ChangeFreq <= 0) { line.c2Dir *= -1; line.c2ChangeFreq = Math.floor(Math.random() * 200) + 1; }

                // Audio-reactive speed: high freq adds jitter to control points
                const highJitter = currentState === "speaking" ? smoothHigh * 1.5 : 0;

                line.c1Angle += line.c1Dir * line.baseC1Speed * baseSpeedMult + highJitter * (Math.random() - 0.5);
                line.c2Angle += line.c2Dir * line.baseC2Speed * baseSpeedMult + highJitter * (Math.random() - 0.5);
                line.endAngle += line.endDir * line.baseEndSpeed * baseSpeedMult;

                const c1 = aroundPoint(line.x, line.y, c1Dist, line.c1Angle);
                const end = aroundPoint(line.x, line.y, endDist, line.endAngle);
                const c2 = aroundPoint(end.x, end.y, c2Dist, line.c2Angle);

                ctx.beginPath();
                ctx.moveTo(line.x, line.y);
                ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 1;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            // === AUDIO-REACTIVE PULSE RINGS (when speaking) ===
            if (currentState === "speaking" && smoothVolume > 0.02) {
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "lighter";
                const cx = W / 2, cy = H / 2;

                // Bass ring — big, slow
                const bassR = endDist * (0.4 + smoothBass * 0.9);
                const bassAlpha = smoothBass * 0.08;
                if (bassAlpha > 0.005) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, bassR, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(43, 230, 255, ${bassAlpha})`;
                    ctx.lineWidth = 2 + smoothBass * 3;
                    ctx.stroke();
                }

                // Mid ring
                const midR = endDist * (0.3 + smoothMid * 0.6);
                const midAlpha = smoothMid * 0.06;
                if (midAlpha > 0.005) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, midR, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(43, 255, 230, ${midAlpha})`;
                    ctx.lineWidth = 1 + smoothMid * 2;
                    ctx.stroke();
                }

                // High ring — tight, fast
                const highR = endDist * (0.2 + smoothHigh * 0.4);
                const highAlpha = smoothHigh * 0.05;
                if (highAlpha > 0.005) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, highR, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(100, 255, 255, ${highAlpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                ctx.restore();
            }

            // === PROCESSING: subtle animated rings ===
            if (currentState === "processing") {
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "lighter";
                const cx = W / 2, cy = H / 2;
                for (let r = 0; r < 3; r++) {
                    const ringPhase = (Date.now() * 0.002 + r * 2) % (Math.PI * 2);
                    const expand = (Math.sin(ringPhase) + 1) * 0.5;
                    const ringR = endDist * (0.3 + expand * 0.8);
                    const alpha = Math.max(0, (1 - expand) * 0.06);
                    if (alpha > 0.005) {
                        ctx.beginPath();
                        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(138, 43, 226, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const stateLabel: Record<OrbState, string> = {
        booting: "INITIALIZING",
        idle: "AWAITING",
        processing: "PROCESSING",
        speaking: "TRANSMITTING",
    };

    const stateColor: Record<OrbState, string> = {
        booting: "#00e5ff",
        idle: "#2bcdff",
        processing: "#8a2be2",
        speaking: "#2bffe6",
    };

    const containerAnim = state === "speaking"
        ? "orbFlickr 2s ease-in-out infinite"
        : state === "processing"
            ? "orbFlickr 3s ease-in-out infinite"
            : "orbFlickr 6s ease-in-out infinite";

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: "transparent" }}>
            <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate3d(0, -5px, 0); }
          50% { transform: translate3d(0, 5px, 0); }
        }
        @keyframes orbFlickr {
          0%, 100% { opacity: 1; transform: translate3d(-3px, 0, 0); }
          25%, 75% { opacity: 1; }
          50% { opacity: 0.7; transform: translate3d(3px, 0, 0); }
        }
      `}</style>

            <div className="absolute inset-0" style={{ animation: containerAnim }}>
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ animation: "orbFloat 10s ease-in-out infinite" }}
                />
            </div>

            {/* Centered labels */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none z-10">
                <p className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: stateColor[state], opacity: 0.75 }}>
                    O.R.I.E.L
                </p>
                <div className="flex items-center gap-2">
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                            background: stateColor[state],
                            boxShadow: `0 0 6px ${stateColor[state]}`,
                            animation: state !== "idle" ? "pulse 0.8s ease-in-out infinite" : "pulse 2s ease-in-out infinite",
                        }}
                    />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: stateColor[state], opacity: 0.6 }}>
                        {stateLabel[state]}
                    </span>
                </div>
            </div>


        </div>
    );
}
