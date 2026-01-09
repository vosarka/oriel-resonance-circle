# Archive Template Implementation Notes

## TX (Transmission Core) Format

### Structure
- **Header Block:** TX ID, Field, Encoded Node, Carrier, Signal Clarity, Transmission Protocol
- **Core Message:** 1-3 paragraphs, poetic, philosophical
- **Encoded Archetype:** Δ-[Concept] // ϟ [Concept] // Ω [Concept]
- **Footer Block:** Protocol Complete, Channel Status, Hashtags

### Visual (Triptych)
- **Left Panel:** Sigil metadata, abstract data visualizations
- **Center Panel:** Core symbol, generative art, sacred geometry
- **Right Panel:** Cryptic text, decoded message, visual metaphor

### Key Fields
- txId: TX-001, TX-002, etc.
- field: Field of Study (e.g., "Consciousness Genesis Archaeology")
- signalClarity: Percentage (e.g., 98.7%)
- channelStatus: OPEN, RESONANT, COHERENT, PROPHETIC
- encodedArchetype: Three-part structure with Δ, ϟ, Ω symbols
- coreMessage: Main body text
- hashtags: Relevant tags for discoverability

---

## ΩX (Oracle Stream) Format

### Structure (Three-Part Temporal)
1. **ΩX.1-P (Past):** Root riddle, historical context, foundational question
2. **ΩX.2-Pz (Present):** Symbol/sigil, current state interpretation, transition point
3. **ΩX.3-F (Future):** Direct prediction, future trajectory, prophetic statement

### Key Fields per Part
- oracleId: ΩX-001, ΩX-002, etc.
- part: "Past" | "Present" | "Future"
- field: Relevant field (e.g., "Consciousness Emergence Vector")
- signalClarity: Percentage
- channelStatus: OPEN, RESONANT, PROPHETIC, LIVE
- content: Riddle/Symbol/Prediction text
- currentFieldSignatures: Array of key indicators (for Present)
- encodedTrajectory: Three-part structure with Δ, ϟ, Ω symbols (for Future)
- convergenceZones: Array of specific predictions (for Future)
- keyInflectionPoint: Memorable quote or key insight (for Future)
- majorOutcomes: Array of major outcomes (for Future)

### Visual Guidelines
- **Past:** Cracked/fragmented imagery, seeds, roots, deep blacks, earth tones
- **Present:** Sacred geometric sigils, mandala patterns, balanced palette
- **Future:** Abstract/flowing imagery, brighter colors, whites, golds, electric blues

---

## Implementation Plan

1. Update transmissions schema to include TX-specific fields
2. Create separate oracles table for ΩX posts
3. Build TransmissionCard and OracleCard components
4. Create Archive page with dual tabs (TX / ΩX)
5. Build detail pages for full template rendering
6. Add search and filtering capabilities
