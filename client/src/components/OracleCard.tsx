import { motion } from "framer-motion";
import { Link } from "wouter";
import { ResonateButton } from "@/components/ResonateButton";
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
  const colors =
    TEMPORAL_COLORS[temporalDirection] || TEMPORAL_COLORS.Present;
  const glyph = TEMPORAL_GLYPHS[temporalDirection] || "●";
  const { hasResonance } = usePersonalResonance();

  const isFieldConfirmed = resonanceCount >= 20;
  const hasPersonal = hasResonance(linkedCodons);

  return (
    <Link href={`/oracle/${oracleId}`}>
      <div
        className="group relative cursor-pointer"
        style={{
          borderLeft: hasPersonal ? "2px solid #D4AF37" : "none",
          boxShadow: hasPersonal
            ? "0 0 12px rgba(212,175,55,0.16)"
            : "none",
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
              <motion.span
                className="font-mono tracking-widest"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ fontSize: 8, color: "#D4AF37" }}
              >
                ⟡ PERSONAL
              </motion.span>
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

          <h3
            className="font-mono text-sm uppercase tracking-wider mb-1 transition-colors duration-300"
            style={{ color: "rgba(232,228,220,0.85)" }}
          >
            {title}
          </h3>

          <p
            className="font-mono tracking-wider mb-4"
            style={{ fontSize: 10, color: `${colors.light}44` }}
          >
            {field}
          </p>

          <p
            className="font-mono italic leading-relaxed line-clamp-2 mb-4"
            style={{ fontSize: 11, color: "rgba(232,228,220,0.3)" }}
          >
            &ldquo;{content}&rdquo;
          </p>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {hashtags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="font-mono"
                  style={{ fontSize: 8, color: `${colors.light}44` }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: `1px solid ${colors.glow}` }}
          >
            <div className="flex items-center gap-3">
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
                >
                  🔗 THREAD
                </span>
              )}
            </div>
            <span
              className="font-mono tracking-wider transition-all duration-300 group-hover:translate-x-0.5"
              style={{ fontSize: 9, color: `${colors.light}44` }}
            >
              RECEIVE →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
