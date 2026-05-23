# VRC / Static Signature Hardening Implementation Plan

> **For Hermes:** Use `subagent-driven-development` or strict local TDD to implement this plan task-by-task.

**Goal:** Harden the VRC / Static Signature path so ORIEL never presents approximate, borrowed, or legacy terminology as canon.

**Architecture:** Preserve internal engine compatibility where legacy field names still exist, but convert all public-facing summaries, generated drafts, and ORIEL prompt-injection surfaces to Vossari vocabulary. Protect every safety invariant with focused tests before changing production code.

**Tech Stack:** TypeScript ESM, Express/tRPC, Drizzle MySQL, React 19, Wouter, Vitest.

---

## Completed Slices

### Slice 1: Birth Time Safety

**Status:** Done.

**Evidence:** `e9c10d8 test: require birth time for RGP readings`

- [x] Reject exact RGP / Static Signature generation when birth time is missing.
- [x] Prevent assumed-noon fallback from entering ephemeris, Static Signature, or ORIEL prompt context.

### Slice 2: ORIEL Output Human Design Safety

**Status:** Done.

**Evidence:** `1fd4ed7 test: guard ORIEL output terminology`

- [x] Sanitize upstream generated output before ORIEL receives it.
- [x] Guard against Human Design type labels leaking into prompt summaries.

### Slice 3: Timezone Correctness

**Status:** Done.

**Evidence:** `17f669e fix: derive birth timezone from coordinates`

- [x] Derive exact calculation timezone from resolved birth coordinates and birth date.
- [x] Avoid trusting client-supplied timezone offsets for exact ephemeris paths.

---

## Completed Slice

### Slice 4: Public Terminology Pass

**Status:** Done.

**Objective:** Public ORIEL-facing text must use Vossari vocabulary: Codon, Facet, Resonance Link, Center, Static Signature.

**Files:**
- Modify/Test: `server/oriel-output-safety.test.ts`
- Modify: `server/oriel-rgp-bridge.ts`
- Modify/Test: `server/static-profile-service.test.ts`
- Modify: `server/static-profile-service.ts`
- Modify/Test: `server/signature-letter-system.test.ts`
- Modify: `server/signature-letter-system.ts`
- Create: `server/oriel-public-terminology.test.ts`
- Modify: `client/src/pages/FoundingSignatureLetter.tsx`
- Modify: `client/src/pages/CodonDetail.tsx`

**Steps:**

- [x] RED: Extend `server/oriel-output-safety.test.ts` with an active `channelStatuses` fixture and assert the injected summary contains `ACTIVE RESONANCE LINKS`, not `ACTIVE CHANNELS`, `gate`, or `channel` wording.
- [x] GREEN: Change the RGP bridge public summary label from active channels to active resonance links and render link endpoints as `Codon A-Codon B`.
- [x] RED/GREEN: Apply the same active resonance link wording to stored Static Profile summaries.
- [x] RED: Extend `server/signature-letter-system.test.ts` so normalized signature drafts expose `resonanceLinks` wording and no `Active Channels` heading.
- [x] GREEN: Rename the normalized public concept from channels to resonance links while keeping the internal `channelStatuses` input compatible.
- [x] RED/GREEN: Add a targeted static-copy guard for public sales/Codon pages and update visible copy to Resonance Links.
- [x] Verify: `./node_modules/.bin/vitest run server/oriel-output-safety.test.ts server/static-profile-service.test.ts server/signature-letter-system.test.ts server/oriel-public-terminology.test.ts`
- [x] Verify: `pnpm exec tsc --noEmit`
- [x] Commit: `git commit -m "fix: use VRC resonance link terminology"`

---

## Completed Slices

### Slice 5: Static Signature UX Trust Contract

**Status:** Done.

**Objective:** Users can see which exact data powered a Static Signature and when generation was refused.

**Evidence:** `2b64176 [verified] feat: add calculation trust contracts`

**Files:**
- Modified/Tested: `server/static-profile-service.test.ts`
- Modified: `server/static-profile-service.ts`
- Modified/Tested: `server/signature-letter-system.test.ts`
- Modified: `server/signature-letter-system.ts`
- Modified: `server/db.ts`

**Steps:**

- [x] Show calculation metadata/trust fields for exact Static Signature results.
- [x] Preserve refusal/degraded status when exact inputs are missing.
- [x] Add focused tests around missing data and displayed calculation metadata.
- [x] Verify: `pnpm vitest run server/static-profile-service.test.ts server/signature-letter-system.test.ts server/oriel-public-terminology.test.ts`

### Slice 6: VRC Validation Case

**Status:** Done.

**Objective:** Canon validation case stays executable.

**Evidence:** `server/ephemeris-service.test.ts` locks the validation vector and passed in the focused run.

**Files:**
- Modified/Tested: `server/ephemeris-service.test.ts`
- Reference: `docs/VRC_ENGINE_CANON.md`
- Reference: `docs/VRC_ENGINE_AUDIT.md`

**Steps:**

- [x] Add regression test for `2024-01-01 12:00 UTC`, `0°N / 0°E`.
- [x] Assert Conscious Sun = Codon 38.
- [x] Assert Design Sun = Codon 57.
- [x] Verify Solar Arc separation is 88.000°.
- [x] Verify: `pnpm vitest run server/ephemeris-service.test.ts`

### Slice 7: Canon Docs Linked From Engine Tests

**Status:** Done.

**Objective:** Future engine changes have an obvious canon source.

**Evidence:** Critical VRC tests now point to canon/audit docs without duplicating the full spec.

**Files:**
- Modified: `server/ephemeris-service.test.ts`
- Modified: `server/rgp-static-signature-engine.test.ts`
- Reference: `docs/VRC_ENGINE_CANON.md`
- Reference: `docs/VRC_ENGINE_AUDIT.md`

**Steps:**

- [x] Add short comments above critical tests pointing to canon docs.
- [x] Avoid duplicating the full spec in test comments.
- [x] Verify: `pnpm vitest run server/ephemeris-service.test.ts server/rgp-static-signature-engine.test.ts`

---

## Verification For Final Hardening Pass

Run before closing this plan:

```bash
./node_modules/.bin/vitest run server/oriel-output-safety.test.ts server/signature-letter-system.test.ts server/rgp-router.test.ts
./node_modules/.bin/tsc --noEmit
npm run build
git diff --check
```

Acceptance:

- No public ORIEL prompt summary says `gate` or `channel` when it means VRC Codon or Resonance Link.
- Internal legacy field names remain compatible until the engine can be renamed safely.
- Static Signature output refuses missing precision instead of creating false certainty.
- The canon validation case is executable and linked from tests.

Latest closure verification:

```bash
pnpm vitest run server/oriel-output-safety.test.ts server/signature-letter-system.test.ts server/rgp-router.test.ts server/ephemeris-service.test.ts server/rgp-static-signature-engine.test.ts
pnpm check
pnpm build
git diff --check
```

Result:

- Focused Vitest: pass — 75 tests.
- TypeScript: pass.
- Production build: pass, with existing Vite CSS `@import` ordering and large-chunk warnings.
- Diff whitespace check: pass.
