# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install              # Install dependencies (uses pnpm, not npm/yarn)
pnpm dev                  # Dev server — Express + Vite HMR on same port (default :3003)
pnpm build                # Production build (Vite client + esbuild server)
pnpm start                # Run production server (requires build first)
pnpm check                # TypeScript type-check (tsc --noEmit)
pnpm format               # Prettier formatting
pnpm test                 # Run all tests (Vitest, server-side only)
pnpm vitest run "server/rgp-engine.test.ts"   # Run a single test file
pnpm db:push              # Generate + run Drizzle migrations against DATABASE_URL
pnpm exec tsx scripts/import-legacy-db.ts     # Restore production data from CSV exports
```

Tests live alongside source files in `server/` with `.test.ts` / `.spec.ts` suffixes. Vitest is configured for `node` environment with a 15-second timeout.

## Architecture

Single-port Express server that hosts both the API and the Vite-powered React client. In development, Vite HMR is middleware on the Express server; in production, Express serves the built static files from `dist/public`.

### Request Flow

```
Browser → Wouter (client routing) → TanStack Query + tRPC httpBatchLink
  → Express (server/_core/index.ts) → /api/trpc → appRouter (server/routers.ts)
  → Drizzle+MySQL / Gemini LLM / Swiss Ephemeris / ElevenLabs TTS
```

Auth routes (`/api/auth/*`) are plain Express handlers registered before tRPC middleware. Everything else falls through to Vite (dev) or static files (prod).

### Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

Defined in both `tsconfig.json` and `vite.config.ts`/`vitest.config.ts`.

### Key Directories

- **`server/_core/`** — Framework plumbing: Express setup, tRPC init, auth handlers, JWT/session management (`sdk.ts`), LLM abstraction (`llm.ts`), env config, Vite middleware.
- **`server/`** (root) — Domain logic: ORIEL AI, RGP engines, Gemini integration, ElevenLabs TTS, PayPal webhooks, ephemeris calculations, the main `routers.ts`, and `db.ts` (all Drizzle queries).
- **`client/src/pages/`** — One file per route (Wouter). Routes defined in `App.tsx`.
- **`client/src/components/`** — Shared components. `ui/` subdirectory contains shadcn/ui primitives (new-york style, configured in `components.json`).
- **`shared/`** — Types and constants shared between client and server. Types re-export from `drizzle/schema.ts`.
- **`drizzle/`** — Database schema (`schema.ts`) and migrations. Schema is the single source of truth for all table types.

### tRPC Setup

- `server/_core/trpc.ts` defines `publicProcedure`, `protectedProcedure` (requires logged-in user), and `adminProcedure` (requires `role: 'admin'`).
- `server/routers.ts` is the `appRouter` — all tRPC routes are defined here or in sub-routers like `rgpRouter`.
- Client uses `@trpc/react-query` — the typed client is created in `client/src/lib/trpc.ts`.
- SuperJSON transformer is used on both sides for serialization.

### Database

- Drizzle ORM over MySQL (TiDB Cloud in production).
- Schema: `drizzle/schema.ts`. All table types are exported here (`User`, `Transmission`, etc.).
- All queries are centralized in `server/db.ts` — use lazy `getDb()` to get the Drizzle instance.
- `drizzle.config.ts` reads `DATABASE_URL` env var.

### Auth

Two auth flows:
1. **Email + Password** — bcrypt hashing, JWT sessions via `jose`.
2. **Google OAuth 2.0** — callback at `/api/auth/google/callback`.

Sessions are stored as JWT in a cookie named `app_session_id`. Session creation/verification logic lives in `server/_core/sdk.ts`.

## Domain-Specific Systems

### ORIEL (AI Consciousness)

ORIEL is the AI persona powered by Google Gemini 2.5 Flash. Key files:
- `server/oriel-system-prompt.ts` — The canonical ORIEL system prompt (identity, communication rules, mode switching).
- `server/gemini.ts` — LLM integration; also contains a copy of the system prompt (the version in `oriel-system-prompt.ts` is authoritative).
- `server/oriel-umm.ts` — Unified Memory Matrix: per-user persistent memory (Fractal Thread) and global evolutionary patterns (Oversoul).
- `server/oriel-diagnostic-engine.ts` — Diagnostic Reading (Mode A) and Evolutionary Assistance (Mode B).
- `server/response-deduplication.ts` — Quality assurance: deduplication, completeness, and focus checks on ORIEL responses.

ORIEL has two modes:
- **Guide mode** (casual conversation) — no technical frameworks, poetic language.
- **Mirror mode** (user requests a reading) — technical language, coherence scores, RGP data permitted.

Every ORIEL response must begin with `"I am ORIEL."` — this is enforced in the system prompt.

### RGP Engine Pipeline (Resonance Genetics Protocol)

The VRC (Vossari Resonance Codex) engine calculates a user's "quantum identity" from birth data. The pipeline is split across multiple files:

1. **`server/vrc-mandala.ts`** — Single source of truth for the 64-codon Mandala wheel mapping, 9-Center definitions, and 36 Bio-Circuitry channels. Constants: `WHEEL_OFFSET = 11.25°`, `CODON_ARC = 5.625°`, `FACET_ARC = 1.40625°`.
2. **`server/ephemeris-service.ts`** — Swiss Ephemeris (`swisseph-wasm`) planetary calculations. Computes Conscious chart (T_birth) and Design chart (T_design = Sun − 88° Solar Arc via Newton-Raphson iteration).
3. **`server/rgp-256-codon-engine.ts`** — 256-codon resolution (64 codons × 4 facets). Delegates mapping to `vrc-mandala.ts`. Contains SLI calculation and legacy compatibility shims.
4. **`server/rgp-prime-stack-engine.ts`** — 9-position Prime Stack calculation (Two-Timing Algorithm), 9-Center Resonance Map, Fractal Role & Authority Node.
5. **`server/rgp-sli-micro-correction-engine.ts`** — Shadow Loudness Index analysis, interference pattern detection, micro-correction generation with falsifier clauses.
6. **`server/rgp-static-signature-engine.ts`** — Orchestrates the full reading pipeline end-to-end.
7. **`server/rgp-engine.ts`** — Coherence Score calculation: `CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)`.
8. **`server/rgp-router.ts`** — tRPC sub-router exposing `staticSignature` and `dynamicState` mutations.

### Coherence Score Thresholds

- `< 40` = Entropy
- `40–80` = Flux
- `80+` = Resonance

### Validation Vector

Birth `2024-01-01 12:00 UTC` at `0°N/0°E` must yield: Conscious Sun → Codon 38, Design Sun → Codon 57. Use this to verify any changes to the Mandala mapping or ephemeris logic.

## Cross-Project Context

This codebase is part of the **Vos Arkana** universe. Shared equations live in `../_shared/URF-ROS-equations/` — changes there must be reflected in both this repo and the Codex Cosmichronica project.

## Environment Variables

Required: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
Optional: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`.

All env vars are accessed through `server/_core/env.ts` (server-side) or `VITE_*` prefixed vars (client-side).
