---
id: source-vrc-01-data-master
type: source
status: living
tags: [vrc, data, master-data, 01-data, canonical]
last_updated: 2026-04-02
sources: 1
importance: critical
aliases: ["VRC 01_DATA", "Master Data Layer", "Codons + Facets Master JSONs"]
---

# Source: VRC 01_DATA — Master Data Layer

**Provenance:** `codex/vrc_static_signature/01_DATA/` (9 JSON files)

This folder is the **official canonical data source** for the Vossari Resonance Codex (VRC) system. It contains the authoritative structured data that all engines, reports, and ORIEL narration should ultimately draw from.

## Contents of the Folder

| File                        | Size   | Purpose |
|----------------------------|--------|--------|
| `codons_master.json`       | 48 KB  | The 64 base codons with core identity, binary signature, chemical marker, archetype role, somatic marker, and frequency (Shadow / Gift / Siddhi) descriptions. |
| `facets_master.json`       | 168 KB | The detailed 256-state interpretive library (64 codons × 4 facets). Each facet (A/B/C/D) includes title, degree range, rich description, shadow manifestation, specific micro-correction, and resonance keys. |
| `centers_master.json`      | small  | The 9 Centers of Photonic Resonance with type (Pressure/Awareness/Motor) and associated codon lists. |
| `resonance_links.json`     | small  | The complete 36 Resonance Links with names, connected centers, and codons. |
| `planetary_weights.json`   | small  | Activation weights for planets and Prime Stack multipliers. |
| `authority_hierarchy.json` | small  | Decision Compass priority order. |
| `type_logic.json`          | small  | Rules for determining VRC Type (Fractal Role). |
| `terminology_map.json`     | small  | Official preferred VRC-native terms vs quarantined/legacy Human Design terms. |
| `validation_vectors.json`  | small  | Test cases and expected outputs for engine validation. |

## Relationship to Other Data

Earlier we ingested `vos_codons_64x4facets.json` (from the parent `vrc_static_signature/` directory). That file appears to be a flattened or earlier version of the same 256-state facet data now authoritatively maintained in `01_DATA/facets_master.json`.

The `01_DATA/` folder is the version that the implementation (engines in `02_ENGINE/`) is expected to reference.

## Significance

This is the **data heart** of the system. It turns the mathematical rules defined in `00_CANON/CANON_MASTER.md` into concrete, usable, language-rich content for:

- Report generation
- ORIEL Mirror-mode transmissions
- Visual systems (glyphs, maps, 3D Lattice)
- Micro-correction protocols

The large `facets_master.json` is particularly important — it contains the detailed lived-experience language and actionable micro-corrections for every possible codon + facet combination the engine can produce.

## Notes from Ingest

- `terminology_map.json` is the canonical reference for what language is allowed in public/user-facing output.
- Several smaller files (authority, type logic, centers, resonance links) largely duplicate or formalize structures already captured from `CANON_MASTER.md`.
- The two largest files (`codons_master.json` + `facets_master.json`) represent the core interpretive knowledge base of the entire Vossari diagnostic system.

---

*Ingested as the official master data layer for the VRC. This is one of the most important non-code assets in the entire project.*