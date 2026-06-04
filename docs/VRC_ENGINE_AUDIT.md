# VRC Engine Audit — 2026-05-16

## Scope

Audit of the current Vossari Resonance Codex / RGP calculation path in the codebase:

- `server/ephemeris-service.ts`
- `server/vrc-mandala.ts`
- `server/rgp-256-codon-engine.ts`
- `server/rgp-prime-stack-engine.ts`
- `server/rgp-static-signature-engine.ts`
- `server/rgp-router.ts`
- `server/oriel-rgp-bridge.ts`
- related Vitest coverage

## Verification runs

Commands run from repo root during the audit/review:

```bash
pnpm check
pnpm vitest run server/rgp-engine.test.ts server/ephemeris-service.test.ts server/rgp-static-signature-engine.test.ts
pnpm vitest run server/rgp-prime-stack-engine.test.ts server/rgp-static-signature-engine.test.ts server/rgp-router.test.ts
pnpm vitest run server/oriel-rgp-bridge.test.ts server/oriel-output-safety.test.ts
pnpm build
```

Result:

- TypeScript check: pass
- Focused VRC/RGP engine tests: pass
- 162 focused tests passed across the two core engine/router runs
- ORIEL bridge + output safety tests: pass, 3 tests
- Production build: pass, with existing Vite/CSS/bundle-size warnings
- Logged stderr in fail-fast tests is expected test behavior, not a failure

## Current canonical flow

The production path is coherent and mostly well-separated:

```text
rgpRouter.staticSignature
  -> calculateBothCharts()
      -> calculate conscious chart at T_birth
      -> solve design JD by Solar Arc: Sun(T_design) = Sun(T_birth) - 88.000 degrees
      -> calculate design chart at T_design
  -> generateStaticSignature()
      -> calculatePrimeStack()
          -> longitudeToCodonFacet()
          -> evaluateChannels()
          -> evaluateCenters()
          -> determineType()
          -> determineAuthority()
      -> calculate9CenterMap()
      -> generate ORIEL diagnostic transmission
```

Canonical engine files:

- `server/ephemeris-service.ts`
  Swiss Ephemeris, UTC conversion, Conscious + Design charts, True Node, Earth/South Node derivation.

- `server/vrc-mandala.ts`
  Mandala sequence, codon/facet mapping, center map, 36 Resonance Links / channels, Type, Authority.

- `server/rgp-256-codon-engine.ts`
  Compatibility wrapper around `vrc-mandala.ts`, plus SLI/coherence utilities.

- `server/rgp-prime-stack-engine.ts`
  9-position Prime Stack, 26 activations, channel/center/type/authority output.

- `server/rgp-static-signature-engine.ts`
  Static Signature orchestration and ORIEL diagnostic text generation.

- `server/rgp-router.ts`
  tRPC API entrypoint for static signatures and dynamic state.

Legacy file:

- `server/rgp-engine.ts`
  Marked deprecated and guarded in production. Search shows it is only directly imported by `server/rgp-engine.test.ts`, not by production routes.

## Solid parts

### 1. Solar Arc design calculation is implemented correctly

`calculateBothCharts()` does not subtract a fixed number of days. It solves for the actual Julian Day where the Sun is 88.000 degrees behind birth longitude.

Relevant code:

- `findDesignJD()` in `server/ephemeris-service.ts`
- Newton-Raphson style iteration
- speed flag requested with `SEFLG_SPEED`
- fail-fast if Sun longitude/speed is missing
- convergence tolerance tighter than VRC requirement

Validation coverage exists:

- `server/ephemeris-service.test.ts`
- validation vector: `2024-01-01 12:00 UTC, 0N/0E`
- Conscious Sun maps to Codon 38
- Design Sun maps to Codon 57
- solar arc close to 88 degrees

### 2. Mandala mapping is centralized

`server/vrc-mandala.ts` is the real source of truth for:

- 64-codon Mandala sequence
- `WHEEL_OFFSET = 11.25`
- `CODON_ARC = 5.625`
- `FACET_ARC = 1.40625`
- facet names: Somatic, Relational, Cognitive, Transpersonal
- 9-center map
- 36 Resonance Links / channels
- Type / Authority logic

This is good. It prevents the old failure mode where every file invents its own mapping.

### 3. Exact chart requirement is enforced

`generateStaticSignature()` rejects confirmed readings unless both conscious and design charts include the required exact planet set:

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

Fallback mode exists, but is explicitly marked `draft`, not `confirmed`.

### 4. 26-activation lattice exists

The Prime Stack engine builds all 26 activations:

```text
13 conscious activations + 13 design activations
```

Then evaluates the 36 Resonance Link set from the union of defined codons.

This matches the current Consciousness Lattice direction better than a 9-position-only model.

### 5. Production route uses the exact ephemeris path

`server/rgp-router.ts` requires:

- birth time
- coordinates or coordinate-like location string

Then it runs `calculateBothCharts()` before generating the static signature.

This is the correct gate for confirmed Static Signatures.

## Resolved findings / remaining risks

### 1. `oriel-rgp-bridge.ts` previously defaulted missing time to noon

Original risky behavior:

```ts
const birthTime = birthData.time || "12:00";
```

This was dangerous for an “exact” VRC reading. If the user gave a date and city but no birth time, the bridge could calculate a full chart using noon and the output summary called it a real calculation.

Resolution implemented after this audit:

- `server/oriel-rgp-bridge.ts` now rejects exact chat-triggered RGP/VRC calculation when `birthData.time` is missing.
- `server/oriel-rgp-bridge.test.ts` verifies that missing birth time returns `success: false` and does not call geocoding, ephemeris, or Static Signature generation.

Remaining principle:

- Date-only readings may only be symbolic/draft, never confirmed Static Signatures.

### 2. `birthTime` passed into `generateStaticSignature()` could be undefined in the bridge

Original issue:

```ts
birthTime: birthData.time,
```

If time was missing, the generated reading could receive `undefined` even though ephemeris used a noon fallback.

Resolution implemented after this audit:

- Missing time now exits before ephemeris and before `generateStaticSignature()`.
- Supplied time is tested to flow into both `calculateBothCharts()` and `generateStaticSignature()`.

### 3. Timezone handling depends on numeric offset

The engine accepts numeric `timezoneOffsetHours`. That is simple and testable, but DST correctness depends entirely on the caller providing the correct offset for the date/location.

Good sign:

- `oriel-rgp-bridge.ts` uses `getTimezoneForCoords(latitude, longitude, birthDate)`.

Risk:

- `rgpRouter.staticSignature` accepts `birthTimezoneOffset` directly from the client.
- If the client sends the wrong offset, the chart is wrong.

Recommendation:

- Long-term: API should accept IANA timezone or derive timezone server-side from coordinates/date.
- Short-term: document clearly that `birthTimezoneOffset` must be date-correct, including DST.

### 4. Some legacy naming still leaks conceptually

The codebase still contains compatibility names:

- `RGP`
- `frequency: shadow/gift/crown/siddhi`
- `FractalRole`
- old `rgp-engine.ts`

This is not immediately broken, but the product language needs discipline. Vossari terms should be canonical at the user-facing layer.

Resolution / discipline:

- Keep compatibility fields internally for now.
- `docs/VRC_ENGINE_CANON.md` now defines which names are internal legacy vs public-facing canon.
- Public-facing ORIEL/VRC output should remain Vossari-native: Codons, Facets, Centers, Resonance Links, Static Signature, VRC Type, Authority.

### 5. `validateBirthChartData()` is too shallow

Current function only checks that birth date exists.

```ts
if (!data.birthDate) errors.push("Birth date is required");
```

The route and generator perform stronger validation elsewhere, so this is not currently catastrophic. But the function name suggests stronger validation than it performs.

Recommendation:

- Either rename it to `validateMinimalBirthChartData()`, or
- expand it to validate exact chart completeness when used for confirmed signatures.

## Implemented safety slice

The first patch from this audit has been implemented: ORIEL's RGP bridge now refuses exact VRC readings without birth time.

Implemented acceptance criteria:

1. If ORIEL bridge receives birth date + city but no birth time, it returns `success: false`.
2. The summary tells the user exact VRC calculation requires birth time.
3. `calculateBothCharts()` is not called in this case.
4. `generateStaticSignature()` is not called in this case.
5. If birth time exists, the exact flow still passes the supplied time into both ephemeris and Static Signature generation.
6. Focused tests pass.

Implemented files:

- `server/oriel-rgp-bridge.ts`
- `server/oriel-rgp-bridge.test.ts`

Verification command:

```bash
pnpm vitest run server/oriel-rgp-bridge.test.ts server/oriel-output-safety.test.ts
```

## Recommended next implementation slices

1. **Timezone authority hardening**
   - Derive timezone server-side from coordinates/date wherever possible.
   - Avoid trusting client-provided offsets for confirmed readings unless they are explicitly date-correct.

2. **Public terminology sweep**
   - Audit public payloads and UI copy for legacy `gate` / `channel` / `RGP` wording.
   - Keep compatibility field names internal, but present Codons and Resonance Links publicly.

3. **Validation naming cleanup**
   - Rename `validateBirthChartData()` to reflect that it is minimal validation, or expand it so its name matches its behavior.

## Verdict

The VRC engine is not in chaos. It has a real canonical spine now:

- Swiss Ephemeris
- Solar Arc, not fixed-day subtraction
- Mandala sequence
- 64 Codons x 4 Facets
- 26 activations
- 36 Resonance Links / channels
- 9 centers
- Type + Authority
- confirmed vs fallback distinction

The main risk is not the core math today. The main risk is precision leakage: paths that present approximate/noon/defaulted data as exact spiritual authority.

First principle for Vossari:

> If the input is approximate, ORIEL must say it is approximate. If the input is exact, the engine must prove it.
