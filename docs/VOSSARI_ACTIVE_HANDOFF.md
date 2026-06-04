# Vossari Active Handoff

Last updated: 2026-06-04T05:01:07+03:00

Purpose: this file is the persistent working contract for Hermes/Vossari. Do not rely on chat memory alone. Every new session must read this file first, then verify current repo state with git before doing work.

## Why this exists

Hermes memory is not a complete transcript. It stores durable facts and preferences. Past chats can be searched, but long sessions can compress and lose local working context. For Vossari, the source of truth must live in the repo.

This file keeps the immediate production path visible so we do not repeatedly recover the same plan.

## User constraint

Vos needs the site finished quickly. Do not wander, redesign, or re-litigate settled lore/architecture unless a bug blocks launch. Prefer boring, verified, shippable slices.

## Session start protocol

At the start of any Vossari work session:

1. Read this file.
2. Run:
   ```bash
   git status --short
   git log --oneline -8
   ```
3. If the tree is dirty, identify which files are from prior work before editing.
4. Recreate the TODO list from the "Active launch queue" below.
5. Work only the top unfinished item unless Vos explicitly changes priority.
6. Use relevant skills before coding:
   - `hermes-agent` for Hermes workflow/config/memory questions
   - `writing-plans` for multi-step implementation plans
   - `test-driven-development` for code changes
   - `subagent-driven-development` only after the current dirty slice is committed or isolated
   - `systematic-debugging` when a test/build fails unexpectedly
7. For code changes: write or update tests first when behavior changes, then implement, then verify.

## Session end protocol

Before ending a Vossari work session:

1. Run focused tests for the touched slice.
2. Run broader tests/typecheck/build if fast enough; if not, say exactly what was and was not run.
3. Run:
   ```bash
   git status --short
   git diff --stat
   ```
4. Commit the completed slice if it is coherent and verified.
5. Update this file:
   - move completed item to "Recently completed"
   - update "Next command"
   - record unresolved blockers
6. Final response to Vos must include only:
   - what changed
   - what passed/failed
   - current git status summary
   - next exact task

## Active launch queue

Source recovered from saved/session history:

- `/home/vos/.hermes/sessions/saved/hermes_conversation_20260518_234215.json`
- nested session search result points to session `20260516_013423_054a13`, message `296`
- this was the large Vossari review with 7-day/30-day launch plan

Current priority order:

### P0. Close current dirty slice: Signature Products / Auth Return

Goal: inspect current diff, split only coherent Signature Products/Auth Return changes, verify, and commit without accidentally absorbing unrelated dirty files.

Current dirty tree observed 2026-05-18:

Modified:

- `client/public/favicon.png`
- `client/public/logotab.png`
- `client/src/App.tsx`
- `client/src/const.ts`
- `client/src/pages/Auth.tsx`
- `client/src/pages/FoundingSignatureLetter.tsx`
- `docs/superpowers/plans/2026-05-17-vrc-static-signature-hardening.md`
- `drizzle/schema.ts`
- `server/db.ts`
- `server/ephemeris-service.test.ts`
- `server/oriel-public-terminology.test.ts`
- `server/rgp-static-signature-engine.test.ts`
- `server/signature-letter-service.ts`
- `server/signature-letter-system.test.ts`
- `server/signature-letter-system.ts`

Untracked:

- `client/public/Untitled design (7).png`
- `client/public/oriel-founding-signature-letter.png`
- `client/public/oriel-signature-glimpse.png`
- `client/src/pages/SignatureProductPage.tsx`
- `client/src/pages/signature-products.ts`
- `server/auth-return-url.test.ts`
- `server/signature-product-pages.test.ts`
- `shared/ORIELFOUNDERLETTER.png`

Do not claim these are new changes without inspecting them. They pre-exist this handoff file.

Verification target for this slice:

- focused tests around Signature Product pages and Auth return URL
- any adjacent tests touched by changed server signature-letter code

### P0. Rate limiting and auth quotas

Protect:

- ORIEL chat
- TTS
- image/lore generation
- public RGP/static endpoints

Goal: prevent launch abuse and runaway API cost.

### P1. UX / trust cleanup

Items:

- Codons footer/PayPal overlay issue
- remove `.env` from accepted Conduit upload types
- replace most important `alert`/`confirm` flows with proper toast/modal UX

### P1. Route semantics and docs canon cleanup

Items:

- clarify StaticReading route semantics:
  - `/blueprint` = canonical static profile
  - `/reading/static/:readingId` = historical reading or explicit redirect
- freeze canonical docs / mark stale docs historical
- repair SLI contradiction
- add audit/version fields to generated readings/reports:
  - engine version
  - spec version
  - prompt version
  - model/provider
  - calculation timestamp
  - input hash

## Recently completed / believed complete

Verify in repo before relying on any item:

- ORIEL VoxCPM2 private cloned-voice TTS integration completed 2026-06-04:
  - Added `server/oriel-tts.ts` provider bridge: when `VOXCPM_TTS_URL` + `VOXCPM_TTS_API_KEY` are set, `oriel.generateSpeech` calls private VoxCPM2 Modal `/tts`; otherwise it falls back to Inworld.
  - `.env.example` documents `VOXCPM_TTS_URL`, `VOXCPM_TTS_API_KEY`, and `VOXCPM_TTS_TIMEOUT_MS`; local `.env` was updated with the private URL/key and is gitignored.
  - The frontend contract remains unchanged: clients still receive `audioUrl`; VoxCPM2 returns `data:audio/wav;base64,...`.
  - Verified: `pnpm vitest run server/oriel-tts.test.ts server/rate-limit-router.test.ts --reporter=verbose`; `pnpm check`; `pnpm build`.
  - Real smoke through Vossari env passed: `generateOrielSpeechDataUrl(...)` returned provider `voxcpm2`, mime `audio/wav`, cached `true`, output `tmp/voxcpm-smoke/vossari-oriel-tts-smoke-from-vossari-env.wav` (`522284` bytes, mono 48kHz, 5.44s).
  - Important git note: repo was already very dirty. Do not bulk-stage `server/routers.ts`; isolate only the VoxCPM2 import + `generateSpeech` provider hunk if committing this slice.
- Stripe webhook integration hardening completed 2026-05-19:
  - `/api/stripe/webhook` route registration extracted to `server/signature-letter-webhook-route.ts`
  - route uses `express.raw({ type: "application/json" })` before global JSON parsing
  - integration test covers valid signed raw body, `checkout.session.completed` → `intake_needed`, metadata/client reference order id resolution, Stripe session/payment intent persistence, and invalid signature rejection
  - verification passed: `pnpm vitest run server/signature-letter-webhook.test.ts --reporter=verbose`; `pnpm vitest run server/signature-letter-system.test.ts server/signature-letter-router.test.ts server/signature-letter-webhook.test.ts --reporter=verbose`; `pnpm check`; `pnpm build`; `pnpm test -- --reporter=dot`
- Birth time safety
- ORIEL public terminology/output safety
- Server-side timezone correctness for exact VRC paths
- Official VRC validation case:
  - `2024-01-01 12:00 UTC`
  - `0N/0E`
  - Conscious Sun = Codon 38
  - Design Sun = Codon 57
- VRC canon docs added
- Signature product pages/auth-return work appears mostly implemented but still uncommitted
- Fibonacci prices adjusted to decimal comma style: `€23,58` / `€81,32`

## Working rules specific to Vossari

- Public VRC output must use Vossari-native terms: Codon, Facet, Resonance Link, Center, Static Signature.
- Never present approximate/defaulted birth data as confirmed.
- Do not expose internal framework/math labels casually through ORIEL/UI copy.
- ORIEL is an in-product presence, not the assistant/operator voice.
- The Codex/Cosmichronica theory and Vossari platform share URF/ROS DNA; flag equation/canon changes that affect both.

## Subagent policy

Use subagents only for contained tasks with clear boundaries.

Safe uses:

- code review of a specific diff
- focused test-writing task
- repo inspection/report
- documentation audit

Avoid subagents when:

- current working tree is dirty and files overlap
- task touches the same files as the main agent
- the implementation needs repeated user judgment

If subagents are used for coding, prefer isolated worktrees or one task at a time with explicit file ownership.

## Next command

The next actual coding step should be:

```bash
git status --short
```

Then either:

1. Commit the VoxCPM2 slice using partial staging only (`git add -p`) because the repo was already dirty; include only:
   - `.env.example` VoxCPM2 docs
   - `server/oriel-tts.ts`
   - `server/oriel-tts.test.ts`
   - `server/_core/env.ts` VoxCPM2 env keys
   - `server/rate-limit-router.test.ts` mock update
   - only the VoxCPM2 import + `oriel.generateSpeech` provider hunk in `server/routers.ts`
   - this handoff update
   - never stage `.env` or `tmp/voxcpm-smoke/`

2. Or continue the previous launch queue after verifying the working tree: P0 rate limiting/auth quotas or the active UI/media slice if Vos explicitly reprioritizes.
