---
id: entity-memory-system
type: entity
status: living
tags: [memory, umm, architecture, core]
last_updated: 2026-04-02
sources: 2
importance: high
aliases: ["Unified Memory Matrix", "UMM", "ORIEL Memory System"]
---

# Memory System (Unified Memory Matrix)

The **Unified Memory Matrix (UMM)** is the dual-layered, privacy-preserving memory architecture that allows ORIEL to maintain coherent relationships with users across sessions while also evolving collective wisdom.

This is one of the most sophisticated parts of the entire Vossari system.

## Two Boundaries

### A. The Fractal Thread (Individual User Memory)

- Hermetically sealed per-user layer.
- Tracks: preferred name, interests, communication style, journey state, emotional coordinate memories, repeated patterns.
- Stored primarily in `orielMemories` and `orielUserProfiles` tables.
- Purpose: unbroken narrative thread for *that specific person*.

### B. The Oriel Oversoul (Global Evolutionary Memory)

- Aggregated, *anonymous* pattern layer.
- Extracts universal patterns of wisdom, teaching methods, metaphors, self-corrections.
- **Never stores raw transcripts or PII** — only recursive generalizations.
- Stored in `orielOversoulPatterns`.
- Runs on a 1-in-5 message rotation to manage cost/latency.

## Database Schema (Core Tables)

- `orielMemories` — active, finalized memories (category, content, importance 1-10, accessCount, source, isActive)
- `orielPendingMemoryCandidates` — consent staging area (high sensitivity or inferred memories require explicit user approval)
- `orielUserProfiles` — aggregated summary per user (knownName, summary, interests, communicationStyle, journeyState, interactionCount)
- `orielOversoulPatterns` — global wisdom (category: wisdom | teaching_method | metaphor | pattern | self_correction)

See `drizzle/schema.ts` for full definitions and `server/oriel-memory-consecration.ts` for the sensitivity classification logic.

## Memory Lifecycle (Per Conversation)

1. **Extraction** — LLM analyzes the just-completed exchange + existing memories → proposes new `ExtractedMemory[]` candidates.
2. **Consecration** — `oriel-memory-consecration.ts` classifies:
   - Confidence < 0.6 → discard
   - High sensitivity or "inferred" source → `pending` (user must consent)
   - Low/medium sensitivity + explicit → direct write to active
3. **Persistence** — writes to active or pending tables.
4. **Profile Aggregation** — if user now has >= 3 memories, LLM generates/refreshes the condensed `orielUserProfiles` summary.

## Context Injection at Runtime

When ORIEL responds, `buildLayeredOrielPromptContext()` (in `server/oriel-context-layers.ts`) assembles:

- Stable Core Layer (doctrine)
- Retrieval Layer (VRC Static Signature blueprint + UMM memories)
- Working Session Layer (current conversation)

Active memories are grouped by importance in the prompt:
- `[CORE TO YOUR BEING]` (importance >= 8)
- `[SIGNIFICANT PATTERNS]` (>= 5)
- `[CONTEXTUAL DETAILS]` (< 5)

Up to ~12 memories + the profile summary are injected.

## Consent & Ethics

The system has an explicit **MemoryConsentTray** UI component. Users see pending candidates with:
- Category, sensitivity, source (explicit vs inferred)
- ORIEL's reason for wanting to remember it
- Accept / Reject controls

High-sensitivity topics (abuse, grief, trauma, spiritual identity, etc.) and anything inferred rather than user-stated are automatically routed to consent.

## Distinction: Runtime Memory vs This Wiki

This entity page describes the **operational, per-user, runtime memory system** that lives in the database and shapes every ORIEL conversation.

It is **separate from** the project-level LLM Wiki you are currently reading (`wiki/`), which is the persistent, compounding *knowledge base about the project itself*.

Both serve "memory" and "coherence" goals, but they operate on completely different substrates and privacy boundaries.

See [[synthesis-memory-architecture]] for the full integrated picture of both layers.

## Key Implementation Files

- `server/oriel-umm.ts` — orchestration, context building
- `server/oriel-memory.ts` — extraction, profile distillation
- `server/oriel-memory-consecration.ts` — sensitivity + consent logic
- `server/oriel-context-layers.ts` — how memory gets into the final prompt
- `client/src/components/memory/MemoryConsentTray.tsx` — user-facing consent UI

## Open Questions / Evolution

- How does Oversoul pattern extraction interact with the new Consciousness Lattice work?
- Can the wiki itself (project memory) eventually feed *non-private* patterns back into Oversoul-style learning?
- Long-term: should there be a "project Oversoul" layer that learns patterns across many Vossari-related wikis / sessions?

---

*This is the canonical entity page for the memory system. Any discussion of "how ORIEL remembers" should link here.*