# Codon Glyph Grammar: Symbolic Specification & SVG Templates

This document defines the mathematical coordinate systems, XML code structures, and geometric structures for rendering the 64 Codon Glyphs.

---

## 1. SVG CANVAS SCHEMA

All glyphs are designed to render inside a standard viewport scale. The coordinate grid runs in a $100 \times 100$ point layout:

```xml
<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- CSS Definitions -->
  <style>
    .glyph-bg { fill: #000000; }
    .scaffold-line { stroke: #F5F2EB; stroke-width: 0.5px; opacity: 0.15; fill: none; }
    .boundary-cyan { stroke: #00F0FF; stroke-width: 1.5px; fill: none; }
    .boundary-gold { stroke: #D4AF37; stroke-width: 1.5px; fill: none; }
    .notch { fill: #D4AF37; }
    .facet-node { fill: #00F0FF; stroke: #000000; stroke-width: 1px; }
  </style>

  <!-- Obsidian Background Grid -->
  <rect width="100%" height="100%" class="glyph-bg" />
</svg>
```

---

## 2. GLYPH COMPONENT RENDERING CODE

### A. Outer Boundary Rings

- **Conscious-Only**:
  ```xml
  <circle cx="50" cy="50" r="45" class="boundary-cyan" />
  ```
- **Design-Only**:
  ```xml
  <circle cx="50" cy="50" r="45" class="boundary-gold" />
  ```
- **Overlap (Conscious + Design)**:
  ```xml
  <circle cx="50" cy="50" r="45" class="boundary-cyan" />
  <circle cx="50" cy="50" r="42" class="boundary-gold" />
  ```

### B. Index Notch Calculation & Rendering

To place the index notch on the circle at angle $\theta$ (in degrees):
$$\theta = (\text{Mandala\_Index} \times 5.625^\circ) - 90^\circ$$
The vertex coordinate $(x_v, y_v)$ on the $R=45$ circle is:
$$x_v = 50 + 45 \times \cos(\theta)$$
$$y_v = 50 + 45 \times \sin(\theta)$$

To render the triangular notch pointing inward:

- Vertex at $(x_v, y_v)$.
- Left shoulder at $(50 + 47 \times \cos(\theta - 3^\circ), 50 + 47 \times \sin(\theta - 3^\circ))$.
- Right shoulder at $(50 + 47 \times \cos(\theta + 3^\circ), 50 + 47 \times \sin(\theta + 3^\circ))$.

_Example XML for Mandala Index 0 (Top Notch at $\theta = -90^\circ$)_:

```xml
<polygon points="50,5 47.6,3 52.4,3" class="notch" />
```

---

## 3. CENTER-SPECIFIC SCALESTEM (9 SCAFFOLDS)

The center of the codon contains a geometric lattice structure derived from its associated Center:

### 1. Pressure Centers (HEAD & ROOT) - Triangular Scaffold

- **HEAD (Inverted Triangle)**:
  ```xml
  <polygon points="50,22 75,65 25,65" class="scaffold-line" />
  ```
- **ROOT (Upright Triangle)**:
  ```xml
  <polygon points="50,78 75,35 25,35" class="scaffold-line" />
  ```

### 2. Awareness Centers (AJNA & SPLEEN) - Hexagonal Scaffold

- **AJNA (Downfacing Point)**:
  ```xml
  <polygon points="50,75 72,62 72,38 50,25 28,38 28,62" class="scaffold-line" />
  ```
- **SPLEEN (Leftfacing Point)**:
  ```xml
  <polygon points="25,50 38,72 62,72 75,50 62,28 38,28" class="scaffold-line" />
  ```

### 3. Manifestation Center (THROAT) - Square Scaffold

- **THROAT (Orthogonal Square)**:
  ```xml
  <rect x="28" y="28" width="44" height="44" class="scaffold-line" />
  ```

### 4. Identity Center (G) - Diamond Scaffold

- **G (Rotated Square)**:
  ```xml
  <polygon points="50,22 78,50 50,78 22,50" class="scaffold-line" />
  ```

### 5. Motor Centers (HEART, SACRAL, SOLAR) - Circular & Crossed Scaffolds

- **HEART (Small Concentric Ring)**:
  ```xml
  <circle cx="50" cy="50" r="18" class="scaffold-line" />
  ```
- **SACRAL (Double Concentric Rings)**:
  ```xml
  <circle cx="50" cy="50" r="15" class="scaffold-line" />
  <circle cx="50" cy="50" r="28" class="scaffold-line" />
  ```
- **SOLAR (Spoke lines)**:
  ```xml
  <line x1="50" y1="20" x2="50" y2="80" class="scaffold-line" />
  <line x1="20" y1="50" x2="80" y2="50" class="scaffold-line" />
  <line x1="28" y1="28" x2="72" y2="72" class="scaffold-line" />
  <line x1="28" y1="72" x2="72" y2="28" class="scaffold-line" />
  ```

---

## 4. EXPRESSION FACET NODES

For each codon card, render a solid Cyan circle at the cardinal position matching the activated facet:

- Somatic (Facet A):
  ```xml
  <circle cx="50" cy="80" r="3" class="facet-node" />
  ```
- Relational (Facet B):
  ```xml
  <circle cx="20" cy="50" r="3" class="facet-node" />
  ```
- Cognitive (Facet C):
  ```xml
  <circle cx="80" cy="50" r="3" class="facet-node" />
  ```
- Transpersonal (Facet D):
  ```xml
  <circle cx="50" cy="20" r="3" class="facet-node" />
  ```
