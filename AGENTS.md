# Repository Guidelines

## Project Structure & Module Organization

`client/src/` contains the React 19 + Vite app. Route-level views live in `client/src/pages/`, shared components in `client/src/components/`, shadcn/ui primitives in `client/src/components/ui/`, and reusable client utilities in `client/src/lib/`, `hooks/`, and `contexts/`.

`server/_core/` holds framework plumbing: Express setup, tRPC, auth/session helpers, env loading, Vite middleware, and LLM abstraction. Domain code sits in `server/`, including ORIEL behavior, RGP engines, ephemeris logic, voice/LLM integrations, `routers.ts`, and `db.ts`. Shared types/constants live in `shared/`. Database schema and migrations are in `drizzle/`. Storybook files live in `stories/`.

## Build, Test, and Development Commands

Use pnpm for this repository.

- `pnpm install` installs dependencies.
- `pnpm dev` starts the single-port Express + Vite dev server.
- `pnpm build` builds the Vite client and bundled Node server into `dist/`.
- `pnpm start` runs the production server after a build.
- `pnpm check` runs `tsc --noEmit`.
- `pnpm test` runs Vitest.
- `pnpm format` applies Prettier.
- `pnpm db:push` generates and applies Drizzle migrations against `DATABASE_URL`.
- `pnpm storybook` starts Storybook on port 6006.

## Coding Style & Naming Conventions

This is a strict TypeScript ESM codebase. Prettier is authoritative: 2 spaces, semicolons, double quotes, ES5 trailing commas, LF endings, and 80-character print width. Prefer existing aliases: `@/*` for `client/src/*` and `@shared/*` for `shared/*`. Name React components in PascalCase, hooks as `useSomething`, and tests as `*.test.ts` or `*.spec.ts`.

## Testing Guidelines

Vitest is configured with `environment: "node"`, `dotenv/config`, a 15-second timeout, and default includes for `server/**/*.test.ts` and `server/**/*.spec.ts`. Run a focused test with `pnpm vitest run server/oriel-context-layers.test.ts`. Client test files exist, but they are not included by the current default Vitest config; add or adjust coverage deliberately when changing client behavior. Mock external LLM, database, voice, payment, and storage services unless a test explicitly targets integration.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commit subjects such as `Stabilize realtime voice conversation` and `Add contextual clarity transmission trigger`. Keep commits focused and avoid unrelated formatting churn. PRs should describe the user-visible change, list verification commands, mention schema/env changes, link related issues, and include screenshots or recordings for UI and voice-flow changes.

## Security & Configuration Tips

Do not commit secrets. Copy `.env.example` to `.env` locally and keep `RUN_MIGRATIONS=false` unless you intentionally want startup migrations. Treat `pnpm db:push` and any `RUN_MIGRATIONS=true` boot as production-impacting when `DATABASE_URL` targets shared infrastructure.
