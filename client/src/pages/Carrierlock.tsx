import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import BreathProtocol from "@/components/BreathProtocol";
import Layout from "@/components/Layout";

const C = {
  void: "#0a0a0e",
  deep: "#0f0f15",
  surface: "#14141c",
  border: "rgba(189,163,107,0.12)",
  gold: "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  teal: "#5ba4a4",
  tealDim: "rgba(91,164,164,0.4)",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
  red: "#c94444",
};

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.deep }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em" }}>{title}</span>
        {subtitle && (
          <p style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, marginTop: 4, lineHeight: 1.6 }}>{subtitle}</p>
        )}
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

function SliderRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txt, letterSpacing: "0.08em" }}>{label}</div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>{description}</div>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: C.gold }}>{value}/10</div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

export default function Carrierlock() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [mentalNoise, setMentalNoise] = useState(5);
  const [bodyTension, setBodyTension] = useState(5);
  const [emotionalTurbulence, setEmotionalTurbulence] = useState(5);
  const [breathCompletion, setBreathCompletion] = useState(false);
  const [readingError, setReadingError] = useState<string | null>(null);

  const saveCarrierlockMutation = trpc.codex.saveCarrierlock.useMutation();
  const saveReadingMutation = trpc.codex.saveReading.useMutation();
  const dynamicStateMutation = trpc.rgp.dynamicState.useMutation();

  const handleBreathComplete = useCallback(() => setBreathCompletion(true), []);

  const coherenceScore = Math.max(
    0,
    Math.min(
      100,
      100 - (mentalNoise * 3 + bodyTension * 3 + emotionalTurbulence * 3) + (breathCompletion ? 10 : 0),
    ),
  );

  const coherenceColor = coherenceScore >= 70 ? C.teal : coherenceScore >= 40 ? C.gold : C.red;
  const coherenceLabel = coherenceScore >= 70 ? "RESONANCE" : coherenceScore >= 40 ? "FLUX" : "ENTROPY";

  const handleGetReading = async () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    setReadingError(null);

    try {
      const carrierlockResult = await saveCarrierlockMutation.mutateAsync({
        mentalNoise,
        bodyTension,
        emotionalTurbulence,
        breathCompletion,
      });

      const result = await dynamicStateMutation.mutateAsync({
        mentalNoise,
        bodyTension,
        emotionalTurbulence,
        breathCompletion: breathCompletion ? 1 : 0,
        birthDate: new Date().toISOString(),
        userId: String(user.id),
      });

      if (!result.success || !result.data) {
        throw new Error((result as { error?: string }).error || "Dynamic reading generation failed");
      }

      const data = result.data;
      const readingText = [
        `ORIEL Dynamic Reading — ${data.coherenceScore}/100 — ${data.coherenceLabel}`,
        "",
        data.orielTransmission,
      ].join("\n");

      const falsifierMatch = data.orielTransmission.match(/falsifier[:\s]+(.+)/i);

      const savedReading = await saveReadingMutation.mutateAsync({
        carrierlockId: carrierlockResult.id,
        readingText,
        flaggedCodons: [],
        sliScores: { mentalNoise, bodyTension, emotionalTurbulence },
        activeFacets: {},
        confidenceLevels: {},
        microCorrection: undefined,
        correctionFacet: undefined,
        falsifier: falsifierMatch?.[1]?.trim() ?? "",
      });

      setLocation(`/reading/dynamic/${savedReading.id}`);
    } catch (error) {
      console.error("Failed to generate reading:", error);
      setReadingError(error instanceof Error ? error.message : "Failed to generate reading. Please try again.");
    }
  };

  const isLoading =
    saveCarrierlockMutation.isPending ||
    saveReadingMutation.isPending ||
    dynamicStateMutation.isPending;

  return (
    <Layout>
      <div style={{ minHeight: "100vh", padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.25em", marginBottom: 12 }}>
              SIGNAL CALIBRATION
            </div>
            <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: 20 }} />
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(26px, 4vw, 42px)",
              fontWeight: 300,
              color: C.txt,
              lineHeight: 1.1,
              marginBottom: 8,
            }}>
              Carrierlock Diagnostic
            </h1>
            <p style={{ fontFamily: "monospace", fontSize: 11, color: C.txtS, lineHeight: 1.9, maxWidth: 520 }}>
              This page now measures only your current field state. Your natal blueprint lives permanently inside your profile and is used automatically for contextualization.
            </p>
          </div>

          <div style={{ background: C.border, display: "flex", flexDirection: "column", gap: 1 }}>
            <Panel
              title="CURRENT FIELD STATE"
              subtitle="Move the sliders until they reflect the moment honestly. ORIEL will read the present state against your stored blueprint."
            >
              <SliderRow
                label="MENTAL NOISE"
                description="Cognitive static, loops, intrusive thought density."
                value={mentalNoise}
                onChange={setMentalNoise}
              />
              <SliderRow
                label="BODY TENSION"
                description="Somatic contraction, tightness, bracing in the nervous system."
                value={bodyTension}
                onChange={setBodyTension}
              />
              <SliderRow
                label="EMOTIONAL TURBULENCE"
                description="Affective instability, overwhelm, volatility in the field."
                value={emotionalTurbulence}
                onChange={setEmotionalTurbulence}
              />
            </Panel>

            <Panel
              title="BREATH RESET"
              subtitle="Complete the breath cycle if you want the assessment to account for active regulation in the body."
            >
              <BreathProtocol onComplete={handleBreathComplete} isCompleted={breathCompletion} />
              <div style={{ marginTop: 16, fontFamily: "monospace", fontSize: 10, color: breathCompletion ? C.teal : C.txtD, letterSpacing: "0.08em" }}>
                BREATH STATE: {breathCompletion ? "COMPLETE" : "PENDING"}
              </div>
            </Panel>

            <Panel title="COHERENCE SNAPSHOT">
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: coherenceColor, fontWeight: 300 }}>
                  {coherenceScore}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: coherenceColor, letterSpacing: "0.16em" }}>
                  {coherenceLabel}
                </div>
              </div>
              <div style={{ height: 4, background: C.border, marginBottom: 16 }}>
                <div
                  style={{
                    width: `${coherenceScore}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${C.red}, ${C.gold}, ${C.teal})`,
                  }}
                />
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, lineHeight: 1.9 }}>
                ORIEL uses this as a state estimate only. It does not rewrite your blueprint. It shows how the current field condition may distort or clarify the expression of what is already stable in you.
              </div>
            </Panel>

            <Panel title="EXECUTE READING">
              {readingError && (
                <div style={{ marginBottom: 16, fontFamily: "monospace", fontSize: 10, color: C.red, lineHeight: 1.8 }}>
                  {readingError}
                </div>
              )}

              <button
                onClick={handleGetReading}
                disabled={isLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "14px 20px",
                  background: C.gold,
                  color: C.void,
                  border: `1px solid ${C.goldDim}`,
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={16} />}
                {isLoading ? "CALIBRATING..." : "GENERATE DYNAMIC READING"}
                {!isLoading && <ArrowRight size={16} />}
              </button>
            </Panel>
          </div>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </Layout>
  );
}
