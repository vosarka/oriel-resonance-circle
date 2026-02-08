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
 * Calculate planetary positions for a given birth date and time
 */
export async function calculateBirthChart(
  birthDate: Date,
  birthTime: string, // Format: "HH:MM" or "HH:MM:SS"
  latitude: number, // Birth location latitude
  longitude: number, // Birth location longitude
  timezone: number = 0 // Timezone offset in hours
): Promise<BirthChart> {
  try {
    const se = await initEphemeris();
    
    // Parse birth time
    const timeParts = birthTime.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = parseInt(timeParts[2] || '0', 10);
    
    // Create date with birth time (UTC)
    const fullDate = new Date(birthDate);
    fullDate.setHours(hours - timezone, minutes, seconds, 0);
    
    // Get date components
    const year = fullDate.getUTCFullYear();
    const month = fullDate.getUTCMonth() + 1;
    const day = fullDate.getUTCDate();
    const hour = fullDate.getUTCHours() + (fullDate.getUTCMinutes() / 60) + (fullDate.getUTCSeconds() / 3600);
    
    // Calculate Julian Day
    const jd = se.julday(year, month, day, hour);
    
    // Calculate planetary positions
    const planets: Record<string, PlanetaryPosition> = {};
    
    // Calculate positions for all major planets
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
      PLANETS.NORTH_NODE,
    ];
    
    for (const planetId of planetIds) {
      try {
        // Calculate position using Swiss Ephemeris
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
    
    // Calculate house system (Placidus)
    // Note: Swiss Ephemeris houses function returns a number (ARMC), not house cusps
    // For now, we'll skip house calculation as it requires additional setup
    let houses: HouseSystem | undefined;
    try {
      // The houses function in swisseph-wasm returns ARMC (Ascendant Right Ascension)
      // Full house calculation would require additional ephemeris setup
      // For now, create a placeholder house system
      houses = {
        system: 'Placidus',
        houses: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
        ascendant: 0,
        midheaven: 0,
      };
    } catch (error) {
      console.error('Error calculating houses:', error);
    }
    
    return {
      timestamp: fullDate.getTime(),
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
