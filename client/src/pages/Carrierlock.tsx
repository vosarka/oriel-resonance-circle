import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowRight, Calendar, Zap, MapPin, CheckCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import BreathProtocol from "@/components/BreathProtocol";
import Layout from "@/components/Layout";

type ReadingType = "dynamic" | "static";

const C = {
  void:    "#0a0a0e",
  deep:    "#0f0f15",
  surface: "#14141c",
  border:  "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold:    "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  teal:    "#5ba4a4",
  txt:     "#e8e4dc",
  txtS:    "#9a968e",
  txtD:    "#6a665e",
  red:     "#c94444",
  green:   "#44a866",
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function HudInput({ type, value, onChange, placeholder, style }: {
  type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%", boxSizing: "border-box" as const,
        background: C.surface, border: `1px solid ${C.border}`,
        color: C.txt, fontFamily: "monospace", fontSize: 12,
        padding: "9px 12px", outline: "none",
        colorScheme: "dark",
        ...style,
      }}
    />
  );
}

export default function Carrierlock() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [readingType, setReadingType] = useState<ReadingType>("dynamic");

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [resolveQuery, setResolveQuery] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<{
    displayName: string;
    latitude: number;
    longitude: number;
    tzId: string;
    offsetHours: number;
  } | null>(null);

  const [mentalNoise, setMentalNoise] = useState(5);
  const [bodyTension, setBodyTension] = useState(5);
  const [emotionalTurbulence, setEmotionalTurbulence] = useState(5);
  const [breathCompletion, setBreathCompletion] = useState(false);

  const saveCarrierlockMutation = trpc.codex.saveCarrierlock.useMutation();
  const saveReadingMutation = trpc.codex.saveReading.useMutation();
  const saveStaticReadingMutation = trpc.codex.saveStaticReading.useMutation();
  const staticSignatureMutation = trpc.rgp.staticSignature.useMutation();
  const dynamicStateMutation = trpc.rgp.dynamicState.useMutation();

  const geocodeQuery = trpc.geo.geocode.useQuery(
    { city: resolveQuery },
    { enabled: resolveQuery.length > 0 }
  );

  useEffect(() => {
    if (geocodeQuery.data) setResolvedLocation(geocodeQuery.data);
  }, [geocodeQuery.data]);

  const [readingError, setReadingError] = useState<string | null>(null);

  const coherenceScore = Math.max(0, Math.min(100,
    100 - (mentalNoise * 3 + bodyTension * 3 + emotionalTurbulence * 3) + (breathCompletion ? 10 : 0)
  ));

  const coherenceColor = coherenceScore >= 70 ? C.teal : coherenceScore >= 40 ? C.gold : C.red;
  const coherenceLabel = coherenceScore >= 70 ? "RESONANCE" : coherenceScore >= 40 ? "FLUX" : "ENTROPY";

  const handleBreathComplete = useCallback(() => setBreathCompletion(true), []);

  const handleGetReading = async () => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    setReadingError(null);

    try {
      if (readingType === "static") {
        const result = await staticSignatureMutation.mutateAsync({
          birthDate,
          birthTime: birthTime || "12:00",
          birthCity: resolvedLocation?.displayName || birthCity || undefined,
          birthLatitude: resolvedLocation?.latitude,
          birthLongitude: resolvedLocation?.longitude,
          birthTimezoneOffset: resolvedLocation?.offsetHours,
          userId: String(user?.id || "anonymous"),
          coherenceScore,
        });

        if (!result.success || !result.data) {
          throw new Error((result as { error?: string }).error || "Static signature generation failed");
        }

        const data = result.data;
        await saveStaticReadingMutation.mutateAsync({
          readingId: data.readingId,
          birthDate,
          birthTime: birthTime || "",
          birthCity: resolvedLocation?.displayName ?? birthCity ?? "",
          birthCountry: "",
          latitude: resolvedLocation?.latitude ?? 0,
          longitude: resolvedLocation?.longitude ?? 0,
          timezoneId: resolvedLocation?.tzId,
          timezoneOffset: resolvedLocation?.offsetHours,
          primeStack: data.primeStack,
          ninecenters: data.ninecenters,
          fractalRole: data.fractalRole,
          authorityNode: data.authorityNode,
          vrcType: data.vrcType,
          vrcAuthority: data.vrcAuthority,
          circuitLinks: data.circuitLinks,
          baseCoherence: data.baseCoherence,
          coherenceTrajectory: data.coherenceTrajectory,
          microCorrections: data.microCorrections,
          ephemerisData: data.ephemerisData,
          diagnosticTransmission: data.diagnosticTransmission,
          coreCodonEngine: data.coreCodonEngine,
        });

        setLocation(`/reading/static/${data.readingId}`);
      } else {
        const carrierlockResult = await saveCarrierlockMutation.mutateAsync({
          mentalNoise, bodyTension, emotionalTurbulence, breathCompletion,
        });

        const result = await dynamicStateMutation.mutateAsync({
          mentalNoise, bodyTension, emotionalTurbulence,
          breathCompletion: breathCompletion ? 1 : 0,
          birthDate: new Date().toISOString(),
          userId: user?.id ? String(user.id) : undefined,
        });

        if (result.success && result.data) {
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
        }
      }
    } catch (error) {
      console.error("Failed to generate reading:", error);
      setReadingError(error instanceof Error ? error.message : "Failed to generate reading. Please try again.");
    }
  };

  const isLoading = saveCarrierlockMutation.isPending ||
    staticSignatureMutation.isPending ||
    dynamicStateMutation.isPending ||
    saveReadingMutation.isPending ||
    saveStaticReadingMutation.isPending;

  const canSubmitStatic = birthDate.length > 0 && resolvedLocation !== null;

  return (
    <Layout>
      <div style={{ minHeight: "100vh", padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.25em", marginBottom: 12 }}>
              SIGNAL CALIBRATION
            </div>
            <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: 20 }} />
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(26px, 4vw, 42px)",
              fontWeight: 300, color: C.txt, lineHeight: 1.1, marginBottom: 8,
            }}>
              Carrierlock Diagnostic
            </h1>
            <p style={{ fontFamily: "monospace", fontSize: 11, color: C.txtS, lineHeight: 1.9, maxWidth: 480 }}>
              Select a reading mode. Your response determines how ORIEL calibrates your field.
            </p>
          </div>

          {/* All panels stacked with 1px gap */}
          <div style={{ background: C.border, display: "flex", flexDirection: "column", gap: 1 }}>

            {/* Reading Type Selector */}
            <Panel title="READING MODE">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {([
                  { id: "dynamic" as ReadingType, icon: <Zap size={20} />, label: "Dynamic State", desc: "Current moment Carrierlock" },
                  { id: "static"  as ReadingType, icon: <Calendar size={20} />, label: "Static Signature", desc: "Birth-based blueprint" },
                ] as const).map(({ id, icon, label, desc }) => {
                  const active = readingType === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setReadingType(id)}
                      style={{
                        padding: "20px 16px",
                        border: `1px solid ${active ? C.teal : C.border}`,
                        background: active ? "rgba(91,164,164,0.06)" : "transparent",
                        cursor: "pointer", textAlign: "center" as const,
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ color: active ? C.teal : C.txtD, display: "flex", justifyContent: "center", marginBottom: 10 }}>
                        {icon}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: active ? C.teal : C.txtS, letterSpacing: "0.1em", marginBottom: 4 }}>
                        {label.toUpperCase()}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>{desc}</div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            {/* Static Signature Form */}
            {readingType === "static" && (
              <Panel
                title="STATIC SIGNATURE · BIRTH DATA"
                subtitle="Your birth data encodes your permanent resonance blueprint — the 9-position Prime Stack that defines your archetypal signature."
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  <div>
                    <FieldLabel>BIRTH DATE *</FieldLabel>
                    <HudInput type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>

                  <div>
                    <FieldLabel>BIRTH TIME (OPTIONAL)</FieldLabel>
                    <HudInput type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 4 }}>
                      If unknown, 12:00 noon will be used as an approximation
                    </div>
                  </div>

                  <div>
                    <FieldLabel>BIRTH LOCATION *</FieldLabel>
                    <div style={{ display: "flex", gap: 8 }}>
                      <HudInput
                        type="text"
                        value={birthCity}
                        onChange={(e) => {
                          setBirthCity(e.target.value);
                          if (resolvedLocation) setResolvedLocation(null);
                          if (resolveQuery) setResolveQuery("");
                        }}
                        placeholder="e.g. London, UK"
                        style={{ flex: 1, width: "auto" }}
                      />
                      <button
                        type="button"
                        disabled={!birthCity.trim() || geocodeQuery.isFetching}
                        onClick={() => { setResolvedLocation(null); setResolveQuery(birthCity.trim()); }}
                        style={{
                          padding: "9px 16px", flexShrink: 0,
                          background: "transparent",
                          border: `1px solid ${C.borderH}`,
                          color: C.gold, fontFamily: "monospace", fontSize: 9,
                          letterSpacing: "0.12em", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6,
                          opacity: (!birthCity.trim() || geocodeQuery.isFetching) ? 0.5 : 1,
                        }}
                      >
                        {geocodeQuery.isFetching
                          ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                          : <MapPin size={12} />}
                        {geocodeQuery.isFetching ? "RESOLVING…" : "RESOLVE"}
                      </button>
                    </div>

                    {resolvedLocation && (
                      <div style={{
                        display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10,
                        padding: "10px 14px",
                        border: `1px solid ${C.green}40`,
                        background: "rgba(68,168,102,0.05)",
                      }}>
                        <CheckCircle size={13} style={{ color: C.green, marginTop: 1, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontFamily: "monospace", fontSize: 10, color: C.green, marginBottom: 2 }}>
                            {resolvedLocation.displayName}
                          </div>
                          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>
                            {resolvedLocation.latitude.toFixed(4)}° · {resolvedLocation.longitude.toFixed(4)}° · {resolvedLocation.tzId} (UTC{resolvedLocation.offsetHours >= 0 ? "+" : ""}{resolvedLocation.offsetHours})
                          </div>
                        </div>
                      </div>
                    )}

                    {geocodeQuery.isError && (
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.red, marginTop: 6 }}>
                        Location not found. Try a more specific name (e.g. "Paris, France").
                      </div>
                    )}

                    <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 6 }}>
                      Enter a city and click RESOLVE to confirm coordinates.
                    </div>
                  </div>

                  {/* What you'll receive */}
                  <div style={{ paddingLeft: 16, borderLeft: `2px solid ${C.border}` }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.15em", marginBottom: 8 }}>
                      READING INCLUDES
                    </div>
                    {[
                      "9-Position Prime Stack with Facet assignments",
                      "9-Center Resonance Map (defined / open)",
                      "Fractal Role and Authority Node",
                      "Circuit Link activations",
                      "Falsifier verification clauses",
                    ].map((item, i) => (
                      <div key={i} style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, lineHeight: 1.9 }}>
                        <span style={{ color: C.teal, marginRight: 8 }}>◈</span>{item}
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            )}

            {/* Dynamic State Form */}
            {readingType === "dynamic" && (
              <>
                <BreathProtocol onComplete={handleBreathComplete} isCompleted={breathCompletion} />

                <Panel
                  title="CARRIERLOCK ASSESSMENT"
                  subtitle="Rate your current state on each axis. These values determine your Coherence Score and Facet Loudness."
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

                    {([
                      { label: "MENTAL NOISE", key: "mn", desc: "Racing thoughts, mental chatter, cognitive overwhelm", value: mentalNoise, set: setMentalNoise },
                      { label: "BODY TENSION", key: "bt", desc: "Physical tightness, somatic stress, nervous system activation", value: bodyTension, set: setBodyTension },
                      { label: "EMOTIONAL TURBULENCE", key: "et", desc: "Emotional reactivity, mood instability, feeling overwhelmed", value: emotionalTurbulence, set: setEmotionalTurbulence },
                    ] as const).map(({ label, key, desc, value, set }) => (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em" }}>{label}</div>
                          <div style={{ fontFamily: "monospace", fontSize: 16, color: C.teal }}>{value}<span style={{ fontSize: 10, color: C.txtD }}>/10</span></div>
                        </div>
                        <input
                          type="range"
                          min={0} max={10} step={1}
                          value={value}
                          onChange={(e) => set(Number(e.target.value))}
                          style={{ width: "100%", accentColor: C.teal, cursor: "pointer" }}
                        />
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 4 }}>{desc}</div>
                      </div>
                    ))}

                    {/* Coherence Score Display */}
                    <div style={{ border: `1px solid ${C.border}`, padding: "16px 20px", background: C.surface }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em" }}>COHERENCE SCORE</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 28, color: coherenceColor, lineHeight: 1 }}>{coherenceScore}</span>
                          <span style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD }}>/100</span>
                        </div>
                      </div>
                      <div style={{ height: 3, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${coherenceScore}%`, background: coherenceColor, transition: "all 0.3s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 9, color: coherenceColor, letterSpacing: "0.15em" }}>{coherenceLabel}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>CS = 100 − (MN+BT+ET)×3 + BC×10</span>
                      </div>
                    </div>

                    {/* Optional birth data */}
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 14 }}>
                        OPTIONAL · BIRTH DATA FOR PERSONALIZED READING
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <FieldLabel>BIRTH DATE</FieldLabel>
                          <HudInput type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                        </div>
                        <div>
                          <FieldLabel>BIRTH TIME</FieldLabel>
                          <HudInput type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </>
            )}

            {/* Error */}
            {readingError && (
              <div style={{
                padding: "14px 20px",
                border: `1px solid ${C.red}40`,
                background: "rgba(201,68,68,0.06)",
                fontFamily: "monospace", fontSize: 10, color: C.red,
              }}>
                {readingError}
              </div>
            )}

            {/* Submit */}
            <div style={{ background: C.deep, padding: "24px" }}>
              <button
                onClick={handleGetReading}
                disabled={isLoading || (readingType === "static" && !canSubmitStatic)}
                style={{
                  width: "100%", padding: "16px 0",
                  background: isLoading || (readingType === "static" && !canSubmitStatic)
                    ? "transparent"
                    : `linear-gradient(90deg, rgba(189,163,107,0.15), rgba(91,164,164,0.15))`,
                  border: `1px solid ${
                    isLoading || (readingType === "static" && !canSubmitStatic) ? C.border : C.gold
                  }`,
                  color: isLoading || (readingType === "static" && !canSubmitStatic) ? C.txtD : C.gold,
                  fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em",
                  cursor: isLoading || (readingType === "static" && !canSubmitStatic) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "all 0.15s",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    GENERATING READING…
                  </>
                ) : (
                  <>
                    {readingType === "static" ? "GENERATE STATIC SIGNATURE" : "GENERATE DYNAMIC READING"}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              {readingType === "static" && !canSubmitStatic && (
                <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, textAlign: "center" as const, marginTop: 10 }}>
                  {!birthDate ? "ENTER BIRTH DATE TO CONTINUE" : "RESOLVE BIRTH LOCATION TO CONTINUE"}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
