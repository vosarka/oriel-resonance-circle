# Engine Specification: center-evaluator

## 1. PURPOSE

The `center-evaluator` determines the activation status (Defined vs Open) for each of the 9 regulatory centers of photonic resonance. A center functions as an active processor only when it is connected to a completed energetic circuit (Resonance Link).

---

## 2. INPUTS

- `activeLinks`: List of active Resonance Link IDs (e.g. `["64-47", "10-57"]`) compiled by the `resonance-link-engine`.

---

## 3. OUTPUTS

- `centerStatuses`: Dictionary mapping Center IDs (`HEAD`, `AJNA`, `THROAT`, `G`, `HEART`, `SACRAL`, `SPLEEN`, `SOLAR`, `ROOT`) to:
  - `status`: String (`DEFINED` or `OPEN`)
  - `activeLinkIds`: List of active channel IDs connected to this center.

---

## 4. DEPENDENCIES

- `/01_DATA/centers_master.json` (for center definitions and associated codon mappings).

---

## 5. OWNERSHIP

- File: `server/vrc-mandala.ts`

---

## 6. FAIL CONDITIONS

- **Empty input array bypass**: If the input `activeLinks` is null or undefined (must default to empty list, not fail, but log warning).
- **Invalid Link ID**: Link ID does not exist in the master database.

---

## 7. VALIDATION RULES

1. **Definition Criterion**: A center is Defined if and only if at least one active Resonance Link connects to it.
2. **Open Criterion**: A center is Open if and only if no active Resonance Links connect to it.
3. **No Codon-Only Definition**: An activated codon (gate) on a center does NOT define the center. Only a completed channel (where both codons are active) can define the center.

---

## 8. TEST STRATEGY

- **Zero Links Test**: Pass an empty list of active links. Assert all 9 centers return `OPEN`.
- **Single Link Definition**: Pass `["64-47"]`. Assert `HEAD` and `AJNA` return `DEFINED`, and all other 7 centers return `OPEN`.
- **Multiple Links Definition**: Pass `["64-47", "10-57"]`. Assert `HEAD`, `AJNA`, `G`, and `SPLEEN` return `DEFINED`, and others return `OPEN`.
