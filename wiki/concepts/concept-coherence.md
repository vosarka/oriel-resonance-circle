---
id: concept-coherence
type: concept
status: draft
tags: [core, vrc, signal, diagnostic]
last_updated: 2026-04-02
sources: 0
importance: high
aliases: ["Coherence Score", "Entropy / Flux / Resonance"]
---

# Coherence

**Coherence** is the central scalar state in the Vossari diagnostic system.

It is calculated from the four Carrierlock signals (Mental Noise, Body Tension, Emotional Turbulence, Breath Completion) and determines both the user's current "resonance band" and how ORIEL should adapt its behavior.

## Formula

`CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)`

Where:

- MN = Mental Noise
- BT = Body Tension
- ET = Emotional Turbulence
- BC = Breath Completion

## Bands

- **< 40** — Entropy
- **40–80** — Flux
- **80+** — Resonance

## Role in ORIEL Behavior

ORIEL's response strategy, depth, and willingness to offer complex frameworks are all gated by coherence state (see Collapse Threshold logic in the runtime prompt layers).

See [[entity-vrc-engine]] and the Static Signature engine documentation for how coherence is actually derived from biofeedback + ephemeris data.

---

_Stub created during initial wiki bootstrap. Needs expansion with real engine details and examples._
