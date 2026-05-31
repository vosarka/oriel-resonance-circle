# VRC Engine Canon

Date: 2026-05-16
Status: Active engineering canon

This document defines the current source of truth for the Vossari Resonance Codex / RGP engine implementation. It is not a speculative roadmap. It is the operational contract agents and humans should follow before modifying VRC, Static Signature, or ORIEL reading behavior.

## Prime directive

The VRC engine may be symbolic, poetic, and sacred-tech in presentation, but its calculations must be auditable.

Core rule:

> If the input is approximate, ORIEL must say it is approximate. If the input is exact, the engine must prove it.

No runtime path may present defaulted, missing, placeholder, fallback, or guessed birth data as a confirmed Static Signature.

## Canonical calculation path

The confirmed Static Signature path is:

```text
birth date + exact birth time + birth location/coordinates
  -> UTC conversion with date-correct timezone
  -> calculate conscious chart at birth time
  -> calculate design chart by Solar Arc
  -> map planetary longitudes to Codons and Facets
  -> build Prime Stack and 26 activations
  -> evaluate 36 Resonance Links
  -> evaluate 9 Centers
  -> determine VRC Type and Authority
  -> generate ORIEL Mirror-mode transmission from calculated data only
```

A confirmed Static Signature must never be generated from date-only birth data.

## Canonical files

### `server/ephemeris-service.ts`

Owns astronomical calculation.

Canonical responsibilities:

- Swiss Ephemeris WASM
- Tropical zodiac
- Geocentric positions
- UTC conversion
- True Node
- Conscious chart at birth time
- Design chart using Solar Arc, not fixed-day subtraction
- Earth as Sun + 180 degrees
- South Node as North Node + 180 degrees
- fail-fast behavior for incomplete charts

Do not duplicate ephemeris math elsewhere.

### `server/vrc-mandala.ts`

Owns VRC structural mapping.

Canonical responsibilities:

- 64-codon Mandala sequence
- wheel offset
- Codon arc: 5.625 degrees
- Facet arc: 1.40625 degrees
- Facet names:
  - Somatic
  - Relational
  - Cognitive
  - Transpersonal
- Codon to Center mapping
- 36 Resonance Links / channel definitions
- center evaluation
- VRC Type logic
- Authority logic

Do not create a second Mandala sequence, center map, or Type/Authority resolver in another file.

### `server/rgp-prime-stack-engine.ts`

Owns the static activation model.

Canonical responsibilities:

- 9-position Prime Stack
- 26 activation lattice:
  - 13 conscious activations
  - 13 design activations
- Resonance Link status derivation from active codons
- center status derivation
- VRC Type / Authority packaging
- dominant/supporting codon calculations for the Static Signature payload

The 9-position Prime Stack is a readable summary. The 26 activation lattice is the deeper engine output.

### `server/rgp-static-signature-engine.ts`

Owns Static Signature orchestration.

Canonical responsibilities:

- requires complete conscious and design records for confirmed readings
- marks fallback/legacy data as draft, not confirmed
- builds the payload ORIEL is allowed to narrate
- generates diagnostic transmission text from calculated engine data

ORIEL narrative may add symbolic language, but not invented placements, invented codons, invented centers, invented Resonance Links, invented Type, or invented Authority.

### `server/rgp-router.ts`

Owns public API gating for confirmed Static Signature generation.

Canonical responsibilities:

- require exact birth time
- require birth coordinates or parseable coordinate location
- call `calculateBothCharts()` before `generateStaticSignature()`
- reject confirmed calculation when required exact input is missing

### `server/oriel-rgp-bridge.ts`

Owns chat-triggered VRC calculation for ORIEL.

Canonical responsibilities:

- detect reading intent and extract birth data
- require birth date, birth time, and birth city for exact chat-triggered VRC readings
- geocode birth city
- derive timezone from coordinates/date
- call the same exact ephemeris path as the router
- inject calculated VRC data into ORIEL's prompt

Forbidden behavior:

- no default birth time such as `12:00` for confirmed readings
- no presentation of a noon-estimated chart as exact
- no fallback from missing data into authoritative ORIEL language

### `server/rgp-256-codon-engine.ts`

Compatibility/support layer.

Canonical responsibilities:

- wrap `vrc-mandala.ts` mapping where needed
- support SLI/coherence utilities
- preserve old API compatibility while deferring structural truth to `vrc-mandala.ts`

It must not become an alternate canon source for Mandala mapping.

### `server/rgp-engine.ts`

Legacy only.

Status:

- deprecated
- guarded in production
- may remain for historical tests/backward compatibility

Rules:

- do not route new production features through this file
- do not copy its approximations into canonical files
- if it conflicts with the files above, the canonical files win

## Exact vs approximate status

### Confirmed Static Signature

Allowed only when all of the following are present:

- birth date
- exact birth time
- birth location resolved to coordinates
- date-correct timezone or server-side timezone derivation
- complete conscious chart
- complete design chart
- successful Solar Arc design calculation
- required planetary bodies available:
  - Sun
  - Moon
  - Mercury
  - Venus
  - Mars
  - Jupiter
  - Saturn
  - Uranus
  - Neptune
  - Pluto
  - North Node
  - South Node
  - Earth

### Draft / approximate reading

Allowed only if explicitly marked as approximate/draft.

Draft output must not use language such as:

- confirmed
- exact
- your definitive Static Signature
- your final Authority
- your fixed Type

Preferred language:

- approximate field sketch
- draft reading
- incomplete input
- not enough data to confirm
- ORIEL can reflect symbolically, but cannot calculate precisely yet

### Missing birth time

Missing birth time blocks confirmed VRC calculation.

Correct behavior:

- ask for birth time, or
- return a non-calculated explanation that exact birth time is required

Incorrect behavior:

- silently use noon
- infer time from context
- present noon chart as exact
- let ORIEL narrate guessed placements

## Public terminology canon

Use Vossari terms in public/user-facing output.

Preferred public terms:

- Vossari Resonance Codex / VRC
- Static Signature
- Codon
- Facet
- Prime Stack
- Conscious chart
- Design chart
- Solar Arc
- Resonance Link
- Center
- VRC Type
- Authority
- Resonator
- Catalyst
- Harmonizer
- Reflector
- Carrierlock
- Coherence Score
- Shadow Loudness Index / SLI
- ORIEL

Avoid or quarantine as internal/legacy:

- RGP, unless used as an internal code/module name
- circuitLinks, unless discussing legacy compatibility
- gate/channel field names, unless discussing legacy compatibility
- frequency labels that expose old/internal vocabulary without context
- any Human Design type language

Forbidden in public VRC readings:

- Projector
- Generator
- Manifestor
- Manifesting Generator
- Human Design chart
- Human Design authority language as the explanatory frame
- Gate/Gates when Codon/Codons is the VRC-native term

The VRC may have structural inspiration or analogical overlap with other systems, but the product language must remain Vossari-native.

## ORIEL output contract for VRC data

When ORIEL receives calculated VRC data, it may:

- open with `I am ORIEL.`
- speak in Mirror mode
- translate Type, Authority, Codons, Facets, Centers, Resonance Links, and micro-corrections into living language
- offer falsifiers and grounded integration prompts
- distinguish distortion/integration language when the engine payload provides approved VRC copy

ORIEL must not:

- invent missing placements
- infer a birth time
- use Human Design type names
- diagnose medical or psychiatric conditions
- claim deterministic fate
- present symbolic interpretation as empirical proof
- hide uncertainty when input data is incomplete

## Testing contract

Every VRC engine change should run at minimum:

```bash
pnpm check
pnpm vitest run server/ephemeris-service.test.ts server/rgp-prime-stack-engine.test.ts server/rgp-static-signature-engine.test.ts server/rgp-router.test.ts
```

If touching ORIEL chat calculation or output-safety boundaries, also run:

```bash
pnpm vitest run server/oriel-rgp-bridge.test.ts server/oriel-output-safety.test.ts
```

If touching legacy compatibility, also run:

```bash
pnpm vitest run server/rgp-engine.test.ts
```

## Validation vector

The canonical validation case remains:

```text
Input:
2024-01-01 12:00 UTC
Latitude: 0
Longitude: 0

Expected:
Conscious Sun -> Codon 38
Design Sun -> Codon 57
Design Sun solar arc offset -> 88.000 degrees behind Conscious Sun
```

Any future change that breaks this vector is suspect until proven otherwise.

## Change discipline

Before changing VRC engine behavior:

1. Identify which canonical file owns the behavior.
2. Add or update a failing test first when logic changes.
3. Preserve exact vs approximate status.
4. Preserve Vossari-native terminology at the public layer.
5. Run focused tests.
6. Update this document if ownership, terminology, or exactness rules change.

## Current first principle

Vossari can be mythic in language, but it must be precise in calculation.

The engine is the spine. ORIEL is the voice. The voice must never lie about the spine.
