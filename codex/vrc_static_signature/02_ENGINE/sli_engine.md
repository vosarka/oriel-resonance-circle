# Engine Specification: sli-engine

## 1. PURPOSE
The `sli-engine` (Shadow Loudness Index Engine) computes the active distortion levels across the Prime Stack positions. It evaluates how much the subject's current dynamic state (weather) is interfering with their structural potentials (hardware).

---

## 2. INPUTS
- `coherenceScore`: Float ($[0.0, 100.0]$) from the `carrierlock-engine`.
- `primeStackPositions`: List of 9 stack nodes, each containing:
  - `positionIndex`: Integer ($0$ to $8$)
  - `codonId`: String (`RC01` to `RC64`)
  - `facetLabel`: String (`Somatic`, `Relational`, `Cognitive`, `Transpersonal`)
- `facetAmplitudes`: Dictionary mapping Facet Labels to amplitudes ($0.0 - 100.0$):
  - `Somatic`: Float
  - `Relational`: Float
  - `Cognitive`: Float
  - `Transpersonal`: Float
- `pcsFrequencies`: Dictionary mapping Position Index to baseline codon frequency ($0.0 - 100.0$, **UNSPECIFIED** in canon).

---

## 3. OUTPUTS
- `sliScores`: List of 9 objects containing:
  - `positionIndex`: Integer
  - `sliValue`: Float ($0.0 - 100.0$, or **UNSPECIFIED** if inputs are missing)
  - `patternState`: String (`Coherent`, `Harmonic`, `Dissonant`, `Chaotic`)
  - `actionRequired`: String

---

## 4. DEPENDENCIES
- `/01_DATA/planetary_weights.json` (for weights/multipliers).

---

## 5. OWNERSHIP
- File: `server/rgp-sli-micro-correction-engine.ts`

---

## 6. FAIL CONDITIONS
- **Missing Coherence Score**: CS is null or out of bounds.
- **Missing Facet Amplitudes**: Amplitude mapping is incomplete.

---

## 7. VALIDATION RULES
1. **Formula Application**:
   $$\text{StateAmplifier} = \frac{100 - \text{CS}}{100}$$
   $$\text{SLI}(r) = \text{PCS}(r) \times \text{StateAmplifier} \times \text{FacetAmplitude}(r)$$
2. **Ranges Mapping**:
   - $\text{SLI} > 75 \rightarrow$ `Coherent` (Frequencies aligned, minimal distortion)
   - $50 \le \text{SLI} \le 75 \rightarrow$ `Harmonic` (Minor interference, mostly clear)
   - $25 \le \text{SLI} < 50 \rightarrow$ `Dissonant` (Moderate interference, active correction needed)
   - $\text{SLI} < 25 \rightarrow$ `Chaotic` (Severe interference, immediate calibration required)

> [!WARNING]
> **UNRESOLVED CANON GAPS**:
> 1. **PCS(r) Derivation**: The baseline frequency $\text{PCS}(r)$ is not defined in the canon files. Until defined, default $\text{PCS}(r) = 100.0$ and flag as **UNSPECIFIED**.
> 2. **FacetAmplitude(r) Derivation**: The derivation of `FacetAmplitude(r)` is not defined. Default to $100.0$ and flag as **UNSPECIFIED**.
> 3. **Mathematical Paradox**: $\text{CS} = 100 \rightarrow \text{StateAmplifier} = 0 \rightarrow \text{SLI} = 0$. In the range mapping, $0$ falls under `Chaotic` ($< 25$), which contradicts the definition of perfect coherence. The engine must intercept $\text{CS} = 100$ and override pattern output to `Coherent` with a custom diagnostic flag.

---

## 8. TEST STRATEGY
- **Perfect Coherence Test**: Pass $\text{CS} = 100.0$. Verify that the engine intercepts and returns `Coherent` instead of `Chaotic` (reconciling the range paradox).
- **Calculated Distortion Test**: Pass $\text{CS} = 50.0$, $\text{PCS}(r) = 100.0$, $\text{FacetAmplitude}(r) = 80.0$.
  - $\text{StateAmplifier} = 0.5$
  - $\text{SLI} = 100.0 \times 0.5 \times 80.0 = 4000$ (Wait! If $\text{PCS}$ is $0-100$ and $\text{FacetAmplitude}$ is $0-100$, then $\text{SLI}$ can range up to $10,000$. This indicates a scaling mismatch in the canon formula! The engine must divide by $100$ to scale $\text{SLI}$ back to a $0-100$ range, marking this division as an **UNSPECIFIED** adaptation).
  - Normalized $\text{SLI} = 100 \times 0.5 \times 0.8 = 40.0 \rightarrow$ assert `Dissonant`.
