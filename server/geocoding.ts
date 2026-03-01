import { find as tzFind } from 'geo-tz';

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

export interface TimezoneResult {
  tzId: string;
  offsetHours: number;
}

/**
 * Geocode a city/address string to coordinates using Nominatim (OpenStreetMap).
 * No API key required. Rate limit: 1 req/sec — fine for human-driven form submissions.
 */
export async function geocodeCity(city: string): Promise<GeocodeResult> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', city);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'OrielResonanceCircle/1.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }

  const results = await response.json() as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  if (!results.length) {
    throw new Error(`No location found for: "${city}"`);
  }

  const first = results[0];
  return {
    displayName: first.display_name,
    latitude: parseFloat(first.lat),
    longitude: parseFloat(first.lon),
  };
}

/**
 * Look up the IANA timezone ID for a coordinate pair using geo-tz (embedded data, no API call).
 * Then compute the UTC offset in decimal hours at the given reference date.
 */
export function getTimezoneForCoords(
  lat: number,
  lon: number,
  referenceDate: Date = new Date()
): TimezoneResult {
  const tzIds = tzFind(lat, lon);
  const tzId = tzIds[0] ?? 'UTC';
  const offsetHours = getUtcOffsetHours(tzId, referenceDate);
  return { tzId, offsetHours };
}

/**
 * Compute the UTC offset in decimal hours for an IANA timezone at a specific date,
 * accounting for DST. Uses the built-in Intl API — no extra packages required.
 *
 * Examples: "Europe/London" in winter → 0, in summer → 1
 *           "America/New_York" in winter → -5, in summer → -4
 *           "Asia/Kolkata" → 5.5
 */
function getUtcOffsetHours(tzId: string, date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      timeZoneName: 'longOffset',
      hour: 'numeric',
    }).formatToParts(date);

    const tzName = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0';
    // tzName is like "GMT+5:30", "GMT-8", "GMT+0"
    const match = tzName.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3] ?? '0', 10);
    return sign * (hours + minutes / 60);
  } catch {
    return 0;
  }
}
