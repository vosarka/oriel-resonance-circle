import SwissEph from 'swisseph-wasm';

/**
 * Planetary body identifiers for Swiss Ephemeris
 */
export const PLANETS = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  CHIRON: 15,
  NORTH_NODE: 11, // True node
  MEAN_NODE: 10, // Mean node
} as const;

export const PLANET_NAMES: Record<number, string> = {
  0: 'Sun',
  1: 'Moon',
  2: 'Mercury',
  3: 'Venus',
  4: 'Mars',
  5: 'Jupiter',
  6: 'Saturn',
  7: 'Uranus',
  8: 'Neptune',
  9: 'Pluto',
  15: 'Chiron',
  11: 'North Node',
  10: 'Mean Node',
};

/**
 * Represents a planetary position
 */
export interface PlanetaryPosition {
  planet: string;
  planetId: number;
  longitude: number; // Degrees (0-360)
  latitude: number; // Degrees
  distance: number; // AU (Astronomical Units)
  speed: number; // Degrees per day
  zodiacSign: string;
  zodiacDegree: number; // 0-30 degrees within sign
}

/**
 * Birth chart data with calculated planetary positions
 */
export interface BirthChart {
  timestamp: number; // Unix timestamp (milliseconds)
  jd: number; // Julian Day number
  latitude: number; // Birth location latitude
  longitude: number; // Birth location longitude
  timezone: number; // Timezone offset in hours
  planets: Record<string, PlanetaryPosition>;
  houses?: HouseSystem;
}

/**
 * House system (Placidus, Koch, etc.)
 */
export interface HouseSystem {
  system: string; // 'P' for Placidus, 'K' for Koch, etc.
  houses: number[]; // House cusps in degrees (12 values)
  ascendant: number;
  midheaven: number;
}

/**
 * Zodiac signs and their properties
 */
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/**
 * Get zodiac sign from longitude (0-360 degrees)
 */
function getLongitudeToZodiac(longitude: number): { sign: string; degree: number } {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized % 30;
  return {
    sign: ZODIAC_SIGNS[signIndex],
    degree: degree,
  };
}

// Initialize Swiss Ephemeris instance
let swissEph: SwissEph | null = null;

/**
 * Initialize Swiss Ephemeris
 */
async function initEphemeris(): Promise<SwissEph> {
  if (swissEph) {
    return swissEph;
  }

  swissEph = new SwissEph();
  await swissEph.initSwissEph();
  return swissEph;
}

/**
 * Calculate all planetary positions for a given Julian Day number.
 * Extracted as a helper so it can be called for both Conscious and Design charts.
 */
async function calcPlanetsAtJD(
  jd: number,
  se: SwissEph
): Promise<Record<string, PlanetaryPosition>> {
  const planetIds = [
    PLANETS.SUN,
    PLANETS.MOON,
    PLANETS.MERCURY,
    PLANETS.VENUS,
    PLANETS.MARS,
    PLANETS.JUPITER,
    PLANETS.SATURN,
    PLANETS.URANUS,
    PLANETS.NEPTUNE,
    PLANETS.PLUTO,
    PLANETS.CHIRON,
    PLANETS.NORTH_NODE, // True Node — VRC § 1 mandates True Node, not Mean Node
  ];

  const planets: Record<string, PlanetaryPosition> = {};

  for (const planetId of planetIds) {
    try {
      const result = se.calc(jd, planetId, 0);
      if (result && result.longitude !== undefined) {
        const zodiac = getLongitudeToZodiac(result.longitude);
        const planetName = PLANET_NAMES[planetId] || `Planet ${planetId}`;
        planets[planetName] = {
          planet: planetName,
          planetId,
          longitude: result.longitude,
          latitude: result.latitude || 0,
          distance: result.distance || 1,
          speed: result.longitudeSpeed || 0,
          zodiacSign: zodiac.sign,
          zodiacDegree: zodiac.degree,
        };
      }
    } catch (error) {
      console.error(`Error calculating position for planet ${planetId}:`, error);
    }
  }

  return planets;
}

/**
 * Find the Julian Day (T_design) at which the Sun was exactly 88.0000° behind
 * its position at T_birth, using the iterative Solar Arc method required by VRC § 2B.
 *
 * Formula:  λ_Sun(T_design) = (λ_Sun(T_birth) − 88.0°) mod 360
 * Method:   Newton-Raphson iteration backward ~88-89 days.
 * Precision: < 0.001° as mandated by VRC § 1.
 *
 * @param consciousJD       Julian Day of the birth moment (T_birth)
 * @param consciousSunLon   Sun longitude at T_birth (degrees 0–360)
 * @param se                Initialized Swiss Ephemeris instance
 * @returns Julian Day of T_design
 */
async function findDesignJD(
  consciousJD: number,
  consciousSunLon: number,
  se: SwissEph
): Promise<number> {
  const targetLon = ((consciousSunLon - 88.0) % 360 + 360) % 360;

  // Initial estimate: approximately 88 days before birth
  // (Sun moves ~0.9856°/day on average, so 88° ≈ 88–89 days)
  let jd = consciousJD - 88.5;

  const MAX_ITERATIONS = 50;
  const TOLERANCE = 0.00001; // << 0.001° VRC requirement

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const result = se.calc(jd, PLANETS.SUN, 0);
    const currentLon: number = result.longitude;
    const speed: number = result.longitudeSpeed || 0.9856; // degrees/day

    // Shortest angular difference (handles 0°/360° wrap-around)
    let diff = ((targetLon - currentLon) % 360 + 360) % 360;
    if (diff > 180) diff -= 360;

    if (Math.abs(diff) < TOLERANCE) break;

    jd += diff / speed;
  }

  return jd;
}

/**
 * Parse a birth date + time string into a UTC Date object.
 * VRC § 1: all user inputs MUST be converted to UTC before calculation.
 */
function parseBirthDateTime(
  birthDate: Date,
  birthTime: string,
  timezoneOffsetHours: number
): Date {
  const timeParts = birthTime.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  const seconds = parseInt(timeParts[2] || '0', 10);

  // Apply timezone correction to get UTC
  const utc = new Date(birthDate);
  utc.setHours(hours - timezoneOffsetHours, minutes, seconds, 0);
  return utc;
}

/**
 * Calculate planetary positions for a given birth date and time (Conscious chart).
 * VRC global config: geocentric, tropical zodiac, True Node.
 */
export async function calculateBirthChart(
  birthDate: Date,
  birthTime: string,     // Format: "HH:MM" or "HH:MM:SS"
  latitude: number,      // Birth location latitude
  longitude: number,     // Birth location longitude
  timezone: number = 0   // Timezone offset in hours (VRC: convert to UTC)
): Promise<BirthChart> {
  try {
    const se = await initEphemeris();

    const utcDate = parseBirthDateTime(birthDate, birthTime, timezone);

    const year = utcDate.getUTCFullYear();
    const month = utcDate.getUTCMonth() + 1;
    const day = utcDate.getUTCDate();
    const hour = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600;

    const jd = se.julday(year, month, day, hour);
    const planets = await calcPlanetsAtJD(jd, se);

    // VRC § 1: House System = None / Equal — the VRC relies on the Mandala (360°), not House cusps.
    const houses: HouseSystem = {
      system: 'None',
      houses: Array.from({ length: 12 }, (_, i) => i * 30),
      ascendant: 0,
      midheaven: 0,
    };

    return {
      timestamp: utcDate.getTime(),
      jd,
      latitude,
      longitude,
      timezone,
      planets,
      houses,
    };
  } catch (error) {
    console.error('Error calculating birth chart:', error);
    throw new Error(`Failed to calculate birth chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate BOTH the Conscious chart (T_birth) and the Design chart (T_design)
 * as required by the VRC Two-Timing Algorithm (§ 2).
 *
 * Step A — Conscious (Mind): planets at T_birth.
 * Step B — Design (Body):    planets at T_design, where
 *           T_design = moment the Sun was exactly 88.0000° behind its T_birth position.
 *
 * @returns { conscious, design } — two full BirthChart objects.
 */
export async function calculateBothCharts(
  birthDate: Date,
  birthTime: string,
  latitude: number,
  longitude: number,
  timezone: number = 0
): Promise<{ conscious: BirthChart; design: BirthChart }> {
  const se = await initEphemeris();

  const utcDate = parseBirthDateTime(birthDate, birthTime, timezone);
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1;
  const day = utcDate.getUTCDate();
  const hour = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600;

  const consciousJD = se.julday(year, month, day, hour);

  // Step A: Conscious chart
  const consciousPlanets = await calcPlanetsAtJD(consciousJD, se);
  const consciousSunLon = consciousPlanets['Sun']?.longitude ?? 0;

  // Step B: Design chart — iterative Solar Arc search
  const designJD = await findDesignJD(consciousJD, consciousSunLon, se);
  const designPlanets = await calcPlanetsAtJD(designJD, se);

  const noHouses: HouseSystem = {
    system: 'None',
    houses: Array.from({ length: 12 }, (_, i) => i * 30),
    ascendant: 0,
    midheaven: 0,
  };

  const conscious: BirthChart = {
    timestamp: utcDate.getTime(),
    jd: consciousJD,
    latitude,
    longitude,
    timezone,
    planets: consciousPlanets,
    houses: noHouses,
  };

  const design: BirthChart = {
    timestamp: utcDate.getTime() - Math.round((consciousJD - designJD) * 86400000),
    jd: designJD,
    latitude,
    longitude,
    timezone,
    planets: designPlanets,
    houses: noHouses,
  };

  return { conscious, design };
}

/**
 * Get planetary position by name
 */
export function getPlanetPosition(birthChart: BirthChart, planetName: string): PlanetaryPosition | undefined {
  return birthChart.planets[planetName];
}

/**
 * Get all planetary positions
 */
export function getAllPlanetPositions(birthChart: BirthChart): PlanetaryPosition[] {
  return Object.values(birthChart.planets);
}

/**
 * Format planetary position for display
 */
export function formatPlanetPosition(position: PlanetaryPosition): string {
  return `${position.planet} at ${position.zodiacDegree.toFixed(1)}° ${position.zodiacSign}`;
}
