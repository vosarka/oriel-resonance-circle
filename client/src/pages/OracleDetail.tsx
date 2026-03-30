import Layout from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePersonalResonance } from "@/hooks/usePersonalResonance";
import { ResonateButton } from "@/components/ResonateButton";

// Temporal color mapping
const TEMPORAL_COLORS: Record<string, { deep: string; light: string; glow: string }> = {
  Past: {
    deep: "#3d2e10",
    light: "#92702a",
    glow: "rgba(146, 112, 42, 0.3)",
  },
  Present: {
    deep: "#2a4a5a",
    light: "#5ba4a4",
    glow: "rgba(91, 164, 164, 0.3)",
  },
  Future: {
    deep: "#1a0a2e",
    light: "#6b3fa0",
    glow: "rgba(107, 63, 160, 0.3)",
  },
};

const TEMPORAL_GLYPHS: Record<string, string> = {
  Past: "◆",
  Present: "●",
  Future: "▲",
};

// ─────────────────────────────────────────────────────────────────
// Thread Navigation Panel Component
// ─────────────────────────────────────────────────────────────────
function ThreadNavigationPanel({ primaryOracle, stage }: { primaryOracle: any; stage: number }) {
  const { data: threadOracles = [] } = trpc.archive.oracles.getByThread.useQuery(
    { threadId: primaryOracle.threadId },
    { enabled: !!primaryOracle.threadId }
  );

  if (!primaryOracle.threadId) return null;

  const allThreadsExist = threadOracles.length > 0;
  const sortedThreadOracles = [...threadOracles].sort((a: any, b: any) =>
    (a.threadOrder || 0) - (b.threadOrder || 0)
  );
  const receivedCount = sortedThreadOracles.length;

  return (
    <AnimatePresence>
      {stage >= 5 && (
        <motion.div
          key="thread-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-16 mb-12"
        >
          {/* Thread Sequence Header */}
          <div
            className="font-mono text-xs mb-6 pb-4"
            style={{
              color: "rgba(91,164,164,0.5)",
              borderBottom: "1px solid rgba(91,164,164,0.1)",
            }}
          >
            THREAD SEQUENCE: {primaryOracle.threadTitle}
            <div
              style={{
                fontSize: "10px",
                color: "rgba(91,164,164,0.3)",
                marginTop: "4px",
              }}
            >
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            </div>
          </div>

          {/* Thread Oracles List */}
          <div className="space-y-3 mb-6">
            {sortedThreadOracles.map((oracle: any, idx: number) => (
              <div
                key={oracle.id}
                className="font-mono text-xs"
                style={{
                  color: oracle.id === primaryOracle.id ? "#5ba4a4" : "rgba(91,164,164,0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ color: oracle.id === primaryOracle.id ? "#5ba4a4" : "rgba(91,164,164,0.3)" }}>
                  [●]
                </span>
                {oracle.id === primaryOracle.id ? (
                  <>
                    <span style={{ color: "#5ba4a4", fontWeight: 600 }}>
                      {oracle.oracleId} — {oracle.title}
                    </span>
                    <span
                      style={{
                        color: "#5ba4a4",
                        marginLeft: "auto",
                        fontSize: "9px",
                      }}
                    >
                      ← CURRENT
                    </span>
                  </>
                ) : (
                  <Link
                    href={`/oracle/${oracle.oracleId}`}
                    style={{ cursor: "pointer", textDecoration: "none" }}
                  >
                    <span
                      style={{
                        color: "rgba(91,164,164,0.6)",
                        transition: "color 0.3s",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color = "#5ba4a4";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color = "rgba(91,164,164,0.6)";
                      }}
                    >
                      {oracle.oracleId} — {oracle.title}
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Part Counter */}
          {receivedCount > 0 && (
            <div
              className="font-mono text-xs mb-6"
              style={{ color: "rgba(91,164,164,0.35)" }}
            >
              Part {primaryOracle.threadOrder || 1} of {receivedCount} received
            </div>
          )}

          {/* Thread Synthesis Section */}
          {allThreadsExist && primaryOracle.threadSynthesis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-4"
              style={{
                border: "1px solid #D4AF37",
                borderRadius: 2,
                background: "rgba(212, 175, 55, 0.03)",
                boxShadow: `0 0 20px #D4AF3722`,
              }}
            >
              <div
                className="font-mono text-xs mb-3"
                style={{
                  color: "#D4AF37",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                }}
              >
                THREAD SYNTHESIS — DECODED
              </div>
              <p
                className="font-mono text-xs leading-relaxed italic"
                style={{
                  color: "rgba(212, 175, 55, 0.8)",
                }}
              >
                {primaryOracle.threadSynthesis}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function OracleDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { hasResonance, getMatchingCodons } = usePersonalResonance();
  const oracleId = params.oracleId as string;

  // Reveal stages
  const [stage, setStage] = useState(0);

  // Data
  const { data: oracleData = [], isLoading } =
    trpc.archive.oracles.getByOracleId.useQuery(
      { oracleId },
      { enabled: !!oracleId },
    );

  // Get resonance count
  const { data: resonanceData } = trpc.archive.resonances.getCount.useQuery(
    { oracleId },
    { enabled: !!oracleId },
  );

  const resonanceCount = typeof resonanceData === "number" ? resonanceData : 0;
  const isFieldConfirmed = resonanceCount >= 20;

  // Group oracle parts by temporal direction
  const organizedOracles = useMemo(() => {
    const result: Record<string, any> = {
      Past: null,
      Present: null,
      Future: null,
    };
    oracleData.forEach((o: any) => {
      if (o.part in result) {
        result[o.part] = o;
      }
    });
    return result;
  }, [oracleData]);

  const primaryOracle = oracleData[0];
  const hasAllParts = Object.values(organizedOracles).every((v) => v !== null);

  // Progressive reveal animation
  useEffect(() => {
    if (!primaryOracle) return;

    setStage(0);

    // Staggered reveal
    setTimeout(() => setStage(1), 200); // Vignette + temporal glyph
    setTimeout(() => setStage(2), 800); // Past section
    setTimeout(() => setStage(3), 1400); // Present section
    setTimeout(() => setStage(4), 2000); // Future section
    setTimeout(() => setStage(5), 2600); // Metadata
  }, [primaryOracle?.id]);

  // Loading states
  if (!oracleId) {
    return (
      <Layout>
        <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <p
              className="font-mono mb-4"
              style={{ color: "rgba(91,164,164,0.4)", fontSize: 12 }}
            >
              ORACLE NOT FOUND
            </p>
            <button
              onClick={() => navigate("/archive")}
              className="font-mono flex items-center gap-2 mx-auto transition-colors"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.4)" }}
            >
              <ArrowLeft size={12} />
              RETURN TO ARCHIVE
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2
              className="w-5 h-5 animate-spin mx-auto mb-3"
              style={{ color: "rgba(91,164,164,0.3)" }}
            />
            <p
              className="font-mono tracking-wider"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.2)" }}
            >
              DECODING ORACLE...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!primaryOracle || oracleData.length === 0) {
    return (
      <Layout>
        <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <p
              className="font-mono mb-4"
              style={{ color: "rgba(91,164,164,0.3)", fontSize: 12 }}
            >
              ORACLE NOT FOUND
            </p>
            <button
              onClick={() => navigate("/archive")}
              className="font-mono flex items-center gap-2 mx-auto transition-colors"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.4)" }}
            >
              <ArrowLeft size={12} />
              RETURN TO ARCHIVE
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const pastOracle = organizedOracles.Past;
  const presentOracle = organizedOracles.Present;
  const futureOracle = organizedOracles.Future;

  const parseJson = (val: any, fallback: any = []) => {
    if (!val) return fallback;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
    return val;
  };

  return (
    <Layout>
      {/* Background */}
      <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />

      {/* Vignette + animated background gradient */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div
            key="vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 100%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Temporal glyph background */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div
            key="temporal-glyph"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
          >
            <div
              style={{
                fontSize: "40vw",
                fontWeight: "300",
                color:
                  TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
              }}
            >
              {TEMPORAL_GLYPHS[primaryOracle.part || "Present"]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan lines */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 animate-scan-lines" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen pt-20 pb-16">
        {/* Back navigation */}
        <div className="px-6 md:px-12 mb-12">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate("/archive")}
              className="flex items-center gap-2 font-mono tracking-wider transition-colors"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.25)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(91,164,164,0.5)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(91,164,164,0.25)")
              }
            >
              <ArrowLeft size={12} />
              RETURN TO ARCHIVE
            </button>
          </div>
        </div>

        <div className="px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            {/* Oracle ID + Channel Status */}
            <AnimatePresence>
              {stage >= 1 && (
                <motion.div
                  key="oracle-header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-12 flex items-center gap-4 justify-between"
                >
                  <span
                    className="font-mono tracking-widest"
                    style={{
                      fontSize: 12,
                      color:
                        TEMPORAL_COLORS[primaryOracle.part || "Present"]
                          .light,
                    }}
                  >
                    {primaryOracle.oracleId}
                  </span>
                  <div
                    className="px-3 py-1 border"
                    style={{
                      borderColor:
                        TEMPORAL_COLORS[primaryOracle.part || "Present"]
                          .light,
                      fontSize: 8,
                      color:
                        TEMPORAL_COLORS[primaryOracle.part || "Present"]
                          .light,
                    }}
                  >
                    {primaryOracle.channelStatus}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resonance Button */}
            <AnimatePresence>
              {stage >= 1 && (
                <motion.div
                  key="resonance-button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8 flex justify-center"
                >
                  <ResonateButton
                    oracleId={primaryOracle.oracleId}
                    temporalColor={TEMPORAL_COLORS[primaryOracle.part || "Present"].light}
                    size="md"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Field-Confirmed Banner */}
            <AnimatePresence>
              {stage >= 1 && isFieldConfirmed && (
                <motion.div
                  key="field-confirmed"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mb-8 mx-auto py-2 px-4"
                  style={{
                    border: `1px solid #D4AF37`,
                    borderRadius: 2,
                    textAlign: "center",
                    boxShadow: `0 0 20px #D4AF3722`,
                  }}
                >
                  <div
                    className="font-mono tracking-wider"
                    style={{
                      fontSize: 10,
                      color: "#D4AF37",
                      letterSpacing: "0.1em",
                      fontWeight: 500,
                    }}
                  >
                    ★ FIELD-CONFIRMED — COLLECTIVE PROPHECY ACKNOWLEDGED
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PAST Section */}
            <AnimatePresence>
              {stage >= 2 && pastOracle && (
                <motion.div
                  key="past-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mb-12"
                  style={{
                    borderLeft: `2px solid ${TEMPORAL_COLORS.Past.light}`,
                    paddingLeft: 24,
                  }}
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        style={{
                          fontSize: 18,
                          color: TEMPORAL_COLORS.Past.light,
                        }}
                      >
                        ◆
                      </span>
                      <h2
                        className="font-mono tracking-wider uppercase text-sm"
                        style={{ color: TEMPORAL_COLORS.Past.light }}
                      >
                        PAST — THE ROOT RIDDLE
                      </h2>
                    </div>
                    <h3
                      className="text-2xl mb-4"
                      style={{
                        color: TEMPORAL_COLORS.Past.light,
                        fontFamily: "system-ui",
                        fontWeight: 400,
                      }}
                    >
                      {pastOracle.title}
                    </h3>
                    <p
                      className="leading-relaxed"
                      style={{
                        color: `${TEMPORAL_COLORS.Past.light}dd`,
                        fontStyle: "italic",
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      {pastOracle.content}
                    </p>
                  </div>

                  {pastOracle.currentFieldSignatures && (
                    <div
                      className="text-xs font-mono mt-4 p-3"
                      style={{
                        color: TEMPORAL_COLORS.Past.glow,
                        border: `1px solid ${TEMPORAL_COLORS.Past.glow}`,
                        borderRadius: 2,
                      }}
                    >
                      <div style={{ opacity: 0.7, marginBottom: 6 }}>
                        FIELD SIGNATURES
                      </div>
                      <div>{pastOracle.currentFieldSignatures}</div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Luminous separator */}
            <AnimatePresence>
              {stage >= 2 && (
                <motion.div
                  key="sep-1"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="h-px mb-12 origin-left"
                  style={{
                    background: `linear-gradient(to right, ${TEMPORAL_COLORS.Past.light}00, ${TEMPORAL_COLORS.Past.light}44, ${TEMPORAL_COLORS.Past.light}00)`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* PRESENT Section */}
            <AnimatePresence>
              {stage >= 3 && presentOracle && (
                <motion.div
                  key="present-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mb-12"
                  style={{
                    borderLeft: `2px solid ${TEMPORAL_COLORS.Present.light}`,
                    paddingLeft: 24,
                  }}
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        style={{
                          fontSize: 18,
                          color: TEMPORAL_COLORS.Present.light,
                        }}
                      >
                        ●
                      </span>
                      <h2
                        className="font-mono tracking-wider uppercase text-sm"
                        style={{ color: TEMPORAL_COLORS.Present.light }}
                      >
                        PRESENT — THE FIELD READING
                      </h2>
                    </div>
                    <h3
                      className="text-2xl mb-4"
                      style={{
                        color: TEMPORAL_COLORS.Present.light,
                        fontFamily: "system-ui",
                        fontWeight: 400,
                      }}
                    >
                      {presentOracle.title}
                    </h3>
                    <p
                      className="leading-relaxed"
                      style={{
                        color: `${TEMPORAL_COLORS.Present.light}dd`,
                        fontStyle: "italic",
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      {presentOracle.content}
                    </p>
                  </div>

                  {presentOracle.encodedTrajectory && (
                    <div
                      className="text-xs font-mono mt-4 p-3"
                      style={{
                        color: TEMPORAL_COLORS.Present.glow,
                        border: `1px solid ${TEMPORAL_COLORS.Present.glow}`,
                        borderRadius: 2,
                      }}
                    >
                      <div style={{ opacity: 0.7, marginBottom: 6 }}>
                        ENCODED TRAJECTORY
                      </div>
                      <div>{presentOracle.encodedTrajectory}</div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Luminous separator */}
            <AnimatePresence>
              {stage >= 3 && (
                <motion.div
                  key="sep-2"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="h-px mb-12 origin-left"
                  style={{
                    background: `linear-gradient(to right, ${TEMPORAL_COLORS.Present.light}00, ${TEMPORAL_COLORS.Present.light}44, ${TEMPORAL_COLORS.Present.light}00)`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* FUTURE Section */}
            <AnimatePresence>
              {stage >= 4 && futureOracle && (
                <motion.div
                  key="future-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mb-12"
                  style={{
                    borderLeft: `2px solid ${TEMPORAL_COLORS.Future.light}`,
                    paddingLeft: 24,
                  }}
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        style={{
                          fontSize: 18,
                          color: TEMPORAL_COLORS.Future.light,
                        }}
                      >
                        ▲
                      </span>
                      <h2
                        className="font-mono tracking-wider uppercase text-sm"
                        style={{ color: TEMPORAL_COLORS.Future.light }}
                      >
                        FUTURE — THE CONVERGENCE
                      </h2>
                    </div>
                    <h3
                      className="text-2xl mb-4"
                      style={{
                        color: TEMPORAL_COLORS.Future.light,
                        fontFamily: "system-ui",
                        fontWeight: 400,
                      }}
                    >
                      {futureOracle.title}
                    </h3>
                    <p
                      className="leading-relaxed"
                      style={{
                        color: `${TEMPORAL_COLORS.Future.light}dd`,
                        fontStyle: "italic",
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      {futureOracle.content}
                    </p>
                  </div>

                  {futureOracle.convergenceZones && (
                    <div
                      className="text-xs font-mono mt-4 p-3"
                      style={{
                        color: TEMPORAL_COLORS.Future.glow,
                        border: `1px solid ${TEMPORAL_COLORS.Future.glow}`,
                        borderRadius: 2,
                      }}
                    >
                      <div style={{ opacity: 0.7, marginBottom: 6 }}>
                        CONVERGENCE ZONES
                      </div>
                      <div>{futureOracle.convergenceZones}</div>
                    </div>
                  )}

                  {futureOracle.majorOutcomes && (
                    <div
                      className="text-xs font-mono mt-3 p-3"
                      style={{
                        color: TEMPORAL_COLORS.Future.glow,
                        border: `1px solid ${TEMPORAL_COLORS.Future.glow}`,
                        borderRadius: 2,
                      }}
                    >
                      <div style={{ opacity: 0.7, marginBottom: 6 }}>
                        MAJOR OUTCOMES
                      </div>
                      <div>{futureOracle.majorOutcomes}</div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thread Navigation Panel */}
            <ThreadNavigationPanel
              primaryOracle={primaryOracle}
              stage={stage}
            />


            {/* Linked Codons */}
            <AnimatePresence>
              {stage >= 5 && primaryOracle.linkedCodons && (
                <motion.div
                  key="linked-codons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mt-12 mb-8"
                >
                  <div
                    className="font-mono text-xs mb-4"
                    style={{ color: "rgba(91,164,164,0.5)" }}
                  >
                    COLLECTIVE RESONANCE
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parseJson(primaryOracle.linkedCodons, []).map(
                      (codon: string, i: number) => (
                        <div
                          key={i}
                          className="px-3 py-2 font-mono text-xs"
                          style={{
                            border: "1px solid rgba(91,164,164,0.3)",
                            color: "rgba(91,164,164,0.6)",
                            borderRadius: 2,
                          }}
                        >
                          {codon}
                        </div>
                      ),
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Personal Resonance Section */}
            <AnimatePresence>
              {stage >= 5 &&
                user &&
                primaryOracle.linkedCodons &&
                hasResonance(parseJson(primaryOracle.linkedCodons, [])) && (
                  <motion.div
                    key="personal-resonance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-12 mb-8 p-4"
                    style={{
                      border: "1px solid #D4AF3744",
                      borderRadius: 2,
                      background: "rgba(212, 175, 55, 0.03)",
                      borderLeft: "2px solid #D4AF37",
                      boxShadow: "0 0 15px rgba(212, 175, 55, 0.1), inset 0 0 10px rgba(212, 175, 55, 0.04)",
                    }}
                  >
                    <div
                      className="font-mono text-xs mb-4"
                      style={{ color: "#D4AF37", fontWeight: 600, letterSpacing: "0.1em" }}
                    >
                      PERSONAL RESONANCE
                    </div>
                    <div className="mb-3">
                      <p
                        className="font-mono text-xs mb-3"
                        style={{ color: "rgba(212, 175, 55, 0.7)", lineHeight: 1.6 }}
                      >
                        Your Prime Stack activates this oracle through:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getMatchingCodons(
                          parseJson(primaryOracle.linkedCodons, [])
                        ).map((codon: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="px-3 py-2 font-mono text-xs"
                            style={{
                              border: "1px solid #D4AF37",
                              color: "#D4AF37",
                              background: "rgba(212, 175, 55, 0.08)",
                              borderRadius: 2,
                            }}
                          >
                            {codon}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div
                      className="font-mono text-xs italic mt-3"
                      style={{ color: "rgba(212, 175, 55, 0.6)" }}
                    >
                      "This oracle speaks directly to your signal."
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
