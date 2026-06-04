# UI Wireframe Specifications: Sacred-Tech Dashboard

This document details the interface hierarchy, layout structures, and navigation flows for the VRC companion dashboard interface.

---

## 1. SACRED-TECH THEME & BRANDING

- **Grid Layout**: Obsidian canvas grid, double lines, high-contrast borders in Ivory, glow-filtered highlights in Gold/Cyan.
- **Aesthetic**: Instrument panel from a high-technology observatory. Minimalist margins, precision data tables, and centered geometric widgets.

---

## 2. DASHBOARD LAYOUT HIERARCHY

```
+--------------------------------------------------------------------------------+
| [VOSSARI LOGO]               VRC CONDUIT HUB CONSOLE          [STATUS: ACTIVE] |
+--------------------------------------------------------------------------------+
|  [LAYER TABS: 1. COSMIC MAP | 2. CODON WHEEL | 3. BODY MAP | 4. EXPLORER]      |
+--------------------------------------------------------------------------------+
|  +-------------------------------------+  +---------------------------------+  |
|  |                                     |  |          PROFILE PANEL          |  |
|  |                                     |  |                                 |  |
|  |                                     |  |  Receiver: Name                 |  |
|  |                                     |  |  Type: RESONATOR                |  |
|  |                                     |  |  Authority: Gut Response        |  |
|  |                                     |  +---------------------------------+  |
|  |           PRIMARY WIDGET            |  |         CALIBRATION SEAL        |  |
|  |                                     |  |                                 |  |
|  |      (WebGL Geodesic Lattice,       |  |  Birth: 2024-01-01 12:00 UTC    |  |
|  |       SVG 64-Segment Mandala,       |  |  Coordinates: 0N, 0E            |  |
|  |       or SVG Body Map)              |  |  Solar Arc Offset: -88.0000°    |  |
|  |                                     |  +---------------------------------+  |
|  |                                     |  |         CARRIERLOCK STATS       |  |
|  |                                     |  |                                 |  |
|  |                                     |  |  Coherence Score: 83            |  |
|  |                                     |  |  State: Aligned                 |  |
|  |                                     |  |  Primary Shadow: Entropy        |  |
|  |                                     |  +---------------------------------+  |
|  +-------------------------------------+  |       MICRO-CORRECTIONS         |  |
|  |           RESONANCE RADAR           |  |                                 |  |
|  |  [Somatic] [Relational] [Cognitive] |  |  Somatic Signal: Buzzing        |  |
|  |  [Transpersonal]                    |  |  Practice: Kinetic Discharge    |  |
|  +-------------------------------------+  +---------------------------------+  |
+--------------------------------------------------------------------------------+
|  [FOOTER: CHECKSUM HASH]                           [SWISS EPHEMERIS WASM v2.8] |
+--------------------------------------------------------------------------------+
```

---

## 3. FOUR UI LAYERS

### Layer 1: Cosmic Map

- Displays planetary trajectories at $T_{\text{birth}}$ and $T_{\text{design}}$ mapped as orbits on the geocentric Tropical ecliptic.

### Layer 2: Codon Wheel

- Renders the interactive SVG 64-segment wheel in Mandala order. Hovering highlights active planetary nodes and expands detail panels.

### Layer 3: Body Map

- Shows the human silhouette with the 9 centers. Defined centers pulse softly in Gold. Selecting an active link illuminates the path between connecting nodes.

### Layer 4: Deep Codon Explorer

- Multi-dimensional directory of all 64 codons. Provides search parameters by shadow/gift/siddhi keys, facet parameters, and associated somatic markers.
