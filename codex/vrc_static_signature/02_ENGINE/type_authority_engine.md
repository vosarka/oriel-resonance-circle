# Engine Specification: type-authority-engine

## 1. PURPOSE
The `type-authority-engine` executes the logical decision trees to determine a subject's VRC Type (Fractal Role) and VRC Authority (Decision Compass) from the set of defined centers and active links.

---

## 2. INPUTS
- `definedCenterIds`: List of Defined Center IDs (e.g. `["HEAD", "AJNA"]`) resolved by the `center-evaluator`.
- `activeLinks`: List of active Resonance Links.

---

## 3. OUTPUTS
- `vrcType`: String (`REFLECTOR`, `RESONATOR`, `CATALYST`, `HARMONIZER`)
- `vrcSubtype`: String (e.g. `Manifesting Resonator` or `None`)
- `vrcAuthority`: String (`Emotional Resonance`, `Gut Response`, `Instinctive Pulse`, `Will/Desire`, `Self-Direction`, `Lunar Cycle`, `Mental Projector`)

---

## 4. DEPENDENCIES
- `/01_DATA/type_logic.json` (for Type rules).
- `/01_DATA/authority_hierarchy.json` (for Authority scan priorities).

---

## 5. OWNERSHIP
- File: `server/vrc-mandala.ts`

---

## 6. FAIL CONDITIONS
- **Empty Defined Centers List**: Should default to `REFLECTOR` and `Lunar Cycle` without throwing errors.
- **Pathfinding Loop**: Cyclic links causing infinite recursion during Throat-to-Motor connectivity checks.

---

## 7. VALIDATION RULES
1. **Type Determination Hierarchy**: Evaluate in this exact order:
   - **REFLECTOR**: `definedCenterIds` is empty.
   - **RESONATOR**: `SACRAL` $\in$ `definedCenterIds`.
     - *Subcheck*: A path of active links connects any motor center (`SACRAL`, `ROOT`, `SOLAR`, `HEART`) to the `THROAT` center. If true, subtype $\rightarrow$ `Manifesting Resonator`.
   - **CATALYST**: `SACRAL` $\notin$ `definedCenterIds` AND a path of active links connects at least one defined motor center (`ROOT`, `SOLAR`, `HEART`) to the `THROAT` center.
   - **HARMONIZER**: All other cases.
2. **Authority Scan priority**: Scan `definedCenterIds` in this order, returning the first match:
   - `SOLAR` $\rightarrow$ `Emotional Resonance`
   - `SACRAL` $\rightarrow$ `Gut Response`
   - `SPLEEN` $\rightarrow$ `Instinctive Pulse`
   - `HEART` $\rightarrow$ `Will/Desire`
   - `G` $\rightarrow$ `Self-Direction`
   - If Reflector (no defined centers) $\rightarrow$ `Lunar Cycle`
   - If `HEAD`/`AJNA` defined and no motors defined below throat $\rightarrow$ `Mental Projector` (Environment)

---

## 8. TEST STRATEGY
- **Reflector Test**: Empty defined centers. Assert Type = `REFLECTOR`, Authority = `Lunar Cycle`.
- **Resonator Test**: Defined centers = `["SACRAL"]`. Assert Type = `RESONATOR`, Subtype = `None`, Authority = `Gut Response`.
- **Manifesting Resonator Test**: Defined centers = `["SACRAL", "THROAT"]`, link = `["20-34"]`. Assert Type = `RESONATOR`, Subtype = `Manifesting Resonator`.
- **Catalyst Test**: Defined centers = `["THROAT", "HEART"]`, link = `["45-21"]`. Assert Type = `CATALYST`, Authority = `Will/Desire`.
- **Harmonizer Test**: Defined centers = `["HEAD", "AJNA", "THROAT"]`, links = `["64-47", "17-62"]`. Assert Type = `HARMONIZER`, Authority = `Mental Projector` (Environment).
