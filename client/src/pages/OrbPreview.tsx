import { useState, useCallback, useRef } from "react";
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

  const inputRef = useRef(inputVolume);
  const outputRef = useRef(outputVolume);
  inputRef.current = inputVolume;
  outputRef.current = outputVolume;

  const getInput = useCallback(() => inputRef.current, []);
  const getOutput = useCallback(() => outputRef.current, []);

  const [copied, setCopied] = useState(false);

  const config = {
    colors: [color1, color2],
    agentState,
    seed,
    inputVolume,
    outputVolume,
  };

  const copyConfig = () => {
    const text = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0e" }}>
      {/* Orb display area */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: bgColor }}
      >
        <div style={{ width: orbSize, height: orbSize }}>
          <Orb
            colors={[color1, color2] as [string, string]}
            agentState={agentState}
            seed={seed}
            volumeMode="manual"
            getInputVolume={getInput}
            getOutputVolume={getOutput}
          />
        </div>
      </div>

      {/* Controls panel */}
      <div
        className="w-80 overflow-y-auto p-5 flex flex-col gap-5"
        style={{
          background: "#14141c",
          borderLeft: "1px solid rgba(189,163,107,0.12)",
          color: "#e8e4dc",
          fontFamily: "monospace",
          fontSize: 12,
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

        {/* Colors */}
        <Section title="Colors">
          <ColorInput label="Color 1" value={color1} onChange={setColor1} />
          <ColorInput label="Color 2" value={color2} onChange={setColor2} />
          <ColorInput label="Background" value={bgColor} onChange={setBgColor} />
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
        <Section title="Volume (manual mode)">
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

        {/* Seed */}
        <Section title="Seed">
          <Slider
            label="Seed"
            value={seed}
            onChange={(v) => setSeed(Math.round(v))}
            min={0}
            max={100}
            step={1}
          />
        </Section>

        {/* Size */}
        <Section title="Orb Size (px)">
          <Slider
            label="Size"
            value={orbSize}
            onChange={(v) => setOrbSize(Math.round(v))}
            min={100}
            max={800}
            step={10}
          />
        </Section>

        {/* Presets */}
        <Section title="Presets">
          <div className="flex flex-col gap-1">
            <PresetButton
              label="ORIEL Default"
              onClick={() => {
                setColor1("#affff1");
                setColor2("#9696ff");
                setBgColor("#05050a");
              }}
            />
            <PresetButton
              label="Teal + Gold"
              onClick={() => {
                setColor1("#3CD2DC");
                setColor2("#BDA36B");
                setBgColor("#05050a");
              }}
            />
            <PresetButton
              label="Cyan + Indigo"
              onClick={() => {
                setColor1("#00E5FF");
                setColor2("#1A0A3A");
                setBgColor("#05050a");
              }}
            />
            <PresetButton
              label="Mint + Cream"
              onClick={() => {
                setColor1("#affff1");
                setColor2("#ffffe8");
                setBgColor("#05050a");
              }}
            />
            <PresetButton
              label="White Theme"
              onClick={() => {
                setColor1("#3CD2DC");
                setColor2("#9696ff");
                setBgColor("#ffffff");
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
            background: copied
              ? "rgba(0,229,255,0.15)"
              : "rgba(0,229,255,0.05)",
            color: "#00e5ff",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {copied ? "Copied!" : "Copy Config JSON"}
        </button>

        {/* Live config display */}
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
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
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", minWidth: 70 }}>
        {label}
      </span>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="flex justify-between" style={{ marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color: "#00e5ff" }}>
          {step < 1 ? value.toFixed(2) : value}
        </span>
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

function PresetButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
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
