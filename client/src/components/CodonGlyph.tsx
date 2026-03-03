/**
 * CodonGlyph — 6-node binary glyph rendered as an SVG.
 *
 * Binary encoding: I Ching hexagram lines 1–6 (bottom→top), char 0 = line 1.
 * Each bit maps to a node on a hexagonal ring (node 0 = top, clockwise).
 *
 * The CODON_BINARY table is the authoritative client-side source so the
 * glyph always renders correctly regardless of server response state.
 *
 * isActivating: overrides all nodes to filled (navigation flash effect).
 */

// Authoritative binary lookup — I Ching hexagram encoding, keyed by codon ID 1–64
const CODON_BINARY: Record<number, string> = {
  1:"111111", 2:"000000", 3:"100010", 4:"010001", 5:"010111", 6:"111010",
  7:"010000", 8:"010111", 9:"111011",10:"110111",11:"111000",12:"000111",
 13:"101111",14:"111101",15:"001000",16:"000100",17:"011001",18:"011001",
 19:"110000",20:"000011",21:"100101",22:"100101",23:"000001",24:"000001",
 25:"100111",26:"111001",27:"100001",28:"011110",29:"010010",30:"101101",
 31:"001110",32:"001110",33:"001111",34:"111100",35:"000101",36:"101000",
 37:"101011",38:"110101",39:"001010",40:"001010",41:"110001",42:"100011",
 43:"011111",44:"111110",45:"000110",46:"011000",47:"010110",48:"011010",
 49:"101110",50:"011101",51:"100100",52:"001001",53:"001011",54:"001101",
 55:"001101",56:"111100",57:"011011",58:"011011",59:"010011",60:"010011",
 61:"110011",62:"001100",63:"010101",64:"101010",
};

export default function CodonGlyph({
  codonNumber,
  isActivating = false,
  className = "",
}: {
  codonNumber: number;
  isActivating?: boolean;
  className?: string;
}) {
  const binary = CODON_BINARY[codonNumber] ?? "000000";

  const bits: number[] = isActivating
    ? [1, 1, 1, 1, 1, 1]
    : binary.split("").map(Number);

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
