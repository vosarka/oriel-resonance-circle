import Layout from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePersonalResonance } from "@/hooks/usePersonalResonance";
import { ResonateButton } from "@/components/ResonateButton";

<<<<<<< HEAD
<<<<<<< HEAD
=======
const TEMPORAL_COLORS: Record<
  string,
  { deep: string; light: string; glow: string }
> = {
  Past: { deep: "#3d2e10", light: "#92702a", glow: "rgba(146,112,42,0.3)" },
  Present: { deep: "#2a4a5a", light: "#5ba4a4", glow: "rgba(91,164,164,0.3)" },
  Future: { deep: "#1a0a2e", light: "#6b3fa0", glow: "rgba(107,63,160,0.3)" },
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======
const TEMPORAL_COLORS: Record<
  string,
  { deep: string; light: string; glow: string }
> = {
  Past: { deep: "#3d2e10", light: "#92702a", glow: "rgba(146,112,42,0.3)" },
  Present: { deep: "#2a4a5a", light: "#5ba4a4", glow: "rgba(91,164,164,0.3)" },
  Future: { deep: "#1a0a2e", light: "#6b3fa0", glow: "rgba(107,63,160,0.3)" },
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
};

const TEMPORAL_GLYPHS: Record<string, string> = {
  Past: "◆",
  Present: "●",
  Future: "▲",
};

<<<<<<< HEAD
<<<<<<< HEAD
=======
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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

<<<<<<< HEAD
=======
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
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
export default function OracleDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { hasResonance, getMatchingCodons } = usePersonalResonance();
  const oracleId = params.oracleId as string;

<<<<<<< HEAD
<<<<<<< HEAD
=======
  const [stage, setStage] = useState(0);

=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
  // Reveal stages
  const [stage, setStage] = useState(0);

  // Data
<<<<<<< HEAD
=======
  const [stage, setStage] = useState(0);

>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
  const { data: oracleData = [], isLoading } =
    trpc.archive.oracles.getByOracleId.useQuery(
      { oracleId },
      { enabled: !!oracleId },
    );

<<<<<<< HEAD
<<<<<<< HEAD
  // Get resonance count
=======
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
=======
  // Get resonance count
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
  const { data: resonanceData } = trpc.archive.resonances.getCount.useQuery(
    { oracleId },
    { enabled: !!oracleId },
  );

<<<<<<< HEAD
<<<<<<< HEAD
=======
  const resonanceCount =
    typeof resonanceData === "number" ? resonanceData : 0;
  const isFieldConfirmed = resonanceCount >= 20;

=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
  const resonanceCount = typeof resonanceData === "number" ? resonanceData : 0;
  const isFieldConfirmed = resonanceCount >= 20;

  // Group oracle parts by temporal direction
<<<<<<< HEAD
=======
  const resonanceCount =
    typeof resonanceData === "number" ? resonanceData : 0;
  const isFieldConfirmed = resonanceCount >= 20;

>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
  const organizedOracles = useMemo(() => {
    const result: Record<string, any> = {
      Past: null,
      Present: null,
      Future: null,
    };
    oracleData.forEach((o: any) => {
<<<<<<< HEAD
<<<<<<< HEAD
      if (o.part in result) {
        result[o.part] = o;
      }
=======
      if (o.part in result) result[o.part] = o;
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
      if (o.part in result) result[o.part] = o;
=======
      if (o.part in result) {
        result[o.part] = o;
      }
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
    });
    return result;
  }, [oracleData]);

  const primaryOracle = oracleData[0];
<<<<<<< HEAD
<<<<<<< HEAD
=======

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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======

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
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
    return (
      <Layout>
        <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
<<<<<<< HEAD
<<<<<<< HEAD
=======
            <p className="font-mono mb-4" style={{ color: "rgba(91,164,164,0.4)", fontSize: 12 }}>
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
            <p
              className="font-mono mb-4"
              style={{ color: "rgba(91,164,164,0.4)", fontSize: 12 }}
            >
<<<<<<< HEAD
=======
            <p className="font-mono mb-4" style={{ color: "rgba(91,164,164,0.4)", fontSize: 12 }}>
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
              ORACLE NOT FOUND
            </p>
            <button
              onClick={() => navigate("/archive")}
              className="font-mono flex items-center gap-2 mx-auto transition-colors"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.4)" }}
            >
<<<<<<< HEAD
<<<<<<< HEAD
              <ArrowLeft size={12} />
              RETURN TO ARCHIVE
=======
              <ArrowLeft size={12} /> RETURN TO ARCHIVE
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
              <ArrowLeft size={12} /> RETURN TO ARCHIVE
=======
              <ArrowLeft size={12} />
              RETURN TO ARCHIVE
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
          <Loader2
            className="w-5 h-5 animate-spin mx-auto mb-3"
            style={{ color: "rgba(91,164,164,0.3)" }}
          />
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======
          <Loader2
            className="w-5 h-5 animate-spin mx-auto mb-3"
            style={{ color: "rgba(91,164,164,0.3)" }}
          />
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
        </div>
      </Layout>
    );
  }

  const pastOracle = organizedOracles.Past;
  const presentOracle = organizedOracles.Present;
  const futureOracle = organizedOracles.Future;

<<<<<<< HEAD
<<<<<<< HEAD
=======
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======
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
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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

<<<<<<< HEAD
<<<<<<< HEAD
=======
      {/* Background temporal glyph */}
      <AnimatePresence>
        {stage >= 1 && primaryOracle && (
          <motion.div
            key="glyph-bg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.06, scale: 1 }}
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
      {/* Temporal glyph background */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div
            key="temporal-glyph"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.08, scale: 1 }}
<<<<<<< HEAD
=======
      {/* Background temporal glyph */}
      <AnimatePresence>
        {stage >= 1 && primaryOracle && (
          <motion.div
            key="glyph-bg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.06, scale: 1 }}
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
            transition={{ duration: 1 }}
            className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
          >
            <div
              style={{
                fontSize: "40vw",
<<<<<<< HEAD
<<<<<<< HEAD
                fontWeight: "300",
                color:
                  TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
=======
                color: TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
                color: TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
=======
                fontWeight: "300",
                color:
                  TEMPORAL_COLORS[primaryOracle.part || "Present"].light,
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
              }}
            >
              {TEMPORAL_GLYPHS[primaryOracle.part || "Present"]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

<<<<<<< HEAD
<<<<<<< HEAD
=======
      <div className="relative z-10 min-h-screen pt-20 pb-16">
        {/* Back nav */}
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
      {/* Scan lines */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 animate-scan-lines" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen pt-20 pb-16">
        {/* Back navigation */}
<<<<<<< HEAD
=======
      <div className="relative z-10 min-h-screen pt-20 pb-16">
        {/* Back nav */}
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
<<<<<<< HEAD
              <ArrowLeft size={12} />
              RETURN TO ARCHIVE
=======
              <ArrowLeft size={12} /> RETURN TO ARCHIVE
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
              <ArrowLeft size={12} /> RETURN TO ARCHIVE
=======
              <ArrowLeft size={12} />
              RETURN TO ARCHIVE
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
            </button>
          </div>
        </div>

        <div className="px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
<<<<<<< HEAD
<<<<<<< HEAD
=======
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======
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
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
                </motion.div>
              )}
            </AnimatePresence>

<<<<<<< HEAD
<<<<<<< HEAD
=======
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
<<<<<<< HEAD
=======
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
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
                  />
                </motion.div>
              )}
            </AnimatePresence>

<<<<<<< HEAD
<<<<<<< HEAD
=======
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
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
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
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

<<<<<<< HEAD
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
=======
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
=======
            {/* Linked Codons */}
            <AnimatePresence>
              {stage >= 5 && linkedCodons.length > 0 && (
                <motion.div
                  key="codons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mt-8 mb-8"
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
                >
                  <div
                    className="font-mono text-xs mb-4"
                    style={{ color: "rgba(91,164,164,0.5)" }}
                  >
<<<<<<< HEAD
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
<<<<<<< HEAD
=======
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
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
<<<<<<< HEAD
=======

<<<<<<< HEAD
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
=======
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
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
            </AnimatePresence>
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
          </div>
        </div>
      </div>
    </Layout>
  );
}
