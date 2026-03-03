/**
 * CodonGlyph — 6-node binary glyph rendered as an SVG.
 *
 * Each of the 6 nodes maps to one bit of the codon's binary string.
 * Node 0 = top, clockwise. Filled + glowing = bit "1".
 *
 * isActivating: overrides all nodes to filled (used during navigation flash).
 */
export default function CodonGlyph({
  binary,
  codonNumber,
  isActivating = false,
  className = "",
}: {
  binary?: string;
  codonNumber: number;
  isActivating?: boolean;
  className?: string;
}) {
  const bits: number[] = isActivating
    ? [1, 1, 1, 1, 1, 1]
    : binary
      ? binary.split("").map(Number)
      : Array.from({ length: 6 }, (_, i) => (codonNumber >> i) & 1);

  const cx = 50, cy = 50, orbitR = 34, dotR = 8;

  const nodes = bits.map((bit, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    return {
      x: cx + orbitR * Math.cos(angle),
      y: cy + orbitR * Math.sin(angle),
      filled: bit === 1,
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label={`Codon ${codonNumber} glyph`}
    >
      {/* Orbit ring */}
      <circle
        cx={cx} cy={cy} r={orbitR}
        fill="none"
        stroke="currentColor"
        strokeOpacity={isActivating ? 0.6 : 0.12}
        strokeWidth={isActivating ? 1.5 : 1}
      />
      {/* Lines between adjacent filled nodes */}
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % 6];
        if (!node.filled || !next.filled) return null;
        return (
          <line
            key={`l${i}`}
            x1={node.x} y1={node.y}
            x2={next.x} y2={next.y}
            stroke="currentColor"
            strokeWidth={isActivating ? 1.5 : 1}
            strokeOpacity={isActivating ? 0.7 : 0.35}
          />
        );
      })}
      {/* Centre dot */}
      <circle cx={cx} cy={cy} r={2.5} fill="currentColor" opacity={isActivating ? 0.8 : 0.3} />
      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={`n${i}`}>
          {node.filled && (
            <circle
              cx={node.x} cy={node.y}
              r={dotR + (isActivating ? 6 : 4)}
              fill="currentColor"
              opacity={isActivating ? 0.25 : 0.10}
            />
          )}
          <circle
            cx={node.x} cy={node.y}
            r={dotR}
            fill={node.filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={node.filled ? 0 : 1.5}
            opacity={node.filled ? (isActivating ? 1 : 0.95) : 0.22}
          />
        </g>
      ))}
    </svg>
  );
}
