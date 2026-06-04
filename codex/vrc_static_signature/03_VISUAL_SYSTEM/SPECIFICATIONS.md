# Visual System Specifications: VRC Sacred-Tech UI

This document defines the rendering parameters, SVG layout matrices, WebGL geometries, and typographic layouts for the VRC visual systems.

---

## 1. AESTHETICS & BRANDING TOKENS

- **Design Philosophy**: _Sacred Technology_ (Vossari civilization style: high-precision instrumentation meets ancient geometry).
- **Backgrounds**: Obsidian Black `#000000` / Deep Space `#0D0E10` / Dark Slate `#15171C`.
- **Accents**:
  - Gold (Coherence, Defined Structures, Authority): `#D4AF37` / `#FFD700`.
  - Cyan (Active Signal, Conscious Placements): `#00F0FF` / `#00E8C6`.
  - Ivory (Static Text, Borders, Open Elements): `#F5F2EB` / `#E8E5DE`.
  - Muted Gray (Dormant Links, Off-states): `#2C2E35` / `#3E414A`.
- **Gradients**: Restrained, linear. Only two-color steps (e.g. Obsidian to Deep Slate, Cyan to Gold for overlap regions).
- **Typography**: Modern geometric sans-serif (Google Fonts: Outfit, Montserrat, or Inter).

---

## 2. CODON ZODIAC WHEEL

- **Geometry**: Concentric circles.
  - Outer Ring: Degree tick marks ($360^\circ$, steps of $1^\circ$ and $5^\circ$).
  - Middle Ring: 64 segments mapping the **Resonance Mandala Sequence** (non-sequential).
  - Inner Ring: Coordinates overlay (ecliptic degree labels).
- **Mapping Logic**:
  - $0^\circ$ Aries is set at the top vertical axis ($12$ o'clock position) or offset as per the engine specification.
  - Each segment spans exactly $5.625^\circ$ of arc.
  - Active planets are marked as small dots/ticks on the outer ring: Conscious activations in Cyan, Design activations in Gold.
- **Interactivity (Digital companion only)**:
  - Hovering over a segment expands the segment arc by 5% radius, highlighting the active codon ID.
  - Clicking on a segment zoom-focuses the viewport.

---

## 3. 3D CONSCIOUSNESS LATTICE (WEBGL / THREE.JS)

- **Geometry**: A 3D geodesic sphere or double-toroid structure containing:
  - 64 Codon cluster nodes.
  - 4 Facet sub-nodes per cluster node.
  - 2 Expression layers per facet.
  - Total nodes: $64 \times 4 \times 2 = 512$ nodes.
- **Node Styling**:
  - Inactive nodes: Tiny, translucent gray dots ($0.05$ radius).
  - Active nodes: Glowing Cyan (conscious) or Gold (design) spheres ($0.2$ radius).
- **Connection Edges**:
  - Render thin lines connecting active nodes if they form active Resonance Links. Line color follows the dominant activation (Cyan, Gold, or gradient if mixed).

---

## 4. NINE CENTERS BODY MAP

- **Geometry**: Stylized, minimalist human silhouette centered in a $600 \times 800$ viewport.
- **Node Placements**:
  1. `HEAD`: Centered at coordinates $(300, 100)$, inverted triangle.
  2. `AJNA`: Centered at coordinates $(300, 180)$, downward triangle.
  3. `THROAT`: Centered at coordinates $(300, 260)$, square.
  4. `G`: Centered at coordinates $(300, 360)$, diamond.
  5. `HEART`: Offset at coordinates $(360, 420)$, small triangle pointing right.
  6. `SACRAL`: Centered at coordinates $(300, 520)$, large square.
  7. `SPLEEN`: Offset at coordinates $(210, 480)$, triangle pointing left.
  8. `SOLAR`: Offset at coordinates $(390, 480)$, triangle pointing right.
  9. `ROOT`: Centered at coordinates $(300, 680)$, square.
- **Active States**:
  - Defined Centers: Render filled with Gold (`#D4AF37`) or Cyan (`#00F0FF`) with a soft glow filter (`feGaussianBlur`).
  - Open Centers: Render hollow with a thin Ivory border (`1px stroke`).

---

## 5. RESONANCE RADAR (FACET MAP)

- **Geometry**: 4-axis polar radar chart.
  - Axis 1 ($90^\circ$ North): `Transpersonal`
  - Axis 2 ($0^\circ$ East): `Cognitive`
  - Axis 3 ($270^\circ$ South): `Somatic`
  - Axis 4 ($180^\circ$ West): `Relational`
- **Data Plotting**:
  - Score on each axis is computed by summing the weights of active codons mapping to that facet domain.
  - Points are plotted on a normalized scale ($0$ to $100$) and joined by a filled translucent polygon (`fill: rgba(0, 240, 255, 0.2)`).

---

## 6. CODON GLYPH SYSTEM

Every codon must have a systematic glyph structure that can be dynamically generated:

- **Scaffold**: A thin circular ring enclosing a hexagonal grid coordinate space.
- **Core Elements**:
  - **NOTCH**: A dark notch on the perimeter representing the codon index on the Mandala.
  - **HEXAGRAM MAPPING (UNSPECIFIED)**: If binary data is provided, draw the corresponding yin/yang line segments stacked vertically. If unavailable, render the neutral hexagonal scaffold.
  - **FACET MARKER**: A dot placed on the north, east, south, or west node of the inner circle to represent the active facet.
  - **LAYER COLOR RING**: Encircling boundary rendered in Cyan (conscious), Gold (design), or double-ring (both).
