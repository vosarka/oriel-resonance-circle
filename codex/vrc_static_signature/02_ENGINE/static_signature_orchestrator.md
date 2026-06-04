# Engine Specification: static-signature-orchestrator

## 1. PURPOSE

The `static-signature-orchestrator` coordinates the entire calculation pipeline. It ingests the raw birth inputs, triggers the astronomical calculations, runs the structural mapping, evaluates identity rules, and outputs a single, validated JSON payload that the ORIEL layer is allowed to narrate.

---

## 2. INPUTS

- `birthInput`: Object containing:
  - `name`: String
  - `date`: String (`YYYY-MM-DD`)
  - `time`: String (`HH:mm:ss`, optional)
  - `location`: String (city name)
  - `latitude`: Float (optional)
  - `longitude`: Float (optional)
- `carrierlockInput`: Object (optional) containing `MN`, `BT`, `ET`, `BC` scores.

---

## 3. OUTPUTS

- `readingPayload`: Object containing:
  - `status`: String (`CONFIRMED` or `DRAFT`)
  - `provenance`: Object (birth inputs, geocoded coordinates, UTC offset, T_design offset)
  - `activations`: List of 26 activations (codon, facet, center, weight, layer)
  - `centers`: Dictionary of 9 centers with Defined/Open status and connecting active links
  - `activeLinks`: List of active Resonance Links
  - `identity`: Object containing `vrcType`, `vrcSubtype`, and `vrcAuthority`
  - `dynamicState`: Object (optional, contains Coherence Score, Coherence State, and SLI scores)
  - `auditSignature`: String (hash or verification code representing math checksum)

---

## 4. DEPENDENCIES

- `ephemeris-service`
- `solar-arc-engine`
- `codon-mapping-engine`
- `facet-engine`
- `center-evaluator`
- `resonance-link-engine`
- `type-authority-engine`
- `carrierlock-engine`
- `sli-engine`

---

## 5. OWNERSHIP

- File: `server/rgp-static-signature-engine.ts`

---

## 6. FAIL CONDITIONS

- **Missing Date**: Date is missing (critical block).
- **Missing Location**: Coordinates cannot be resolved (critical block).
- **Sub-engine Failure**: Any of the calculation phases fails.

---

## 7. VALIDATION RULES

1. **Time-Check Integrity**: If birth time is missing or set to a default (e.g. `12:00` without confirmation), the orchestrator must:
   - Downgrade `status` to `DRAFT`.
   - Append an `approximate_sketch` warning flag to the payload.
   - Prohibit the output from using confirmed labels.
2. **Deterministic Sequence**: Placements must be generated for both Conscious and Design layers before type and authority are calculated.

---

## 8. TEST STRATEGY

- **Confirmed Reading E2E Test**: Input calibration birth vector. Verify that the output payload resolves to `CONFIRMED` status with `RC38` as Conscious Sun and `RC57` as Design Sun.
- **Draft Downgrade Test**: Input calibration birth vector without birth time. Assert that the status is set to `DRAFT`, and the orchestrator includes a data provenance disclaimer.
