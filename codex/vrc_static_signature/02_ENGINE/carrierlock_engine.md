# Engine Specification: carrierlock-engine

## 1. PURPOSE

The `carrierlock-engine` measures the subject's dynamic coherence at a specific moment in time (current weather) using a 2-minute Tier-1 check. This score is used to identify phase interference and compute active Shadow Loudness.

---

## 2. INPUTS

- `mentalNoise` (MN): Integer (scale: $0 - 10$, rate of intrusive loops)
- `bodyTension` (BT): Integer (scale: $0 - 10$, physical bracing/clamping)
- `emotionalTurbulence` (ET): Integer (scale: $0 - 10$, emotional volatility)
- `breathCompletion` (BC): Integer/Binary ($0$ or $1$, successful completion of 6 breaths/minute for 2 minutes)

---

## 3. OUTPUTS

- `coherenceScore` (CS): Float ($[0.0, 100.0]$, clamped)
- `coherenceState`: String (`Aligned`, `Drifted`, `Fragmented`)
- `description`: String (state summary)

---

## 4. DEPENDENCIES

- None.

---

## 5. OWNERSHIP

- File: `server/rgp-static-signature-engine.ts`

---

## 6. FAIL CONDITIONS

- **Missing Parameters**: Any of `MN`, `BT`, `ET`, or `BC` is null or undefined.
- **Out of Range Inputs**: `MN`, `BT`, `ET` outside $[0, 10]$, or `BC` not equal to $0$ or $1$.

---

## 7. VALIDATION RULES

1. **Formula**:
   $$\text{CS} = 100 - (\text{MN} \times 3 + \text{BT} \times 3 + \text{ET} \times 3) + (\text{BC} \times 10)$$
2. **Clamping**: Enforce a lower bound of $0.0$ and an upper bound of $100.0$:
   $$\text{CS}_{\text{clamped}} = \max(0.0, \min(100.0, \text{CS}))$$
3. **State Transitions**:
   - $\text{CS} \ge 80.0 \rightarrow$ `Aligned`
   - $40.0 \le \text{CS} < 80.0 \rightarrow$ `Drifted`
   - $\text{CS} < 40.0 \rightarrow$ `Fragmented`

---

## 8. TEST STRATEGY

- **Maximum Coherence**: `MN = 0, BT = 0, ET = 0, BC = 1`. Expected CS: $100.0$ (clamped from $110$). State: `Aligned`.
- **Minimum Coherence**: `MN = 10, BT = 10, ET = 10, BC = 0`. Expected CS: $10.0$. State: `Fragmented`.
- **Boundary Drift**: `MN = 4, BT = 4, ET = 4, BC = 1`. Expected CS: $100 - 36 + 10 = 74.0$. State: `Drifted`.
