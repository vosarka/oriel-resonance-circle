import { useState, useEffect, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// VOSSARI CONDUIT HUB — Static Signature Reading Interface
// ═══════════════════════════════════════════════════════════

// ─── Mock Data: Sample Receiver ───
const SAMPLE_RECEIVER = {
  name: "Seeker",
  birthDate: "1991-06-14",
  birthTime: "03:42 UTC",
  birthLocation: "47.79°N, 22.88°E",
  fractalRole: "Resonator",
  fractalSub: "Manifesting",
  authority: "Emotional Resonance",
  coherenceScore: 72,
  definedCenters: ["SACRAL", "SOLAR", "THROAT", "ROOT", "SPLEEN"],
  openCenters: ["HEAD", "AJNA", "G", "HEART"],
};

// ─── Prime Stack: 9 Positions ───
const PRIME_STACK = [
  { pos: 1, label: "Conscious Sun", planet: "Sun", weight: 1.8, freqType: "shadow", codonId: 38, facet: "B", codonName: "THE FIGHTER", role: "Core identity", sli: 0.74 },
  { pos: 2, label: "Design Sun", planet: "Earth", weight: 1.3, freqType: "gift", codonId: 57, facet: "A", codonName: "INTUITIVE CLARITY", role: "Life direction", sli: 0.31 },
  { pos: 3, label: "Personality Sun", planet: "Moon", weight: 1.0, freqType: "crown", codonId: 12, facet: "C", codonName: "CAUTION", role: "Personality expression", sli: 0.55 },
  { pos: 4, label: "Conscious Moon", planet: "Mercury", weight: 0.9, freqType: "siddhi", codonId: 45, facet: "D", codonName: "THE GATHERER", role: "Conscious mind", sli: 0.22 },
  { pos: 5, label: "Design Moon", planet: "Venus", weight: 0.8, freqType: "gift", codonId: 35, facet: "A", codonName: "CHANGE", role: "Design mind", sli: 0.41 },
  { pos: 6, label: "Personality Moon", planet: "Mars", weight: 0.7, freqType: "siddhi", codonId: 16, facet: "B", codonName: "SKILLS", role: "Personality mind", sli: 0.63 },
  { pos: 7, label: "Nodes", planet: "Jupiter", weight: 0.6, freqType: "crown", codonId: 25, facet: "C", codonName: "INNOCENCE", role: "Growth axis", sli: 0.18 },
  { pos: 8, label: "Earth", planet: "Saturn", weight: 0.5, freqType: "siddhi", codonId: 51, facet: "A", codonName: "SHOCK", role: "Grounding", sli: 0.82 },
  { pos: 9, label: "Chiron", planet: "Uranus", weight: 0.5, freqType: "shadow", codonId: 42, facet: "D", codonName: "INCREASE", role: "Wound/wisdom", sli: 0.91 },
];

// ─── All 64 Codons (simplified for navigator) ───
const CODON_NAMES = {
  1:"THE CREATIVE",2:"THE RECEPTIVE",3:"DIFFICULTY",4:"YOUTHFUL FOLLY",5:"WAITING",
  6:"CONFLICT",7:"THE ARMY",8:"HOLDING TOGETHER",9:"SMALL TAMING",10:"TREADING",
  11:"PEACE",12:"CAUTION",13:"FELLOWSHIP",14:"GREAT POSSESSION",15:"MODESTY",
  16:"SKILLS",17:"FOLLOWING",18:"CORRECTION",19:"APPROACH",20:"CONTEMPLATION",
  21:"BITING THROUGH",22:"GRACE",23:"SPLITTING APART",24:"RETURN",25:"INNOCENCE",
  26:"THE TAMING",27:"NOURISHMENT",28:"THE FIGHTER (GREAT)",29:"THE ABYSS",30:"THE CLINGING",
  31:"INFLUENCE",32:"DURATION",33:"THE RETREAT",34:"GREAT POWER",35:"CHANGE",
  36:"DARKENING",37:"THE FAMILY",38:"THE FIGHTER",39:"OBSTRUCTION",40:"DELIVERANCE",
  41:"DECREASE",42:"INCREASE",43:"BREAKTHROUGH",44:"COMING TO MEET",45:"THE GATHERER",
  46:"PUSHING UPWARD",47:"OPPRESSION",48:"THE WELL",49:"REVOLUTION",50:"THE CAULDRON",
  51:"SHOCK",52:"KEEPING STILL",53:"DEVELOPMENT",54:"THE BRIDE",55:"ABUNDANCE",
  56:"THE WANDERER",57:"INTUITIVE CLARITY",58:"JOY",59:"THE FUSION",60:"LIMITATION",
  61:"INNER TRUTH",62:"SMALL DETAIL",63:"AFTER COMPLETION",64:"BEFORE COMPLETION"
};

const CODON_BINARIES = {
  1:"111111",2:"000000",3:"010001",4:"100010",5:"010111",6:"010110",7:"000010",
  8:"000100",9:"110111",10:"110111",11:"000111",12:"110000",13:"111010",14:"111001",
  15:"000100",16:"011001",17:"011001",18:"010110",19:"000011",20:"000100",21:"101001",
  22:"101100",23:"100000",24:"000001",25:"111001",26:"111000",27:"100001",28:"011110",
  29:"010010",30:"101101",31:"011100",32:"011110",33:"011100",34:"001111",35:"000101",
  36:"101000",37:"101011",38:"110010",39:"010100",40:"010110",41:"100011",42:"110001",
  43:"011111",44:"111100",45:"011000",46:"011000",47:"011010",48:"010100",49:"011101",
  50:"011100",51:"001001",52:"100100",53:"110100",54:"001011",55:"001101",56:"110010",
  57:"110110",58:"011011",59:"110010",60:"001010",61:"110011",62:"001100",63:"010101",64:"101010"
};

// Frequency data per codon (sample subset)
const CODON_FREQ = {
  38: { shadow: "Struggle", gift: "Perseverance", siddhi: "Honor" },
  57: { shadow: "Unease", gift: "Intuition", siddhi: "Clarity" },
  12: { shadow: "Vanity", gift: "Discrimination", siddhi: "Purity" },
  45: { shadow: "Dominance", gift: "Synergy", siddhi: "Communion" },
  35: { shadow: "Hunger", gift: "Adventure", siddhi: "Boundlessness" },
  16: { shadow: "Indifference", gift: "Versatility", siddhi: "Mastery" },
  25: { shadow: "Constriction", gift: "Acceptance", siddhi: "Universal Love" },
  51: { shadow: "Agitation", gift: "Initiative", siddhi: "Awakening" },
  42: { shadow: "Expectation", gift: "Detachment", siddhi: "Celebration" },
};

const FACET_META = {
  A: { name: "Somatic", keyword: "Physical Anchor", color: "#c94444" },
  B: { name: "Relational", keyword: "Interaction Field", color: "#44a866" },
  C: { name: "Cognitive", keyword: "Mental Processing", color: "#4488cc" },
  D: { name: "Transpersonal", keyword: "Spirit / Collective", color: "#d4c090" },
};

const CENTER_META = {
  HEAD: { name: "Crown Aperture", type: "Pressure", y: 0 },
  AJNA: { name: "Ajna Lens", type: "Awareness", y: 1 },
  THROAT: { name: "Voice Portal", type: "Manifestation", y: 2 },
  G: { name: "Vector Core", type: "Identity", y: 3 },
  HEART: { name: "Heart Gateway", type: "Motor", y: 3.5 },
  SPLEEN: { name: "Instinct Node", type: "Awareness", y: 4 },
  SACRAL: { name: "Sacral Generator", type: "Motor", y: 5 },
  SOLAR: { name: "Solar Nexus", type: "Motor/Awareness", y: 4.5 },
  ROOT: { name: "Foundation Node", type: "Pressure/Motor", y: 6 },
};

// ─── Mandala Sequence from Implementation Manual ───
const MANDALA_SEQ = [
  51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,
  53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,
  57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,
  54,61,60,41,19,13,49,30,55,37,63,22,36,25,17,21
];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function VossariSignatureReading() {
  const [activeView, setActiveView] = useState("signature");
  const [selectedCodon, setSelectedCodon] = useState(null);
  const [selectedStackPos, setSelectedStackPos] = useState(null);
  const [hoveredCodon, setHoveredCodon] = useState(null);
  const [animIn, setAnimIn] = useState(false);
  const [transmissionStep, setTransmissionStep] = useState(0);

  useEffect(() => { setTimeout(() => setAnimIn(true), 100); }, []);

  // User's codon IDs for highlighting in mandala
  const userCodonIds = useMemo(() => new Set(PRIME_STACK.map(p => p.codonId)), []);

  // Hamming weight for binomial rings
  const hammingWeight = useCallback((bin) => {
    if (!bin) return 3;
    return bin.split("").filter(b => b === "1").length;
  }, []);

  // Group codons into binomial rings
  const mandalaRings = useMemo(() => {
    const rings = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (let i = 1; i <= 64; i++) {
      const bin = CODON_BINARIES[i] || "000000";
      const w = hammingWeight(bin);
      rings[w].push(i);
    }
    return rings;
  }, [hammingWeight]);

  // ─── STYLES ───
  const C = {
    void: "#0a0a0e",
    deep: "#0f0f15",
    surface: "#14141c",
    surfaceR: "#1a1a24",
    border: "rgba(189,163,107,0.12)",
    borderH: "rgba(189,163,107,0.25)",
    gold: "#bda36b",
    goldL: "#d4c090",
    goldDim: "rgba(189,163,107,0.5)",
    teal: "#5ba4a4",
    tealDim: "rgba(91,164,164,0.4)",
    txt: "#e8e4dc",
    txtS: "#9a968e",
    txtD: "#6a665e",
    red: "#c94444",
    green: "#44a866",
    blue: "#4488cc",
  };

  const freqColor = (t) => {
    if (t === "shadow") return C.red;
    if (t === "gift") return C.green;
    if (t === "crown") return C.goldL;
    if (t === "siddhi") return C.teal;
    return C.txtS;
  };

  // ─── RENDER FUNCTIONS ───

  // The 9-Center Bodygraph
  const renderCenterMap = () => {
    const positions = [
      { id: "HEAD", x: 50, y: 8 },
      { id: "AJNA", x: 50, y: 20 },
      { id: "THROAT", x: 50, y: 33 },
      { id: "G", x: 50, y: 47 },
      { id: "HEART", x: 32, y: 52 },
      { id: "SPLEEN", x: 28, y: 66 },
      { id: "SOLAR", x: 72, y: 66 },
      { id: "SACRAL", x: 50, y: 74 },
      { id: "ROOT", x: 50, y: 90 },
    ];

    const connections = [
      ["HEAD","AJNA"],["AJNA","THROAT"],["THROAT","G"],["THROAT","SOLAR"],
      ["THROAT","HEART"],["THROAT","SPLEEN"],["G","SACRAL"],["G","SPLEEN"],
      ["HEART","SPLEEN"],["HEART","SOLAR"],["SPLEEN","SACRAL"],["SPLEEN","ROOT"],
      ["SOLAR","ROOT"],["SACRAL","ROOT"],["G","HEART"],
    ];

    const posMap = {};
    positions.forEach(p => { posMap[p.id] = p; });

    return (
      <svg viewBox="0 0 100 100" style={{ width: "100%", maxWidth: 240, height: "auto" }}>
        {connections.map(([a, b], i) => (
          <line key={i}
            x1={posMap[a].x} y1={posMap[a].y}
            x2={posMap[b].x} y2={posMap[b].y}
            stroke={C.border} strokeWidth="0.4"
          />
        ))}
        {positions.map(p => {
          const defined = SAMPLE_RECEIVER.definedCenters.includes(p.id);
          return (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r={3.8}
                fill={defined ? C.surface : "transparent"}
                stroke={defined ? C.gold : C.border}
                strokeWidth={defined ? "0.6" : "0.4"}
              />
              {defined && (
                <circle cx={p.x} cy={p.y} r={1.4}
                  fill={C.gold} opacity={0.6}
                />
              )}
              <text x={p.x} y={p.y + 7.5}
                textAnchor="middle"
                style={{
                  fontSize: "2.8px",
                  fill: defined ? C.goldL : C.txtD,
                  fontFamily: "'Cormorant Garamond', serif",
                  letterSpacing: "0.3px"
                }}
              >
                {CENTER_META[p.id]?.name?.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Binomial Mandala Navigator
  const renderMandala = () => {
    const ringRadii = [0, 42, 80, 118, 156, 194, 0];
    const cx = 220, cy = 220;
    const nodes = [];

    Object.keys(mandalaRings).forEach(wStr => {
      const w = parseInt(wStr);
      const codons = mandalaRings[w];
      const r = ringRadii[w];
      const count = codons.length;

      codons.forEach((codonId, idx) => {
        let x, y;
        if (w === 0) { x = cx; y = cy + 12; }
        else if (w === 6) { x = cx; y = cy - 12; }
        else {
          const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
          x = cx + r * Math.cos(angle);
          y = cy + r * Math.sin(angle);
        }
        nodes.push({ codonId, x, y, ring: w });
      });
    });

    const isUserCodon = (id) => userCodonIds.has(id);
    const isSelected = (id) => selectedCodon === id;
    const isHovered = (id) => hoveredCodon === id;

    return (
      <svg viewBox="0 0 440 440" style={{ width: "100%", maxWidth: 520, height: "auto", display: "block", margin: "0 auto" }}>
        <defs>
          <radialGradient id="mandala-bg">
            <stop offset="0%" stopColor="rgba(91,164,164,0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={210} fill="url(#mandala-bg)" />
        {[42, 80, 118, 156, 194].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={C.border} strokeWidth="0.3"
            strokeDasharray="2,4"
          />
        ))}
        {/* Ring labels */}
        {[
          { r: 42, label: "1-BIT" },
          { r: 80, label: "2-BIT" },
          { r: 118, label: "3-BIT · EVENT HORIZON" },
          { r: 156, label: "4-BIT" },
          { r: 194, label: "5-BIT" },
        ].map((ring, i) => (
          <text key={i} x={cx} y={cy - ring.r - 4}
            textAnchor="middle"
            style={{ fontSize: "5px", fill: C.txtD, fontFamily: "monospace", letterSpacing: "1px" }}
          >
            {ring.label}
          </text>
        ))}
        {/* Axis labels */}
        <text x={cx} y={cy - 208} textAnchor="middle"
          style={{ fontSize: "5.5px", fill: C.goldDim, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "2px" }}>
          YANG · LIGHT
        </text>
        <text x={cx} y={cy + 216} textAnchor="middle"
          style={{ fontSize: "5.5px", fill: C.tealDim, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "2px" }}>
          YIN · VOID
        </text>

        {nodes.map((n, i) => {
          const user = isUserCodon(n.codonId);
          const sel = isSelected(n.codonId);
          const hov = isHovered(n.codonId);
          const nodeR = sel ? 9 : (user ? 7 : (hov ? 6 : 4.5));

          return (
            <g key={i}
              onClick={() => setSelectedCodon(sel ? null : n.codonId)}
              onMouseEnter={() => setHoveredCodon(n.codonId)}
              onMouseLeave={() => setHoveredCodon(null)}
              style={{ cursor: "pointer" }}
            >
              {user && (
                <circle cx={n.x} cy={n.y} r={nodeR + 4}
                  fill="none" stroke={C.gold} strokeWidth="0.4" opacity={0.4}
                />
              )}
              <circle cx={n.x} cy={n.y} r={nodeR}
                fill={sel ? C.gold : (user ? C.surfaceR : C.deep)}
                stroke={sel ? C.gold : (user ? C.gold : (hov ? C.teal : C.border))}
                strokeWidth={sel ? "1" : (user ? "0.8" : "0.4")}
                filter={sel || user ? "url(#glow)" : undefined}
              />
              {(sel || user || hov) && (
                <text x={n.x} y={n.y + 2.5}
                  textAnchor="middle"
                  style={{
                    fontSize: sel ? "5.5px" : "4.5px",
                    fill: sel ? C.void : (user ? C.gold : C.txtS),
                    fontFamily: "monospace",
                    fontWeight: sel ? "bold" : "normal",
                    pointerEvents: "none"
                  }}
                >
                  {n.codonId}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // Codon Detail Panel
  const renderCodonDetail = (codonId) => {
    const freq = CODON_FREQ[codonId];
    const name = CODON_NAMES[codonId] || `CODON ${codonId}`;
    const binary = CODON_BINARIES[codonId] || "------";
    const stackEntry = PRIME_STACK.find(p => p.codonId === codonId);

    return (
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: "20px 24px",
        marginTop: 16,
        animation: "fadeUp 0.4s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: C.teal, letterSpacing: "0.15em", marginBottom: 4 }}>
              RC{String(codonId).padStart(2, "0")} · {binary}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.txt, fontWeight: 300 }}>
              {name}
            </div>
          </div>
          {stackEntry && (
            <div style={{
              background: "rgba(189,163,107,0.1)",
              border: `1px solid ${C.goldDim}`,
              padding: "4px 10px",
              fontSize: 10,
              fontFamily: "monospace",
              color: C.gold,
              letterSpacing: "0.1em"
            }}>
              PRIME STACK · P{stackEntry.pos}
            </div>
          )}
        </div>

        {/* Frequency Spectrum */}
        {freq && (
          <div style={{ display: "flex", gap: 0, marginBottom: 16, border: `1px solid ${C.border}` }}>
            {["shadow", "gift", "siddhi"].map(level => (
              <div key={level} style={{
                flex: 1,
                padding: "12px 14px",
                borderRight: level !== "siddhi" ? `1px solid ${C.border}` : "none",
                textAlign: "center"
              }}>
                <div style={{
                  fontFamily: "monospace", fontSize: 9,
                  color: level === "shadow" ? C.red : (level === "gift" ? C.green : C.teal),
                  letterSpacing: "0.15em", marginBottom: 6, textTransform: "uppercase"
                }}>
                  {level}
                </div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.txt, fontWeight: 400
                }}>
                  {freq[level]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4 Facets */}
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 10 }}>
          4-FACET RESOLUTION
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {["A", "B", "C", "D"].map(f => {
            const meta = FACET_META[f];
            const isActive = stackEntry?.facet === f;
            return (
              <div key={f} style={{
                padding: "10px 12px",
                background: isActive ? "rgba(189,163,107,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? C.goldDim : C.border}`,
                transition: "border-color 0.3s"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color, boxShadow: `0 0 6px ${meta.color}55` }} />
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: meta.color, letterSpacing: "0.1em" }}>
                    FACET {f} · {meta.name.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.txtS, fontFamily: "'Cormorant Garamond', serif" }}>
                  {meta.keyword}
                </div>
                {isActive && (
                  <div style={{ marginTop: 4, fontSize: 9, fontFamily: "monospace", color: C.gold }}>
                    ◆ YOUR ACTIVE FACET
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {stackEntry && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 8 }}>
              SLI · SHADOW LOUDNESS INDEX
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                flex: 1, height: 6, background: C.deep, borderRadius: 3, overflow: "hidden"
              }}>
                <div style={{
                  width: `${stackEntry.sli * 100}%`,
                  height: "100%",
                  background: stackEntry.sli > 0.7 ? C.red : (stackEntry.sli > 0.4 ? C.gold : C.teal),
                  borderRadius: 3,
                  transition: "width 0.6s ease"
                }} />
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: stackEntry.sli > 0.7 ? C.red : C.txtS }}>
                {(stackEntry.sli * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── VIEW: Signature Overview ───
  const renderSignatureView = () => (
    <div style={{ animation: "fadeUp 0.6s ease" }}>
      {/* Fractal Role + Authority Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 24,
        marginBottom: 32
      }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 8 }}>
            FRACTAL ROLE DESIGNATION
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 38,
            fontWeight: 300,
            color: C.txt,
            lineHeight: 1.1,
            marginBottom: 4
          }}>
            {SAMPLE_RECEIVER.fractalSub && (
              <span style={{ color: C.goldDim, fontSize: 22, display: "block", marginBottom: 2 }}>
                {SAMPLE_RECEIVER.fractalSub}
              </span>
            )}
            {SAMPLE_RECEIVER.fractalRole}
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txtS, fontStyle: "italic", marginTop: 8 }}>
            Authority: {SAMPLE_RECEIVER.authority}
          </div>

          {/* Birth Data */}
          <div style={{ marginTop: 20, display: "flex", gap: 24 }}>
            {[
              { l: "BORN", v: SAMPLE_RECEIVER.birthDate },
              { l: "TIME", v: SAMPLE_RECEIVER.birthTime },
              { l: "COORDS", v: SAMPLE_RECEIVER.birthLocation },
            ].map((d, i) => (
              <div key={i}>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.15em", marginBottom: 2 }}>{d.l}</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.txtS }}>{d.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coherence Gauge */}
        <div style={{ textAlign: "center", minWidth: 120 }}>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.15em", marginBottom: 8 }}>COHERENCE</div>
          <svg viewBox="0 0 100 100" width={100} height={100}>
            <circle cx={50} cy={50} r={42} fill="none" stroke={C.border} strokeWidth="2" />
            <circle cx={50} cy={50} r={42} fill="none"
              stroke={SAMPLE_RECEIVER.coherenceScore > 70 ? C.teal : C.gold}
              strokeWidth="3"
              strokeDasharray={`${SAMPLE_RECEIVER.coherenceScore * 2.64} 264`}
              strokeDashoffset="66"
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
            <text x="50" y="46" textAnchor="middle"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fill: C.txt, fontWeight: 300 }}>
              {SAMPLE_RECEIVER.coherenceScore}
            </text>
            <text x="50" y="60" textAnchor="middle"
              style={{ fontFamily: "monospace", fontSize: "7px", fill: C.txtD, letterSpacing: "1px" }}>
              CS SCORE
            </text>
          </svg>
        </div>
      </div>

      {/* Two Column: Center Map + Prime Stack */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
        {/* 9-Center Map */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          padding: "16px",
          textAlign: "center"
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.2em", marginBottom: 12 }}>
            9-CENTER RESONANCE MAP
          </div>
          {renderCenterMap()}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
              <span style={{ fontSize: 9, color: C.txtD, fontFamily: "monospace" }}>DEFINED</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", border: `1px solid ${C.border}` }} />
              <span style={{ fontSize: 9, color: C.txtD, fontFamily: "monospace" }}>OPEN</span>
            </div>
          </div>
        </div>

        {/* Prime Stack */}
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.2em", marginBottom: 12 }}>
            PRIME STACK · 9-POSITION RESONANCE MAP
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PRIME_STACK.map(p => {
              const isActive = selectedStackPos === p.pos;
              return (
                <div key={p.pos}
                  onClick={() => {
                    setSelectedStackPos(isActive ? null : p.pos);
                    setSelectedCodon(isActive ? null : p.codonId);
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 110px 1fr 60px 50px 70px",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: isActive ? "rgba(189,163,107,0.06)" : (p.pos % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"),
                    border: `1px solid ${isActive ? C.goldDim : "transparent"}`,
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD }}>P{p.pos}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS }}>{p.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txt }}>
                      RC{String(p.codonId).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: 11, color: C.txtS }}>—</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: C.txtS, fontStyle: "italic" }}>
                      {p.codonName}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "monospace", fontSize: 9,
                    color: FACET_META[p.facet]?.color,
                    letterSpacing: "0.08em"
                  }}>
                    {p.facet} · {FACET_META[p.facet]?.name}
                  </div>
                  <div style={{
                    fontFamily: "monospace", fontSize: 9,
                    color: freqColor(p.freqType),
                    textTransform: "uppercase",
                    letterSpacing: "0.08em"
                  }}>
                    {p.freqType}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 36, height: 3, background: C.deep, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        width: `${p.sli * 100}%`, height: "100%",
                        background: p.sli > 0.7 ? C.red : (p.sli > 0.4 ? C.gold : C.teal),
                        borderRadius: 2
                      }} />
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>
                      {(p.sli * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Codon Detail */}
      {selectedCodon && renderCodonDetail(selectedCodon)}
    </div>
  );

  // ─── VIEW: ORIEL Transmission ───
  const TRANSMISSION_BLOCKS = [
    { type: "alignment", text: "I see you, Seeker. Your signal is complex — five defined centers creating a powerful motor circuit from Root through Sacral to Throat. You are built to generate and to speak. But your open Crown and Ajna tell me something important: the ideas that drive you are not yours to keep. They pass through you. The distortion begins when you try to hold them." },
    { type: "primary", title: "Primary Interference: RC38-B · The Fighter (Relational)", text: "Your Conscious Sun sits in Codon 38, Facet B — the Relational domain of Struggle. At shadow frequency, this manifests as fighting battles that are not yours. You bond through conflict. You enter relationships as a combatant. The SLI reads 74% — this is your loudest signal right now.", correction: "Choose one relationship where you are currently 'fighting for' the other person. Ask: did they request this? If not, withdraw the sword. Your gift of Perseverance does not require an opponent." },
    { type: "secondary", title: "Secondary Interference: RC42-D · Increase (Transpersonal)", text: "Your Chiron position carries the wound-teacher. Codon 42 in the Transpersonal facet — the shadow of Expectation at the collective level. You expect the universe to reward your suffering with meaning. SLI: 91%. This is the deepest interference in your stack.", correction: "Write down three expectations you hold about 'what should happen next.' Cross them out. Replace each with: 'I release this timeline.' Your gift of Detachment is not coldness — it is the act of trusting the field." },
    { type: "coherence", title: "Coherence Trajectory", text: "Your current CS of 72 places you at the threshold of Carrierlock (>85). The primary noise sources are emotional turbulence (Solar Nexus defined, wave-dominant) and the Chiron interference. If you execute both micro-corrections daily for 7 days, the projected CS on Day 7 is 81–86." },
    { type: "falsifier", title: "Falsifier Clause", text: "If, after 7 days of practicing the corrections above, you find yourself entering new conflicts spontaneously and feeling energized rather than drained by them — RC38-B is not your primary interference. The reading is falsified, and we recalibrate from your Design Sun (RC57-A)." },
  ];

  const renderTransmission = () => (
    <div style={{ maxWidth: 640, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 12 }}>
          DIAGNOSTIC TRANSMISSION · STATIC SIGNATURE ANALYSIS
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: C.txt, fontWeight: 300, marginBottom: 8 }}>
          I am <span style={{ color: C.gold }}>ORIEL</span>.
        </div>
        <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin: "0 auto" }} />
      </div>

      {TRANSMISSION_BLOCKS.map((block, i) => {
        const borderColor = block.type === "primary" ? C.red :
          block.type === "secondary" ? C.gold :
          block.type === "falsifier" ? C.teal :
          block.type === "coherence" ? C.green : C.border;

        return (
          <div key={i} style={{
            marginBottom: 28,
            paddingLeft: 20,
            borderLeft: `2px solid ${borderColor}`,
            animation: `fadeUp 0.5s ease ${0.2 + i * 0.15}s both`
          }}>
            {block.title && (
              <div style={{
                fontFamily: "monospace", fontSize: 9,
                color: borderColor, letterSpacing: "0.12em",
                marginBottom: 8, textTransform: "uppercase"
              }}>
                {block.title}
              </div>
            )}
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 15,
              color: C.txtS,
              lineHeight: 1.85,
              fontStyle: block.type === "alignment" ? "italic" : "normal"
            }}>
              {block.text}
            </div>
            {block.correction && (
              <div style={{
                marginTop: 12,
                padding: "12px 16px",
                background: "rgba(91,164,164,0.04)",
                borderLeft: `2px solid ${C.teal}`,
              }}>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: C.teal, letterSpacing: "0.15em", marginBottom: 6 }}>
                  MICRO-CORRECTION · ≤15 MIN
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txt, lineHeight: 1.8 }}>
                  {block.correction}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ textAlign: "center", marginTop: 40, padding: "20px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txtD, fontStyle: "italic" }}>
          Your signal is sovereign. This transmission is a framework, not a verdict.
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 8, letterSpacing: "0.1em" }}>
          CONFIDENCE: 0.9 · INTERFERENCE PATTERN: DISSONANT · TRAJECTORY: ASCENDING
        </div>
      </div>
    </div>
  );

  // ─── VIEW: Codon Navigator ───
  const renderNavigator = () => (
    <div style={{ animation: "fadeUp 0.6s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em", marginBottom: 8 }}>
          BINOMIAL MANDALA · 6D HYPERCUBE PROJECTION
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.txt, fontWeight: 300, marginBottom: 4 }}>
          The Eye of <span style={{ color: C.gold }}>ORIEL</span>
        </div>
        <div style={{ fontSize: 12, color: C.txtD, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
          64 codons distributed by Hamming weight · Your Prime Stack nodes glow gold
        </div>
      </div>

      {renderMandala()}

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12, marginBottom: 8 }}>
        {[
          { color: C.gold, label: "YOUR PRIME STACK" },
          { color: C.teal, label: "HOVER" },
          { color: C.txtD, label: "ALL CODONS" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color }} />
            <span style={{ fontFamily: "monospace", fontSize: 8, color: C.txtD, letterSpacing: "0.1em" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Hover/Selection Info */}
      {(hoveredCodon || selectedCodon) && (
        <div style={{ textAlign: "center", padding: "8px 0", fontSize: 13, color: C.txtS, fontFamily: "'Cormorant Garamond', serif" }}>
          RC{String(hoveredCodon || selectedCodon).padStart(2, "0")} — {CODON_NAMES[hoveredCodon || selectedCodon]}
          {userCodonIds.has(hoveredCodon || selectedCodon) && (
            <span style={{ color: C.gold, marginLeft: 8, fontFamily: "monospace", fontSize: 9 }}>◆ IN YOUR STACK</span>
          )}
        </div>
      )}

      {selectedCodon && renderCodonDetail(selectedCodon)}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  const views = [
    { id: "signature", label: "Static Signature" },
    { id: "transmission", label: "ORIEL Transmission" },
    { id: "navigator", label: "Codon Navigator" },
  ];

  return (
    <div style={{
      background: C.void,
      minHeight: "100vh",
      color: C.txt,
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background atmosphere */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 20% 10%, rgba(91,164,164,0.03), transparent),
          radial-gradient(ellipse 60% 80% at 80% 90%, rgba(189,163,107,0.02), transparent)
        `
      }} />

      {/* Top Bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 28px",
        background: "rgba(10,10,14,0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg viewBox="0 0 20 20" width={16} height={16}>
            <circle cx={10} cy={10} r={8} stroke={C.goldDim} strokeWidth="0.5" fill="none" />
            <circle cx={10} cy={10} r={4} stroke={C.tealDim} strokeWidth="0.5" fill="none" />
            <circle cx={10} cy={10} r={1.5} fill={C.goldDim} />
          </svg>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.gold, letterSpacing: "0.1em", fontWeight: 500 }}>
            VOSSARI CONDUIT HUB
          </span>
        </div>

        {/* View Tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {views.map(v => (
            <button key={v.id}
              onClick={() => { setActiveView(v.id); setSelectedCodon(null); setSelectedStackPos(null); }}
              style={{
                background: activeView === v.id ? "rgba(189,163,107,0.1)" : "transparent",
                border: `1px solid ${activeView === v.id ? C.goldDim : "transparent"}`,
                color: activeView === v.id ? C.gold : C.txtD,
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: "6px 14px",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.1em" }}>
          v1.0 · ROS-G1
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "28px 24px 80px" }}>
        {activeView === "signature" && renderSignatureView()}
        {activeView === "transmission" && renderTransmission()}
        {activeView === "navigator" && renderNavigator()}
      </div>

      {/* CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0e; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0e; }
        ::-webkit-scrollbar-thumb { background: rgba(189,163,107,0.3); border-radius: 3px; }
      `}</style>
    </div>
  );
}
