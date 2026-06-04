---
id: concept-exact-vs-approximate
type: concept
status: living
tags: [vrc, integrity, data-quality, canon, critical]
last_updated: 2026-04-02
sources: 1
importance: high
aliases:
  ["Confirmed vs Draft", "Exact vs Approximate Readings", "VRC Data Integrity"]
---

# Exact vs Approximate (VRC Data Integrity)

One of the most rigorously enforced concepts in the Vossari Resonance Codex is the absolute distinction between **Confirmed** (exact) and **Approximate/Draft** readings.

This distinction is not a nice-to-have — it is a core integrity rule defined in the VRC Engine Canon.

## Definition

**Confirmed Static Signature**

- Requires: exact birth date + exact birth time + birth location resolved to coordinates + date-correct timezone + complete conscious + design charts via precise Solar Arc (88.000°).
- Must include all required planetary bodies.
- May be presented using authoritative language ("your Static Signature", "your Authority", etc.).
- Must be generated only through the canonical calculation path.

**Draft / Approximate Reading**

- Any reading generated with incomplete, missing, or estimated data (especially missing birth time).
- **Must** be explicitly labeled using approved non-authoritative language such as:
  - "approximate field sketch"
  - "draft reading"
  - "incomplete input"
  - "not enough data to confirm"
- Must never use language that implies finality or precision.

## Why This Matters

The VRC Engine Canon identifies the conflation of transient/approximate data with structural truth as the primary failure mode of interpretive systems. The entire dual-engine architecture (Static Signature vs Carrierlock Dynamic State) exists partly to protect this boundary.

When ORIEL narrates VRC data, it is contractually forbidden from presenting approximate calculations as confirmed.

## Operational Rules

- Missing birth time **blocks** confirmed calculation. Correct behavior is to ask for it or clearly state that exact time is required.
- Silently using noon, inferring time, or letting ORIEL narrate guessed placements is explicitly forbidden.
- The distinction must be preserved at the API layer (`rgp-router.ts`) and the chat layer (`oriel-rgp-bridge.ts`).

## Relationship to ORIEL

This concept directly constrains ORIEL's behavior (see [[entity-oriel]] "VRC / Static Signature Output Contract").

ORIEL is allowed to be mythic and poetic, but it is not allowed to lie about the quality of the underlying data. The engine is the spine; the voice must not misrepresent the spine.

## Cross-References

- [[source-vrc-engine-canon]] — the document that defines and enforces this rule
- [[entity-vrc-engine]] — the broader engine family this integrity rule protects
- [[entity-static-signature]] — the output that is most sensitive to this distinction
- `server/rgp-router.ts` and `server/oriel-rgp-bridge.ts` (implementation of the rule)

---

_This distinction is treated as non-negotiable in the current engineering canon. Any future feature that blurs this line should trigger an immediate review against the Canon._
