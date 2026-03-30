import Layout from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

// ── Temporal direction config ────────────────────────────────────────
const TEMPORAL_SYMBOL: Record<string, string> = {
  Past: "◆",
  Present: "●",
  Future: "▲",
};

const TEMPORAL_COLOR: Record<string, string> = {
  Past: "#bda36b",
  Present: "#7ab8c4",
  Future: "#a88fd0",
};

const TEMPORAL_PART_INITIAL: Record<string, string> = {
  Past: "P",
  Present: "R",
  Future: "F",
};

const CH_COLORS: Record<string, string> = {
  OPEN: "#5ba4a4",
  RESONANT: "#7ab8c4",
  COHERENT: "#a88fd0",
  PROPHETIC: "#bda36b",
  LIVE: "#e05555",
};

export default function OracleDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const oracleId = params.id ? parseInt(params.id) : null;

  // Protocol reveal stage
  const [stage, setStage] = useState(0);
  const [vlsText, setVlsText] = useState("");

  // Data
  const { data: oracle, isLoading } = trpc.archive.oracles.getById.useQuery(
    { id: oracleId || 0 },
    { enabled: !!oracleId },
  );

  // All oracles for prev/next navigation
  const { data: allOracles = [] } = trpc.archive.oracles.list.useQuery();

  // Sort by oracleNumber for navigation
  const sorted = useMemo(
    () => [...allOracles].sort((a: any, b: any) => a.oracleNumber - b.oracleNumber),
    [allOracles],
  );
  const currentIndex = sorted.findIndex((o: any) => o.id === oracleId);
  const prevOracle = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextOracle =
    currentIndex >= 0 && currentIndex < sorted.length - 1
      ? sorted[currentIndex + 1]
      : null;

  // ── Progressive reveal ──────────────────────────────────────────
  useEffect(() => {
    if (!oracle) return;

    setStage(0);
    setVlsText("");

    const ox = oracle as any;
    const partInitial = TEMPORAL_PART_INITIAL[ox.part] || "X";
    const vls = `VLS// RECEIVE.node ΩX-${String(ox.oracleNumber).padStart(3, "0")}.${partInitial}`;
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      charIndex++;
      setVlsText(vls.substring(0, charIndex));
      if (charIndex >= vls.length) {
        clearInterval(typeInterval);
        setTimeout(() => setStage(1), 300);
        setTimeout(() => setStage(2), 900);
        setTimeout(() => setStage(3), 1500);
        setTimeout(() => setStage(4), 2400);
        setTimeout(() => setStage(5), 3200);
        setTimeout(() => setStage(6), 3800);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [(oracle as any)?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading / Error states ──────────────────────────────────────
  if (!oracleId) {
    return (
      <Layout>
        <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <p className="font-mono mb-4" style={{ color: "#e05555", fontSize: 12 }}>
              SIGNAL NOT FOUND
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
              style={{ color: "rgba(168,143,208,0.3)" }}
            />
            <p
              className="font-mono tracking-wider"
              style={{ fontSize: 10, color: "rgba(168,143,208,0.2)" }}
            >
              TUNING ORACLE FREQUENCY...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!oracle) {
    return (
      <Layout>
        <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <p
              className="font-mono mb-4"
              style={{ color: "rgba(168,143,208,0.3)", fontSize: 12 }}
            >
              ORACLE TRANSMISSION NOT FOUND
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

  // ── Parsed data ─────────────────────────────────────────────────
  const ox = oracle as any;
  let hashtags: string[] = [];
  if (Array.isArray(ox.hashtags)) {
    hashtags = ox.hashtags;
  } else if (typeof ox.hashtags === "string") {
    try {
      hashtags = JSON.parse(ox.hashtags);
    } catch {
      hashtags = ox.hashtags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
  }

  const clarity = parseFloat(ox.signalClarity?.replace("%", "") || "0");
  const temporalColor = TEMPORAL_COLOR[ox.part] || "#5ba4a4";
  const temporalSymbol = TEMPORAL_SYMBOL[ox.part] || "●";
  const statusColor = CH_COLORS[ox.channelStatus] || temporalColor;
  const oxLabel = `ΩX-${String(ox.oracleNumber).padStart(3, "0")}.${TEMPORAL_PART_INITIAL[ox.part] || "X"}`;

  return (
    <Layout>
      {/* ── Background ──────────────────────────────────── */}
      <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 animate-scan-lines" />
      </div>

      <div className="relative z-10 min-h-screen pt-20 pb-16">
        {/* ── Back navigation ─────────────────────────────── */}
        <div className="px-6 md:px-12 mb-12">
          <div className="max-w-3xl mx-auto">
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
          <div className="max-w-3xl mx-auto">
            {/* ── VLS Command ───────────────────────────────── */}
            <div className="mb-10">
              <span
                className="font-mono tracking-wider"
                style={{ fontSize: 12, color: `${temporalColor}80` }}
              >
                {vlsText}
                <span className="animate-pulse" style={{ opacity: 0.6 }}>
                  _
                </span>
              </span>
            </div>

            {/* ── Signal Clarity Bar ────────────────────────── */}
            <div
              className="mb-10 transition-opacity"
              style={{ opacity: stage >= 1 ? 1 : 0, transitionDuration: "600ms" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex-1 relative overflow-hidden rounded-full"
                  style={{ height: 1, background: `${temporalColor}14` }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: stage >= 1 ? `${clarity}%` : "0%",
                      background: `${temporalColor}59`,
                      transition: "width 2s ease-out",
                    }}
                  />
                </div>
                <span
                  className="font-mono"
                  style={{ fontSize: 9, color: `${temporalColor}59` }}
                >
                  {ox.signalClarity}
                </span>
              </div>
            </div>

            {/* ── ORACLE:: OPEN ────────────────────────────── */}
            <div
              className="mb-12"
              style={{
                opacity: stage >= 1 ? 1 : 0,
                transform: stage >= 1 ? "translateY(0)" : "translateY(8px)",
                transition: "all 700ms ease-out",
              }}
            >
              <span
                className="font-mono tracking-widest"
                style={{ fontSize: 10, color: `${temporalColor}59` }}
              >
                ORACLE:: OPEN
              </span>
            </div>

            {/* ── Title Block ───────────────────────────────── */}
            <div
              className="mb-12"
              style={{
                opacity: stage >= 2 ? 1 : 0,
                transform: stage >= 2 ? "translateY(0)" : "translateY(12px)",
                transition: "all 800ms ease-out",
              }}
            >
              {/* Symbol + ID + Status */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="text-3xl"
                  style={{
                    color: temporalColor,
                    filter: `drop-shadow(0 0 12px ${temporalColor}40)`,
                  }}
                >
                  {temporalSymbol}
                </span>
                <span
                  className="font-mono tracking-wider"
                  style={{ fontSize: 10, color: `${temporalColor}59` }}
                >
                  {oxLabel}
                </span>
                <span
                  className="font-mono tracking-widest px-2.5 py-0.5 rounded-sm border"
                  style={{
                    fontSize: 8,
                    color: statusColor,
                    borderColor: `${statusColor}25`,
                  }}
                >
                  {ox.channelStatus}
                </span>
                <span
                  className="font-mono tracking-widest px-2.5 py-0.5 rounded-sm border"
                  style={{
                    fontSize: 8,
                    color: temporalColor,
                    borderColor: `${temporalColor}20`,
                  }}
                >
                  {ox.part?.toUpperCase()}
                </span>
              </div>

              {/* Title */}
              <h1
                className="text-3xl md:text-5xl uppercase tracking-wide mb-4"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  color: "#e8e4dc",
                  lineHeight: 1.15,
                }}
              >
                {ox.title}
              </h1>

              {/* Field */}
              <p
                className="font-mono tracking-wider"
                style={{ fontSize: 11, color: `${temporalColor}40` }}
              >
                {ox.field}
              </p>
            </div>

            {/* ── Main Content ───────────────────────────────── */}
            <div
              className="mb-14"
              style={{
                opacity: stage >= 3 ? 1 : 0,
                transform: stage >= 3 ? "translateY(0)" : "translateY(12px)",
                transition: "all 1000ms ease-out",
              }}
            >
              <div
                className="py-3"
                style={{
                  borderLeft: `1px solid ${temporalColor}26`,
                  paddingLeft: 24,
                }}
              >
                <p
                  className="font-mono italic"
                  style={{
                    fontSize: "clamp(13px, 1.4vw, 16px)",
                    color: "rgba(232,228,220,0.75)",
                    lineHeight: 2,
                  }}
                >
                  {ox.content}
                </p>
              </div>
            </div>

            {/* ── Oracle-specific metadata sections ─────────── */}
            <div
              style={{
                opacity: stage >= 4 ? 1 : 0,
                transform: stage >= 4 ? "translateY(0)" : "translateY(12px)",
                transition: "all 700ms ease-out",
              }}
            >
              {ox.currentFieldSignatures && (
                <OracleMetaBlock
                  label="CURRENT FIELD SIGNATURES"
                  content={ox.currentFieldSignatures}
                  color={temporalColor}
                />
              )}

              {ox.encodedTrajectory && (
                <OracleMetaBlock
                  label="ENCODED TRAJECTORY"
                  content={ox.encodedTrajectory}
                  color={temporalColor}
                />
              )}

              {ox.convergenceZones && (
                <OracleMetaBlock
                  label="CONVERGENCE ZONES"
                  content={ox.convergenceZones}
                  color={temporalColor}
                />
              )}

              {ox.keyInflectionPoint && (
                <OracleMetaBlock
                  label="KEY INFLECTION POINT"
                  content={ox.keyInflectionPoint}
                  color={temporalColor}
                />
              )}

              {ox.majorOutcomes && (
                <OracleMetaBlock
                  label="MAJOR OUTCOMES"
                  content={ox.majorOutcomes}
                  color={temporalColor}
                />
              )}
            </div>

            {/* ── Hashtags ──────────────────────────────────── */}
            {hashtags.length > 0 && (
              <div
                className="mb-10"
                style={{
                  opacity: stage >= 4 ? 1 : 0,
                  transition: "opacity 700ms ease-out",
                }}
              >
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag: string) => (
                    <span
                      key={tag}
                      className="font-mono px-2.5 py-1 rounded-sm border"
                      style={{
                        fontSize: 9,
                        color: `${temporalColor}33`,
                        borderColor: `${temporalColor}14`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── ORACLE:: CLOSE ───────────────────────────── */}
            <div
              className="mb-16"
              style={{
                opacity: stage >= 5 ? 1 : 0,
                transform: stage >= 5 ? "translateY(0)" : "translateY(8px)",
                transition: "all 700ms ease-out",
              }}
            >
              <span
                className="font-mono tracking-widest"
                style={{ fontSize: 10, color: `${temporalColor}59` }}
              >
                ORACLE:: CLOSE
              </span>
            </div>

            {/* ── Navigation ────────────────────────────────── */}
            <div
              style={{
                opacity: stage >= 6 ? 1 : 0,
                transform: stage >= 6 ? "translateY(0)" : "translateY(12px)",
                transition: "all 700ms ease-out",
              }}
            >
              <div
                className="pt-10"
                style={{ borderTop: "1px solid rgba(91,164,164,0.06)" }}
              >
                <div className="flex justify-between items-start">
                  {/* Prev */}
                  {prevOracle ? (
                    <Link href={`/oracle/${(prevOracle as any).id}`}>
                      <div className="group cursor-pointer max-w-[45%]">
                        <div className="flex items-center gap-2 mb-2">
                          <ChevronLeft
                            size={12}
                            style={{ color: "rgba(91,164,164,0.2)" }}
                            className="group-hover:text-[#5ba4a4]/50 transition-colors"
                          />
                          <span
                            className="font-mono tracking-wider transition-colors group-hover:text-[#5ba4a4]/50"
                            style={{ fontSize: 9, color: "rgba(91,164,164,0.2)" }}
                          >
                            PREV ORACLE
                          </span>
                        </div>
                        <p
                          className="font-mono uppercase tracking-wider truncate transition-colors group-hover:text-[#e8e4dc]/50"
                          style={{ fontSize: 12, color: "rgba(232,228,220,0.25)" }}
                        >
                          {(prevOracle as any).title}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {/* Next */}
                  {nextOracle ? (
                    <Link href={`/oracle/${(nextOracle as any).id}`}>
                      <div className="group cursor-pointer text-right max-w-[45%]">
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <span
                            className="font-mono tracking-wider transition-colors group-hover:text-[#5ba4a4]/50"
                            style={{ fontSize: 9, color: "rgba(91,164,164,0.2)" }}
                          >
                            NEXT ORACLE
                          </span>
                          <ChevronRight
                            size={12}
                            style={{ color: "rgba(91,164,164,0.2)" }}
                            className="group-hover:text-[#5ba4a4]/50 transition-colors"
                          />
                        </div>
                        <p
                          className="font-mono uppercase tracking-wider truncate transition-colors group-hover:text-[#e8e4dc]/50"
                          style={{ fontSize: 12, color: "rgba(232,228,220,0.25)" }}
                        >
                          {(nextOracle as any).title}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </div>

              {/* Footer ambient */}
              <div className="mt-16 text-center">
                <span
                  className="font-mono tracking-widest"
                  style={{ fontSize: 8, color: "rgba(189,163,107,0.12)" }}
                >
                  THE FIELD SPEAKS ACROSS TIME
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ── Oracle metadata block ────────────────────────────────────────────
function OracleMetaBlock({
  label,
  content,
  color,
}: {
  label: string;
  content: string;
  color: string;
}) {
  return (
    <div
      className="mb-8 p-5 rounded-sm"
      style={{
        border: `1px solid ${color}1f`,
        background: `${color}05`,
      }}
    >
      <div
        className="font-mono uppercase tracking-widest mb-3"
        style={{ fontSize: 9, color: `${color}59` }}
      >
        {label}
      </div>
      <p
        className="font-mono"
        style={{ fontSize: 12, color: `${color}8c`, lineHeight: 1.8 }}
      >
        {content}
      </p>
    </div>
  );
}
