import { Link } from "wouter";
<<<<<<< HEAD
import { ResonateButton } from "@/components/ResonateButton";
=======
import { motion } from "framer-motion";
import { ResonateButton } from "./ResonateButton";
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
import { usePersonalResonance } from "@/hooks/usePersonalResonance";

export interface OracleCardProps {
  id: number;
  oracleId: string;
  oxNumber: number;
  title: string;
  field: string;
  temporalDirection: "Past" | "Present" | "Future";
  content: string;
  hashtags: string[];
  status: "Draft" | "Confirmed" | "Deprecated" | "Prophetic";
  resonanceCount?: number;
  linkedCodons?: string[];
  threadId?: string;
}

<<<<<<< HEAD
const TEMPORAL_COLORS: Record<
  string,
  { glow: string; bg: string; light: string }
> = {
  Past: {
    glow: "rgba(146,112,42,0.35)",
    bg: "rgba(146,112,42,0.03)",
    light: "#92702a",
  },
  Present: {
    glow: "rgba(91,164,164,0.35)",
    bg: "rgba(91,164,164,0.03)",
    light: "#5ba4a4",
  },
  Future: {
    glow: "rgba(107,63,160,0.35)",
    bg: "rgba(107,63,160,0.03)",
=======
const TEMPORAL_COLORS: Record<string, { glow: string; bg: string; light: string }> = {
  Past: {
    glow: "#92702a",
    bg: "rgba(146, 112, 42, 0.03)",
    light: "#92702a",
  },
  Present: {
    glow: "#5ba4a4",
    bg: "rgba(91, 164, 164, 0.03)",
    light: "#5ba4a4",
  },
  Future: {
    glow: "#6b3fa0",
    bg: "rgba(107, 63, 160, 0.03)",
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
    light: "#6b3fa0",
  },
};

const TEMPORAL_GLYPHS: Record<string, string> = {
  Past: "◆",
  Present: "●",
  Future: "▲",
};

export function OracleCard({
  oracleId,
  oxNumber,
  title,
  field,
  temporalDirection,
  content,
  hashtags,
  status,
  resonanceCount = 0,
  linkedCodons = [],
  threadId,
}: OracleCardProps) {
<<<<<<< HEAD
  const colors = TEMPORAL_COLORS[temporalDirection] || TEMPORAL_COLORS.Present;
  const glyph = TEMPORAL_GLYPHS[temporalDirection] || "●";
  const { hasResonance } = usePersonalResonance();

  const isFieldConfirmed = resonanceCount >= 20;
  const hasPersonal = hasResonance(linkedCodons);

  return (
    <Link href={`/oracle/${oracleId}`}>
      <div
        className="group relative cursor-pointer"
        style={{
          // Golden thread for personal resonance
          borderLeft: hasPersonal ? "2px solid #D4AF37" : "none",
          paddingLeft: hasPersonal ? 0 : 0,
        }}
      >
        <div
          className="p-5 rounded-sm transition-all duration-500 relative overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at top left, ${colors.bg}, rgba(10,10,14,0.8))`,
            border: `1px solid ${isFieldConfirmed ? "rgba(212,175,55,0.3)" : colors.glow}`,
            boxShadow: isFieldConfirmed
              ? "0 0 20px rgba(212,175,55,0.1)"
              : "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isFieldConfirmed
              ? "rgba(212,175,55,0.5)"
              : colors.light;
            e.currentTarget.style.boxShadow = `0 0 30px ${colors.glow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isFieldConfirmed
              ? "rgba(212,175,55,0.3)"
              : colors.glow;
            e.currentTarget.style.boxShadow = isFieldConfirmed
              ? "0 0 20px rgba(212,175,55,0.1)"
              : "none";
          }}
        >
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="text-3xl transition-all duration-300"
                style={{
                  color: colors.light,
                  filter: `drop-shadow(0 0 6px ${colors.glow})`,
                }}
              >
                {glyph}
              </span>
              <span
                className="font-mono tracking-wider"
                style={{ fontSize: 10, color: `${colors.light}66` }}
              >
                ΩX-{String(oxNumber).padStart(3, "0")}.{temporalDirection[0]}
              </span>
            </div>
            {hasPersonal ? (
              <span
                className="font-mono tracking-widest"
                style={{ fontSize: 8, color: "#D4AF37" }}
              >
                ⟡ PERSONAL
              </span>
            ) : (
              <span
                className="font-mono tracking-widest px-2 py-0.5 rounded-sm border"
                style={{
                  fontSize: 7,
                  color: colors.light,
                  borderColor: `${colors.light}25`,
                  background: colors.bg,
                }}
              >
                {status}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-mono text-sm uppercase tracking-wider mb-1 transition-colors duration-300"
            style={{ color: "rgba(232,228,220,0.85)" }}
          >
            {title}
          </h3>

          {/* Field */}
          <p
            className="font-mono tracking-wider mb-4"
            style={{ fontSize: 10, color: `${colors.light}44` }}
          >
            {field}
          </p>

          {/* Content preview */}
          <p
            className="font-mono italic leading-relaxed line-clamp-2 mb-4"
            style={{ fontSize: 11, color: "rgba(232,228,220,0.3)" }}
          >
            &ldquo;{content}&rdquo;
          </p>

          {/* Hashtags */}
          {hashtags && hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {hashtags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="font-mono"
                  style={{ fontSize: 8, color: `${colors.light}44` }}
                >
                  #{tag}
                </span>
=======
  const colors = TEMPORAL_COLORS[temporalDirection];
  const isFieldConfirmed = resonanceCount >= 20;
  const { hasResonance } = usePersonalResonance();
  const hasPersonalResonance = hasResonance(linkedCodons);

  return (
    <Link href={`/oracle/${oracleId}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="group relative h-full cursor-pointer overflow-hidden"
        style={{
          background: `rgba(10,10,14,0.8)`,
        }}
      >
        {/* Golden thread indicator for personal resonance */}
        {hasPersonalResonance && (
          <div
            className="absolute inset-y-0 left-0 pointer-events-none"
            style={{
              width: "2px",
              background: "#D4AF37",
              boxShadow: "0 0 12px rgba(212, 175, 55, 0.5), inset 0 0 8px rgba(212, 175, 55, 0.3)",
            }}
          />
        )}
        {/* Custom border glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            border: `1px solid ${colors.glow}`,
            boxShadow: `0 0 20px ${colors.glow}33, inset 0 0 20px ${colors.glow}11`,
            borderRadius: 2,
          }}
        />

        {/* Static border */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: `1px solid ${colors.glow}`,
            opacity: 0.3,
            borderRadius: 2,
          }}
        />

        {/* Background radial gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top-right, ${colors.bg}, transparent)`,
            borderRadius: 2,
          }}
        />

        {/* Subtle scan line effect on hover */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              ${colors.glow}11 2px,
              ${colors.glow}11 4px
            )`,
            borderRadius: 2,
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-5 flex flex-col h-full">
          {/* Header */}
          <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${colors.glow}22` }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              {/* Temporal glyph + ID */}
              <div className="flex items-center gap-2 flex-1">
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: 20, color: colors.light }}
                >
                  {TEMPORAL_GLYPHS[temporalDirection]}
                </motion.div>
                <div
                  className="font-mono text-xs"
                  style={{ color: `${colors.light}66` }}
                >
                  {oracleId}
                </div>
              </div>

              {/* Personal Signal or Status badge */}
              {hasPersonalResonance ? (
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="px-2 py-1 font-mono text-xs"
                  style={{
                    border: `1px solid #D4AF37`,
                    color: "#D4AF37",
                    borderRadius: 1,
                  }}
                >
                  ⟡ PERSONAL
                </motion.div>
              ) : (
                <div
                  className="px-2 py-1 font-mono text-xs"
                  style={{
                    border: `1px solid ${colors.glow}44`,
                    color: `${colors.light}99`,
                    borderRadius: 1,
                  }}
                >
                  {status}
                </div>
              )}
            </div>

            {/* Title */}
            <h3
              className="text-sm font-semibold leading-tight group-hover:opacity-100 transition-opacity uppercase tracking-wider"
              style={{ color: colors.light }}
            >
              {title}
            </h3>

            {/* Field */}
            <div
              className="text-xs mt-1"
              style={{ color: `${colors.light}77` }}
            >
              {field}
            </div>
          </div>

          {/* Content preview */}
          <div className="flex-1 mb-4">
            <p
              className="text-xs leading-relaxed line-clamp-2 italic"
              style={{ color: `${colors.light}aa` }}
            >
              {content}
            </p>
          </div>

          {/* Resonance indicator */}
          {resonanceCount > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <div className="font-mono text-xs" style={{ color: `${colors.light}66` }}>
                SIGNAL
              </div>
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2"
                    style={{
                      background:
                        i < Math.min(4, Math.ceil(resonanceCount / 10))
                          ? colors.light
                          : `${colors.light}22`,
                      borderRadius: 1,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Linked Codons */}
          {linkedCodons && linkedCodons.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {linkedCodons.slice(0, 2).map((codon: string, i: number) => (
                <div
                  key={i}
                  className="px-2 py-1 font-mono text-xs"
                  style={{
                    border: `1px solid ${colors.glow}33`,
                    color: `${colors.light}77`,
                    borderRadius: 1,
                  }}
                >
                  {codon}
                </div>
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
              ))}
              {linkedCodons.length > 2 && (
                <div
                  className="px-2 py-1 font-mono text-xs"
                  style={{
                    color: `${colors.light}55`,
                  }}
                >
                  +{linkedCodons.length - 2}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div
<<<<<<< HEAD
            className="flex items-center justify-between pt-3"
            style={{ borderTop: `1px solid ${colors.glow}` }}
          >
            <div className="flex items-center gap-3">
              {/* Resonate button (prevent nav) */}
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <ResonateButton
                  oracleId={oracleId}
                  temporalColor={colors.light}
                  size="sm"
                />
              </div>
              {threadId && (
                <span
                  className="font-mono"
                  style={{ fontSize: 8, color: "rgba(91,164,164,0.4)" }}
=======
            className="flex items-center justify-between text-xs font-mono pt-3"
            style={{ borderTop: `1px solid ${colors.glow}22`, color: `${colors.light}66` }}
          >
            <div className="flex items-center gap-2">
              {isFieldConfirmed && (
                <span
                  style={{
                    color: "#D4AF37",
                    fontWeight: 500,
                  }}
                >
                  ★ CONFIRMED
                </span>
              )}
              {threadId && (
                <span
                  style={{
                    color: "rgba(91,164,164,0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "9px",
                  }}
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
                >
                  🔗 THREAD
                </span>
              )}
            </div>
<<<<<<< HEAD
            <span
              className="font-mono tracking-wider transition-all duration-300 group-hover:translate-x-0.5"
              style={{ fontSize: 9, color: `${colors.light}44` }}
            >
              RECEIVE →
            </span>
          </div>
        </div>
      </div>
=======
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex items-center gap-3"
            >
              <ResonateButton oracleId={oracleId} temporalColor={colors.light} size="sm" />
              <span
                className="group-hover:translate-x-1 transition-transform duration-300"
                style={{ color: colors.light }}
              >
                RECEIVE →
              </span>
            </div>
          </div>
        </div>

        {/* Field-Confirmed gold border overlay */}
        {isFieldConfirmed && (
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              border: `1px solid #D4AF3755`,
              boxShadow: `0 0 15px #D4AF3722`,
              borderRadius: 2,
            }}
          />
        )}
      </motion.div>
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
    </Link>
  );
}
