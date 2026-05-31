# Codon Card Layout Specifications

This document defines the typography, spacing grid, container styling, and component structure for rendering **Codon Cards** on Page 7 of the static PDF and explorer consoles.

---

## 1. PHYSICAL DIMENSIONS & GRID LAYOUT
- **PDF Layout (Page 7)**: Cards are arranged in a 2-column by 3-row grid.
- **Card Spacing**: Grid gap is exactly $1.0\text{rem}$ ($16\text{px}$).
- **Card Margins**: Each card is structured with a padding of $1.25\text{rem}$ ($20\text{px}$) to maintain internal negative space.
- **Card Background**: Obsidion Deep Space background `#0D0E10` with a $1\text{px}$ solid border `#3E414A`.

---

## 2. CARD COMPONENT HIERARCHY

```
+-------------------------------------------------------------------------------+
|  [CODON ID & NAME]                                              [LAYER BADGE] |
|  RC01 - AURORA                                                 CONSCIOUS | SUN |
+-------------------------------------------------------------------------------+
|  +-----------------------+  [TRIPTYCH FREQUENCIES]                            |
|  |                       |  Shadow: Entropy (Distorted voltage)               |
|  |                       |  Gift: Freshness (Creative spark)                  |
|  |     CODON GLYPH       |  Siddhi: Beauty (Formless unity)                   |
|  |        (SVG)          |                                                    |
|  |                       |  [SOMATIC MARKER]                                  |
|  |                       |  Somatic: Thoracic Pressure / Nervous Buzz         |
|  +-----------------------+                                                    |
+-------------------------------------------------------------------------------+
|  [CORE NARRATIVE BLOCK]                                                       |
|  The raw spark of mutation hits the body. You process creative fire as        |
|  a high-voltage somatic hum that demands release.                             |
+-------------------------------------------------------------------------------+
|  [MICRO-CORRECTION CARD]                                                      |
|  Kinetic Discharge: Shake limbs vigorously for 60 seconds to disrupt static.  |
+-------------------------------------------------------------------------------+
|  [FOOTER METADATA RAIL]                                                       |
|  CONFIDENCE: 0.9 | FALSIFIER: This profile is likely wrong if the receiver    |
|  experiences persistent somatic silence or lack of creative pressure.         |
+-------------------------------------------------------------------------------+
```

---

## 3. CARD-LEVEL TYPOGRAPHY (CSS CLASSES)
All card labels are styled using the following properties:

```css
/* Card Header */
.vrc-card-id {
  font-family: var(--vrc-font-header);
  font-size: var(--vrc-text-md);
  font-weight: 700;
  color: var(--vrc-color-gold);
}

.vrc-card-layer-badge {
  font-family: var(--vrc-font-header);
  font-size: var(--vrc-text-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--vrc-color-cyan);
}

/* Frequencies */
.vrc-card-frequency-label {
  font-family: var(--vrc-font-body);
  font-size: var(--vrc-text-sm);
  font-weight: 600;
  color: var(--vrc-color-ivory);
}

.vrc-card-frequency-desc {
  font-family: var(--vrc-font-body);
  font-size: var(--vrc-text-sm);
  color: var(--vrc-color-gray-muted);
}

/* Narrative Body */
.vrc-card-body {
  font-family: var(--vrc-font-body);
  font-size: var(--vrc-text-base);
  line-height: 1.4;
  color: var(--vrc-color-ivory);
  margin-top: 1rem;
}

/* Micro-correction */
.vrc-card-correction-box {
  background-color: var(--vrc-color-obsidian);
  border-left: 2px solid var(--vrc-color-gold);
  padding: 0.5rem 0.75rem;
  margin-top: 0.75rem;
  font-size: var(--vrc-text-sm);
}

/* Card Footer */
.vrc-card-footer {
  border-top: 1px solid var(--vrc-color-gray-dormant);
  padding-top: 0.5rem;
  margin-top: 1rem;
  font-family: var(--vrc-font-mono);
  font-size: var(--vrc-text-xs);
  color: var(--vrc-color-gray-muted);
}
```

---

## 4. DESIGN CONSTRAINTS & DATA VALIDATION
- **Unspecified Fields**: If somatic markers or micro-corrections for a codon are **UNSPECIFIED** in the canon (as is the case for Codons 2 to 64), the card must render the narrative box at full width, omitting the micro-correction panel, and labeling the somatic marker field as `UNSPECIFIED`.
- **Falsifier Positioning**: The falsifier clause must remain at the absolute bottom of the card block, highlighted with a gray background strip.
