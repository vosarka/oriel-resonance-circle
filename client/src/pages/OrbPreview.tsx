import { useState, useCallback, useRef, useEffect } from "react";
import { Orb, type AgentState } from "@/components/ui/orb";

export default function OrbPreview() {
  const [color1, setColor1] = useState("#affff1");
  const [color2, setColor2] = useState("#9696ff");
  const [agentState, setAgentState] = useState<AgentState>(null);
  const [seed, setSeed] = useState(42);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [bgColor, setBgColor] = useState("#05050a");
  const [orbSize, setOrbSize] = useState(384);
  const [speed, setSpeed] = useState(1);

  // Border controls
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderColor, setBorderColor] = useState("#2a2a35");
  const [borderOpacity, setBorderOpacity] = useState(0.6);
  const [borderGap, setBorderGap] = useState(4);

  // Mic input for live testing
  const [micActive, setMicActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  // Volume refs for Orb
  const inputRef = useRef(inputVolume);
  const outputRef = useRef(outputVolume);
  inputRef.current = inputVolume;
  outputRef.current = outputVolume;

  const getInput = useCallback(() => inputRef.current, []);
  const getOutput = useCallback(() => outputRef.current, []);

  // Mic toggle
  const toggleMic = useCallback(async () => {
    if (micActive) {
      // Stop mic
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      analyserRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setMicActive(false);
      setInputVolume(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setMicActive(true);

      // Pump volume readings
      const data = new Uint8Array(analyser.fftSize);
      const pump = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.min(1, Math.sqrt(sum / data.length) * 3);
        setInputVolume(rms);
        rafRef.current = requestAnimationFrame(pump);
      };
      pump();
    } catch {
      console.error("Mic access denied");
    }
  }, [micActive]);

  // Cleanup mic on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  const [copied, setCopied] = useState(false);

  const config = {
    colors: [color1, color2],
    agentState,
    seed,
    speed,
    inputVolume: +inputVolume.toFixed(2),
    outputVolume: +outputVolume.toFixed(2),
    border: {
      width: borderWidth,
      color: borderColor,
      opacity: borderOpacity,
      gap: borderGap,
    },
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute border style for the orb wrapper
  const borderRgba = (() => {
    const hex = borderColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${borderOpacity})`;
  })();

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0e" }}>
      {/* Orb display area */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: bgColor }}
      >
        <div
          style={{
            width: orbSize + borderGap * 2 + borderWidth * 2,
            height: orbSize + borderGap * 2 + borderWidth * 2,
            borderRadius: "50%",
            border: `${borderWidth}px solid ${borderRgba}`,
            padding: borderGap,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: orbSize, height: orbSize, borderRadius: "50%", overflow: "hidden" }}>
            <Orb
              colors={[color1, color2] as [string, string]}
              agentState={agentState}
              seed={seed}
              speed={speed}
              volumeMode="manual"
              getInputVolume={getInput}
              getOutputVolume={getOutput}
            />
          </div>
        </div>
      </div>

      {/* Controls panel */}
      <div
        className="w-80 overflow-y-auto p-5 flex flex-col gap-4"
        style={{
          background: "#14141c",
          borderLeft: "1px solid rgba(189,163,107,0.12)",
          color: "#e8e4dc",
          fontFamily: "monospace",
          fontSize: 12,
          maxHeight: "100vh",
        }}
      >
        <h2
          style={{
            fontSize: 14,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(0,188,212,0.6)",
            marginBottom: 4,
          }}
        >
          Orb Preview
        </h2>

        {/* Mic Input */}
        <Section title="Live Mic Input">
          <button
            onClick={toggleMic}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: micActive
                ? "1px solid rgba(255,80,80,0.5)"
                : "1px solid rgba(0,229,255,0.3)",
              background: micActive
                ? "rgba(255,80,80,0.1)"
                : "rgba(0,229,255,0.05)",
              color: micActive ? "#ff5050" : "#00e5ff",
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              width: "100%",
            }}
          >
            {micActive ? "Stop Mic" : "Start Mic (test voice)"}
          </button>
          {micActive && (
            <div style={{ marginTop: 4 }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.05)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${inputVolume * 100}%`,
                    background: "linear-gradient(90deg, #00e5ff, #9696ff)",
                    borderRadius: 3,
                    transition: "width 50ms",
                  }}
                />
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                Live input: {inputVolume.toFixed(2)}
              </span>
            </div>
          )}
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <ColorInput label="Color 1" value={color1} onChange={setColor1} />
          <ColorInput label="Color 2" value={color2} onChange={setColor2} />
          <ColorInput label="Background" value={bgColor} onChange={setBgColor} />
        </Section>

        {/* Border */}
        <Section title="Border (outline ring)">
          <ColorInput label="Color" value={borderColor} onChange={setBorderColor} />
          <Slider label="Width" value={borderWidth} onChange={setBorderWidth} min={0} max={8} step={0.5} />
          <Slider label="Opacity" value={borderOpacity} onChange={setBorderOpacity} min={0} max={1} step={0.01} />
          <Slider label="Gap (padding)" value={borderGap} onChange={setBorderGap} min={0} max={20} step={1} />
        </Section>

        {/* Speed */}
        <Section title="Speed">
          <Slider label="Speed multiplier" value={speed} onChange={setSpeed} min={0.05} max={5} step={0.05} />
        </Section>

        {/* Agent State */}
        <Section title="Agent State">
          <div className="flex flex-wrap gap-1">
            {([null, "thinking", "listening", "talking"] as AgentState[]).map(
              (s) => (
                <button
                  key={String(s)}
                  onClick={() => setAgentState(s)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    border:
                      agentState === s
                        ? "1px solid rgba(0,229,255,0.6)"
                        : "1px solid rgba(255,255,255,0.1)",
                    background:
                      agentState === s
                        ? "rgba(0,229,255,0.1)"
                        : "rgba(255,255,255,0.03)",
                    color: agentState === s ? "#00e5ff" : "#e8e4dc",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {s ?? "idle (null)"}
                </button>
              )
            )}
          </div>
        </Section>

        {/* Volume */}
        <Section title="Volume (manual)">
          <Slider
            label="Input Volume"
            value={inputVolume}
            onChange={setInputVolume}
            min={0}
            max={1}
            step={0.01}
          />
          <Slider
            label="Output Volume"
            value={outputVolume}
            onChange={setOutputVolume}
            min={0}
            max={1}
            step={0.01}
          />
        </Section>

        {/* Seed + Size */}
        <Section title="Seed & Size">
          <Slider label="Seed" value={seed} onChange={(v) => setSeed(Math.round(v))} min={0} max={100} step={1} />
          <Slider label="Size (px)" value={orbSize} onChange={(v) => setOrbSize(Math.round(v))} min={100} max={800} step={10} />
        </Section>

        {/* Presets */}
        <Section title="Presets">
          <div className="flex flex-col gap-1">
            <PresetButton
              label="ORIEL Default"
              onClick={() => {
                setColor1("#affff1"); setColor2("#9696ff"); setBgColor("#05050a");
                setBorderColor("#2a2a35"); setBorderWidth(2); setBorderOpacity(0.6); setBorderGap(4);
              }}
            />
            <PresetButton
              label="Teal + Gold"
              onClick={() => {
                setColor1("#3CD2DC"); setColor2("#BDA36B"); setBgColor("#05050a");
              }}
            />
            <PresetButton
              label="Cyan + Indigo"
              onClick={() => {
                setColor1("#00E5FF"); setColor2("#1A0A3A"); setBgColor("#05050a");
              }}
            />
            <PresetButton
              label="No Border"
              onClick={() => {
                setBorderWidth(0); setBorderGap(0);
              }}
            />
            <PresetButton
              label="Thick Border"
              onClick={() => {
                setBorderWidth(4); setBorderColor("#3a3a4a"); setBorderOpacity(0.8); setBorderGap(6);
              }}
            />
          </div>
        </Section>

        {/* Copy config */}
        <button
          onClick={copyConfig}
          style={{
            padding: "10px",
            borderRadius: 6,
            border: "1px solid rgba(0,229,255,0.3)",
            background: copied ? "rgba(0,229,255,0.15)" : "rgba(0,229,255,0.05)",
            color: "#00e5ff",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {copied ? "Copied!" : "Copy Config JSON"}
        </button>

        {/* Live config */}
        <pre
          style={{
            fontSize: 10,
            padding: 10,
            borderRadius: 6,
            background: "rgba(0,0,0,0.3)",
            color: "rgba(0,229,255,0.5)",
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(189,163,107,0.5)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 28, height: 28, border: "none", cursor: "pointer", background: "transparent" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: "4px 8px",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.3)",
          color: "#e8e4dc",
          fontSize: 11,
          fontFamily: "monospace",
        }}
      />
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", minWidth: 60 }}>{label}</span>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <div>
      <div className="flex justify-between" style={{ marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{label}</span>
        <span style={{ fontSize: 10, color: "#00e5ff" }}>{step < 1 ? value.toFixed(2) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#00e5ff" }}
      />
    </div>
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 10px",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        color: "#e8e4dc",
        fontSize: 11,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {label}
    </button>
  );
}
