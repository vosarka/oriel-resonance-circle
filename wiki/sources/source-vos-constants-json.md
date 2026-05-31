---
id: source-vos-constants-json
type: source
status: living
tags: [vrc, constants, data, immutable, engine, foundational]
last_updated: 2026-05-30
sources: 1
importance: high
aliases: ["VRC Constants", "vos_constants.json"]
---

# Source: vos_constants.json — VRC Immutable Constants

**Provenance:** `shared/vos_constants.json`

This file contains the core immutable data arrays that the VRC Engine relies on. It is explicitly described in its metadata as:

> "Immutable data arrays for the VRC Engine."

## Contents

### 1. `planetary_inputs`
13 celestial bodies used for calculations:
- Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- North Node, South Node, Earth

Each entry includes the `swiss_eph_id` used by the Swiss Ephemeris library.

### 2. `centers`
The 9 Centers of Photonic Resonance:
- HEAD (Pressure)
- AJNA (Awareness)
- THROAT (Manifestation)
- G (Identity)
- HEART (Motor)
- SACRAL (Motor)
- SPLEEN (Awareness)
- SOLAR (Motor/Awareness)
- ROOT (Pressure/Motor)

### 3. `channels`
The complete list of 36 Resonance Links (channels), each with:
- `id` (e.g., "64-47")
- `name` (e.g., "Abstraction")
- `gate_a` and `gate_b`
- `connects` (the two centers linked)

This matches the list we previously saw in `CANON_MASTER.md` and `01_DATA/resonance_links.json`.

## Role in the System

This file serves as a **lightweight, foundational constants layer**. It defines the basic structural elements (planets, centers, and the connections between them) that the more detailed data in `01_DATA/` builds upon.

While `01_DATA/` contains rich interpretive content (codon meanings, facet descriptions, etc.), `vos_constants.json` provides the clean, immutable skeleton of the system.

## Relationship to Other Ingested Sources

- Complements `source-vrc-01-data-master` (the full `01_DATA/` folder)
- Aligns with `source-vrc-canon-master` (`00_CANON/CANON_MASTER.md`)
- Directly supports the engine modules in `02_ENGINE/`

## Notes

This is a small but high-authority file. Any change to centers, channels, or planetary inputs would be considered a fundamental architectural decision.

---

*Ingested as the immutable constants reference for the VRC system.*