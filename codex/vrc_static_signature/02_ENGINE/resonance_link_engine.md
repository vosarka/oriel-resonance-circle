# Engine Specification: resonance-link-engine

## 1. PURPOSE
The `resonance-link-engine` resolves the active circuit paths (Resonance Links) between Centers. A link is a stable channel of energy expression. The engine scans the 26 activations (conscious and design) to identify if both endpoints of any of the 36 canonical links are active.

---

## 2. INPUTS
- `activeCodonIds`: Set or list of activated Codon numbers (e.g. `[1, 38, 57, 64, 47]`) derived from the 26 planetary activations.

---

## 3. OUTPUTS
- `activeLinks`: List of active Resonance Link objects, each containing:
  - `id`: String (e.g. `64-47`)
  - `name`: String (e.g. `Abstraction`)
  - `centerA`: String (e.g. `HEAD`)
  - `centerB`: String (e.g. `AJNA`)
  - `codonA`: Integer (e.g. `64`)
  - `codonB`: Integer (e.g. `47`)

---

## 4. DEPENDENCIES
- `/01_DATA/resonance_links.json` (for the database of 36 channels).

---

## 5. OWNERSHIP
- File: `server/vrc-mandala.ts`

---

## 6. FAIL CONDITIONS
- **Undefined Inputs**: The active codons set is missing or empty.
- **Malformed Codon ID**: Input contains IDs outside the $[1, 64]$ integer range.

---

## 7. VALIDATION RULES
1. **Coherence Rule**: A link is **ACTIVE** if and only if:
   $$\text{codonA} \in \text{activeCodonIds} \quad \text{AND} \quad \text{codonB} \in \text{activeCodonIds}$$
2. **Cross-Layer Definition**: The activation of `codonA` and `codonB` is layer-independent. It may be conscious-conscious, design-design, or conscious-design.
3. **Dormancy Rule**: If only one of the two codons is present, the link is **DORMANT** and must not be returned in the active list.

---

## 8. TEST STRATEGY
- **Dormant Case**: Pass `[64]`. Assert `activeLinks` is empty.
- **Active Case**: Pass `[64, 47]`. Assert link `64-47` (Abstraction) is returned in the list.
- **Mixed Activation Case**: Verify that activating Conscious Sun (Codon 38) and Design Sun (Codon 57) does not trigger `38-57` unless `38-57` is a valid channel in `resonance_links.json` (it is not, as there is no channel `38-57`).
