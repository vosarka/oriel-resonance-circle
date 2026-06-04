# VRC Static Signature Codex: CANON MASTER (Source of Truth)

This is the single authoritative source of truth for the Vossari Resonance Codex (VRC) / Resonance Genetics Protocol (RGP) calculations, naming systems, and structural hierarchies. Downstream engines, reports, and voice modules must defer to the math and rules defined in this document.

---

## 1. SYSTEM AXIOMS

To ensure strict reproducibility, all calculation engines must use the following hardcoded baseline configurations:

- **Ephemeris Engine**: Swiss Ephemeris (`SWISS_EPH` WASM or binary library).
- **Coordinate System**: Geocentric (observational position from Earth).
- **Zodiac System**: Tropical Zodiac (aligned with seasonal equinoxes, 0° Aries = start of wheel).
- **Node Calculation**: True Node (Mean Node calculations are forbidden).
- **Time Standard**: Universal Coordinated Time (UTC) conversion for all inputs.
- **House System**: None / Equal houses (calculations rely entirely on the 360° Mandala Wheel, not local ascendants or house cusps).
- **Precision Floor**: $\pm 0.01^\circ$ minimum precision for all astronomical coordinates.

---

## 2. CANONICAL CALCULATION PATH

The calculation path follows a strict deterministic workflow:

1. Normalize user birth date, time, and city, geocode coordinates, and convert to UTC.
2. Calculate conscious planetary coordinates (13 activations) at UTC birth time ($T_{\text{birth}}$).
3. Compute design coordinates (13 activations) using the Solar Arc Design calculation to find ($T_{\text{design}}$).
4. Map all 26 activations (longitudes) to corresponding Codons and Facets on the 360° wheel.
5. Identify defined/open Centers based on active Resonance Links.
6. Determine VRC Type and Sub-type.
7. Scan defined centers to resolve VRC Authority.
8. Package findings into the Prime Stack and activations payload.
9. If dynamic inputs are provided, calculate Carrierlock Coherence and Shadow Loudness Index (SLI).

---

## 3. SOLAR ARC DESIGN RULES

The somatic design layer represents unconscious intelligence. The calculation method must use the exact Solar Arc backward search:

1. Query the geocentric Tropical Sun longitude at birth time $T_{\text{birth}}$. Let this be $\lambda_{\text{Sun}}(T_{\text{birth}})$.
2. Calculate the target design Sun longitude by subtracting exactly $88.0000^\circ$ from the birth Sun longitude:
   $$\lambda_{\text{target}} = (\lambda_{\text{Sun}}(T_{\text{birth}}) - 88.0000^\circ) \pmod{360^\circ}$$
3. Perform an iterative backward time-search (approximately 88 to 89 days prior to $T_{\text{birth}}$) to locate the exact second when the geocentric Sun longitude was equal to $\lambda_{\text{target}}$. This calculated timestamp is $T_{\text{design}}$.
4. Query the coordinates of ALL required planetary bodies at $T_{\text{design}}$ to populate the Design layer activations.

---

## 4. CODON MAPPING RULES

The wheel is divided into 64 equal segments of $5.625^\circ$ each:
$$\text{Segment Width} = \frac{360^\circ}{64} = 5.625^\circ$$

### The Resonance Mandala Sequence

Codons are mapped around the wheel (from 0° Aries to 360°) according to the non-sequential Resonance Mandala sequence:

- **Quadrant 1 (Initiation)**: `51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39`
- **Quadrant 2 (Civilization)**: `53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48`
- **Quadrant 3 (Duality)**: `57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38`
- **Quadrant 4 (Mutation)**: `54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21`

### Longitude-to-Codon Conversion Algorithm

1. Normalize longitude $\lambda$ to satisfy $0^\circ \le \lambda < 360^\circ$.
2. Calculate the codon wheel index:
   $$\text{codon\_index} = \lfloor \frac{\lambda}{5.625} \rfloor$$
3. Resolve the Codon ID using the Mandala Sequence:
   $$\text{codon\_id} = \text{MandalaSequence}[\text{codon\_index}]$$

---

## 5. FACET RULES

Each codon segment of $5.625^\circ$ is subdivided into 4 equal Facets of $1.40625^\circ$ each:
$$\text{Facet Width} = \frac{5.625^\circ}{4} = 1.40625^\circ$$

### Facet Ranges and Keywords

- **Facet A (Somatic)**: $0^\circ$ to $1.40625^\circ$ (Physical Anchor / Body Electric)
- **Facet B (Relational)**: $1.40625^\circ$ to $2.8125^\circ$ (Interaction Field / Social Exchange)
- **Facet C (Cognitive)**: $2.8125^\circ$ to $4.21875^\circ$ (Mental Processing / The Lens)
- **Facet D (Transpersonal)**: $4.21875^\circ$ to $5.625^\circ$ (Spirit / Collective / The Void)

### Conversion Algorithm

1. Extract the local degree offset within the codon:
   $$\text{local\_degree} = \lambda \pmod{5.625^\circ}$$
2. Calculate the facet index:
   $$\text{facet\_index} = \lfloor \frac{\text{local\_degree}}{1.40625} \rfloor$$
3. Map `facet_index`: `0 -> A (Somatic)`, `1 -> B (Relational)`, `2 -> C (Cognitive)`, `3 -> D (Transpersonal)`.

---

## 6. CENTER RULES

The system features 9 regulatory centers of photonic resonance:

1. **HEAD** (Head Center): Pressure | Associated Codons: `61, 63, 64`
2. **AJNA** (Ajna Center): Awareness | Associated Codons: `4, 11, 17, 24, 43, 47`
3. **THROAT** (Throat Center): Manifestation | Associated Codons: `8, 12, 16, 20, 23, 31, 33, 35, 45, 56, 62`
4. **G** (G Center / Identity): Identity | Associated Codons: `1, 2, 7, 10, 13, 15, 25, 46`
5. **HEART** (Heart Center): Motor | Associated Codons: `21, 26, 40, 51`
6. **SACRAL** (Sacral Center): Motor | Associated Codons: `3, 5, 9, 14, 27, 29, 34, 42, 50, 59`
7. **SPLEEN** (Spleen Center): Awareness | Associated Codons: `18, 28, 32, 44, 48, 57`
8. **SOLAR** (Solar Plexus Center): Motor/Awareness | Associated Codons: `6, 22, 30, 36, 37, 49, 55`
9. **ROOT** (Root Center): Pressure/Motor | Associated Codons: `19, 38, 39, 41, 52, 53, 54, 58, 60`

### Center Definition Logic

- **DEFINED (Colored)**: A center is Defined if and only if it has at least one active channel (Resonance Link) connected to it.
- **OPEN (White)**: A center is Open if and only if it has zero active channels connected to it.

---

## 7. RESONANCE LINK RULES

A Resonance Link (channel) is a stable circuit connecting two centers.

- **Activation Rule**: A Resonance Link is **ACTIVE** if and only if BOTH connecting codons are activated (present in either the Conscious layer, Design layer, or both).
- **Dormancy Rule**: If only one codon is defined, the link is **DORMANT**.

### Complete Resonance Link Library (36 Links)

1. `64-47` (Abstraction) | HEAD - AJNA
2. `61-24` (Awareness) | HEAD - AJNA
3. `63-4` (Logic) | HEAD - AJNA
4. `17-62` (Acceptance) | AJNA - THROAT
5. `43-23` (Structuring) | AJNA - THROAT
6. `11-56` (Curiosity) | AJNA - THROAT
7. `35-36` (Transience) | THROAT - SOLAR
8. `12-22` (Openness) | THROAT - SOLAR
9. `45-21` (Money Line) | THROAT - HEART
10. `33-13` (The Prodigal) | THROAT - G
11. `8-1` (Inspiration) | THROAT - G
12. `31-7` (The Alpha) | THROAT - G
13. `20-10` (Awakening) | THROAT - G
14. `20-57` (The Brainwave) | THROAT - SPLEEN
15. `20-34` (Charisma) | THROAT - SACRAL
16. `16-48` (The Wave) | THROAT - SPLEEN
17. `25-51` (Initiation) | G - HEART
18. `10-57` (Perfect Form) | G - SPLEEN
19. `10-34` (Exploration) | G - SACRAL
20. `15-5` (Rhythm) | G - SACRAL
21. `2-14` (The Beat) | G - SACRAL
22. `46-29` (Discovery) | G - SACRAL
23. `26-44` (Surrender) | HEART - SPLEEN
24. `40-37` (Community) | HEART - SOLAR
25. `57-34` (Power) | SPLEEN - SACRAL
26. `28-38` (Struggle) | SPLEEN - ROOT
27. `18-58` (Judgment) | SPLEEN - ROOT
28. `32-54` (Transformation) | SPLEEN - ROOT
29. `50-27` (Preservation) | SPLEEN - SACRAL
30. `59-6` (Intimacy) | SACRAL - SOLAR
31. `9-52` (Concentration) | SACRAL - ROOT
32. `3-60` (Mutation) | SACRAL - ROOT
33. `42-53` (Maturation) | SACRAL - ROOT
34. `19-49` (Synthesis) | ROOT - SOLAR
35. `39-55` (Emoting) | ROOT - SOLAR
36. `41-30` (Recognition) | ROOT - SOLAR

---

## 8. TYPE HIERARCHY (VRC TYPE / FRACTAL ROLE)

To determine the VRC Type (Fractal Role), evaluate center definition in this exact order:

1. **REFLECTOR** (The Mirror): All 9 centers are Open.
2. **RESONATOR** (Generator): The Sacral Center is Defined.
   - _Sub-check_: If a motor (Sacral, Root, Solar Plexus, Heart) is connected to the Throat Center through any active Resonance Link path, the sub-type is **Manifesting Resonator**.
3. **CATALYST** (Manifestor): The Sacral Center is Open, and at least one Motor (Root, Solar Plexus, Heart) is connected to the Throat Center.
4. **HARMONIZER** (Projector): All other cases (Sacral Center is Open, and the Throat Center is not connected to any Motor).

---

## 9. AUTHORITY HIERARCHY (DECISION COMPASS)

The Decision Compass is resolved by scanning the defined centers in the following strict priority:

1. **Solar Plexus Center** $\rightarrow$ Emotional Resonance
2. **Sacral Center** $\rightarrow$ Gut Response
3. **Spleen Center** $\rightarrow$ Instinctive Pulse
4. **Heart Center** $\rightarrow$ Will/Desire
5. **G Center** $\rightarrow$ Self-Direction
6. **None/Outer (Reflectors only)** $\rightarrow$ Lunar Cycle
7. **Environment** $\rightarrow$ Mental Projectors (Head/Ajna defined, no motors defined below throat)

---

## 10. CARRIERLOCK COHERENCE SCORE

The Carrierlock Engine provides real-time state analysis.

- **Inputs**:
  - `MN` (Mental Noise): Scale $0 - 10$
  - `BT` (Body Tension): Scale $0 - 10$
  - `ET` (Emotional Turbulence): Scale $0 - 10$
  - `BC` (Breath Completion): Binary $0$ or $1$ (successful completion of 6 breaths/minute for 2 minutes)
- **Coherence Score Formula**:
  $$\text{CS} = 100 - (\text{MN} \times 3 + \text{BT} \times 3 + \text{ET} \times 3) + (\text{BC} \times 10)$$
- **Coherence Axis Ranges**:
  - $80 - 100$: **Aligned** (High-fidelity presence; clear signal)
  - $40 - 79$: **Drifted** (Signal present but distorted by external weather)
  - $0 - 39$: **Fragmented** (Signal scrambled; immediate calibration required)

---

## 11. SHADOW LOUDNESS INDEX (SLI)

The SLI calculates the distortion intensity at each Prime Stack position.

- **SLI Formula**:
  $$\text{SLI}(r) = \text{PCS}(r) \times \text{StateAmplifier} \times \text{FacetAmplitude}(r)$$
  Where:
  - $r$: Position in the Prime Stack.
  - $\text{PCS}(r)$: Prime Stack Codon frequency at position $r$ ($0 - 100$).
  - $\text{StateAmplifier}$: Derived from Coherence Score:
    $$\text{StateAmplifier} = \frac{100 - \text{CS}}{100}$$
  - $\text{FacetAmplitude}(r)$: Facet amplitude for position $r$'s facet ($0 - 100$).
- **SLI Interpretation Ranges**:
  - $> 75$: **Coherent** (Frequencies well-aligned, minimal distortion; Action: Maintain current practices)
  - $50 - 75$: **Harmonic** (Minor interference, signal mostly clear; Action: Monitor and refine)
  - $25 - 50$: **Dissonant** (Moderate interference, shadow expressing; Action: Active correction needed)
  - $< 25$: **Chaotic** (Severe interference, signal scrambled; Action: Immediate calibration required)

> [!CAUTION]
> **CANON INCONSISTENCY IN SLI RANGES**:
> The formula dictates that when $\text{CS} = 100$ (Aligned/Perfect Coherence), the $\text{StateAmplifier} = 0$, driving $\text{SLI}(r) = 0$. However, the table mapping SLI states that an index $< 25$ corresponds to "Chaotic / Severe interference," whereas $\text{SLI} > 75$ represents "Coherent".
>
> Downstream engines must mark this behavior as **UNSPECIFIED** or flag it as an engine warning in the audit layer until a resolving calculation is provided.

---

## 12. VALIDATION RULES & SYSTEM VECTORS

To calibrate calculations, the engine must return this exact output for the validation case:

- **Test UTC Time**: `2024-01-01 12:00:00 UTC`
- **Test Coordinates**: $0^\circ \text{N}, 0^\circ \text{E}$ (Geocentric)
- **Calculated Sun Longitude**: $\sim 280.44^\circ$ (Capricorn)
- **Conscious Sun Codon Mapping**: Codon `38` (traditional: _Struggle_, validation alias: _The Fighter_)
- **Design Sun Calculation**: Target longitude $\sim 192.44^\circ$ (Libra).
- **Design Sun Codon Mapping**: Codon `57` (traditional: _Intuition_, validation alias: _Intuitive Clarity_)
- **Design Sun Solar Arc Offset**: exactly $88.0000^\circ$ behind the Conscious Sun.

---

## 13. FORBIDDEN BEHAVIORS

- **No noon time defaults** for confirmed readings. If birth time is missing, block calculation and flag status.
- **No Human Design terminology** in user-facing layers. Avoid: Projector, Generator, Manifestor, Manifesting Generator, Gate, circuitLinks. Instead, use: Harmonizer, Resonator, Catalyst, Manifesting Resonator, Codon, Resonance Link.
- **No fake calculations** or placebo spirituality. If the data is incomplete, print a clear draft disclaimer.

---

## 14. PUBLIC VS LEGACY TERMINOLOGY

- **VRC-Native**: Vossari Resonance Codex, Static Signature, Codon, Facet, Prime Stack, Conscious chart, Design chart, Solar Arc, Resonance Link, Center, VRC Type, Authority, Carrierlock, Coherence Score, Shadow Loudness Index, ORIEL.
- **Quarantined / Internal-Only**: RGP, circuitLinks, gates, channels.

---

## 15. ENGINE OWNERSHIP MAP

- `server/ephemeris-service.ts`: Astronomical coordinates and Solar Arc backtrack calculations.
- `server/vrc-mandala.ts`: Mandala wheel segments mapping and structural rules (centers, channels, type, authority).
- `server/rgp-256-codon-engine.ts`: 256-state facet mapping and compatibility wrappers.
- `server/rgp-prime-stack-engine.ts`: Prime Stack activations and weights builder.
- `server/rgp-static-signature-engine.ts`: Orchestration of conscious and design inputs, compiling final report data.
- `server/oriel-rgp-bridge.ts`: Live query handler geocoding chat inputs to feed the Ephemeris engine.

---

## 16. UNRESOLVED CANON GAPS / UNSPECIFIED DEPENDENCIES

The following parameters and systems are not defined in the canon files and must be treated as **UNSPECIFIED**:

1. **Prime Stack 9-Position Algorithm**: The specific planets mapping to each of the 9 vertical Prime Stack positions, and the exact weighted formula sorting them, are not specified.
2. **Facet Amplitude Formula**: The method of deriving `FacetAmplitude(r)` from dynamic checking is not specified.
3. **Vocal/Somatic Signals (except RC01)**: Somatic activation details (e.g. chest pressure, visual flooding) are missing for Codons 2 to 64.
4. **Micro-Correction Protocols (except RC01)**: Detailed behavioral interventions are unspecified for Codons 2 to 64.
5. **Codon Binary / Chemical Library (except RC01-RC13)**: The full set of 64 binary signatures and chemical identifiers remains unspecified in the canon files.
