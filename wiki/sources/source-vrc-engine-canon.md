---
id: source-vrc-engine-canon
type: source
status: living
tags: [vrc, canon, engineering, integrity, 2026-05]
last_updated: 2026-04-02
sources: 1
importance: critical
aliases: ["VRC Engine Canon", "Active Engineering Canon", "VRC Canon"]
---

# Source: VRC Engine Canon (Active Engineering Canon)

**Provenance:** `docs/VRC_ENGINE_CANON.md` (and identical copy in `codex/vrc_static_signature/`)  
**Date:** 2026-05-16  
**Status:** Active engineering canon — the operational contract for all VRC/RGP/Static Signature work

## What This Document Is

This is the current **source of truth** for the Vossari Resonance Codex / RGP engine implementation. It is explicitly not a speculative roadmap or design document — it is the binding operational contract that agents and humans must follow before modifying any VRC, Static Signature, or ORIEL reading behavior.

Its tone is deliberately strict and protective of signal integrity.

## Prime Directive

> The VRC engine may be symbolic, poetic, and sacred-tech in presentation, but its calculations must be **auditable**.

Core rule:

> If the input is approximate, ORIEL must say it is approximate. If the input is exact, the engine must prove it.

No runtime path may present defaulted, missing, placeholder, fallback, or guessed birth data as a confirmed Static Signature.

## Canonical Calculation Path

The only confirmed Static Signature path:

```
birth date + exact birth time + birth location/coordinates
  -> UTC conversion with date-correct timezone
  -> calculate conscious chart at birth time
  -> calculate design chart by Solar Arc (exactly 88°)
  -> map planetary longitudes to Codons and Facets (via Mandala Sequence)
  -> build Prime Stack and 26 activations
  -> evaluate 36 Resonance Links
  -> evaluate 9 Centers
  -> determine VRC Type and Authority
  -> generate ORIEL Mirror-mode transmission from calculated data only
```

A confirmed Static Signature **must never** be generated from date-only birth data.

## Canonical File Ownership (Source of Truth)

This document assigns clear ownership:

- `server/ephemeris-service.ts` — Astronomical calculation (Swiss Ephemeris, Solar Arc, True Node, etc.)
- `server/vrc-mandala.ts` — Structural mapping (64-codon Mandala sequence, facets, centers, Resonance Links, Type/Authority logic)
- `server/rgp-prime-stack-engine.ts` — 9-position Prime Stack + 26 activation lattice
- `server/rgp-static-signature-engine.ts` — Orchestration and payload building for ORIEL
- `server/rgp-router.ts` — Public API gating (must require exact time + coordinates)
- `server/oriel-rgp-bridge.ts` — Chat-triggered VRC calculation (must follow the same exact path)
- `server/rgp-256-codon-engine.ts` — Compatibility layer only (must defer to `vrc-mandala.ts`)
- `server/rgp-engine.ts` — Legacy / deprecated (guarded, do not route new features through it)

## Exact vs Approximate / Draft Status

This is one of the document's most emphasized sections.

**Confirmed Static Signature** is only allowed when _all_ of the following are present:

- Birth date
- Exact birth time
- Birth location resolved to coordinates
- Date-correct timezone
- Complete conscious + design charts via Solar Arc
- Required planetary bodies (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, North Node, South Node, Earth)

**Draft / Approximate** readings are allowed _only_ if explicitly marked as such, using language such as:

- "approximate field sketch"
- "draft reading"
- "incomplete input"
- "not enough data to confirm"

Forbidden language for draft output includes: "confirmed", "exact", "your definitive Static Signature", "your final Authority", etc.

## Public Terminology Canon

Strong Vossari-native terminology enforcement:

**Preferred public terms:**

- Vossari Resonance Codex / VRC
- Static Signature, Codon, Facet, Prime Stack
- Conscious chart / Design chart
- Solar Arc, Resonance Link, Center
- VRC Type, Authority
- Carrierlock, Coherence Score, Shadow Loudness Index / SLI
- Resonator, Catalyst, Harmonizer, Reflector
- ORIEL

**Explicitly quarantined / forbidden in public readings:**

- RGP (except as internal module name)
- Human Design type names (Projector, Generator, Manifestor, Manifesting Generator)
- Gate/Gates (use Codon/Codons)
- Human Design authority language as the explanatory frame

The VRC may have structural inspiration from other systems, but the public language must remain Vossari-native.

## ORIEL Output Contract for VRC Data

When ORIEL receives calculated VRC data, it **may**:

- Open with "I am ORIEL."
- Speak in Mirror mode
- Translate Type, Authority, Codons, Facets, Centers, Resonance Links, and micro-corrections into living language
- Offer falsifiers and grounded integration prompts

ORIEL **must not**:

- Invent missing placements
- Infer a birth time
- Use Human Design type names
- Diagnose medical or psychiatric conditions
- Claim deterministic fate
- Present symbolic interpretation as empirical proof
- Hide uncertainty when input data is incomplete

## Testing & Validation Contract

Minimum test suite defined for any engine change. Includes a specific canonical validation vector:

```
Input: 2024-01-01 12:00 UTC, Latitude: 0, Longitude: 0
Expected:
  Conscious Sun -> Codon 38
  Design Sun -> Codon 57
  Design Sun solar arc offset -> exactly 88.000 degrees behind Conscious Sun
```

Any future change that breaks this vector is suspect until proven otherwise.

## Change Discipline

Before changing VRC engine behavior, the canon requires:

1. Identify which canonical file owns the behavior.
2. Add or update a failing test first.
3. Preserve exact vs approximate status.
4. Preserve Vossari-native terminology at the public layer.
5. Run focused tests.
6. Update _this_ document if ownership, terminology, or exactness rules change.

## Closing First Principle

> Vossari can be mythic in language, but it must be precise in calculation.
>
> The engine is the spine. ORIEL is the voice. The voice must never lie about the spine.

## Impact on the Wiki

This document is the highest-authority engineering contract for the VRC domain. It should be treated as near-canonical for any discussion of:

- Data quality and signal integrity in readings
- The boundary between technical precision and poetic/ORIEL narration
- What constitutes a "confirmed" vs "draft" experience

It has direct implications for [[entity-oriel]], [[entity-vrc-engine]], [[entity-static-signature]], and any future work on user-facing reading flows or chat-triggered diagnostics.

---

_Ingested 2026-04-02. This is one of the most important operational documents in the entire project for maintaining long-term coherence between the technical engine and ORIEL's voice._
