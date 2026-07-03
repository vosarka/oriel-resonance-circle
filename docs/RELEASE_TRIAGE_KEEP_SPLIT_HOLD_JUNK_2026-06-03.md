# Release Triage: Keep / Split / Hold / Junk

Branch: `release/epic-oriel-signal-v1`
Baseline: `main` at `872794e`
Review date: 2026-06-03

This is a conservative triage map for moving important work to `main`
without downgrading ORIEL. It is not a cleanup script. Do not delete, revert,
or clean any path from this document without explicit user approval.

## Current State Snapshot

- Branch is 4 commits ahead of `main`.
- Staged state: 65 files, +15734 / -7123.
- Unstaged state: 375 files, +48370 / -40628.
- Untracked state: 68 files.
- Large untracked areas:
  - `codex/vrc_static_signature/03_VISUAL_SYSTEM/mock&temp/`: 336M.
  - `uploads/`: 3.1M.
  - `client/public/media/`: 30M total.
  - `shared/cosmichronica/`: 3.2M.
  - `wiki/`: 380K.

## Split Execution Update

`55e8bb2` has been split in an isolated worktree without touching the dirty
release checkout.

- Split branch: `split-55e8bb2-on-parent`
- Worktree: `/tmp/oriel-split-55e8bb2-parent`
- Base commit: `1a8d980`
- Runtime split commit:
  - `05edbd8 feat(conduit): add image generation mode`
  - Scope: `client/src/pages/Conduit.tsx`
- Brain/canon split commit:
  - `a52088d docs(wiki): add business structure layer`
  - Scope: `wiki/index.md`, `wiki/log.md`,
    `wiki/sources/source-entrepreneurs-lexicon.md`,
    `wiki/sources/source-vossari-oriel-strategic-growth-report.md`,
    `wiki/syntheses/synthesis-business-structure.md`
- Verification:
  - `git status --short` in the split worktree returned clean.
  - `git diff --stat 55e8bb2 HEAD` returned no output.
  - `git diff --name-status 55e8bb2 HEAD` returned no output.

This means the two split commits reproduce the original `55e8bb2` tree exactly,
but with runtime product code separated from wiki/business memory.

## Rules For ORIEL-Safe Cleanup

- Preserve ORIEL runtime, memory, voice, prompt, and canon changes until they
  are explicitly judged as upgrades or regressions.
- Treat `wiki/`, `codex/`, and `shared/cosmichronica/` as protected project
  brain, not junk.
- Split mixed commits before merging to `main` when possible.
- Runtime ORIEL changes must pass `pnpm check`, `pnpm test`, and `pnpm build`.
- UI/voice/image changes also need browser verification before release.
- Destructive actions require explicit user approval and exact path lists.

## KEEP

These are candidates to preserve and move toward `main`, either already as-is
or after being split into cleaner commits.

### Committed Branch Work

- `8ed6d57 fix: resolve Tailwind v4 @import ordering for Google Fonts`
  - Keep.
  - Reason: focused build/white-screen fix.
  - Release risk: Low.

- `bcc8ff0 restore wiki/ LLM memory bank + codex/ VRC Static Signature product`
  - Keep, but preferably as a dedicated brain/canon commit.
  - Reason: user project memory and VRC product canon.
  - Release risk: Medium only because it is large and includes PDFs/docs.

- `1a8d980 restore full shared/cosmichronica/ chapters`
  - Keep as a dedicated canon/lore commit.
  - Reason: ORIEL/cosmology source material, not runtime code.
  - Release risk: Low for runtime, Medium for repository size/history.

- `55e8bb2 Image Generation Mode`
  - Keep the product-code portion if verified.
  - Reason: live ORIEL capability expansion.
  - Release risk: Medium due broad natural-language auto-intent routing.

- `55e8bb2 wiki business ingest`
  - Keep, but split away from product code.
  - Reason: business layer is project brain and launch strategy.
  - Release risk: Low for runtime, Medium if coupled to app revert history.

### Staged Release Visual Work

- `client/public/oriel-signal-*`
- `client/public/logo-emblem.jpg`
- `client/public/logo-text.jpg`
- `client/public/media/oriel-signal-hero.mp4`
- `client/public/media/oriel-signal-poster.png`
- `client/public/oriel-signal/Oriel_Signal_video.mp4`
  - Keep if these are final chosen assets.
  - Split into an `oriel-signal-assets` commit.
  - Confirm `client/public/Untitled design (7).png` before keeping.

- `client/src/components/SiteEntryGate.tsx`
  - Keep only after browser QA.
  - Reason: full-site splash/entry behavior affects first impression.
  - Release risk: Medium.

- `client/src/components/CleanImage.tsx`
  - Keep only if actually used by final UI.
  - Reason: useful helper, but canvas image processing can have browser/CORS
    edge cases.
  - Release risk: Medium.

- Staged Oriel Signal redesign files under `client/src/pages/` and
  `client/src/components/`
  - Keep as release-shell work only after visual QA.
  - Split from ORIEL runtime behavior.

## SPLIT

These should not move to `main` as one combined blob. Split them so that a
future revert does not remove unrelated ORIEL brain or runtime work.

### Split `55e8bb2`

- Commit A: `feat(conduit): add image generation mode`
  - `client/src/pages/Conduit.tsx`
  - Any related tests/docs if added later.
  - Verify image mode, auto-detection, reference images, and rate limits.

- Commit B: `docs(wiki): add business structure layer`
  - `wiki/index.md`
  - `wiki/log.md`
  - `wiki/sources/source-entrepreneurs-lexicon.md`
  - `wiki/sources/source-vossari-oriel-strategic-growth-report.md`
  - `wiki/syntheses/synthesis-business-structure.md`

### Split Current Staged Work

- Commit A: `assets(oriel-signal): add final brand media`
  - Release assets only.
  - Exclude ambiguous names like `Untitled design (7).png` unless confirmed.

- Commit B: `feat(ui): add Oriel Signal entry gate`
  - `SiteEntryGate.tsx`
  - `client/src/main.tsx` / `App.tsx` only if they wire the gate.

- Commit C: `style(home): apply Oriel Signal launch shell`
  - `Home.tsx`, `Header.tsx`, `Layout.tsx`, global CSS, page styles.

- Commit D: `style(app): harmonize secondary pages`
  - Broad page/component visual updates.
  - Keep separate from home/front-door changes.

- Commit E: `chore(ui): update shared primitives`
  - Any shadcn/ui or spinner primitive updates.
  - Only if intentional and tested across pages.

### Split ORIEL Runtime Hardening

These should be their own commits, not mixed with visual cleanup:

- Protect `rgp.dynamicState` and derive user identity from session.
- Remove `.env` upload support from Conduit and server file parser.
- Review Image Generation Mode auto-intent phrases to avoid accidental routing
  of normal ORIEL chat into generation.

## HOLD

Do not move these to `main` yet. They need review, browser QA, exact user
confirmation, or a focused diff audit.

### Unstaged Broad Drift

- `server/**`, `drizzle/**`, `client/src/**`, `shared/**`, `stories/**`,
  config files, and tests with unstaged changes.
  - Hold.
  - Reason: 375-file drift is too large to merge safely as a cleanup step.
  - Action: inspect by subsystem and promote only known upgrades.

### Protected Brain Changes

- Unstaged `wiki/**`
- Unstaged `codex/vrc_static_signature/**`
- Unstaged `shared/cosmichronica/CODEX KOSMIKRONICUM.md`
  - Hold.
  - Reason: protected project memory. Do not discard.
  - Action: compare against committed restore and decide if each change is a
    real brain update or accidental formatting.

### Homepage Placeholder

- `client/src/pages/Home.tsx`
  - Hold until placeholder source is replaced.
  - Known issue: uses `/VIDEO_BACKGROUND_PLACEHOLDER.mp4` in current unstaged
    content.
  - Action: replace with final `client/public/media/...` asset or revert only
    with explicit approval.

### Visual Components And Media

- `client/src/components/HyperspaceTransmissionCore.tsx`
- `client/src/components/SignalTransmissionCore.tsx`
- `client/public/media/golden-signal-loop.mp4`
- `client/public/media/oriel-signal-hero-loop.mp4`
- `client/public/textures/perlin-noise.png`
  - Hold as potentially valuable.
  - Reason: new visual system pieces; not yet staged into a coherent release
    commit.
  - Action: decide whether these are final launch assets or experiment assets.

### Generated Uploads

- `uploads/generated/oriel-chat-images/*.png`
  - Hold until user approves deletion.
  - Reason: generated runtime artifacts, likely not source.
  - Expected final classification: Junk after approval.

### Local Agent Metadata

- `.agents/`
- `.codex/`
  - Hold / protect.
  - Reason: `git clean -fd` would remove them, but they may contain local tool
    state. Do not clean globally.

## JUNK CANDIDATES

These look unsafe or inappropriate for `main`. They are candidates only;
removal still requires explicit user approval.

### High-Confidence Junk

- `.manus/db/*.json`
  - Reason: DB query logs/tool artifacts. Some contain connection command
    metadata. Not release source.
  - Recommended action: do not commit. Add `.manus/` to `.gitignore`.

- `uploads/`
  - Reason: generated runtime output.
  - Recommended action: do not commit. Add `uploads/` to `.gitignore`.

- `AGENT_GIT_REVIEW_PROMPT.md`
  - Reason: local review prompt artifact.
  - Recommended action: remove or keep outside repo after approval.

- `wiki/Untitled 1.base`
- `wiki/Untitled 1.canvas`
- `wiki/Untitled 2.canvas`
  - Reason: likely Obsidian scratch files.
  - Recommended action: ask user before removal because `wiki/` is protected.

### Large Mock/Temp Archive

- `codex/vrc_static_signature/03_VISUAL_SYSTEM/mock&temp/`
  - Size: 336M.
  - Reason: large generated mock images and duplicated visual directions.
  - Recommended action: do not push to `main` unless user explicitly wants the
    mock archive versioned. If retained locally, ignore with
    `codex/**/mock&temp/`.

### Ambiguous Scratch Media

- `shared/Golden_logo_with_glitches_202606012151.mp4`
- `shared/fa_mi_un_videoclip_loop_ca_sa.mp4`
  - Reason: large video files in `shared/` with scratch-like names.
  - Recommended action: hold for user confirmation; move only final assets to
    `client/public/media/`.

## Proposed Main-Merge Order

1. Safety checkpoint branch or tag before cleanup.
2. Brain/canon commits:
   - `wiki/` + `codex/` restore.
   - `shared/cosmichronica/` restore.
   - business structure ingest.
3. Runtime ORIEL upgrade commits:
   - Image Generation Mode.
   - `rgp.dynamicState` auth hardening.
   - `.env` upload rejection.
4. Visual release-shell commits:
   - final Oriel Signal media assets.
   - home/header/layout redesign.
   - entry gate if approved.
5. Ignore/cleanup commit:
   - `.manus/`
   - `uploads/`
   - `.agents/`
   - `.codex/`
   - `wiki/Untitled*.canvas`
   - `wiki/Untitled*.base`
   - `codex/**/mock&temp/`

## Verification Gates

Before merging each runtime or UI batch:

- `pnpm check`
- `pnpm test`
- `pnpm build`
- Browser QA for:
  - home page first viewport
  - Conduit text chat
  - Image Generation Mode
  - file upload rejection paths
  - Carrierlock / Dynamic Reading
  - voice mode if touched

## Explicit Approval Required Before

- `git clean -f` or `git clean -fd`
- `git reset --hard`
- `git checkout -- <path>`
- `rm`, `git rm`, or deleting files
- force push or history rewrite
- unstaging/reverting protected `wiki/`, `codex/`, or `shared/cosmichronica`
  changes
