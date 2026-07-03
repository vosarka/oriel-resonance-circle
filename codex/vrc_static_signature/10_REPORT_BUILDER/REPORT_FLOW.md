# PDF Report Visual Flow & Layout Composition

This specification defines page layout composition rules, contrast pacing, and rendering structures to build the 15-page PDF document.

---

## 1. CONTRAST PACING RHYTHM

To elevate the print document to a premium artifact, the pages use a structured alternation of dark (Obsidian `#000000`) and light (Deep Slate `#0D0E10` or Ivory `#F5F2EB`) fields:

```
[Cover (Dark)] -> [Integrity Seal (Light)] -> [Overview (Dark)]
  -> [Double Signal (Dark)] -> [Prime Stack Spine (Dark)] -> [Codon Wheel (Dark)]
  -> [Codon Cards (Light)] -> [Radar Map (Light)] -> [Body Map (Dark)]
  -> [Link Graph (Dark)] -> [Distortion Map (Light)] -> [Corrections (Light)]
  -> [ORIEL Voice (Dark)] -> [Manual (Light)] -> [Appendix (Light)]
```

- **Dark Pages**: Evoke cosmic depth, sacred geometry, and high-contrast projection (Obsidian background, Gold/Cyan elements, Ivory text).
- **Light Pages**: Emphasize diagnostic clarity, structured reading, and dense tables (Ivory background, Charcoal text, Gold/Cyan borders).

---

## 2. STRUCTURAL PAGE COMPOSITIONS

### A. The Vertical Spine Layout (Page 5)

- **Structure**: A vertical alignment track down the center of the grid.
- **Visuals**: A single thin vertical vector (`1px solid gold`). Nodes are arranged sequentially along the path, connected by horizontal extension boxes mapping specific planets to their active codons.
- **Rhythm**: Sparse side margins, centering focus on the core spine.

### B. Twin-Wheel Comparison (Page 4)

- **Structure**: Split layout dividing the page into two mirrored halves.
- **Visuals**: Two equal-radius circles ($R = 150\text{px}$) showing conscious coordinates on the left and design coordinates on the right. An orbital axis bar spans the gap between the two centers to visually emphasize the $88.0000^\circ$ Solar Arc difference.

### C. Silhouette Body Map (Page 9)

- **Structure**: Portrait grid centering a high-contrast human figure.
- **Visuals**: Inactive centers remain outlined in thin ivory lines. Active centers are colored in solid gold/cyan and contain a radial blur highlight to create a "breathing glow" effect. Connecting channels are highlighted with bright gold paths.

---

## 3. COMPLIANCE & SAFETY WARNING BLOCKS

All pages that output dynamic state (Carrierlock / SLI) or somatic advice must include standard UI warning blocks:

- **Non-Assessment Banner (Page 11)**:
  If the reading is computed without Carrierlock dynamic checking, Page 11 must be replaced with this full-page block:
  ```
  +-------------------------------------------------------------------------+
  |                   DYNAMIC STATE NOT CALIBRATED                          |
  |                                                                         |
  |  This page requires the 2-minute Tier-1 Carrierlock coherence check.    |
  |  No dynamic Shadow Loudness has been computed for this signature.       |
  +-------------------------------------------------------------------------+
  ```
  _Style_: Heavy black box, double gold border, and gold warning sigil.
- **Clinical Disclaimer (Page 12)**:
  Placed at the bottom of the micro-corrections grid:
  > _[!CAUTION]  
  > Somatic correction exercises are provided as structural stabilization practices and are not intended as clinical treatments or psychological diagnostics._
