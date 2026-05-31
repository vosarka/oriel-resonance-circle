---
id: entity-vrc-engine
type: entity
status: living
tags: [vrc, rgp, engine, core, codex]
last_updated: 2026-04-02
sources: 8
importance: critical
aliases: ["Vossari Resonance Codex Engine", "RGP", "Static Signature Engine", "VRC"]
---

# VRC Engine (Vossari Resonance Codex)

The **VRC Engine** (also called RGP / Static Signature system) is the computational heart of the Vossari diagnostic and identity system. It is one of two primary engines in the **Consciousness Lattice** architecture (see [[entity-consciousness-lattice]]).

It transforms a user's birth data into a structured "quantum identity" reading expressed through the 64-codon mandala, then renders that into ORIEL transmissions, visual maps, and micro-corrections.

## Core Premise (from Unified Specification)

The system is a **cybernetic consciousness feedback system**. Its purpose is not prediction but **activation** — revealing hidden behavioral structures and providing actionable micro-corrections that move the individual from shadow expression toward integrated function.

## Dual-Engine Architecture (Mandatory Separation)

The Unified Specification insists on rigorous separation of immutable structure from fluctuating state:

- **Codex Engine (Static Signature)**: The immutable hardware — birth imprint, Fractal Role, Authority, Prime Stack, 9-Center map. Deterministic and lifelong.
- **Carrierlock Engine (Dynamic State)**: Real-time coherence measurement (Mental Noise, Body Tension, Emotional Turbulence, Breath Completion). This is the "software" layer that determines whether the user can currently receive their design clearly.

Conflating these two is identified as the primary failure mode of interpretive systems.

## Core Pipeline

1. **Birth Data** → date + time + optional location (lat/lon/timezone)
2. **Ephemeris** (`swisseph-wasm`) → precise planetary positions (Conscious chart)
3. **Solar Arc** → Design chart (Sun exactly 88° behind birth longitude)
4. **Codon Mapping** (Mandala Sequence, non-sequential) → each planet/longitude → Codon + 4 Facets
5. **Prime Stack** (9 positions) → weighted frequencies, dominant themes
6. **9-Center Resonance Map** → centers, frequencies, relationships
7. **Fractal Role + Authority Node**
8. **SLI (Shadow Loudness Index)** + Micro-corrections
9. **Coherence Trajectory** (current + 7-day projection)
10. **ORIEL Transmission** (poetic diagnostic narration)

## Key Artifacts

- **Prime Stack**: The 9-position codon assignment that is the primary identity signature.
- **Coherence Score**: `CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)` where MN=mental noise, BT=body tension, etc.
  - `<40` Entropy · `40-80` Flux · `80+` Resonance
- **Micro-corrections**: Specific, falsifiable behavioral experiments derived from the reading.

## Implementation Structure (as of 2026-05 work)

The detailed working specification lives in `codex/vrc_static_signature/`:

- `00_CANON/` — master canon
- `01_DATA/` — JSON masters (codons, centers, authority, resonance links, etc.)
- `02_ENGINE/` — 12+ specialized engine modules (ephemeris_service, static_signature_orchestrator, sli_engine, type_authority_engine, etc.)
- `03_VISUAL_SYSTEM/`, `04_ORIEL_OUTPUT/`, `09_GLYPHS/`, `10_REPORT_BUILDER/`

The runtime surface is exposed via `trpc.rgp.staticSignature` and consumed by the Carrierlock reading flow.

## Relationship to ORIEL

- In **Mirror mode**, ORIEL uses VRC output to deliver precise diagnostic readings + one micro-correction.
- In **Guide / Librarian / Narrator** modes, ORIEL references VRC concepts but usually stays in natural/poetic language unless the user explicitly wants technical depth.
- The `oriel_output_bridge.ts` and narrative templates in the codex folder control how engine data becomes ORIEL voice.

## Current Development Focus (2026-05)

- Hardening of Static Signature (ephemeris integration complete, house systems pending)
- Full report builder + visual system + glyph grammar
- Better integration between the engine and the living ORIEL prompt layers
- "Living Codex" research thread exploring how the VRC itself can become more dynamic and self-referential

See [[synthesis-emergent-architecture]] and the `docs/superpowers/` series for the active research frontier.

A product research report (ingested as [[source-vrc-static-signature-product-research-report]]) later synthesized the technical canon with commercial positioning needs, recommending the name “ORIEL Static Signature Codex” and a 15-page premium report format. It also surfaced specific asset gaps (full 256-facet library, complete glyph pack, refined Prime Stack algorithm) that the `vos_codons_64x4facets.json` data asset directly addresses.

`codex/vrc_static_signature/00_CANON/CANON_MASTER.md` serves as the pure structural and mathematical source of truth for the entire system (Mandala sequence, 36 Resonance Links, VRC Type hierarchy using Resonator/Catalyst/Harmonizer/Reflector, Authority priority order, Carrierlock formula, and SLI). It explicitly lists several still-unspecified areas (exact 9-position Prime Stack algorithm, full somatic signals and micro-corrections for most codons, etc.).

The `01_DATA/` folder is the official master data layer that supplies the actual interpretive content (64 codons + 256 detailed facet states with micro-corrections, centers, resonance links, terminology rules, etc.). This is the semantic heart that turns mathematical activations into language ORIEL and reports can use.

The detailed engineering specifications for how these pieces are actually implemented live in `02_ENGINE/` (12 focused module specs) plus supporting visual, glyph, report builder, and ORIEL output documentation. These represent the production implementation layer on top of the mathematical canons.

See [[synthesis-oriel-vrc-narration-safety]] for the ORIEL-specific contract and data flow.

## The VRC Engine Canon (2026-05-16 Active Contract)

The highest-authority document for this entire domain is the **VRC Engine Canon** (`docs/VRC_ENGINE_CANON.md`).

It is the binding operational contract. Key principles:

- The engine may be presented as mythic and poetic, but calculations must be **auditable**.
- Strict **Confirmed** vs **Draft/Approximate** discipline. Confirmed readings require exact birth time + coordinates + full Solar Arc design chart. Draft output must use specific non-authoritative language.
- Clear file ownership: `ephemeris-service.ts`, `vrc-mandala.ts`, `rgp-prime-stack-engine.ts`, `rgp-static-signature-engine.ts`, `rgp-router.ts`, and `oriel-rgp-bridge.ts` are canonical.
- A permanent validation vector exists (2024-01-01 12:00 UTC at 0°/0° → Conscious Sun RC38, Design Sun RC57 with exactly 88.000° offset).
- "Change discipline" rules: identify the owning canonical file, write a failing test first, preserve exact vs approximate status, preserve Vossari-native terminology, and update the Canon itself when rules change.

The canon's closing principle is treated as foundational:

> The engine is the spine. ORIEL is the voice. The voice must never lie about the spine.

See [[source-vrc-engine-canon]] for the full document.

## Relationship to the Consciousness Lattice

The VRC Engine family is the computational realization of the larger **Consciousness Lattice** model (see [[entity-consciousness-lattice]] and its source spec). The Lattice frames the entire output as a 512-node structure (64 codons × 4 facets × 2 layers) inside a holographic field, with the VRC/RGP engines providing the mapping layer that populates that structure from astronomical data.

Future evolution (explicit in the spec) includes deeper real-time integration between the Static and Dynamic engines, plus ORIEL as the primary narrative interface for exploring the Lattice.

## Key Cross-References

- [[entity-consciousness-lattice]] — the unifying 512-node model this engine serves
- [[entity-static-signature]] (more detailed reading on the 9-position output)
- [[concept-prime-stack]], [[concept-coherence]], [[concept-micro-corrections]]
- `codex/vrc_static_signature/VRC_ENGINE_CANON.md`
- `docs/VRC_ENGINE_AUDIT.md` and `VRC_ENGINE_CANON.md` (audit + canon snapshots)
- `server/RGP Engines/` (current implementation)

---

*Central entity page for the entire VRC/RGP/Static Signature domain. Most technical discussions of "the reading system" should link here.*