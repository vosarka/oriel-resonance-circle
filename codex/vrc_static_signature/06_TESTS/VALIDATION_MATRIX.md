# Validation Matrix & QA Test Suite

This document defines the mathematical test suite, timezone edge scenarios, and engine verification rules.

---

## 1. PRIMARY SYSTEM TEST CASE (CALIBRATION VECTOR)
This is the baseline test vector. Any modification to the Swiss Ephemeris bindings, timezone offset conversions, or Mandala index mappings must pass this case before release.

### Inputs
- **Date**: `2024-01-01`
- **Time**: `12:00:00` UTC
- **Coordinates**: $0^\circ \text{N}, 0^\circ \text{E}$ (Geocentric)
- **Timezone**: `UTC`

### Expected Placements (Conscious)
- **Sun Longitude**: $280.44^\circ \pm 0.01^\circ$ (Capricorn)
- **Sun Codon Index**:
  $$\text{index} = \lfloor \frac{280.44}{5.625} \rfloor = \lfloor 49.856 \rfloor = 49$$
- **Mandala Sequence Index 49**: Codon `38` (Struggle / *The Fighter*)
- **Local Degree Offset**:
  $$\text{offset} = 280.44 \pmod{5.625} \approx 4.815^\circ$$
- **Sun Facet Index**:
  $$\text{facet\_index} = \lfloor \frac{4.815}{1.40625} \rfloor = 3 \rightarrow \text{Transpersonal (D)}$$

### Expected Design Calculations (Solar Arc)
- **Design Sun Longitude**:
  $$\lambda_{\text{target}} = (280.44^\circ - 88.0000^\circ) \pmod{360^\circ} = 192.44^\circ \pm 0.01^\circ$$
- **Design Sun Codon Index**:
  $$\text{index} = \lfloor \frac{192.44}{5.625} \rfloor = \lfloor 34.211 \rfloor = 34$$
- **Mandala Sequence Index 34**: Codon `57` (Intuition / *Intuitive Clarity*)
- **Local Degree Offset**:
  $$\text{offset} = 192.44 \pmod{5.625} \approx 1.190^\circ$$
- **Design Sun Facet Index**:
  $$\text{facet\_index} = \lfloor \frac{1.190}{1.40625} \rfloor = 0 \rightarrow \text{Somatic (A)}$$
- **Target Backtrack Date**: Must resolve to the exact second in October 2023 when the Sun reached $192.44^\circ$ Tropical longitude (approximately October 5-6, 2023).

---

## 2. TIMEZONE & CORRECTION TEST CASES

### Case 2: DST Transition Offset Check
- **Local Birth Input**: `2026-03-29 02:30:00` in London (Europe/London).
- **Behavior**: The IANA library must detect that 02:30:00 does not exist on this date due to the forward shift (clocks skip from 02:00 to 03:00 for British Summer Time).
- **Pass Condition**: The system must catch the invalid local time and throw an `INVALID_LOCAL_TIME` error.

### Case 3: Missing Timezone Resolution
- **Birth Input**: `1990-05-15 08:30:00`, Location coordinates missing, City: `"Unknown Island"`.
- **Pass Condition**: The engine must block calculation, return status `DRAFT`, and trigger an `INSUFFICIENT_INPUT_DATA` warning.

---

## 4. STRUCTURAL RESOLUTION TESTS

### Case 4: Reflector Verification
- **Input Placements**: Setup mock placements so that no Resonance Links are active.
- **Pass Condition**:
  - All 9 Centers must return status `OPEN`.
  - Type must evaluate to `REFLECTOR`.
  - Authority must evaluate to `Lunar Cycle`.

### Case 5: Manifesting Resonator Sub-type check
- **Input Placements**: Activate Codons `20` and `34` (channel `20-34` connects SACRAL to THROAT).
- **Pass Condition**:
  - `SACRAL` and `THROAT` centers return `DEFINED`.
  - Type evaluates to `RESONATOR`.
  - Subtype evaluates to `Manifesting Resonator`.

### Case 6: Catalyst Type check
- **Input Placements**: Activate Codon `21` and `45` (channel `45-21` connects HEART to THROAT). Ensure Sacral is open.
- **Pass Condition**:
  - `HEART` (motor) and `THROAT` return `DEFINED`.
  - Type evaluates to `CATALYST`.
  - Authority evaluates to `Will/Desire`.
