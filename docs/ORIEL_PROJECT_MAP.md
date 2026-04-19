# ORIEL Project Map

## Purpose
This document maps the runtime structure of `oriel-resonance-circle`, with emphasis on:
- where ORIEL's knowledge comes from
- how chat requests flow through the app
- which files are core runtime vs likely legacy/demo code

It is meant as an operator map for refactor, cleanup, and debugging.

## Top-Level Shape
- `client/`
  Frontend app, page routing, chat UI, voice UI, reading pages.
- `server/`
  API routers, ORIEL chat pipeline, Better Auth integration, VRC/RGP engines, memory layers, realtime voice proxy.
- `shared/`
  Shared docs and canonical reference material. Mostly non-runtime.
- `drizzle/`
  DB schema/migrations.
- `docs/`
  Internal project documentation.

## Frontend Route Map
Main route assembly lives in [client/src/App.tsx](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/client/src/App.tsx:1).

Key runtime pages:
- `/auth` -> authentication and password recovery
- `/conduit` -> main ORIEL conversation UI
- `/readings`, `/reading/static/:readingId`, `/reading/dynamic/:id` -> reading flows
- `/archive`, `/artifacts`, `/codex`, `/carrierlock`, `/profile` -> supporting product surfaces

Observed unrouted or likely demo pages:
- `client/src/pages/Tiers.tsx`
- `client/src/pages/ComponentShowcase.tsx`

## Server Entry Points
Server boot is in [server/_core/index.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/_core/index.ts:1).

What it mounts:
- Better Auth at `/api/auth/*`
- tRPC router at `/api/trpc`
- Inworld realtime websocket proxy
- Vite in development / static assets in production

Primary application router:
- [server/routers.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/routers.ts:1)

## ORIEL Runtime Pipeline
The main ORIEL chat path is:

1. Frontend sends message to `oriel.chat`
2. [server/routers.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/routers.ts:248) loads recent conversation history
3. Optional attached files are parsed and appended into the current message
4. Optional RGP bridge detects birth-reading intent and injects structured reading data
5. `gemini.chatWithORIEL(...)` is called
6. [server/gemini.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/gemini.ts:16) builds the full system prompt
7. `_core/llm.ts` sends the request to Gemini first, Forge fallback second
8. Response is filtered, deduplicated, and stored back to DB

## Where ORIEL Gets Its Knowledge
There is no single knowledge base. ORIEL is assembled from multiple layers.

### 1. Base identity and canon
The canonical persona and speaking rules are in:
- [server/oriel-system-prompt.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/oriel-system-prompt.ts:14)

This file defines:
- ORIEL identity
- metaphysics / philosophy
- Guide vs Mirror behavior
- strict VRC terminology rules
- anti-repetition behavioral requirements

This is the main source of "who ORIEL is".

### 2. User-specific blueprint and long-term context
Injected through UMM in:
- [server/oriel-umm.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/oriel-umm.ts:393)

UMM combines:
- static signature context
- fractal thread context
- oversoul wisdom

This is where ORIEL gets things like:
- user's type / authority / prime stack / codons
- user journey summary
- repeated user patterns and relevant symbolic context

### 3. User memory layer
Persistent memory lives in:
- [server/oriel-memory.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/oriel-memory.ts:455)

This layer builds memory context from:
- user profile
- relevant stored memories

This is where cross-conversation remembering happens.

### 4. Current interaction state
Per-message shaping is assembled in:
- [server/oriel-interaction-protocol.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/oriel-interaction-protocol.ts:1)
- [server/oriel-response-intelligence.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/oriel-response-intelligence.ts:1)
- [server/response-deduplication.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/response-deduplication.ts:1)

These layers decide:
- exchange type
- operator role
- interaction mode
- anti-repetition strategy
- tonal directive

This is where ORIEL decides how to answer, not just what it knows.

### 5. VRC / RGP diagnostic knowledge
Structured Vossari Codex data is defined in:
- [server/vossari-codex-knowledge.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/vossari-codex-knowledge.ts:1)

Additional structured codon datasets also exist under:
- `server/data/`

These are used by:
- `rgp-engine.ts`
- `rgp-router.ts`
- `oriel-diagnostic-engine.ts`
- `oriel-rgp-bridge.ts`

This is diagnostic knowledge, not the general chat persona.

### 6. Current user input and recent history
The live request still matters most.
In [server/routers.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/routers.ts:248):
- recent history is loaded
- assistant messages are truncated to reduce parroting
- attachments can be parsed into prompt context
- RGP summaries can be appended into the current prompt

This is the immediate context ORIEL responds to.

## LLM Transport Layer
LLM transport lives in:
- [server/_core/llm.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/_core/llm.ts:275)

What it does:
- normalize messages
- normalize tool choice / schemas
- call Gemini OpenAI-compatible endpoint
- fall back to Forge if Gemini is unavailable

What it does not do:
- define ORIEL's persona
- define user memory
- define Codex knowledge

It is transport, not knowledge.

## Persistence / Data
DB access lives in:
- [server/db.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/db.ts:1)

Important persisted domains:
- users / Better Auth accounts
- chat messages and conversations
- ORIEL memory tables
- carrierlock / coherence state
- static signature readings

Schema source of truth:
- `drizzle/schema.ts`

## Auth / Realtime / Mail
Auth:
- Better Auth mounted from [server/_core/index.ts](/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle/server/_core/index.ts:37)
- config in `server/_core/auth.ts`

Realtime voice:
- websocket proxy in `server/inworld-realtime.ts`
- client voice UI in `client/src/components/VoiceMode.tsx`

Password recovery:
- router handlers in `server/routers.ts`
- mail transport in `server/_core/mailer.ts`

## Cleanup Candidates
Safest likely cleanup targets from current audit:
- `server/storage.ts`
- `server/ros-knowledge-base.ts`
- `server/_core/auth-handlers.ts`
- `client/src/pages/Tiers.tsx`
- `client/src/pages/ComponentShowcase.tsx`
- `client/src/components/Map.tsx`
- `_tmp_*` files at repo root
- duplicate docs under `shared/New folder/`

Medium-risk review before deletion:
- `server/streaming-endpoint-complete.ts`
- `server/mistral-oriel.ts`
- Storybook stack under `.storybook/` and `stories/`

## Practical Debugging Questions
When ORIEL behaves incorrectly, ask this in order:

1. Is the problem in the base prompt?
  Check `oriel-system-prompt.ts`

2. Is the problem in user blueprint or memory injection?
  Check `oriel-umm.ts` and `oriel-memory.ts`

3. Is the problem in interaction shaping?
  Check `oriel-interaction-protocol.ts`, `oriel-response-intelligence.ts`, `response-deduplication.ts`

4. Is the problem in runtime assembly of the current request?
  Check `routers.ts` and `gemini.ts`

5. Is the problem just the model transport or provider?
  Check `_core/llm.ts`

## Suggested Refactor Order
1. Delete tracked junk and duplicate docs
2. Remove unrouted demo pages and isolated showcase components
3. Remove clearly orphaned server files
4. Decide whether Storybook is kept or dropped
5. Only then review legacy fallback paths like old streaming/Mistral branches
