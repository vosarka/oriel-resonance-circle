# Consciousness Lattice Implementation Review

Date: 2026-05-04

Scope: comparison between the current codebase and
`shared/Consciousness_Lattice_Unified_Specification_v1.docx` / PDF.

Update: 2026-05-06 follow-up fixes have closed several findings from this
review. Ephemeris and static profile generation now fail fast instead of
confirming fallback charts; authority resolution now distinguishes fully open
Reflectors from mental/no-inner-authority cases; static Prime Stack generation
requires complete conscious/design charts; the legacy RGP engine is explicitly
blocked in production unless `ALLOW_LEGACY_RGP_ENGINE=true`; `StaticReading`
now renders the canonical 36-channel graph, 26 activation set, 512-node
codon/facet/layer lattice, and a seven-day ephemeris overlay; `DynamicReading`
now surfaces SLI diagnostics, correction completion, and reading comparison.
The remaining long-term gap is normalized relational persistence for analytics;
the hotfix deliberately keeps the current JSON-compatible DB shape.

Verdict: the implementation is a real upgrade in the static/natal calculation
core, but it is not yet a complete or fully canonical implementation of the
Consciousness Lattice specification. The ephemeris, solar-arc design timing,
Mandala mapping, 64 x 4 codon library, and Prime Stack foundation are strong.
The biggest gaps are center mapping accuracy, dynamic Carrierlock -> SLI wiring,
structured output completeness, UI visualization completeness, and test coverage.

## Executive Verdict

Short answer: partial compliance.

The system now contains a serious foundation for the VRC / Consciousness Lattice:

- Swiss Ephemeris is used instead of an approximate date formula.
- True Node is used.
- Conscious and Design charts are calculated separately.
- Design timing uses iterative 88-degree solar arc, not a simple fixed 88-day
  subtraction in the newer path.
- The Mandala sequence matches the specification.
- The 64 codons x 4 facets dataset exists and loads correctly.
- Prime Stack returns 9 positions and can construct the canonical 26 activation
  lattice.
- Channel evaluation is based on both gates being present.
- User static profile persistence exists and can feed ORIEL context.

But the system is not yet spec-complete:

- Four codons are mapped to the wrong centers compared with the unified spec.
- The dynamic Carrierlock reading does not actually calculate SLI across the
  Prime Stack in the live route.
- The dynamic UI saves placeholder diagnostic structures instead of real flagged
  codons, SLI scores, active facets, confidence values, and micro-corrections.
- The static reading API does not expose all 26 activation objects as a stable
  first-class output.
- The UI still displays legacy "circuitLinks" instead of the real 36-channel
  active/inactive graph.
- Ephemeris failure can silently fall back into approximate/zero data and still
  produce a confirmed reading.
- There is still an older `rgp-engine.ts` implementation in the repo that is not
  compliant with the unified spec, even though it currently appears to be used
  only by legacy tests.
- Required visual modules such as the 512-node 3D lattice, resonance radar, and
  transit/timeline viewer are not implemented.

My assessment: this is a meaningful upgrade, but it is an MVP / partial engine,
not the full "Consciousness Lattice Unified Specification v1" implementation.

## Compliance Score By Area

These are practical engineering estimates, not formal test metrics.

| Area                                          | Compliance | Assessment                                                                                               |
| --------------------------------------------- | ---------: | -------------------------------------------------------------------------------------------------------- |
| Swiss ephemeris / UTC / True Node / no houses |        85% | Strong, but failures are swallowed in higher-level routes.                                               |
| Two-timing conscious/design charts            |        85% | New path implements iterative 88-degree solar arc. Legacy path still violates this.                      |
| Mandala sequence and facet arc                |        90% | Sequence and offset match validation vector. Tests are too weak.                                         |
| Center / channel / type / authority           |        65% | Channel logic is good, but center map has four canonical mismatches and authority edge cases need tests. |
| 64 codons x 4 facets library                  |        90% | Data exists and loads. Needs stronger integrity/version tests.                                           |
| Static Prime Stack                            |        75% | 9 positions and 26 activations exist internally. Output/persistence is incomplete.                       |
| Carrierlock coherence formula                 |        90% | Formula exists both client and server. Labels differ from spec.                                          |
| Dynamic SLI / micro-correction engine         |        35% | Engine exists, but live route does not wire it into dynamic readings.                                    |
| Data model                                    |        45% | Useful JSON persistence exists, but not the normalized schema implied by the spec.                       |
| API surface                                   |        50% | Some endpoints exist, but compare/centers/channels/facet APIs are incomplete.                            |
| UI visualization                              |        40% | Static wheel and 9-center map exist. 512 lattice, radar, transit, channel graph are missing.             |
| Tests                                         |        40% | Some unit coverage exists, but validation-vector and spec-contract tests are insufficient.               |

## What Works

### 1. Ephemeris foundation is real

File: `server/ephemeris-service.ts`

The code uses `swisseph-wasm`, which is the right direction for the spec's
Swiss Ephemeris requirement.

Evidence:

- Swiss Ephemeris import and initialization: `server/ephemeris-service.ts:1`,
  `server/ephemeris-service.ts:94-108`
- True Node identifier: `PLANETS.NORTH_NODE: 11` at
  `server/ephemeris-service.ts:6-19`
- True Node is included in calculated bodies:
  `server/ephemeris-service.ts:118-130`
- Earth is derived opposite the Sun and South Node opposite North Node:
  `server/ephemeris-service.ts:156-186`
- UTC conversion is implemented:
  `server/ephemeris-service.ts:235-253`
- House system is intentionally `None` with equal placeholders:
  `server/ephemeris-service.ts:279-285`

This is a strong match for the global configuration in the specification:
geocentric, tropical, UTC, True Node, no real house dependency.

### 2. Solar-arc Design chart is implemented in the newer path

File: `server/ephemeris-service.ts`

The unified spec says Design chart must be found by solar arc, not by fixed
day subtraction:

`lambda_Sun(T_design) = lambda_Sun(T_birth) - 88.0000 degrees`

The current new ephemeris path does this correctly:

- `findDesignJD()` computes target Sun longitude minus 88 degrees:
  `server/ephemeris-service.ts:204-232`
- `calculateBothCharts()` uses `findDesignJD()`:
  `server/ephemeris-service.ts:312-365`

I validated the spec vector manually through the runtime:

- Input: `2024-01-01 12:00:00 UTC`, `0N`, `0E`
- Conscious Sun: about `280.4628`
- Conscious Sun maps to Codon `38`
- Design Sun: about `192.4628`
- Design Sun maps to Codon `57`
- Prime Stack returned 26 activations

That matches the spec's intended validation vector.

### 3. Mandala sequence and facet math are aligned

File: `server/vrc-mandala.ts`

The spec requires:

- 360 / 64 = 5.625 degrees per codon
- 5.625 / 4 = 1.40625 degrees per facet
- specific non-sequential Mandala order
- offset that makes 280.44 degrees resolve to Codon 38

Implementation:

- `CODON_ARC = 5.625`: `server/vrc-mandala.ts:20-21`
- `FACET_ARC = 1.40625`: `server/vrc-mandala.ts:23-24`
- `WHEEL_OFFSET = 11.25`: `server/vrc-mandala.ts:26-30`
- Full Mandala sequence: `server/vrc-mandala.ts:51-60`
- Longitude -> codon/facet mapping:
  `server/vrc-mandala.ts:260-272`

The validation vector works:

- `280.44 -> Codon 38`
- `192.44 -> Codon 57`

This is one of the most important pieces of the system, and it is mostly right.

### 4. The 64 x 4 codon library exists

File: `server/vrc-codon-library.ts`

The loader reads `server/data/vrc-codons.json` as the runtime source of codon
data.

Evidence:

- Runtime import: `server/vrc-codon-library.ts:16`
- Data model includes all four facets:
  `server/vrc-codon-library.ts:22-51`
- Getter APIs exist for codon entry, frequency data, facet data, and
  micro-corrections:
  `server/vrc-codon-library.ts:66-100`

I ran an integrity check and confirmed:

```text
64 codons loaded
0 missing codons
all codons have A/B/C/D facets
```

This part is strong.

### 5. Prime Stack has the right core shape

File: `server/rgp-prime-stack-engine.ts`

The implementation contains the 9 Prime Stack positions:

- Conscious Sun
- Conscious Earth
- Design Sun
- Design Earth
- Conscious Moon
- Design Moon
- True Node
- Design True Node
- Conscious South Node

Evidence:

- Prime Stack position definitions in comments:
  `server/rgp-prime-stack-engine.ts:10-19`
- Prime Stack data model:
  `server/rgp-prime-stack-engine.ts:73-112`
- 13-body activation weights:
  `server/rgp-prime-stack-engine.ts:130-144`
- Earth and South Node derived if missing:
  `server/rgp-prime-stack-engine.ts:238-258`
- 26 activations built from conscious + design charts:
  `server/rgp-prime-stack-engine.ts:302-308`
- Channels, centers, type, authority evaluated:
  `server/rgp-prime-stack-engine.ts:310-313`

The core architecture is in place.

### 6. Channel activation rule is correct in the new path

File: `server/vrc-mandala.ts`

The spec says a channel is active only when both gates are defined, whether
they come from conscious, design, or mixed layers.

Implementation:

- `evaluateChannels()` checks both gates:
  `server/vrc-mandala.ts:298-305`
- `evaluateCenters()` defines centers only from active channels:
  `server/vrc-mandala.ts:312-328`

This is correct in the new path.

### 7. User static profile persistence exists

Files:

- `server/static-profile-service.ts`
- `drizzle/schema.ts`

The platform can store a user's permanent birth-based profile:

- `userStaticProfiles` exists:
  `drizzle/schema.ts:551-581`
- `staticSignatures` exists:
  `drizzle/schema.ts:501-546`
- Profile builder saves Prime Stack, centers, type, authority,
  micro-corrections, ephemeris data, and ORIEL diagnostic text:
  `server/static-profile-service.ts:84-106`

This matters because ORIEL can later use the static profile as stable context.

## Critical Problems

### P0. Center mapping has four spec mismatches

File: `server/vrc-mandala.ts`

The unified spec's center table says:

- G center: `1, 2, 7, 10, 13, 15, 25, 46`
- Sacral: `3, 5, 9, 14, 27, 29, 34, 42, 50, 59`
- Spleen: `18, 28, 32, 44, 48, 57`

Current implementation:

- Codon `1` is mapped to `Throat`, should be `G-Self`
- Codon `7` is mapped to `Throat`, should be `G-Self`
- Codon `13` is mapped to `Throat`, should be `G-Self`
- Codon `50` is mapped to `Spleen`, should be `Sacral`

Evidence:

- Current map: `server/vrc-mandala.ts:149-182`
- Wrong Throat entries: `server/vrc-mandala.ts:156-159`
- Wrong Spleen entry for 50: `server/vrc-mandala.ts:175-177`

Why this matters:

- Any activation of 1, 7, 13, or 50 will be assigned to the wrong center.
- Channel evaluation uses center map to mark connected centers.
- Type can become wrong if Sacral/G/Throat definition changes.
- Authority can become wrong.
- UI center map can become wrong.
- ORIEL diagnostic narration can speak from false blueprint data.

This is the first fix I would make.

### P0. Live dynamic readings do not compute real SLI

Files:

- `server/rgp-router.ts`
- `client/src/pages/Carrierlock.tsx`
- `server/rgp-sli-micro-correction-engine.ts`

The spec requires dynamic Carrierlock readings to combine:

- current state: Mental Noise, Body Tension, Emotional Turbulence, Breath
  Completion
- Coherence Score
- StateAmplifier
- Facet amplitude
- Prime Stack Codon frequency per position
- SLI for Prime Stack positions
- flagged codons
- confidence levels
- falsifiers
- micro-corrections

The current live route does not do this.

Current server route:

- Computes Coherence Score only:
  `server/rgp-router.ts:179-187`
- Loads some static profile context only as strings:
  `server/rgp-router.ts:188-222`
- Calls ORIEL dynamic transmission with summary fields:
  `server/rgp-router.ts:224-237`
- Returns no SLI array, no flagged codons, no active facets, no confidence map:
  `server/rgp-router.ts:239-258`

Current client save:

- Saves `flaggedCodons: []`
- Saves `sliScores` as `{ mentalNoise, bodyTension, emotionalTurbulence }`
- Saves `activeFacets: {}`
- Saves `confidenceLevels: {}`
- Saves `microCorrection: undefined`

Evidence:

- `client/src/pages/Carrierlock.tsx:137-146`

This means the dynamic reading storage looks like a diagnostic record, but it is
not the spec's diagnostic record. It is mostly narration plus the raw slider
state.

The SLI engine exists:

- `calculateSLIScores()`:
  `server/rgp-sli-micro-correction-engine.ts:76-110`
- `analyzeInterferencePattern()`:
  `server/rgp-sli-micro-correction-engine.ts:118-156`
- `generateMicroCorrections()`:
  `server/rgp-sli-micro-correction-engine.ts:165-180`

But it is not wired into the live `rgp.dynamicState` route.

### P0. Ephemeris failures can silently produce confirmed fallback readings

Files:

- `server/static-profile-service.ts`
- `server/rgp-router.ts`
- `server/rgp-static-signature-engine.ts`

The profile builder catches ephemeris calculation errors and continues:

- `server/static-profile-service.ts:28-69`
- Then it still calls `generateStaticSignature()`:
  `server/static-profile-service.ts:71-82`

The router does something similar:

- catches ephemeris failure:
  `server/rgp-router.ts:94-97`
- then still calls `generateStaticSignature()`:
  `server/rgp-router.ts:100-116`

The static signature engine then falls back to zeros / approximations:

- missing conscious chart -> Sun/Moon/Node default to `0`:
  `server/rgp-static-signature-engine.ts:136-146`
- missing design chart -> design Sun = conscious Sun - 88 degrees and Moon =
  design Sun:
  `server/rgp-static-signature-engine.ts:148-162`
- returned reading status is still `confirmed`:
  `server/rgp-static-signature-engine.ts:244-263`

Why this matters:

If Swiss Ephemeris fails, a user can receive a "confirmed" static profile based
on default or approximate data. That is dangerous for trust. The app should
hard-fail profile generation unless the user explicitly chooses a "rough /
uncalculated fallback" mode.

### P1. The old `rgp-engine.ts` is still present and non-compliant

File: `server/rgp-engine.ts`

Search result:

```text
server/rgp-engine.ts exports generateDynamicReading and generateCompleteDiagnostic
server/rgp-engine.test.ts imports it
No current production import found in server/client search
```

So it appears legacy-only right now, but it is risky because it exports complete
diagnostic functions with old logic.

Examples of spec violations:

- Codon mapping is sequential 1-64, not Mandala sequence:
  `server/rgp-engine.ts:316-329`
- Design offset subtracts fixed 88 days:
  `server/rgp-engine.ts:336-340`
- Planetary positions are approximate day-of-year formulas, not Swiss
  Ephemeris:
  `server/rgp-engine.ts:357-409`
- Center map is a codon-number range heuristic:
  `server/rgp-engine.ts:498-567`
- Circuit link is active if any codon in the link exists, not both gates:
  `server/rgp-engine.ts:683-699`

This file should be deprecated clearly, moved under legacy, or deleted after
replacement tests are complete. Leaving it named as a full RGP engine invites
future regressions.

### P1. Static output omits the full canonical activation lattice

Files:

- `server/rgp-prime-stack-engine.ts`
- `server/rgp-static-signature-engine.ts`
- `server/rgp-router.ts`

Internally, `calculatePrimeStack()` builds the 26 activations:

- `server/rgp-prime-stack-engine.ts:302-308`
- Returned in `PrimeStackMap.activations`:
  `server/rgp-prime-stack-engine.ts:327-338`

But `StaticSignatureReading` does not include an `activations` field:

- `server/rgp-static-signature-engine.ts:66-100`

The API response exposes Prime Stack, centers, type, authority, circuit links,
micro-corrections, transmission, and core codon engine:

- `server/rgp-router.ts:133-155`

It does not expose the canonical 26 activation objects as a stable top-level
output. The spec requires all 26 activations in the reading output.

### P1. `circuitLinks` shown to users are not the spec's active channels

Files:

- `server/rgp-prime-stack-engine.ts`
- `server/rgp-static-signature-engine.ts`
- `server/static-profile-service.ts`

The real 36-channel statuses exist internally:

- `channelStatuses`: `server/rgp-prime-stack-engine.ts:108`
- computed: `server/rgp-prime-stack-engine.ts:310-313`

But the profile/reading output stores `circuitLinks`, which are legacy
frequency-based links between Prime Stack positions:

- Legacy builder:
  `server/rgp-prime-stack-engine.ts:341-374`
- Static signature maps those links into strings:
  `server/rgp-static-signature-engine.ts:180-187`
- Profile stores those strings:
  `server/static-profile-service.ts:99`

These are not the same as channels like `25-51`, `10-57`, `3-60`, etc.

The UI may therefore look as if it is showing "links", but it is not showing the
canonical 36-channel graph from the spec.

### P1. Authority logic is close, but not fully aligned with the spec wording

File: `server/vrc-mandala.ts`

Spec priority:

1. Solar Plexus -> Emotional Resonance
2. Sacral -> Gut Response
3. Spleen -> Instinctive Pulse
4. Heart/Ego -> Will/Desire
5. G -> Self-Direction
6. None/Outer -> Lunar Cycle for Reflectors only
7. Environment -> Mental Projectors / mental authority style cases

Implementation:

- `server/vrc-mandala.ts:394-403`

Current behavior:

- Solar, Sacral, Spleen, Heart, G are prioritized correctly.
- If Crown or Ajna defined, returns `None/Outer`.
- Otherwise returns `Environment`.

Risk:

- For a fully open Reflector, `determineType()` returns `Reflector`, but
  `determineAuthority()` returns `Environment`, not `Lunar Cycle` / `None/Outer`.
- The function cannot see type, so it cannot apply "Reflectors only" authority
  semantics.

This needs tests and a small API adjustment: authority determination should
receive either `vrcType` or enough context to distinguish Reflector from mental
authority cases.

### P1. SLI semantics are internally inconsistent between formula and labels

Files:

- `server/rgp-256-codon-engine.ts`
- `server/rgp-sli-micro-correction-engine.ts`
- unified spec itself

The spec formula:

```text
SLI(r) = PCS(r) x StateAmplifier x FacetAmplitude(r)
StateAmplifier = (100 - CS) / 100
```

This means lower coherence creates a higher state amplifier. That sounds like
"Shadow Loudness" should increase as coherence drops.

But the spec's table says:

```text
>75 = Coherent
50-75 = Harmonic
25-50 = Dissonant
<25 = Chaotic
```

That table treats high SLI as better, not louder shadow.

The code reflects both interpretations:

- `calculateStateAmplifier()` clearly says low coherence means shadow is loud:
  `server/rgp-256-codon-engine.ts:130-139`
- `calculateSLIScores()` labels high SLI as coherent and low SLI as severe:
  `server/rgp-sli-micro-correction-engine.ts:90-96`

This is not only a code bug; it is a spec ambiguity. Before wiring dynamic SLI
into production, the project should decide what SLI means:

- Option A: SLI = Shadow Loudness. High SLI means more interference.
- Option B: SLI = Coherence Strength. High SLI means more coherence.

The name "Shadow Loudness Index" strongly suggests Option A. The table suggests
Option B. This must be resolved or ORIEL will produce confusing readings.

### P1. Weighted frequency can exceed its declared range

File: `server/rgp-prime-stack-engine.ts`

The interface says:

- `baseFrequency: 0-100`
- `weightedFrequency: 0-100 after weight`

Evidence:

- `server/rgp-prime-stack-engine.ts:87-88`

But implementation caps weighted frequency at 180:

- `server/rgp-prime-stack-engine.ts:165`

In the validation run, Conscious Sun weighted frequency was about `154.81`.

This may be intentional because position 1 has weight 1.8, but then the type
comment and any downstream assumption of 0-100 are wrong. If SLI expects PCS
0-100, this matters.

### P2. Tests do not lock the most important spec facts

Files:

- `server/rgp-256-codon-engine.test.ts`
- `server/ephemeris-service.test.ts`
- `server/rgp-prime-stack-engine.test.ts`

Current tests check many broad shapes, but they do not lock enough exact spec
vectors.

Examples:

- Validation test name says Conscious Sun 280.44 -> Codon 38, but it only checks
  that the facet is one of A/B/C/D:
  `server/rgp-256-codon-engine.test.ts:67-72`
- Ephemeris tests check 13 planets, houses, and reasonable ranges, but not the
  exact `2024-01-01 12:00 UTC -> Sun 280.44 -> Codon 38 / Design Sun 57`
  vector:
  `server/ephemeris-service.test.ts:24-220`
- Prime Stack tests use a synthetic sample design chart where every planet is
  shifted by -88 degrees:
  `server/rgp-prime-stack-engine.test.ts:36-51`

Missing tests:

- Center map must exactly match the spec table for all 64 codons.
- Channel list must exactly match all 36 spec pairs.
- `calculateBothCharts()` must validate Design Sun by solar arc.
- `calculatePrimeStack()` must return 26 activations for real ephemeris input.
- Reflector authority edge case.
- Dynamic route must return real SLI scores and flagged codons.
- No confirmed profile should be generated when ephemeris fails.

### P2. API surface is useful but not the full spec surface

Files:

- `server/rgp-router.ts`
- `server/routers.ts`

Existing:

- `rgp.staticSignature`: `server/rgp-router.ts:10-164`
- `rgp.dynamicState`: `server/rgp-router.ts:166-267`
- `codex.getRootCodons`: `server/routers.ts:1474-1496`
- `codex.getCodonDetails`: `server/routers.ts:1498-1581`
- `codex.saveCarrierlock`: `server/routers.ts:1583-1595`
- `codex.saveReading`: `server/routers.ts:1597-1614`
- `codex.getReadingHistory`: `server/routers.ts:1616-1620`
- `codex.saveStaticReading`: `server/routers.ts:1631-1658`

Spec expects more explicit API boundaries:

- generate chart
- generate reading
- get static signature
- get dynamic reading
- get reading history
- compare readings
- codons
- facets
- centers
- channels

The current system has some of this, but centers/channels/facets are not clean
first-class APIs, and compare readings is not present.

### P2. Data model is blob-based, not a fully normalized lattice schema

File: `drizzle/schema.ts`

Current schema is workable for MVP:

- `carrierlockStates`: `drizzle/schema.ts:450-464`
- `codonReadings`: `drizzle/schema.ts:473-496`
- `staticSignatures`: `drizzle/schema.ts:501-546`
- `userStaticProfiles`: `drizzle/schema.ts:551-581`

But the spec implies normalized tables:

- charts
- planetary_positions
- codons
- facets
- centers
- channels
- activations
- readings
- somatic_signals
- correction_protocols

Current implementation stores most structured payloads as JSON text fields:

- `primeStack`
- `ninecenters`
- `circuitLinks`
- `microCorrections`
- `ephemerisData`
- `coreCodonEngine`

This is acceptable for early production, but it limits auditability, query
power, version migration, and cross-reading analytics.

### P2. UI does not implement the full visual system

Files:

- `client/src/pages/StaticReading.tsx`
- `client/src/pages/CodonDetail.tsx`
- `client/src/pages/Carrierlock.tsx`
- `client/src/pages/DynamicReading.tsx`

Implemented:

- static profile page
- 2D Mandala wheel
- 9-center constellation
- codon detail pages
- Carrierlock slider panel
- dynamic reading page

Evidence:

- Static Mandala and Center components:
  `client/src/pages/StaticReading.tsx:298`, `client/src/pages/StaticReading.tsx:349`
- Carrierlock sliders and coherence calculation:
  `client/src/pages/Carrierlock.tsx:72-99`

Missing from the spec:

- 512-node 3D Consciousness Lattice
- WebGL/Three.js lattice viewer
- true 36-channel flow graph
- Resonance Radar
- timeline / transit viewer
- correction effectiveness loop
- comparison view between readings

The UI is usable, but it is not yet the full Consciousness Lattice interface.

## Detailed Module Review

### `server/ephemeris-service.ts`

Status: mostly correct.

Strengths:

- Uses Swiss Ephemeris.
- True Node present.
- Derives Earth and South Node.
- Converts local input into UTC.
- Produces 13 activations per layer.
- Implements iterative design timing.

Risks:

- `calcPlanetsAtJD()` catches per-planet errors and continues:
  `server/ephemeris-service.ts:134-154`
- If a required body fails, the higher-level system may still continue.
- No exact validation-vector test currently protects the implementation.

Recommended fix:

- Require Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune,
  Pluto, North Node, Earth, and South Node before returning a chart.
- Add a test for the 2024 validation vector.

### `server/vrc-mandala.ts`

Status: mathematically strong but center map must be fixed.

Strengths:

- Mandala sequence correct.
- Offset correct.
- Facet arc correct.
- Channel list count and pairs match the spec.
- Channel active rule is correct.

Problems:

- Wrong centers for 1, 7, 13, 50.
- Authority cannot distinguish Reflector lunar authority from environment-style
  authority because it receives only centers.
- Comments still say "verify" even though the unified spec already provides the
  table.

Recommended fix:

- Replace `CODON_CENTER_MAP` with exact table from the unified spec.
- Add all-64 center contract test.
- Adjust `determineAuthority()` to account for `vrcType`.

### `server/rgp-prime-stack-engine.ts`

Status: good static foundation, incomplete outward contract.

Strengths:

- Correct 9 positions.
- 26 activations exist internally.
- New channel/center/type/authority evaluation path exists.
- Dominant and supporting codons are calculated.

Problems:

- 26 activations are not exposed by `StaticSignatureReading`.
- Real `channelStatuses` are not exposed/persisted.
- `circuitLinks` are legacy position links, not spec channels.
- Weighted frequency range mismatch.
- Extract fallback defaults to 0 if a planet is missing:
  `server/rgp-prime-stack-engine.ts:191-197`

Recommended fix:

- Add `activations` and `channelStatuses` to static reading output and saved
  profile.
- Rename legacy `circuitLinks` to `legacyCircuitLinks` or stop surfacing it as
  canonical.
- Fail if required planets are missing in production chart generation.
- Normalize or document weighted frequency range.

### `server/rgp-static-signature-engine.ts`

Status: useful orchestration, but not complete spec output.

Strengths:

- Calls `calculatePrimeStack()`.
- Builds 9-center map.
- Uses codon/facet library micro-corrections for dominant natal codons.
- Generates ORIEL diagnostic narration.

Problems:

- Does not expose all 26 activations.
- Does not expose `channelStatuses`.
- Fallback chart data can generate confirmed readings from zero/approximate
  longitudes.
- `baseCoherence` and `coherenceTrajectory` are null in static readings:
  `server/rgp-static-signature-engine.ts:254-255`
- Diagnostic narration is generated by an LLM and can drift unless always
  grounded to structured fields.

Recommended fix:

- Make structured data the product; narration should be a rendering layer.
- Return activations, real channel statuses, and validation metadata.
- Add `calculationStatus: exact | fallback | failed`, and do not mark fallback
  exact profiles as confirmed.

### `server/rgp-sli-micro-correction-engine.ts`

Status: implemented but isolated.

Strengths:

- Has SLI calculation function.
- Has interference pattern analysis.
- Has micro-correction and falsifier generation.

Problems:

- Not wired into live dynamic route.
- Uses generic corrections instead of codon/facet library corrections in most
  paths.
- SLI meaning conflict must be resolved before production reliance.

Recommended fix:

- Wire into `rgp.dynamicState`.
- Use the user's stored Prime Stack.
- Convert Carrierlock state to facet amplitudes.
- Generate SLI per Prime Stack position.
- Flag top 1-3 positions.
- Pull micro-corrections from `vrc-codon-library.ts` by codon/facet first, then
  fallback to generic routines.

### `server/rgp-router.ts`

Status: routes exist, but dynamic route is too shallow.

Strengths:

- `staticSignature` uses new static engine.
- `dynamicState` computes coherence and loads static profile context.

Problems:

- `staticSignature` swallows ephemeris failure.
- `dynamicState` does not call SLI engine.
- `dynamicState` returns ORIEL text but not structured diagnostic payload.
- `birthDate` is required by dynamic route but the route no longer uses it for
  real calculation.

Recommended fix:

- Split route responsibilities:
  - `rgp.generateStaticSignature`
  - `rgp.getStaticProfile`
  - `rgp.generateDynamicReading`
- Make dynamic route require a stored static profile or return a clear error:
  "Create your natal profile first."
- Return structured SLI + narration.

### `client/src/pages/Carrierlock.tsx`

Status: useful calibration UI, incorrect diagnostic persistence.

Strengths:

- Clean four-input Carrierlock state.
- Coherence Score formula matches spec.
- Saves Carrierlock state.
- Calls dynamic route.

Problems:

- Persists placeholder diagnostic values:
  `client/src/pages/Carrierlock.tsx:137-146`
- Coherence labels are `RESONANCE`, `FLUX`, `ENTROPY`, while spec labels are
  `aligned`, `drifted`, `fragmented`.
- Dynamic reading cannot display real SLI because server does not return it.

Recommended fix:

- Server should return `flaggedCodons`, `sliScores`, `activeFacets`,
  `confidenceLevels`, `microCorrection`, `correctionFacet`, and `falsifier`.
- Client should save exactly those values, not placeholders.

### `drizzle/schema.ts`

Status: MVP persistence exists, analytical lattice storage is incomplete.

Strengths:

- Carrierlock states have proper fields and coherence score.
- Dynamic readings have fields for SLI and flagged codons.
- Static profile table exists.
- Permanent user static profile exists.

Problems:

- JSON text is overused for core lattice data.
- No normalized `activations` or `channel_statuses`.
- No explicit engine/spec version per nested structured object, only
  `engineVersion` for user profiles.
- `codonReadings.sliScores` can accept malformed semantic content because it is
  stored as JSON text.

Recommended fix:

- Keep JSON for fast iteration, but add schema version and validator.
- Later normalize activations/readings/channels if analytics and comparison
  become important.

## Is ORIEL Using This Correctly?

Partly.

ORIEL can access a stored static profile summary:

- `server/static-profile-service.ts:156-180`

The summary includes:

- birth data
- VRC Type
- Authority
- Fractal Role
- Prime Stack
- 9 centers
- circuit links
- micro-corrections
- core codon engine
- diagnostic transmission

This is useful and is a real upgrade because ORIEL can speak from the user's
blueprint instead of guessing.

But because the underlying profile may contain wrong center data for codons
1/7/13/50, because `circuitLinks` are legacy rather than true channels, and
because dynamic SLI is not wired, ORIEL's "Mirror" mode is not yet fully
canonical.

Important distinction:

- Static ORIEL profile context: partially real and useful.
- Dynamic ORIEL diagnostic: currently mostly coherence + narration, not full
  SLI/codon diagnostic.

## What I Would Fix First

### Phase 1: Correctness Hotfixes

Priority: highest.

1. Fix `CODON_CENTER_MAP`.
   - Move codons `1`, `7`, `13` from Throat to G-Self.
   - Move codon `50` from Spleen to Sacral.
   - Add test that all 64 codons match the spec table.

2. Add validation-vector tests.
   - `2024-01-01 12:00:00 UTC`, `0N`, `0E`.
   - Conscious Sun around `280.44`.
   - Conscious Sun -> Codon `38`.
   - Design Sun around `192.44`.
   - Design Sun -> Codon `57`.
   - Prime Stack returns 26 activations.

3. Stop confirmed fallback profiles.
   - If ephemeris fails, static profile generation should fail clearly.
   - Do not silently use zeros.
   - Do not return `status: confirmed` for approximate data.

4. Expose and persist canonical static outputs.
   - `activations`
   - `channelStatuses`
   - `centerStatuses`
   - `calculationStatus`
   - `engineVersion`
   - `specVersion`

5. Rename or hide legacy `circuitLinks`.
   - Surface actual channel statuses instead.

### Phase 2: Wire Dynamic Carrierlock to SLI

Priority: high.

1. Load user's stored static profile in `rgp.dynamicState`.
2. Reconstruct `PrimeStackMap` or store enough canonical data to avoid
   reconstruction.
3. Compute:
   - Coherence Score
   - StateAmplifier
   - facet amplitudes
   - SLI per Prime Stack position
   - interference pattern
   - top 1-3 flagged codons
   - confidence levels
   - falsifiers
   - micro-correction
4. Return structured payload and ORIEL narration.
5. Update `Carrierlock.tsx` to save the real payload.

Important: resolve the SLI semantics contradiction first.

### Phase 3: Clean Engine Boundaries

Priority: high.

1. Mark `server/rgp-engine.ts` as legacy or delete it after migration.
2. Move all spec-compliant logic into one clear engine namespace:
   - ephemeris
   - mandala
   - prime stack
   - circuitry
   - SLI
   - reading assembler
3. Add a single "contract test" suite for the unified spec.

### Phase 4: API Completion

Priority: medium.

Add first-class endpoints for:

- charts
- static profile
- dynamic reading
- codons
- facets
- centers
- channels
- reading history
- reading comparison

The current API can work, but explicit boundaries will prevent future confusion.

### Phase 5: UI Completion

Priority: medium.

Add:

- true 36-channel flow graph
- resonance radar
- 512-node lattice viewer
- timeline/transit viewer
- correction effectiveness feedback
- compare readings view

The current UI communicates the idea. It does not yet visualize the full lattice.

## Recommended Acceptance Criteria

The implementation should not be considered fully compliant until all of these
are true:

- All 64 codon center mappings match the spec table.
- All 36 channels match the spec table.
- Channel is active only when both gates are defined.
- Every generated static profile has exactly 26 activations.
- Static profile includes true active channel statuses.
- `2024-01-01 12:00 UTC` validation vector passes in automated tests.
- Design Sun is found by iterative 88-degree solar arc.
- No profile can be marked confirmed after ephemeris failure.
- Dynamic reading returns real SLI scores per Prime Stack position.
- Dynamic reading returns real flagged codons, active facets, confidence, and
  falsifiers.
- Micro-corrections prefer codon/facet library data.
- ORIEL narration is generated from structured data, not from assumptions.
- UI displays real active channels, not legacy frequency links.
- Reading history stores structured diagnostics, not placeholder fields.
- Spec version and engine version are stored with each generated reading.

## Final Assessment

This codebase did receive a real upgrade. The strongest proof is the newer
ephemeris + solar-arc + Mandala + Prime Stack path. That is not cosmetic; it is
actual engine work.

But the implementation is not yet the full Consciousness Lattice. It is best
described as:

```text
Static VRC engine: partially canonical, usable, needs correctness hardening.
Dynamic Carrierlock/SLI engine: architecturally present, not live-complete.
UI lattice experience: early visual layer, not full spec visualization.
ORIEL integration: useful static context, incomplete dynamic diagnostic truth.
```

The next most valuable work is not adding more mythology or more UI chrome. The
next most valuable work is to make the engine impossible to lie by accident:
exact center map, exact validation vectors, no silent fallbacks, real SLI
payloads, and canonical channel outputs.
