# Engine Specification: ephemeris-service

## 1. PURPOSE
The `ephemeris-service` is the astronomical foundation of the system. It is responsible for loading the Swiss Ephemeris WASM engine, normalising user input locations to geocentric coordinates, converting local times to UTC, and calculating raw geocentric longitudes for the 13 required celestial placements at $T_{\text{birth}}$.

---

## 2. INPUTS
- `birthDate`: String (`YYYY-MM-DD`)
- `birthTimeLocal`: String (`HH:mm:ss`)
- `birthCity`: String (identifying metadata)
- `latitude`: Float (range: $[-90.0, 90.0]$)
- `longitude`: Float (range: $[-180.0, 180.0]$)
- `timezoneString`: String (IANA format, e.g., `Europe/Zurich`)

---

## 3. OUTPUTS
- `utcTimestamp`: Date/ISO String (normalized birth time)
- `placements`: Dictionary mapping Planet ID to geocentric longitude in degrees:
  - `Sun`: Float ($[0.0, 360.0)$)
  - `Earth`: Float ($[0.0, 360.0)$)
  - `Moon`: Float ($[0.0, 360.0)$)
  - `Mercury`: Float ($[0.0, 360.0)$)
  - `Venus`: Float ($[0.0, 360.0)$)
  - `Mars`: Float ($[0.0, 360.0)$)
  - `Jupiter`: Float ($[0.0, 360.0)$)
  - `Saturn`: Float ($[0.0, 360.0)$)
  - `Uranus`: Float ($[0.0, 360.0)$)
  - `Neptune`: Float ($[0.0, 360.0)$)
  - `Pluto`: Float ($[0.0, 360.0)$)
  - `NorthNode`: Float ($[0.0, 360.0)$)
  - `SouthNode`: Float ($[0.0, 360.0)$)

---

## 4. DEPENDENCIES
- **Swiss Ephemeris WASM Binaries** (`sweph` wrappers).
- **Timezone lookup database** (IANA mapping database).
- **Geocoding engine** (coordinates validation utility).

---

## 5. OWNERSHIP
- File: `server/ephemeris-service.ts`

---

## 6. FAIL CONDITIONS
- **Invalid Coordinates**: latitude outside $[-90, 90]$ or longitude outside $[-180, 180]$.
- **Invalid Date/Time**: Non-existent calendar date (e.g. February 30) or out-of-bounds time.
- **Ephemeris Data File Failure**: Missing WASM binaries or `.se` files.
- **Missing Timezone**: Unparseable IANA timezone string.

---

## 7. VALIDATION RULES
1. **Zodiac System**: Enforce Tropical Zodiac (longitude measured from 0° Aries, geocentric).
2. **Earth Derivation**: Calculate Earth as Sun longitude + 180°:
   $$\lambda_{\text{Earth}} = (\lambda_{\text{Sun}} + 180^\circ) \pmod{360^\circ}$$
3. **South Node Derivation**: Calculate South Node as North Node (True Node) + 180°:
   $$\lambda_{\text{SouthNode}} = (\lambda_{\text{NorthNode}} + 180^\circ) \pmod{360^\circ}$$
4. **Node Method**: Force True Node. Mean Node calculations are forbidden.

---

## 8. TEST STRATEGY
- **Calibration Vector Test**: Pass `2024-01-01 12:00:00 UTC` at $0^\circ \text{N}, 0^\circ \text{E}$. Verify Sun longitude returns $\approx 280.44^\circ$.
- **Timezone Boundary Checks**: Test birthdates spanning Daylight Savings transitions to verify correct UTC conversion.
- **Geocentric Symmetry Test**: Verify that Earth and South Node are exactly $180.00^\circ$ apart from Sun and North Node respectively.
