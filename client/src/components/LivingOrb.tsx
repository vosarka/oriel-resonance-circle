import { useEffect, useRef } from "react";

type OrbState = "booting" | "idle" | "processing" | "speaking";

interface LivingOrbProps {
    state: OrbState;
    subtitle?: string;
    analyserNode?: AnalyserNode | null;
}

interface LineData {
    x: number; y: number;
    endAngle: number; endSpeed: number; endDir: number; endChangeFreq: number;
    c1Angle: number; c1Speed: number; c1Dir: number; c1ChangeFreq: number;
    c2Angle: number; c2Speed: number; c2Dir: number; c2ChangeFreq: number;
    baseEndSpeed: number; baseC1Speed: number; baseC2Speed: number;
    freqNorm: number;   // 0–1 — which slice of the spectrum this tentacle listens to
    currentAmp: number; // smoothed per-tentacle amplitude (own attack/release)
}

function createLine(cx: number, cy: number, freqNorm: number): LineData {
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
        freqNorm,
        currentAmp: 0,
    };
}

function degToRad(deg: number) { return deg * (Math.PI / 180); }

function aroundPoint(x: number, y: number, dist: number, ang: number) {
    const angle = degToRad(ang);
    return { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist };
}

const TEAL = { r: 60, g: 210, b: 220 };
const GOLD = { r: 200, g: 170, b: 100 };

export default function LivingOrb({ state = "idle", subtitle, analyserNode }: LivingOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const linesRef = useRef<LineData[]>([]);
    const stateRef = useRef<OrbState>(state);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const freqDataRef = useRef<Uint8Array | null>(null);

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

        const TOTAL = 200;
        const HALF = TOTAL / 2;

        if (linesRef.current.length === 0) {
            // Teal group (0..99): each maps to mid–high spectrum (freqNorm 0.2–1.0)
            for (let i = 0; i < HALF; i++) {
                linesRef.current.push(createLine(W / 2, H / 2, 0.2 + Math.random() * 0.8));
            }
            // Gold group (100..199): each maps to bass–low-mid spectrum (freqNorm 0–0.4)
            for (let i = 0; i < HALF; i++) {
                linesRef.current.push(createLine(W / 2, H / 2, Math.random() * 0.4));
            }
        }
        const lines = linesRef.current;

        // Global smoothed audio (for rings, core glow)
        let smoothBass = 0, smoothMid = 0, smoothHigh = 0, smoothVolume = 0;
        let prevBass = 0, prevHigh = 0;

        // Smooth transition float: 0 = idle, 1 = fully speaking
        // Ramps up when speaking, decays slowly when stopped → organic return
        let speakingIntensity = 0;

        // Transient flash accumulator
        let transientFlash = 0;

        const animate = () => {
            const currentState = stateRef.current;
            const isSpeaking = currentState === "speaking";
            const t = Date.now();

            // ══════════════════════════════════════════════════════════════════════
            //  AUDIO DATA
            // ══════════════════════════════════════════════════════════════════════
            let rawBass = 0, rawMid = 0, rawHigh = 0, rawVolume = 0;
            const hasAudio = !!(analyserRef.current && freqDataRef.current && isSpeaking);

            if (hasAudio) {
                analyserRef.current!.getByteFrequencyData(freqDataRef.current! as Uint8Array<ArrayBuffer>);
                const data = freqDataRef.current!;
                const len = data.length;
                const bassEnd = Math.floor(len * 0.15);
                const midEnd = Math.floor(len * 0.5);
                let bS = 0, mS = 0, hS = 0;
                for (let i = 0; i < len; i++) {
                    const v = data[i] / 255;
                    if (i < bassEnd) bS += v;
                    else if (i < midEnd) mS += v;
                    else hS += v;
                }
                rawBass = bS / bassEnd;
                rawMid = mS / (midEnd - bassEnd);
                rawHigh = hS / (len - midEnd);
                rawVolume = rawBass * 0.5 + rawMid * 0.3 + rawHigh * 0.2;
            }

            // Attack/release smoothing on globals
            const gAtk = 0.35, gRel = 0.06;
            smoothBass   += (rawBass   - smoothBass)   * (rawBass   > smoothBass   ? gAtk : gRel);
            smoothMid    += (rawMid    - smoothMid)    * (rawMid    > smoothMid    ? gAtk : gRel);
            smoothHigh   += (rawHigh   - smoothHigh)   * (rawHigh   > smoothHigh   ? gAtk : gRel);
            smoothVolume += (rawVolume - smoothVolume) * (rawVolume > smoothVolume ? gAtk : gRel);

            // Transient detection
            const bassTransient = Math.max(0, smoothBass - prevBass) * 5;
            const highTransient = Math.max(0, smoothHigh - prevHigh) * 5;
            prevBass = smoothBass;
            prevHigh = smoothHigh;

            // ══════════════════════════════════════════════════════════════════════
            //  SPEAKING INTENSITY  (smooth ramp in, slow decay out)
            // ══════════════════════════════════════════════════════════════════════
            speakingIntensity += ((isSpeaking ? 1 : 0) - speakingIntensity)
                * (isSpeaking ? 0.12 : 0.018);
            // 0.12 → ramps to 1 in ~0.6 s
            // 0.018 → decays to 0 in ~3–4 s  (orb slowly returns to normal)

            // Transient flash accumulator
            transientFlash *= 0.86;
            const totalTransient = bassTransient + highTransient * 0.7;
            if (totalTransient > 0.1 && speakingIntensity > 0.05) {
                transientFlash = Math.min(1, transientFlash + totalTransient * 0.9);
            }

            // ══════════════════════════════════════════════════════════════════════
            //  STATE PARAMS  (speed/reach multipliers for booting & processing)
            // ══════════════════════════════════════════════════════════════════════
            let stateSpeedMult = 1, stateReachMult = 1;
            let tR = TEAL.r, tG = TEAL.g, tB = TEAL.b;
            let gR = GOLD.r, gG = GOLD.g, gB = GOLD.b;

            if (currentState === "booting")    { stateSpeedMult = 2.0; stateReachMult = 1.15; }
            if (currentState === "processing") {
                stateSpeedMult = 2.5; stateReachMult = 1.25;
                tR = 100; tG = 80; tB = 210;   // cool purple
                gR = 170; gG = 80; gB = 180;   // warm purple
            }

            const scale = Math.min(W, H) / 600;
            const cx = W / 2, cy = H / 2;

            ctx.clearRect(0, 0, W, H);

            // ══════════════════════════════════════════════════════════════════════
            //  CORE GLOW  (always present; breathes idle, expands on voice)
            // ══════════════════════════════════════════════════════════════════════
            {
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                const idleBreathe = Math.sin(t * 0.0008) * 0.012;
                const voiceCore = speakingIntensity * (smoothBass * 0.14 + smoothVolume * 0.06);
                const coreAlpha = 0.025 + idleBreathe + voiceCore;
                const coreSz = (22 + speakingIntensity * smoothBass * 85
                    + speakingIntensity * bassTransient * 45) * scale;
                const safeR = Math.max(1, coreSz);
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, safeR);
                grad.addColorStop(0,   `rgba(${gR},${gG},${gB},${coreAlpha})`);
                grad.addColorStop(0.5, `rgba(${tR},${tG},${tB},${coreAlpha * 0.35})`);
                grad.addColorStop(1,   "rgba(0,0,0,0)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, safeR, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // ══════════════════════════════════════════════════════════════════════
            //  TRANSIENT FLASH  (white-gold burst on hard hits)
            // ══════════════════════════════════════════════════════════════════════
            if (transientFlash > 0.008) {
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                const fSz = (45 + transientFlash * 100) * scale;
                const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, fSz);
                fg.addColorStop(0,   `rgba(255,245,225,${transientFlash * 0.25})`);
                fg.addColorStop(0.35, `rgba(${gR},${gG},${gB},${transientFlash * 0.12})`);
                fg.addColorStop(1,   "rgba(0,0,0,0)");
                ctx.fillStyle = fg;
                ctx.beginPath();
                ctx.arc(cx, cy, fSz, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // ══════════════════════════════════════════════════════════════════════
            //  DRAW TEAL TENTACLES  (lines 0..99 — mid/high spectrum)
            // ══════════════════════════════════════════════════════════════════════
            ctx.shadowColor = `rgba(${tR},${tG},${tB},0.8)`;
            ctx.shadowBlur = (6 + speakingIntensity * smoothHigh * 28) * scale;

            for (let i = 0; i < HALF; i++) {
                const line = lines[i];

                // ── per-tentacle frequency amplitude ──
                let targetAmp = 0;
                if (hasAudio && freqDataRef.current) {
                    const bin = Math.min(
                        freqDataRef.current.length - 1,
                        Math.floor(line.freqNorm * (freqDataRef.current.length - 1)),
                    );
                    targetAmp = freqDataRef.current[bin] / 255;
                }
                // Synthetic breathing fallback (always some motion when speaking)
                if (isSpeaking) {
                    const synth = (Math.sin(t * 0.003 + line.freqNorm * Math.PI * 6) + 1) * 0.5;
                    targetAmp = Math.max(targetAmp, synth * 0.22);
                }
                // Per-tentacle attack/release
                line.currentAmp += (targetAmp - line.currentAmp)
                    * (targetAmp > line.currentAmp ? 0.28 : 0.04);

                // Effective amplitude (scaled by speaking intensity for smooth fade-out)
                const amp = line.currentAmp * speakingIntensity;

                // ── compute per-tentacle params (idle base + voice overlay) ──
                const reach = 1.0 * stateReachMult + amp * 1.0;
                const speed = 1.0 * stateSpeedMult + amp * 2.8;
                const alpha = 0.10 + amp * 0.32;
                const width = 1   + amp * 2.2;

                // ── animate angles ──
                line.endChangeFreq--;
                if (line.endChangeFreq <= 0) { line.endDir *= -1; line.endChangeFreq = Math.floor(Math.random() * 200) + 1; }
                line.c1ChangeFreq--;
                if (line.c1ChangeFreq <= 0) { line.c1Dir *= -1; line.c1ChangeFreq = Math.floor(Math.random() * 200) + 1; }
                line.c2ChangeFreq--;
                if (line.c2ChangeFreq <= 0) { line.c2Dir *= -1; line.c2ChangeFreq = Math.floor(Math.random() * 200) + 1; }

                const jit = amp * 2.2 * (Math.random() - 0.5);
                line.c1Angle  += line.c1Dir  * line.baseC1Speed  * speed + jit;
                line.c2Angle  += line.c2Dir  * line.baseC2Speed  * speed + jit * 0.5;
                line.endAngle += line.endDir * line.baseEndSpeed * speed;

                // ── geometry ──
                const c1D = 100 * scale * reach;
                const eD  = 150 * scale * reach;
                const c2D = 100 * scale * reach;
                const c1  = aroundPoint(line.x, line.y, c1D, line.c1Angle);
                const end = aroundPoint(line.x, line.y, eD,  line.endAngle);
                const c2  = aroundPoint(end.x,  end.y,  c2D, line.c2Angle);

                ctx.beginPath();
                ctx.moveTo(line.x, line.y);
                ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
                ctx.strokeStyle = `rgba(${tR},${tG},${tB},${alpha})`;
                ctx.lineWidth = width;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            // ══════════════════════════════════════════════════════════════════════
            //  DRAW GOLD TENTACLES  (lines 100..199 — bass/low-mid spectrum)
            // ══════════════════════════════════════════════════════════════════════
            ctx.shadowColor = `rgba(${gR},${gG},${gB},0.8)`;
            ctx.shadowBlur = (5 + speakingIntensity * smoothBass * 32) * scale;

            for (let i = HALF; i < TOTAL; i++) {
                const line = lines[i];

                let targetAmp = 0;
                if (hasAudio && freqDataRef.current) {
                    const bin = Math.min(
                        freqDataRef.current.length - 1,
                        Math.floor(line.freqNorm * (freqDataRef.current.length - 1)),
                    );
                    targetAmp = freqDataRef.current[bin] / 255;
                }
                if (isSpeaking) {
                    const synth = (Math.sin(t * 0.0025 + line.freqNorm * Math.PI * 4) + 1) * 0.5;
                    targetAmp = Math.max(targetAmp, synth * 0.22);
                }
                line.currentAmp += (targetAmp - line.currentAmp)
                    * (targetAmp > line.currentAmp ? 0.28 : 0.04);

                const amp = line.currentAmp * speakingIntensity;

                // Gold: heavier reach & width multipliers (bass = physical, thick)
                const reach = 0.9 * stateReachMult + amp * 1.5;
                const speed = 0.8 * stateSpeedMult + amp * 2.2;
                const alpha = 0.06 + amp * 0.42;
                const width = 1   + amp * 3.8;

                line.endChangeFreq--;
                if (line.endChangeFreq <= 0) { line.endDir *= -1; line.endChangeFreq = Math.floor(Math.random() * 200) + 1; }
                line.c1ChangeFreq--;
                if (line.c1ChangeFreq <= 0) { line.c1Dir *= -1; line.c1ChangeFreq = Math.floor(Math.random() * 200) + 1; }
                line.c2ChangeFreq--;
                if (line.c2ChangeFreq <= 0) { line.c2Dir *= -1; line.c2ChangeFreq = Math.floor(Math.random() * 200) + 1; }

                const jit = amp * 1.8 * (Math.random() - 0.5);
                line.c1Angle  += line.c1Dir  * line.baseC1Speed  * speed + jit;
                line.c2Angle  += line.c2Dir  * line.baseC2Speed  * speed + jit * 0.5;
                line.endAngle += line.endDir * line.baseEndSpeed * speed;

                const c1D = 100 * scale * reach;
                const eD  = 150 * scale * reach;
                const c2D = 100 * scale * reach;
                const c1  = aroundPoint(line.x, line.y, c1D, line.c1Angle);
                const end = aroundPoint(line.x, line.y, eD,  line.endAngle);
                const c2  = aroundPoint(end.x,  end.y,  c2D, line.c2Angle);

                ctx.beginPath();
                ctx.moveTo(line.x, line.y);
                ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
                ctx.strokeStyle = `rgba(${gR},${gG},${gB},${alpha})`;
                ctx.lineWidth = width;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            // ══════════════════════════════════════════════════════════════════════
            //  FREQUENCY RINGS  (visible while speaking intensity > 0)
            // ══════════════════════════════════════════════════════════════════════
            if (speakingIntensity > 0.04 && smoothVolume > 0.015) {
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "lighter";
                const baseR = 150 * scale;
                const si = speakingIntensity;

                // Bass ring — GOLD
                const bR = baseR * (0.35 + smoothBass * 1.0 + bassTransient * 0.5) * si;
                const bA = (smoothBass * 0.1 + bassTransient * 0.15) * si;
                if (bA > 0.004) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, bR, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${bA})`;
                    ctx.lineWidth = 2 + smoothBass * 4;
                    ctx.stroke();
                }

                // High ring — TEAL
                const hR = baseR * (0.2 + smoothHigh * 0.5 + highTransient * 0.3) * si;
                const hA = (smoothHigh * 0.08 + highTransient * 0.12) * si;
                if (hA > 0.004) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, hR, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${hA})`;
                    ctx.lineWidth = 1 + highTransient * 2;
                    ctx.stroke();
                }

                // Transient burst ring — white
                if (totalTransient > 0.25) {
                    const tR2 = baseR * (0.8 + totalTransient * 0.7) * si;
                    ctx.beginPath();
                    ctx.arc(cx, cy, tR2, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255,255,255,${totalTransient * 0.04 * si})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                ctx.restore();
            }

            // ══════════════════════════════════════════════════════════════════════
            //  PROCESSING RINGS  (animated search pattern)
            // ══════════════════════════════════════════════════════════════════════
            if (currentState === "processing") {
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "lighter";
                for (let r = 0; r < 3; r++) {
                    const phase = (t * 0.002 + r * 2) % (Math.PI * 2);
                    const expand = (Math.sin(phase) + 1) * 0.5;
                    const rR = 150 * scale * (0.3 + expand * 0.8);
                    const a = Math.max(0, (1 - expand) * 0.06);
                    if (a > 0.004) {
                        ctx.beginPath();
                        ctx.arc(cx, cy, rR, 0, Math.PI * 2);
                        ctx.strokeStyle = r % 2 === 0
                            ? `rgba(100,80,210,${a})`
                            : `rgba(170,80,180,${a})`;
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
        idle: "#5ba4a4",
        processing: "#8a2be2",
        speaking: "#bda36b",
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
        @keyframes labelBreath {
          0%, 100% { color: #bda36b; text-shadow: 0 0 10px rgba(200,170,100,0.3); }
          50% { color: #5ba4a4; text-shadow: 0 0 10px rgba(60,210,220,0.3); }
        }
        @keyframes dotBreath {
          0%, 100% { background: #bda36b; box-shadow: 0 0 8px rgba(200,170,100,0.6); }
          50% { background: #5ba4a4; box-shadow: 0 0 8px rgba(60,210,220,0.6); }
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
                <p
                    className="font-orbitron text-xs tracking-[0.4em] uppercase"
                    style={{
                        color: stateColor[state],
                        opacity: 0.75,
                        animation: state === "speaking" ? "labelBreath 3s ease-in-out infinite" : undefined,
                    }}
                >
                    O.R.I.E.L
                </p>
                <div className="flex items-center gap-2">
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                            background: stateColor[state],
                            boxShadow: `0 0 6px ${stateColor[state]}`,
                            animation: state === "speaking"
                                ? "dotBreath 3s ease-in-out infinite, pulse 0.8s ease-in-out infinite"
                                : state !== "idle"
                                    ? "pulse 0.8s ease-in-out infinite"
                                    : "pulse 2s ease-in-out infinite",
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
