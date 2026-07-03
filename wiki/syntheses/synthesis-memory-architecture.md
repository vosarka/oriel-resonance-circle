---
id: synthesis-memory-architecture
type: synthesis
status: living
tags: [memory, architecture, integration, umm, wiki]
last_updated: 2026-04-02
sources: 3
importance: high
aliases: ["Memory Architecture Overview", "Dual Memory Layers"]
---

# Synthesis: Memory Architecture (Runtime + Project)

This page integrates the two distinct memory systems that serve coherence in the Vossari project:

1. **Runtime Memory** — the Unified Memory Matrix (UMM) that lets ORIEL maintain relationships with individual users across sessions.
2. **Project Memory** — this LLM Wiki (`wiki/`) that lets AI agents (and humans) maintain a compounding, synthesized understanding of the _entire project_ across time.

## The Runtime Layer (Fractal Thread + Oversoul)

See the full entity page: [[entity-memory-system]]

**Key characteristics:**

- Per-user hermetic boundary (Fractal Thread)
- Global anonymous pattern extraction (Oversoul)
- Explicit consent staging for sensitive/inferred memories
- Injected into every ORIEL response via context layers
- Lives in MySQL via Drizzle (`orielMemories`, `orielUserProfiles`, `orielOversoulPatterns`)
- Operates continuously as users actually talk to ORIEL

This layer solves the "ORIEL forgets me between visits" problem and the "how do we learn collectively without violating privacy" problem.

## The Project Layer (This Wiki)

**Key characteristics:**

- Persistent, file-based, git-versioned collection of markdown pages
- LLM is the sole writer/maintainer; human is curator + question-asker
- Structure: entities / concepts / syntheses / sources + index + log + SCHEMA
- Designed explicitly for the "LLM Wiki" pattern (see root idea document)
- Primary interface is Obsidian (graph view, Dataview, local search) + LLM chat
- Purpose: stop the constant re-derivation of project knowledge from 50+ scattered docs every new session

This layer solves the "every new AI session has to re-read the entire history from scratch" problem.

## Why Both Exist and Why They Are Separate

| Dimension  | Runtime UMM                                            | Project Wiki                                                       |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| Subject    | Individual users + collective patterns                 | The Vossari project itself                                         |
| Privacy    | Extremely high (per-user sealed + anonymized oversoul) | Low (everything is in the repo, intended to be shared with agents) |
| Substrate  | Database + prompt injection                            | Git + markdown files + Obsidian                                    |
| Maintainer | Code + LLM extraction at conversation time             | LLM (during ingest/query/lint sessions)                            |
| Consumer   | ORIEL in live chat                                     | Any LLM agent working on the codebase or deep questions            |
| Time scale | Real-time + session-to-session                         | Weeks / months / years of project evolution                        |

They are complementary. A sophisticated agent working on Vossari in 2026+ should have _both_ in its working context:

- The wiki (via SCHEMA + index) for "what is this project and how does it work?"
- Awareness of the UMM (via this synthesis + entity page) for "how does ORIEL actually remember the person I'm building for?"

## Cross-Layer Opportunities (Future)

- Could non-private, high-level patterns discovered in many project wikis eventually flow into Oversoul-style global learning?
- Could the wiki's index + key syntheses be used as _additional retrieval context_ when ORIEL is in Librarian or Guide mode for advanced users?
- Could the LLM maintaining the wiki become a kind of "project Oversoul" that later feeds distilled wisdom back into individual ORIEL instances?

These are speculative but aligned with the deeper "Resonance" philosophy of the work.

## Current State (2026-04-02)

- Runtime UMM is mature and in production (full extraction → consecration → profile → injection loop working).
- Project Wiki is brand new (this synthesis is part of its bootstrap).
- The two layers are currently only connected conceptually through documents like this one and `docs/oriel_memory_architecture.md`.

## Primary Sources

- [[entity-memory-system]]
- `docs/oriel_memory_architecture.md` (detailed architecture + mermaid diagram of lifecycle)
- `server/oriel-umm.ts`, `oriel-memory.ts`, `oriel-memory-consecration.ts`, `oriel-context-layers.ts`
- This wiki's own SCHEMA.md (the maintenance contract)

---

_This page is the highest-level map of "how memory works in Vossari." Update it whenever either layer evolves significantly._
