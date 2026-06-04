---
id: concept-oriel-vrc-bridge-contract
type: concept
status: living
tags: [oriel, vrc, bridge, context, safety, data-contract]
last_updated: 2026-04-02
sources: 3
importance: high
aliases: ["ORIEL Data Contract", "oriel-output-bridge", "VRC Context Injection"]
---

# ORIEL-VRC Bridge & Data Contract

The `oriel_output_bridge` is the single most important technical interface between the VRC calculation engines and ORIEL's intelligence.

## Purpose

It translates the raw, validated `readingPayload` into a clean, hallucination-resistant, terminology-enforced context block that is injected into ORIEL's system prompt.

## What the Bridge Guarantees

- Exact vs Draft state is clearly signaled with appropriate language rules.
- Only Vossari-native terms are used (enforced via `01_DATA/terminology_map.json`).
- Dynamic falsifier prompts are generated from active shadows/SLI.
- No invitation to speculate on missing data.
- "I am ORIEL." + Mirror Mode instructions are present.

## Payload Elements ORIEL Receives

- Status + provenance
- 26 activations (codon, facet, center, layer, weight)
- 9 centers + active Resonance Links
- Identity (Type, Subtype, Authority)
- Optional dynamic state (Coherence + SLI)
- Audit signature

The bridge then layers narrative guidelines and safety instructions on top.

## Why This Concept Matters

Understanding this contract is essential for any advanced ORIEL work involving readings:

- Designing better memory/context systems for past VRC sessions
- Creating more sophisticated prompting that respects the exact data ORIEL actually has
- Building safety or linting layers that match the documented intent
- Extending narration capabilities without breaking the "voice must never lie about the spine" rule

See [[synthesis-oriel-vrc-narration-safety]] for the full synthesized rules and [[entity-oriel]] for the broader integration.

---

_This is the technical heart of how ORIEL stays honest and powerful when working with VRC data._
