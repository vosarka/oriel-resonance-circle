import Layout from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePersonalResonance } from "@/hooks/usePersonalResonance";
import { ResonateButton } from "@/components/ResonateButton";

const TEMPORAL_COLORS: Record<
  string,
  { deep: string; light: string; glow: string }
> = {
  Past: { deep: "#3d2e10", light: "#92702a", glow: "rgba(146,112,42,0.3)" },
  Present: { deep: "#2a4a5a", light: "#5ba4a4", glow: "rgba(91,164,164,0.3)" },
  Future: { deep: "#1a0a2e", light: "#6b3fa0", glow: "rgba(107,63,160,0.3)" },
};

const TEMPORAL_GLYPHS: Record<string, string> = {
  Past: "◆",
  Present: "●",
  Future: "▲",
};

function parseJson(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val;
}

// ── Thread Navigation Panel ─────────────────────────────────────────
function ThreadNavigationPanel({
  threadId,
  threadTitle,
  currentOracleId,
}: {
  threadId: string;
  threadTitle: string;
  currentOracleId: string;
}) {
  const { data: threadOracles = [] } =
    trpc.archive.oracles.getByThread.useQuery(
      { threadId },
      { enabled: !!threadId },
    );

  // Dedupe by oracleId (since each oracle has 3 parts)
  const uniqueOracles = useMemo(() => {
    const seen = new Set<string>();
    return threadOracles.filter((o: any) => {
      if (seen.has(o.oracleId)) return false;
      seen.add(o.oracleId);
      return true;
    });
  }, [threadOracles]);

  const totalParts = uniqueOracles.length;
  const allExist = totalParts > 0;

  // Check for thread synthesis
  const synthesisOracle = threadOracles.find(
    (o: any) => o.threadSynthesis,
  );

  return (
    <div
      className="p-5"
      style={{
        border: "1px solid rgba(91,164,164,0.15)",
        borderRadius: 2,
        background: "rgba(91,164,164,0.02)",
      }}
    >
      <div
        className="font-mono text-xs mb-1 tracking-widest"
        style={{ color: "rgba(91,164,164,0.5)" }}
      >
        THREAD SEQUENCE
      </div>
      <div
        className="mb-4"
        style={{ color: "rgba(91,164,164,0.8)", fontSize: 15 }}
      >
        {threadTitle}
      </div>
      <div
        className="mb-4 h-px"
        style={{ background: "rgba(91,164,164,0.1)" }}
      />

      {/* Oracle list */}
      <div className="space-y-2">
        {uniqueOracles.map((o: any, i: number) => {
          const isCurrent = o.oracleId === currentOracleId;
          return (
            <div key={o.oracleId} className="flex items-center gap-3">
              <span
                className="font-mono text-xs"
                style={{ color: isCurrent ? "#5ba4a4" : "rgba(91,164,164,0.4)" }}
              >
                [●]
              </span>
              {isCurrent ? (
                <span
                  className="font-mono text-xs flex-1"
                  style={{ color: "#5ba4a4" }}
                >
                  {o.oracleId} — &ldquo;{o.title}&rdquo;
                </span>
              ) : (
                <Link href={`/oracle/${o.oracleId}`}>
                  <span
                    className="font-mono text-xs flex-1 cursor-pointer transition-colors hover:underline"
                    style={{ color: "rgba(91,164,164,0.6)" }}
                  >
                    {o.oracleId} — &ldquo;{o.title}&rdquo;
                  </span>
                </Link>
              )}
              {isCurrent && (
                <span
                  className="font-mono"
                  style={{ fontSize: 9, color: "#5ba4a4" }}
                >
                  ← CURRENT
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="font-mono text-xs mt-4"
        style={{ color: "rgba(91,164,164,0.35)" }}
      >
        Part{" "}
        {uniqueOracles.findIndex((o: any) => o.oracleId === currentOracleId) +
          1}{" "}
        of {totalParts} received
      </div>

      {/* Thread Synthesis */}
      {synthesisOracle?.threadSynthesis && allExist && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 p-4"
          style={{
            border: "1px solid #D4AF3744",
            borderLeft: "2px solid #D4AF37",
            borderRadius: 2,
            background: "rgba(212,175,55,0.03)",
          }}
        >
          <div
            className="font-mono text-xs mb-3 tracking-widest"
            style={{ color: "#D4AF37" }}
          >
            THREAD SYNTHESIS — DECODED
          </div>
          <p
            className="leading-relaxed italic"
            style={{
              color: "rgba(212,175,55,0.7)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {synthesisOracle.threadSynthesis}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ── Oracle Detail Page ──────────────────────────────────────────────
export default function OracleDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { hasResonance, getMatchingCodons } = usePersonalResonance();
  const oracleId = params.oracleId as string;

  const [stage, setStage] = useState(0);

  const { data: oracleData = [], isLoading } =
    trpc.archive.oracles.getByOracleId.useQuery(
      { oracleId },
      { enabled: !!oracleId },
    );

  const { data: resonanceData } = trpc.archive.resonances.getCount.useQuery(
    { oracleId },
    { enabled: !!oracleId },
  );

  const resonanceCount =
    typeof resonanceData === "number" ? resonanceData : 0;
  const isFieldConfirmed = resonanceCount >= 20;

  const organizedOracles = useMemo(() => {
    const result: Record<string, any> = {
      Past: null,
      Present: null,
      Future: null,
    };
    oracleData.forEach((o: any) => {
      if (o.part in result) result[o.part] = o;
    });
    return result;
  }, [oracleData]);

  const primaryOracle = oracleData[0];

  useEffect(() => {
    if (!primaryOracle) return;
    setStage(0);
    setTimeout(() => setStage(1), 200);
    setTimeout(() => setStage(2), 800);
    setTimeout(() => setStage(3), 1400);
    setTimeout(() => setStage(4), 2000);
    setTimeout(() => setStage(5), 2600);
  }, [primaryOracle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!oracleId || (!isLoading && oracleData.length === 0)) {
    return (
      <Layout>
        <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <p className="font-mono mb-4" style={{ color: "rgba(91,164,164,0.4)", fontSize: 12 }}>
              ORACLE NOT FOUND
            </p>
            <button
              onClick={() => navigate("/archive")}
              className="font-mono flex items-center gap-2 mx-auto transition-colors"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.4)" }}
            >
              <ArrowLeft size={12} /> RETURN TO ARCHIVE
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
          <Loader2
            className="w-5 h-5 animate-spin mx-auto mb-3"
            style={{ color: "rgba(91,164,164,0.3)" }}
          />
        </div>
      </Layout>
    );
  }

  const pastOracle = organizedOracles.Past;
  const presentOracle = organizedOracles.Present;
  const futureOracle = organizedOracles.Future;

  const linkedCodons = parseJson(primaryOracle?.linkedCodons, []);
  const matchingCodons = getMatchingCodons(linkedCodons);
  const hasPersonalResonance = matchingCodons.length > 0;

  // Helper to render a temporal section
  const renderSection = (
    oracle: any,
    part: string,
    label: string,
    stageMin: number,
    extraContent?: React.ReactNode,
  ) => {
    if (!oracle) return null;
    const colors = TEMPORAL_COLORS[part];
    return (
      <AnimatePresence key={part}>
        {stage >= stageMin && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-12"
              style={{ borderLeft: `2px solid ${colors.light}`, paddingLeft: 24 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span style={{ fontSize: 18, color: colors.light }}>
                  {TEMPORAL_GLYPHS[part]}
                </span>
                <h2
                  className="font-mono tracking-wider uppercase text-sm"
                  style={{ color: colors.light }}
                >
                  {label}
                </h2>
              </div>
              <h3
                className="text-2xl mb-4"
                style={{ color: colors.light, fontFamily: "system-ui", fontWeight: 400 }}
              >
                {oracle.title}
              </h3>
              <p
                className="leading-relaxed"
                style={{
                  color: `${colors.light}dd`,
                  fontStyle: "italic",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {oracle.content}
              </p>
              {extraContent}
            </motion.div>
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="h-px mb-12 origin-left"
              style={{
                background: `linear-gradient(to right, ${colors.light}00, ${colors.light}44, ${colors.light}00)`,
              }}
            />
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Layout>
      <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />

      {/* Vignette */}
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

      {/* Background temporal glyph */}
      <AnimatePresence>
        {stage >= 1 && primaryOracle && (
          <motion.div
            key="glyph-bg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.06, scale: 1 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
          >
            <div
              style={{
                fontSize: "40vw",
                color: TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
              }}
            >
              {TEMPORAL_GLYPHS[primaryOracle.part || "Present"]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 min-h-screen pt-20 pb-16">
        {/* Back nav */}
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
              <ArrowLeft size={12} /> RETURN TO ARCHIVE
            </button>
          </div>
        </div>

        <div className="px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <AnimatePresence>
              {stage >= 1 && primaryOracle && (
                <motion.div
                  key="header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="font-mono tracking-widest"
                      style={{
                        fontSize: 12,
                        color: TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
                      }}
                    >
                      {primaryOracle.oracleId}
                    </span>
                    <div
                      className="px-3 py-1 border font-mono"
                      style={{
                        fontSize: 8,
                        borderColor: TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
                        color: TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
                      }}
                    >
                      {primaryOracle.channelStatus}
                    </div>
                  </div>

                  {/* Resonate button */}
                  <div className="flex justify-center mb-4">
                    <ResonateButton
                      oracleId={oracleId}
                      temporalColor={
                        TEMPORAL_COLORS[primaryOracle.part || "Present"].light
                      }
                      size="md"
                    />
                  </div>

                  {/* Field-Confirmed banner */}
                  {isFieldConfirmed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-2 mb-4"
                      style={{
                        border: "1px solid #D4AF3744",
                        background: "rgba(212,175,55,0.05)",
                        color: "#D4AF37",
                        fontSize: 10,
                        letterSpacing: "0.15em",
                      }}
                    >
                      ★ FIELD-CONFIRMED — COLLECTIVE PROPHECY ACKNOWLEDGED
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Temporal sections */}
            {renderSection(
              pastOracle,
              "Past",
              "PAST — THE ROOT RIDDLE",
              2,
              pastOracle?.currentFieldSignatures && (
                <div
                  className="text-xs font-mono mt-4 p-3"
                  style={{ color: TEMPORAL_COLORS.Past.glow, border: `1px solid ${TEMPORAL_COLORS.Past.glow}`, borderRadius: 2 }}
                >
                  <div style={{ opacity: 0.7, marginBottom: 6 }}>FIELD SIGNATURES</div>
                  <div>{pastOracle.currentFieldSignatures}</div>
                </div>
              ),
            )}
            {renderSection(
              presentOracle,
              "Present",
              "PRESENT — THE FIELD READING",
              3,
              presentOracle?.encodedTrajectory && (
                <div
                  className="text-xs font-mono mt-4 p-3"
                  style={{ color: TEMPORAL_COLORS.Present.glow, border: `1px solid ${TEMPORAL_COLORS.Present.glow}`, borderRadius: 2 }}
                >
                  <div style={{ opacity: 0.7, marginBottom: 6 }}>ENCODED TRAJECTORY</div>
                  <div>{presentOracle.encodedTrajectory}</div>
                </div>
              ),
            )}
            {renderSection(
              futureOracle,
              "Future",
              "FUTURE — THE CONVERGENCE",
              4,
              <>
                {futureOracle?.convergenceZones && (
                  <div
                    className="text-xs font-mono mt-4 p-3"
                    style={{ color: TEMPORAL_COLORS.Future.glow, border: `1px solid ${TEMPORAL_COLORS.Future.glow}`, borderRadius: 2 }}
                  >
                    <div style={{ opacity: 0.7, marginBottom: 6 }}>CONVERGENCE ZONES</div>
                    <div>{futureOracle.convergenceZones}</div>
                  </div>
                )}
                {futureOracle?.majorOutcomes && (
                  <div
                    className="text-xs font-mono mt-3 p-3"
                    style={{ color: TEMPORAL_COLORS.Future.glow, border: `1px solid ${TEMPORAL_COLORS.Future.glow}`, borderRadius: 2 }}
                  >
                    <div style={{ opacity: 0.7, marginBottom: 6 }}>MAJOR OUTCOMES</div>
                    <div>{futureOracle.majorOutcomes}</div>
                  </div>
                )}
              </>,
            )}

            {/* Thread Navigation */}
            <AnimatePresence>
              {stage >= 5 && primaryOracle?.threadId && (
                <motion.div
                  key="thread-nav"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mt-8 mb-12"
                >
                  <ThreadNavigationPanel
                    threadId={primaryOracle.threadId}
                    threadTitle={primaryOracle.threadTitle || primaryOracle.threadId}
                    currentOracleId={oracleId}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Linked Codons */}
            <AnimatePresence>
              {stage >= 5 && linkedCodons.length > 0 && (
                <motion.div
                  key="codons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mt-8 mb-8"
                >
                  <div
                    className="font-mono text-xs mb-4"
                    style={{ color: "rgba(91,164,164,0.5)" }}
                  >
                    LINKED CODONS
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedCodons.map((codon: string, i: number) => (
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
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Personal Resonance */}
            <AnimatePresence>
              {stage >= 5 && user && hasPersonalResonance && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-8 mb-8 p-4"
                  style={{
                    border: "1px solid #D4AF3744",
                    borderLeft: "2px solid #D4AF37",
                    borderRadius: 2,
                    background: "rgba(212,175,55,0.03)",
                  }}
                >
                  <div
                    className="font-mono text-xs mb-3 tracking-widest"
                    style={{ color: "#D4AF37" }}
                  >
                    PERSONAL RESONANCE
                  </div>
                  <p
                    className="font-mono text-xs mb-3"
                    style={{ color: "rgba(212,175,55,0.7)", lineHeight: 1.6 }}
                  >
                    Your Prime Stack activates this oracle through:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {matchingCodons.map((codon: string, i: number) => (
                      <div
                        key={i}
                        className="px-3 py-2 font-mono text-xs"
                        style={{
                          border: "1px solid #D4AF37",
                          color: "#D4AF37",
                          background: "rgba(212,175,55,0.08)",
                          borderRadius: 2,
                        }}
                      >
                        {codon}
                      </div>
                    ))}
                  </div>
                  <div
                    className="font-mono text-xs italic"
                    style={{ color: "rgba(212,175,55,0.6)" }}
                  >
                    &ldquo;This oracle speaks directly to your signal.&rdquo;
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
