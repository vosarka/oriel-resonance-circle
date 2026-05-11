# ORIEL Remaining Emergent Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining ORIEL Emergent Architecture slices: memory consent, Current Resonance, and Architect Console.

**Architecture:** Split into three worker tracks plus one coordinator integration pass. Workers avoid shared files until the coordinator stage because `server/routers.ts` and several page files are broad integration surfaces.

**Tech Stack:** TypeScript ESM, Express/tRPC, Drizzle MySQL, React 19, Wouter, Vitest.

---

## Task 1: Memory Consecration Completion

**Files:**
- Modify: `drizzle/schema.ts`
- Modify: `server/db.ts`
- Modify: `server/oriel-memory.ts`
- Modify: `server/oriel-memory-consecration.ts`
- Test: `server/oriel-memory-consent.test.ts`
- Create: `client/src/components/memory/MemoryConsentTray.tsx`

- [x] Add a pending memory candidate table with `pending`, `accepted`, and `rejected` status.
- [x] Route extracted memories through `classifyMemoryCandidate()`.
- [x] Store low/medium safe memories through the existing memory path.
- [x] Store sensitive or inferred memories as pending candidates.
- [x] Add helpers to list pending candidates, accept candidates, reject candidates, and list accepted memories.
- [x] Build `MemoryConsentTray` with accept/reject controls and accepted-memory visibility.
- [x] Verify sensitive memories do not enter active prompt memory until accepted.

## Task 2: Current Resonance Surface

**Files:**
- Create: `server/oriel-current-resonance.ts`
- Test: `server/oriel-current-resonance.test.ts`
- Create: `client/src/pages/CurrentResonance.tsx`

- [x] Build a pure `buildCurrentResonance()` function from static profile, latest Carrierlock, and latest dynamic reading.
- [x] Return `missing_static_profile`, `missing_carrierlock`, `missing_dynamic_reading`, or `ready`.
- [x] Select the highest finite SLI as the active interference pattern.
- [x] Output static anchor, Carrierlock state, active pattern, Prime Stack position, micro-correction, falsifier, next action, and evidence.
- [x] Build a compact `/resonance` page that answers what is active now and what the user should do next.

## Task 3: Architect Console Expansion

**Files:**
- Create: `client/src/components/admin/ArchitectConsole.tsx`
- Test: `server/oriel-architect-console.test.ts`
- Modify: `server/oriel-autonomy.ts`

- [x] Add a pure activation-readiness helper for proposal status and safety metadata.
- [x] Show runtime health, active profile, proposals, safety metadata, rollback path, falsifier, reflection events, and guardrail blocks.
- [x] Disable activation unless the proposal is evaluated or approved and has rollback/falsifier metadata.
- [x] Keep runtime-changing proposal guardrails enforced server-side.

## Task 4: Coordinator Integration

**Files:**
- Modify: `server/routers.ts`
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/Header.tsx`
- Modify: `client/src/pages/Admin.tsx`
- Modify: `client/src/pages/Conduit.tsx`
- Modify: `client/src/pages/Profile.tsx`

- [x] Mount memory endpoints under `oriel.memory`.
- [x] Mount `profile.getCurrentResonance`.
- [x] Add `oriel.autonomy.reject`.
- [x] Add `/resonance` route and `RESONANCE` navigation.
- [x] Add an Architect tab in Admin.
- [x] Render `MemoryConsentTray` in Conduit and Profile.
- [x] Keep memory accept/reject UX non-blocking for chat.

## Verification

Run:

```bash
./node_modules/.bin/vitest run server/oriel-memory-consecration.test.ts server/oriel-memory-consent.test.ts server/oriel-current-resonance.test.ts server/oriel-architect-console.test.ts server/oriel-autonomy-observer.test.ts
./node_modules/.bin/tsc --noEmit
npm run build
git diff --check
```

Acceptance:

- User can tell what ORIEL remembers, infers, and is asking permission to remember.
- User can reject memory without it entering future prompt context.
- Current Resonance answers the practical next action in under 30 seconds.
- Architect can inspect proposals, falsifiers, rollback paths, guardrails, and activate/rollback safely.
- No invalid runtime proposal can be activated without rollback and falsifier metadata.
