# Vossari Wiki — Human Guide

This is **your** (and the LLM's) living knowledge base for the Oriel Resonance Circle project.

It sits between the raw scattered documents and your questions. The LLM writes and maintains it. You steer.

## Quick Start (Obsidian)

1. Open this entire repo folder in Obsidian (or just the `wiki/` folder).
2. Recommended plugins (all free):
   - Dataview (for dynamic queries over frontmatter)
   - Graph View enhancements (optional but beautiful)
   - Marp (if you want the LLM to generate slide decks from wiki content)
3. In Obsidian Settings → Files & Links, consider setting a default attachment folder inside `wiki/assets/` if you start clipping images.
4. Use the Graph View frequently — it is the best way to _see_ the shape of the project's understanding.

## Daily / Session Workflow

**When you want the LLM to do knowledge work:**

1. Open Obsidian on the left, the LLM chat on the right.
2. Tell the LLM something like:
   - "Ingest the new ORIEL prompt doc I just pasted. Follow the wiki SCHEMA."
   - "Read the wiki and give me a comparison of the three different memory architectures we've had."
   - "Do a light lint pass on the wiki and tell me the biggest gaps or contradictions you see."
3. Watch the files change in real time in Obsidian as the LLM works.
4. Browse the graph, follow links, leave comments in files (the LLM will see them on next pass).

**You never have to manually edit wiki pages** (though you can). The LLM does the heavy lifting.

## What Goes in the Wiki vs Elsewhere

| Thing                                 | Location                                      | Why                                         |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| Project knowledge synthesis           | `wiki/`                                       | This is its home                            |
| Code style, build commands            | `AGENTS.md` (root)                            | Engineering agents need it fast             |
| Active launch contract + current TODO | `VOSSARI_ACTIVE_HANDOFF.md`                   | Short-term session memory                   |
| Detailed VRC engine specs             | `codex/vrc_static_signature/`                 | Working design authority for that subsystem |
| Runtime user memories                 | Database (orielMemories etc.)                 | Per-user, private, operational              |
| Raw source documents                  | Wherever you keep them (or `wiki/raw/` later) | Immutable truth                             |

The wiki's job is to **synthesize across** all of the above.

## The Three Magic Operations

1. **Ingest** — Drop a new source (article, design doc, long transcript, research note) and say "process this into the wiki".
2. **Query + File Back** — Ask a hard question. When the answer is good, tell the LLM "file this as [[synthesis-xxx]]".
3. **Lint** — Periodically: "Run a wiki health check. Find contradictions, orphans, and missing pages."

## Tips

- The `log.md` file is parseable. In terminal: `grep "^## \[" wiki/log.md | tail -8`
- Frontmatter on every page enables future Dataview power (tables of all entities with `importance: high`, etc.).
- This entire wiki is just a git repo of markdown. Branch it, diff it, blame it.
- Images: Download them locally (Obsidian hotkey) so the LLM can "see" them when needed.

## Relationship to "Your Memory"

This wiki _is_ the implementation of the LLM Wiki pattern for this project. It is explicitly designed to be the persistent, compounding memory that survives between sessions and between different LLM agents.

When a new agent (Claude, Gemini, future Grok, etc.) starts working on Vossari, the fastest way to bring it to high competence is:

1. Point it at `wiki/SCHEMA.md`
2. Tell it to read `wiki/index.md`
3. Let it explore from there

This is dramatically more effective than pasting 15 scattered docs.

---

Maintained by LLMs. Curated by you. The knowledge compounds.
