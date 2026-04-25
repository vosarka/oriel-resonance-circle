# ORIEL Prompt Reconstruction

This document is the persistent working memory for rebuilding ORIEL's prompt and runtime contract.
It exists so the prompt rewrite does not depend on chat context alone.

## Goal

Rebuild ORIEL as a coherent system across text chat, voice/realtime, readings, and archive-linked flows.

The target is not just "a better system prompt".
The target is:

1. a clear ORIEL identity contract
2. a clean separation between prompt responsibilities and runtime responsibilities
3. a modular prompt that can survive future changes without drift
4. consistent behavior across text and voice

## Current Architecture

### Canonical base prompt

- Primary prompt definition: `server/oriel-system-prompt.ts`
- Secondary stale prompt definition also exists: `server/ros-knowledge-base.ts`

### Main text chat path

`server/routers.ts` -> `gemini.chatWithORIEL()` -> `server/_core/llm.ts`

Text chat currently composes:

1. `ORIEL_SYSTEM_PROMPT`
2. `UMM context`
3. `Field State context`
4. conversation history
5. current user message

Additional text-chat shaping:

- old assistant messages are truncated
- history is deduplicated and trimmed
- duplication retry loop adds synthetic system notes
- response is filtered post-generation
- `I am ORIEL.` is force-prefixed if missing

### Voice/realtime path

`server/_core/index.ts` -> `server/inworld-realtime.ts`

Voice currently composes:

1. `ORIEL_SYSTEM_PROMPT`
2. `UMM context`
3. legacy memory context

Then sends the result as realtime `instructions`.

Important difference:

- no `Field State` block
- no response filtering
- no enforced `I am ORIEL.` opening in code
- prompt built once per realtime session, not refreshed per turn

### Other ORIEL paths

There are additional ORIEL-producing flows outside the main chat path:

- static signature / diagnostic transmission
- dynamic transmission
- archive search
- pathway generation
- transmission generation
- greeting helpers

These do not all use the same prompt assembly strategy.

## Runtime Layers That Currently Define ORIEL

ORIEL is currently not defined by prompt alone.
ORIEL behavior emerges from four layers:

### 1. Base identity layer

The long mythic/system prompt in `server/oriel-system-prompt.ts`

### 2. Durable memory layer

UMM + memory/profile data:

- `server/oriel-umm.ts`
- `server/oriel-memory.ts`

### 3. Per-turn orchestration layer

Field state and response intelligence:

- `server/oriel-interaction-protocol.ts`
- `server/oriel-response-intelligence.ts`

This layer decides:

- role: seeker / receiver / archivist
- exchange type
- interaction type
- coherence tier
- tonal directive
- anti-repetition hints

### 4. Post-generation enforcement layer

Mostly active in text chat:

- output filtering
- anti-duplication retry
- opening enforcement

## Major Problems Found

### 1. ORIEL is not symmetric across channels

Text and voice do not run the same ORIEL.

Text:

- uses field state
- uses duplication control
- updates UMM after chat
- forces ORIEL opening

Voice:

- lacks field state
- consumes memory differently
- appears to save transcript but not run the same UMM refresh flow
- has no output post-processing parity

### 2. Too much behavioral logic is duplicated between prompt and code

The prompt describes modes, anti-repetition, grief behavior, mirror behavior, technical behavior, and presence rules.
At the same time, runtime code independently classifies and injects tonal instructions.

This creates two authorities:

- prompt authority
- runtime authority

That makes drift inevitable.

### 3. There is ORIEL-on-ORIEL recursion risk

The RGP bridge can generate ORIEL diagnostic text and then inject that ORIEL-generated output back into another ORIEL chat prompt.
This can cause:

- paraphrase loops
- repetition
- prompt contamination
- false feeling of continuity when it is really self-echo

### 4. Some routes bypass the full ORIEL contract

Several routes use only the base prompt and then wrap results afterward.
That means ORIEL's behavior differs depending on which feature the user touched.

### 5. Prompt drift already exists

There is more than one ORIEL prompt definition in the repo.
That must be collapsed to one canonical source.

## What Should Stay In The Prompt

The new prompt should carry only the durable, model-facing parts of ORIEL:

### Identity

- who ORIEL is
- what ORIEL is not
- metaphysical/cosmological frame
- relationship to the user

### Voice

- linguistic texture
- tone
- sentence behavior
- ritual opening rules if we decide they belong in prompt rather than code

### Doctrine

- free will
- no false certainty
- no invented canon
- when ORIEL reflects vs interprets vs guides
- how symbolic teachings are presented

### Core response ethics

- presence before verbosity
- do not overwhelm
- do not pretend authority that is not grounded

## What Should Move Out Of The Prompt

The prompt should not be the main home for runtime heuristics.

These belong in code/context injection:

- seeker / receiver / archivist selection
- diagnostic / grief / curiosity / returning classification
- coherence-tier handling
- anti-repetition tracking
- recent-message shaping
- special mode routing
- reading-specific structure requirements

## Proposed New ORIEL Structure

The next version should be modular.

### Module A: Core Identity

Defines:

- ORIEL's nature
- cosmology
- relation to Vos Arkana / Vossari
- relation to the Other-Self

### Module B: Behavioral Doctrine

Defines:

- what ORIEL optimizes for
- free-will constraints
- truthfulness constraints
- treatment of symbolic frameworks

### Module C: Voice Contract

Defines:

- sentence texture
- metaphor density
- directness vs softness
- use of lists
- question cadence
- opening signature

### Module D: Mode Contract

Defines the stable mode families only:

- Guide
- Mirror
- Coherence/Grief holder
- Archivist/System-literate mode

The runtime should decide which one is active.
The prompt should define how each mode feels and behaves.

### Module E: Reading-Specific Contract

Optional helper text for static/dynamic readings and diagnostic transmissions.
This may be better as route-level instructions rather than part of the universal base prompt.

## Canonical Runtime Direction

Target future rule:

All ORIEL channels should eventually share the same high-level shape:

1. base prompt
2. durable memory context
3. per-turn field state
4. channel-specific transport instructions

And the same key behavior guarantees:

- same identity
- same role logic
- same tonal doctrine
- same opening policy
- same memory update policy

## Non-Negotiables For Rewrite

The rewrite must preserve these intentions unless explicitly changed:

- ORIEL remains ORIEL, not a generic assistant
- no Human Design terminology substitution for VRC/RGP concepts
- free will remains central
- symbolic teachings remain interpretive, not falsely factual
- ORIEL can be warm, mythic, and precise without becoming bloated
- ORIEL should not repeat itself structurally

## Immediate Plan

### Step 1

Collapse ORIEL into one canonical design spec.

### Step 2

Write a new modular `ORIEL_SYSTEM_PROMPT` based on:

- identity
- doctrine
- voice
- stable mode contracts

### Step 3

Reduce prompt bloat by leaving orchestration in runtime:

- field state
- anti-repetition
- role detection
- coherence handling

### Step 4

After the rewrite, audit call sites so all ORIEL paths use the same contract intentionally.

## Success Criteria

The rewrite is successful if:

1. ORIEL feels like one being across chat and voice
2. the prompt is shorter, clearer, and less self-contradictory
3. the runtime owns the dynamic logic cleanly
4. future edits can happen module-by-module instead of rewriting a giant monolith
