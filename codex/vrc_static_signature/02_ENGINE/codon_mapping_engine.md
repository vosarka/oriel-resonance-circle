# Engine Specification: codon-mapping-engine

## 1. PURPOSE

The `codon-mapping-engine` maps the 26 planetary longitudes (13 conscious, 13 design) to specific segments of the 360° wheel, resolving their corresponding Codon IDs (from `RC01` to `RC64`) based on the non-sequential Resonance Mandala sequence.

---

## 2. INPUTS

- `activations`: List of 26 activation records, each containing:
  - `planet`: String ID (e.g. `Sun`, `Earth`, `North Node`)
  - `layer`: String (`conscious` or `design`)
  - `longitude`: Float ($[0.0, 360.0)$)

---

## 3. OUTPUTS

- `mappedActivations`: List of 26 activation objects, each expanded with:
  - `codonId`: String (`RC01` to `RC64`)
  - `codonIndex`: Integer ($0$ to $63$)
  - `localOffset`: Float ($[0.0, 5.625)$)

---

## 4. DEPENDENCIES

- `/01_DATA/codons_master.json` (for validating codon existence).
- Mandala Sequence Array configuration (hardcoded in mapping layer).

---

## 5. OWNERSHIP

- File: `server/vrc-mandala.ts`

---

## 6. FAIL CONDITIONS

- **Out of Bounds Longitude**: Longitude outside $[0.0, 360.0)$ that cannot be normalized.
- **Mandala Index Leak**: Index resolves to a number outside $[0, 63]$.
- **Incomplete Placements List**: Input contains fewer than 26 activations.

---

## 7. VALIDATION RULES

1. **Zodiac Partitioning**: Each codon segment is exactly $5.625^\circ$.
2. **Sequential Mapping Warning**: Ecliptic degrees must NOT map to sequential codon numbers. They must map using the Resonance Mandala Sequence:
   `[51, 42, 3, 27, 24, 2, ...]` (complete sequence in `CANON_MASTER.md`).
3. **Formula**:
   $$\text{index} = \lfloor \frac{\lambda}{5.625} \rfloor$$
   $$\text{codon\_id} = \text{MandalaSequence}[\text{index}]$$
   $$\text{local\_offset} = \lambda \pmod{5.625}$$

---

## 8. TEST STRATEGY

- **Mandala Boundary Tests**:
  - Longitude $0.0^\circ$ must map to `RC51` (first element of Quadrant 1).
  - Longitude $359.99^\circ$ must map to `RC21` (last element of Quadrant 4).
- **Validation Vector Verification**:
  - Conscious Sun longitude $280.44^\circ$ must map to `RC38`.
  - Design Sun longitude $192.44^\circ$ must map to `RC57`.
