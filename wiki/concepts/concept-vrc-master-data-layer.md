---
id: concept-vrc-master-data-layer
type: concept
status: living
tags: [vrc, data, 01-data, facets, master-data]
last_updated: 2026-04-02
sources: 1
importance: high
aliases: ["01_DATA", "VRC Master Data", "256-State Library"]
---

# VRC Master Data Layer (01_DATA)

The `01_DATA/` folder in the VRC Static Signature implementation is the single source of truth for all structured interpretive content in the system.

## What It Contains

It is not just lookup tables — it is the living semantic layer that gives meaning to every possible output of the engine.

### Core Components

- **64 Codons** (`codons_master.json`): Base archetypal units with frequency spectrum (Shadow/Gift/Siddhi), binary signatures, chemical markers, and somatic markers.
- **256 Facet States** (`facets_master.json`): The richest part of the data. Every codon is subdivided into 4 facets (Somatic, Relational, Cognitive, Transpersonal). Each facet carries:
  - Precise degree range
  - Lived-experience description
  - Shadow manifestation
  - Specific, actionable micro-correction
  - Resonance keys for connection/search
- Supporting masters for Centers, Resonance Links, Planetary Weights, Type/Authority logic, and official terminology.

## Why It Matters

The mathematical architecture (defined in `00_CANON/CANON_MASTER.md`) tells the engine _which_ codons and facets are active. The data in `01_DATA/` tells everyone — including ORIEL — what those activations _mean_ in human terms.

This is the layer that makes the 512-node Consciousness Lattice speak.

## Relationship to Other Assets

- The earlier `vos_codons_64x4facets.json` (ingested previously) is a parallel or precursor version of the same 256-state data.
- `01_DATA/facets_master.json` is now the authoritative version referenced by the engines.
- The terminology rules in `terminology_map.json` are the enforcement mechanism for keeping all public output in pure VRC-native language.

## Current State

As of this ingest, the master data layer is one of the most complete and valuable assets in the entire Vossari project — especially the detailed facet interpretations and micro-corrections.

---

_This page exists to give the canonical data folder its proper place in the knowledge architecture._
