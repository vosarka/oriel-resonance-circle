# Engine Specification: solar-arc-engine

## 1. PURPOSE

The `solar-arc-engine` calculates the unconscious somatic timestamp ($T_{\text{design}}$) using the exact Solar Arc backward-in-time calculation. Rather than subtracting a fixed number of days, the engine uses the precise orbital motion of the Sun to anchor the body signal at a exact offset of $88.0000^\circ$.

---

## 2. INPUTS

- `utcTimestamp`: Date/ISO String ($T_{\text{birth}}$)
- `consciousSunLongitude`: Float ($[0.0, 360.0)$)

---

## 3. OUTPUTS

- `designTimestamp`: Date/ISO String ($T_{\text{design}}$)
- `designSunLongitude`: Float ($[0.0, 360.0)$, must match target within precision limits)

---

## 4. DEPENDENCIES

- `ephemeris-service` (for querying geocentric Sun coordinates at arbitrary timestamps).

---

## 5. OWNERSHIP

- File: `server/ephemeris-service.ts` (All ephemeris math is localized in this module).

---

## 6. FAIL CONDITIONS

- **Missing Sun Coordinate**: No conscious Sun coordinate calculated.
- **Search Non-Convergence**: The backtracking algorithm fails to locate the target Sun coordinate to within $\pm 0.0001^\circ$ within 100 iterations.
- **Out of Bounds Time**: Calculation falls outside the supported epochs of the Swiss Ephemeris.

---

## 7. VALIDATION RULES

1. **Target Angle**: The design Sun longitude must be exactly $88.0000^\circ$ behind the conscious Sun longitude:
   $$\lambda_{\text{target}} = (\lambda_{\text{conscious\_sun}} - 88.0000^\circ) \pmod{360^\circ}$$
2. **Search Span**: The calculated $T_{\text{design}}$ must fall within a window of $88.0$ to $89.5$ calendar days prior to $T_{\text{birth}}$.
3. **Precision**: The computed Sun longitude at $T_{\text{design}}$ must satisfy:
   $$|\lambda_{\text{Sun}}(T_{\text{design}}) - \lambda_{\text{target}}| < 0.0001^\circ$$

---

## 8. TEST STRATEGY

- **Calibration Vector Test**: Input $T_{\text{birth}} =$ `2024-01-01 12:00:00 UTC` ($\lambda_{\text{conscious\_sun}} \approx 280.44^\circ$). Verify target longitude is $\approx 192.44^\circ$, and output $T_{\text{design}}$ matches the exact second in October 2023 when the Sun reached that coordinate.
- **Precision Validation**: Assert that the Sun longitude calculated at the output timestamp converges exactly.
