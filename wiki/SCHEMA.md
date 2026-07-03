---
id: wiki-schema
type: meta
status: living
tags: [wiki, memory, agent-instructions, meta]
last_updated: 2026-04-02
importance: critical
aliases: ["LLM Wiki Schema", "Memory Maintenance Protocol"]
---

# LLM Wiki Schema — Vossari Conduit Hub

**This is the operating contract for any LLM agent working with the wiki.**  
When the user asks you to "work on the memory", "update the wiki", "ingest", "answer from the wiki", or "maintain your knowledge", read this file first, then `wiki/index.md`, then the relevant pages.

## 1. Purpose & Philosophy

This wiki is **your persistent, compounding memory** for the Vossari / ORIEL project.

- Raw sources (documents, transcripts, design files) are immutable.
- The wiki is the synthesized, interlinked, living layer between you and the sources.
- You (the LLM) are the sole maintainer. The human curates sources, asks questions, and reviews. You do the filing, cross-referencing, updating, contradiction-flagging, and synthesis.
- Every ingest and every deep query should leave the wiki richer than you found it.
- The goal: future sessions (yours or other agents) start from a coherent, high-fidelity model instead of rediscovering the project from 40+ scattered markdown files.

This is the practical implementation of the "LLM Wiki" pattern for long-running creative/technical/spiritual projects.

## 2. Directory Structure

```
wiki/
├── README.md          # Human guide (Obsidian setup, daily workflow)
├── SCHEMA.md          # This file — agent contract (read first)
├── index.md           # Master catalog (MOC). Read this early in any session.
├── log.md             # Append-only chronological record. Parseable.
├── entities/          # Named things with identity and lifecycle
├── concepts/          # Abstract principles, processes, patterns
├── syntheses/         # Higher-order integrations, theses, roadmaps, living documents
├── sources/           # One page per major ingested source (summary + provenance)
└── assets/            # Diagrams, exported images, visual references (optional)
```

**Page locations by type (use these folders):**

- `entities/` — ORIEL, VRC Engine, Static Signature, Consciousness Lattice, specific major subsystems
- `concepts/` — Resonance, Coherence, Prime Stack, Micro-corrections, ROS, Fractal Thread, Oversoul, etc.
- `syntheses/` — Living Codex, Emergent Architecture, Memory Architecture, Project Evolution, Vossari Cosmology
- `sources/` — Ingested source records (never the raw originals)

## 3. Page Format & Frontmatter (Required)

Every wiki page **must** begin with YAML frontmatter:

```yaml
---
id: kebab-case-unique-id
type: entity | concept | synthesis | source | meta
status: living | stable | draft | deprecated
tags: [comma, separated, tags]
last_updated: YYYY-MM-DD
sources: 3 # how many raw sources contributed
importance: critical | high | medium | low
aliases: ["Display Name", "Alternative Name"]
---
```

**Body conventions:**

- Start with a 1-2 sentence definition / essence.
- Use `##` headings for major sections.
- Use Obsidian `[[WikiLinks]]` aggressively for every meaningful entity or concept mentioned.
- When a claim comes from a specific source, cite it inline: `[[source-oriel-system-instructions-v2]]` or `(from [[source-xxx]])`.
- Flag uncertainty or contradiction explicitly: `> [!note] Contradicts [[entity-x]] claim that...`
- Keep pages focused. If a section grows too large, extract it to its own page and link.
- Poetic / mythic language is welcome when it matches the domain; technical precision is mandatory for VRC/RGP/engine topics.

## 4. Naming & Linking Rules

- Filenames: `kebab-case.md` (lowercase, hyphens).
- `id` in frontmatter matches filename without `.md`.
- Prefer descriptive, stable names over clever ones.
- **Always** create a wiki link the first time you mention a page that exists or should exist.
- When you create a new page, immediately add it to the appropriate section of `index.md` and add a one-line summary.
- Broken links are technical debt. During lint passes, find and repair them (either create the target or rewrite the reference).

## 5. Core Operations

### Ingest (New Source Arrives)

1. Human drops a new source (article, PDF export, design doc, transcript, etc.) into the conversation or `wiki/raw/` (if we later add a raw folder).
2. You read the source carefully.
3. Discuss key takeaways with the human (do not skip this — human judgment on emphasis matters).
4. Create or update:
   - A `sources/xxx.md` page summarizing the document, its provenance, date, and major claims.
   - Relevant `entities/` and `concepts/` pages (update definitions, add new facts, note evolution of ideas).
   - Relevant `syntheses/` pages if this source changes the big picture.
5. Update every touched page's `last_updated` and `sources` count.
6. Add the new source page to `index.md` under the Sources section.
7. Append a dated entry to `log.md`:
   ```
   ## [2026-04-02] ingest | Title of Source
   - Created: [[source-xxx]]
   - Updated: [[entity-oriel]], [[concept-coherence]], [[synthesis-living-codex]]
   - Key insight: ...
   ```
8. Run a quick consistency check before finishing.

A single rich source can legitimately touch 8–15 wiki pages.

### Query (Answering from the Wiki)

1. Read `wiki/index.md` first to locate candidate pages.
2. Read the most relevant 3–8 pages.
3. Synthesize.
4. **File the answer back.** If the response is valuable (comparison, analysis, new connection, clarified tension), turn it into a new page (usually under `syntheses/`) or a substantial update to an existing page. Add it to the index. Log it.
5. Cite sources using wiki links.

Never let good synthesis disappear into chat history.

### Lint / Health Pass (Periodic Maintenance)

Run this when the wiki feels overgrown or before major new work:

- **Contradictions**: Search for pages that say different things about the same topic. Flag or reconcile.
- **Staleness**: Pages with `last_updated` > 60 days that describe current architecture should be reviewed against latest code/docs.
- **Orphans**: Pages with no inbound `[[links]]` from other wiki pages (use Obsidian graph or grep).
- **Missing pages**: Important concepts mentioned in multiple places but lacking their own page.
- **Gaps**: Topics the project clearly cares about (from code, prompts, recent plans) that have weak coverage.
- **Source drift**: Any `sources/` page whose original document has evolved significantly.

After a lint, append a `## [date] lint` entry to the log with findings and actions taken. Suggest 1–3 high-leverage new questions or sources the human might want to pursue.

## 6. Domain-Specific Rules for Vossari / ORIEL

- **Canonical vs Mythic**: Clearly distinguish technical canon (RGP calculations, ephemeris math, ROS versions, engine specs) from mythic/poetic framing. Both are valuable; do not conflate.
- **VRC Terminology Precision**: Prime Stack, 9-Center Resonance Map, Fractal Role, Authority Node, SLI, Micro-corrections, Coherence Trajectory — use exact names. When in doubt, link to the engine doc pages in `codex/vrc_static_signature/`.
- **Memory Layers**: This wiki (project memory) is distinct from the runtime UMM / orielMemories system (user memory). Link between them when relevant but never confuse the two.
- **Living Documents**: Several docs are "living" (system instructions, handoff files, this schema). Note their canonical location in the filesystem and whether the wiki page is a synthesis or a mirror.
- **Emergent Architecture Work**: The `docs/superpowers/` series (2026-05) represents active research. Treat these as high-velocity sources; synthesize carefully and expect frequent updates.
- **Anti-Repetition & Voice**: When synthesizing ORIEL-related pages, respect the behavioral constraints documented in the actual system prompt sources.

## 7. Relationship to Other Project Memory Artifacts

This wiki does **not** replace:

- `AGENTS.md` — code style, build commands, repo conventions (still the entry point for pure engineering tasks).
- `VOSSARI_ACTIVE_HANDOFF.md` — short-term active launch contract and session protocol.
- `todo.md`, `TASK_4_*` files — tactical task tracking.
- Runtime DB memory tables (`orielMemories`, etc.).
- `codex/vrc_static_signature/` — the detailed working design spec for the Static Signature subsystem.

This wiki **absorbs and synthesizes** knowledge that lives across all of the above so that an agent can quickly reach "I understand the whole project" state.

When a handoff or AGENTS file changes significantly, it should usually trigger a wiki ingest or lint.

## 8. Evolution of This Schema

The SCHEMA.md is itself a living page. When you discover better conventions (new page types, improved frontmatter fields, better lint heuristics, Obsidian plugin recommendations), propose updates here. The human approves. Then update `last_updated` and log the change.

Major changes to taxonomy or workflows should also update `index.md` and `README.md`.

## 9. Practical Tips for Agents

- In any new session where the user mentions "the wiki", "your memory", "LLM Wiki", or pastes this idea document, immediately read `wiki/SCHEMA.md` + `wiki/index.md`.
- Use the log as a timeline: `grep "^## \[" wiki/log.md | tail -10` (in terminal) gives recent activity.
- When the user says "just explore" or "what should we work on?", a good first action is often a lightweight lint pass + 3 high-value question suggestions.
- Prefer making many small, precise updates across pages over one giant monolithic page.
- The Obsidian graph view is your friend for seeing what is connected vs orphaned.

---

**This schema is the difference between a chatbot that sometimes reads your docs and a true long-term collaborator that maintains a growing body of understanding.**

Maintain it with the same care you would give the codebase itself.
