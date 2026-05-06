# Consciousness Lattice Followups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a first production pass for the 10 Consciousness Lattice follow-ups: spec cleanup, backend contracts, legacy quarantine, profile regeneration, richer SLI UI, correction feedback, compare UI, channel graph, 512-node lattice, and transit/timeline preview.

**Architecture:** Keep the hotfix DB-compatible by storing new static lattice data in existing JSON/text payloads. Harden core engines first, then surface the already-computed diagnostic data in React pages. New visualization components stay local to the reading pages unless reuse becomes necessary.

**Tech Stack:** TypeScript, Vitest, Express/tRPC, Drizzle, React 19, Wouter, lucide-react, three/@react-three/fiber.

---

### Task 1: Backend Contract Hardening

**Files:**
- Modify: `server/rgp-prime-stack-engine.ts`
- Modify: `server/rgp-prime-stack-engine.test.ts`

- [x] Add tests that `calculatePrimeStack()` rejects missing/non-finite required chart bodies.
- [x] Add minimal validation in `calculatePrimeStack()` before any longitude fallback can create `0`-degree data.
- [x] Run `./node_modules/.bin/vitest run server/rgp-prime-stack-engine.test.ts`.

### Task 2: Legacy Engine Quarantine

**Files:**
- Modify: `server/rgp-engine.ts`
- Modify: `server/rgp-engine.test.ts`

- [x] Add a production guard exported by the legacy engine.
- [x] Test that the guard throws when `NODE_ENV=production`.
- [x] Keep existing test/runtime imports working in non-production mode.

### Task 3: Profile Regeneration Surface

**Files:**
- Modify: `server/routers.ts`
- Modify: `client/src/pages/Profile.tsx`

- [x] Expose the existing `profile.recomputeStaticProfile` mutation in the profile UI.
- [x] Show clear success/error state without adding schema.
- [x] Run typecheck.

### Task 4: Dynamic SLI Diagnostics And Feedback

**Files:**
- Modify: `client/src/pages/DynamicReading.tsx`

- [x] Render stored `sliScores`, `activeFacets`, and `confidenceLevels` as a score table.
- [x] Wire `codex.markCorrectionComplete` into the dynamic reading page.
- [x] Keep the existing micro-correction/falsifier display.

### Task 5: Compare Readings UI

**Files:**
- Modify: `client/src/pages/Readings.tsx`
- Modify: `client/src/pages/DynamicReading.tsx`

- [x] Add a compare affordance from history/list when two dynamic readings exist.
- [x] Use `codex.compareReadings` to display coherence delta, resolved codons, emerging codons, and correction changed.

### Task 6: Static Channel Flow Graph

**Files:**
- Modify: `client/src/pages/StaticReading.tsx`

- [x] Replace the chip-only active channel display with a compact visual graph.
- [x] Keep chip fallback details for scanning.

### Task 7: 512-Node Lattice Viewer

**Files:**
- Modify: `client/src/pages/StaticReading.tsx`

- [x] Add a 512-node React/Three lattice scene using 64 codon clusters x 4 facets x 2 layers.
- [x] Highlight active static activations from the stored profile.
- [x] Keep activation counts and chips visible outside the WebGL scene.

### Task 8: Transit/Timeline Preview

**Files:**
- Modify: `client/src/pages/StaticReading.tsx`

- [x] Add a seven-day ephemeris overlay from the server-side Swiss Ephemeris path.
- [x] Highlight selected-codon transit hits in the timeline.

### Task 9: Spec And Review Docs Cleanup

**Files:**
- Modify: `shared/vos_consciousness_lattice_system_spec.md`
- Modify: `docs/CONSCIOUSNESS_LATTICE_IMPLEMENTATION_REVIEW.md`

- [x] State the 11.25-degree wheel offset explicitly.
- [x] State SLI high-score semantics as stronger shadow loudness.
- [x] Mark already-fixed review items as resolved/current-state.

### Task 10: Verification

**Files:**
- No production edits.

- [x] Run focused Vitest suite for changed backend files.
- [x] Run `./node_modules/.bin/tsc --noEmit`.
- [x] Run `npm run build`.
- [x] Run `git diff --check`.
