# Engine Specification: facet-engine

## 1. PURPOSE

The `facet-engine` subdivides each codon's $5.625^\circ$ segment into 4 equal expression domains (facets) of $1.40625^\circ$ each. It resolves which specific facet (Somatic, Relational, Cognitive, or Transpersonal) is triggered by an activation's local offset.

---

## 2. INPUTS

- `localOffset`: Float ($[0.0, 5.625)$) for each activation.

---

## 3. OUTPUTS

- `facetLabel`: String (`Somatic`, `Relational`, `Cognitive`, `Transpersonal`)
- `facetIndex`: Integer ($0, 1, 2, 3$)
- `facetOffset`: Float ($[0.0, 1.40625)$)

---

## 4. DEPENDENCIES

- `/01_DATA/facets_master.json` (for validating facet descriptions).

---

## 5. OWNERSHIP

- File: `server/rgp-256-codon-engine.ts`

---

## 6. FAIL CONDITIONS

- **Invalid Offset Range**: `localOffset` is less than $0.0$ or greater than or equal to $5.625$.

---

## 7. VALIDATION RULES

1. **Facet Width**: Each facet is exactly $1.40625^\circ$.
2. **Ranges**:

- `0 (Somatic)`: $[0.0, 1.40625)$
- `1 (Relational)`: $[1.40625, 2.8125)$
- `2 (Cognitive)`: $[2.8125, 4.21875)$
- `3 (Transpersonal)`: $[4.21875, 5.625)$

3. **Formula**:
   $$\text{facet\_index} = \lfloor \frac{\text{localOffset}}{1.40625} \rfloor$$
   $$\text{facet\_offset} = \text{localOffset} \pmod{1.40625}$$

---

## 8. TEST STRATEGY

- **Range Boundaries**:
  - Input $1.40624^\circ \rightarrow$ assert `Somatic`.
  - Input $1.40625^\circ \rightarrow$ assert `Relational`.
  - Input $2.81250^\circ \rightarrow$ assert `Cognitive`.
  - Input $4.21875^\circ \rightarrow$ assert `Transpersonal`.
- **Calibration Verification**:
  - Verify that local degree offset of $1.65^\circ$ (from validation vector) yields `Relational` facet (facet index $1$) and a local facet offset of $0.24375^\circ$.
