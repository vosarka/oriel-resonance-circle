---
id: source-vrc-canon-master
type: source
status: living
tags: [vrc, canon, master, structural, 00-canon]
last_updated: 2026-04-02
sources: 1
importance: critical
aliases: ["VRC Canon Master", "CANON_MASTER.md", "Static Signature Codex Canon"]
---

# Source: VRC Static Signature Codex — CANON MASTER

**Provenance:** `codex/vrc_static_signature/00_CANON/CANON_MASTER.md` (248 lines)  
**Role:** The single authoritative source of truth for the Vossari Resonance Codex (VRC) / Resonance Genetics Protocol (RGP) calculations, naming systems, and structural hierarchies.

This document is positioned inside the implementation worktree as the top-level canon that all downstream engines, reports, and voice modules must defer to.

## Core Content

### System Axioms
Hard requirements for reproducibility:
- Swiss Ephemeris (WASM or binary)
- Geocentric, Tropical Zodiac
- True Node only
- All inputs converted to UTC
- No house system (pure 360° Mandala Wheel)
- ±0.01° minimum precision

### Canonical Calculation Path (9 strict steps)
From birth data normalization → Conscious + Design charts via exact 88.000° Solar Arc → Codon/Facet mapping → Centers & Resonance Links → VRC Type & Authority → Prime Stack payload → optional Carrierlock.

### Solar Arc Design Rules
Emphasizes the precise iterative backward search for the exact moment the Sun was 88.0000° behind the birth Sun longitude. This is non-negotiable for the Design layer.

### Codon Mapping + The Resonance Mandala Sequence
Detailed specification of the non-sequential 64-codon wheel divided into four quadrants:
- Initiation, Civilization, Duality, Mutation

Includes the exact longitude-to-codon algorithm using the Mandala Sequence array.

### Facet Rules
Precise 1.40625° subdivisions (A Somatic, B Relational, C Cognitive, D Transpersonal) with conversion algorithm.

### 9 Centers of Photonic Resonance
Complete list with associated codons and definition logic (Defined = at least one active Resonance Link; Open = none).

### Complete Resonance Link Library (36 Links)
Full enumerated list with names (e.g., "64-47 Abstraction", "20-34 Charisma", "57-34 Power", etc.) and the two centers they connect.

### VRC Type Hierarchy (Fractal Role)
Strict evaluation order:
1. Reflector (all 9 centers Open)
2. Resonator (Sacral Defined) — with "Manifesting Resonator" sub-type if a motor connects to Throat
3. Catalyst (Sacral Open + motor-to-Throat connection)
4. Harmonizer (all other cases)

### Authority Hierarchy (Decision Compass)
Priority scan order: Solar Plexus → Sacral → Spleen → Heart → G → (Reflectors: Lunar Cycle) → Environment (for certain Mental Projectors).

### Carrierlock Coherence Score
Full formula and three-state axis:
- 80–100: Aligned
- 40–79: Drifted
- 0–39: Fragmented

### Shadow Loudness Index (SLI)
Formula provided, plus an explicit internal note about a **CANON INCONSISTENCY** in the SLI interpretation ranges when Coherence Score is perfect (StateAmplifier becomes 0, driving SLI to 0, which conflicts with the stated "Chaotic < 25" vs "Coherent > 75" mapping).

This self-flagged inconsistency is valuable for the wiki.

### Validation Vector
The now-familiar test case: 2024-01-01 12:00 UTC at 0°/0° → Conscious Sun RC38, Design Sun RC57 with exactly 88.0000° Solar Arc offset.

### Forbidden Behaviors & Terminology
- No noon defaults
- No Human Design language in user-facing output (use Resonator / Catalyst / Harmonizer / Manifesting Resonator / Codon / Resonance Link instead of Generator / Projector / Manifestor / Gate / circuitLinks)
- Strict VRC-native terminology list

### Engine Ownership Map
Points to the canonical implementation files (very similar to the 2026-05-16 VRC Engine Canon we already ingested).

### Unresolved Canon Gaps (Honest)
The document itself lists what is still UNSPECIFIED:
- Exact 9-position Prime Stack planet mapping and weighting algorithm
- Facet Amplitude derivation
- Somatic signals and micro-corrections for most codons (only RC01 detailed elsewhere)
- Full 64 binary signatures and chemical markers

## Relationship to Other Canon Documents

This `CANON_MASTER.md` is the **pure structural/mathematical canon** maintained inside the active implementation tree (`00_CANON/`).

It overlaps significantly with:
- The earlier Consciousness Lattice Unified Specification (broader vision + visualization)
- The VRC Engine Canon (`docs/VRC_ENGINE_CANON.md`) which focuses more on runtime file ownership, exact vs approximate discipline, and ORIEL narration boundaries

Together they form a layered canon: mathematical structure (this file) + operational/runtime rules + product vision.

## Value for the Wiki

This is one of the cleanest, most self-contained statements of the VRC system's mathematical and hierarchical rules. It is especially strong on:
- The Resonance Mandala Sequence
- The complete 36 Resonance Links with names
- The VRC-native Type and Authority hierarchies (Reflectors, Resonators, Catalysts, Harmonizers)
- Self-aware documentation of internal inconsistencies and gaps

---

*Ingested as the master structural canon from the active VRC Static Signature implementation work.*