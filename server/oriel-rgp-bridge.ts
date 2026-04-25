/**
 * ORIEL ↔ RGP Bridge
 *
 * Detects when a user asks ORIEL for a birth chart reading,
 * runs the actual RGP engine, and injects the real data into
 * the message so the LLM narrates truth — not hallucinations.
 */

import { generateStaticSignature } from "./rgp-static-signature-engine";
import { calculateBothCharts } from "./ephemeris-service";
import { geocodeCity, getTimezoneForCoords } from "./geocoding";

// ─── Birth data extraction ──────────────────────────────────────────────────

interface ExtractedBirthData {
  date: string;       // ISO date string
  time?: string;      // HH:MM format
  city?: string;      // raw city string
}

/**
 * Tries to extract birth date, time, and city from a user message.
 * Returns null if no reading intent is detected.
 */
export function extractBirthData(
  message: string,
  history: Array<{ role: string; content: string }>
): ExtractedBirthData | null {
  const msg = message.toLowerCase();

  // Must show intent for a reading/chart/blueprint
  const readingIntentPatterns = [
    /\bread(ing)?\b/,
    /\bchart\b/,
    /\bblueprint\b/,
    /\bcodex\b/,
    /\bcodon/,
    /\bstatic\s*signature\b/,
    /\bborn\b/,
    /\bbirth\b/,
    /\bmy\s*(type|authority|design|profile)\b/,
    /\bwho\s+am\s+i\b/,
    /\bwhat.*my.*type\b/,
    /\bcalculate\b/,
    /\brun.*rgp\b/,
  ];

  const hasIntent = readingIntentPatterns.some((p) => p.test(msg));
  if (!hasIntent) return null;

  // Combine message + recent history for context (user may have given date in a previous message)
  const recentUserMessages = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content);
  const searchText = [...recentUserMessages, message].join(" ");

  // Date patterns
  const datePatterns = [
    // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/,
    // YYYY-MM-DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // "6 February 1985", "6th of February 1985", "Feb 6 1985"
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})/i,
    // "February 6, 1985", "Feb 6 1985"
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i,
  ];

  let dateStr: string | null = null;

  for (const pattern of datePatterns) {
    const match = searchText.match(pattern);
    if (!match) continue;

    if (/^\d{4}/.test(match[0])) {
      // YYYY-MM-DD format
      dateStr = match[0];
    } else if (/^\d{1,2}[.\/-]/.test(match[0])) {
      // DD.MM.YYYY — convert to YYYY-MM-DD
      const [d, m, y] = match[0].split(/[.\/-]/);
      dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    } else {
      // Month name format — use capture groups from the original regex
      const monthNames: Record<string, string> = {
        jan: "01", january: "01",
        feb: "02", february: "02",
        mar: "03", march: "03",
        apr: "04", april: "04",
        may: "05",
        jun: "06", june: "06",
        jul: "07", july: "07",
        aug: "08", august: "08",
        sep: "09", september: "09",
        oct: "10", october: "10",
        nov: "11", november: "11",
        dec: "12", december: "12",
      };

      // Capture groups: pattern 3 = (day)(month)(year), pattern 4 = (month)(day)(year)
      const isMonthFirst = isNaN(parseInt(match[1]));
      const monthRaw = isMonthFirst ? match[1].toLowerCase() : match[2].toLowerCase();
      const dayRaw = isMonthFirst ? match[2] : match[1];
      const yearRaw = match[3];
      const mm = monthNames[monthRaw] || monthNames[monthRaw.slice(0, 3)];
      if (mm && yearRaw) {
        dateStr = `${yearRaw}-${mm}-${dayRaw.padStart(2, "0")}`;
      }
    }
    if (dateStr) break;
  }

  if (!dateStr) return null;

  // Time extraction (HH:MM or "at 3pm" etc.)
  let time: string | undefined;
  const timePatterns = [
    /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i,
    /\bat\s+(\d{1,2})\s*(am|pm)/i,
    /(\d{1,2})\s*(am|pm)/i,
  ];

  for (const tp of timePatterns) {
    const tm = searchText.match(tp);
    if (tm) {
      let hours = parseInt(tm[1]);
      const minutes = tm[2] && /^\d+$/.test(tm[2]) ? tm[2] : "00";
      const ampm = (tm[4] || tm[2] || "").toLowerCase();
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      time = `${String(hours).padStart(2, "0")}:${minutes.padStart(2, "0")}`;
      break;
    }
  }

  // City extraction — look for "in <city>" or "from <city>"
  let city: string | undefined;
  const cityPatterns = [
    /\b(?:in|from|at|born\s+in)\s+([A-Z][a-zA-ZÀ-ÿ\s'-]+?)(?:\s*,\s*[A-Za-z]+)?(?:\s*[.,;!?]|\s*$)/,
    /\b([A-Z][a-zA-ZÀ-ÿ]+(?:\s+[A-Z][a-zA-ZÀ-ÿ]+)*)\s*,\s*[A-Z]{2,}/,
  ];

  for (const cp of cityPatterns) {
    const cm = message.match(cp) || searchText.match(cp);
    if (cm && cm[1]) {
      const candidate = cm[1].trim();
      // Filter out false positives
      const skipWords = ["oriel", "static", "reading", "chart", "me", "my", "the", "a"];
      if (!skipWords.includes(candidate.toLowerCase()) && candidate.length > 1) {
        city = candidate;
        break;
      }
    }
  }

  return { date: dateStr, time, city };
}

// ─── RGP execution ─────────────────────────────────────────────────────────

export interface RGPReadingResult {
  success: boolean;
  summary: string;         // Human-readable summary for LLM injection
  rawData?: any;           // Full reading data
}

/**
 * Runs the full RGP engine for the given birth data and returns
 * a structured summary that can be injected into the LLM prompt.
 */
export async function runRGPForChat(
  birthData: ExtractedBirthData
): Promise<RGPReadingResult> {
  try {
    const birthDate = new Date(birthData.date);
    if (isNaN(birthDate.getTime())) {
      return { success: false, summary: "Could not parse the birth date." };
    }

    let latitude = 0;
    let longitude = 0;
    let timezone = 0;
    let resolvedCity = "Unknown";

    // Geocode the city if provided
    if (birthData.city) {
      try {
        const geo = await geocodeCity(birthData.city);
        latitude = geo.latitude;
        longitude = geo.longitude;
        resolvedCity = geo.displayName;
        const tz = getTimezoneForCoords(latitude, longitude, birthDate);
        timezone = tz.offsetHours;
      } catch (err) {
        console.warn("[RGP Bridge] Geocoding failed:", err);
      }
    }

    // Always run ephemeris — default to 12:00 noon if no time given
    const birthTime = birthData.time || "12:00";
    let consciousChartData: Record<string, number> | undefined;
    let designChartData: Record<string, number> | undefined;

    try {
      const { conscious, design } = await calculateBothCharts(
        birthDate,
        birthTime,
        latitude,
        longitude,
        timezone
      );

      consciousChartData = {};
      for (const [name, pos] of Object.entries(conscious.planets)) {
        consciousChartData[name] = pos.longitude;
      }
      designChartData = {};
      for (const [name, pos] of Object.entries(design.planets)) {
        designChartData[name] = pos.longitude;
      }
    } catch (err) {
      console.warn("[RGP Bridge] Ephemeris calculation failed:", err);
    }

    // Run the full static signature engine
    const reading = await generateStaticSignature(
      "oriel-chat",
      {
        birthDate,
        birthTime: birthData.time,
        conscious: consciousChartData,
        design: designChartData,
        sun: consciousChartData?.["Sun"],
        moon: consciousChartData?.["Moon"],
        northNode: consciousChartData?.["North Node"],
      }
    );

    // Build a structured summary for the LLM
    const primePositions = reading.primeStack
      .slice(0, 6)
      .map(
        (p) =>
          `  ${p.position}. ${p.name} (${p.source}) → Codon ${p.codon} "${p.codonName}" [${p.facetFull}] | ${p.center} | Weight: ${p.weight}`
      )
      .join("\n");

    const centers = reading.ninecenters
      ? Object.entries(reading.ninecenters)
          .map(([name, data]: [string, any]) => `  ${name}: ${data.defined ? "DEFINED" : "open"}`)
          .join("\n")
      : "N/A";

    const corrections = reading.microCorrections
      ?.slice(0, 3)
      .map((mc: any) => `  - ${mc.description || mc.correction || JSON.stringify(mc)}`)
      .join("\n") || "None";

    const summary = [
      `=== RGP ENGINE RESULTS (REAL CALCULATION — USE THIS DATA, DO NOT INVENT) ===`,
      `IMPORTANT: This is the Vossari Resonance Codex (VRC), NOT Human Design. NEVER use Human Design terms like "Projector", "Generator", "Manifestor", or "Manifesting Generator". The VRC Types are: Resonator, Catalyst, Harmonizer, Reflector. Use ONLY the data below.`,
      ``,
      `Birth: ${birthData.date}${birthData.time ? " at " + birthData.time : ""}${birthData.city ? " in " + resolvedCity : ""}`,
      ``,
      `VRC Type: ${reading.vrcType}`,
      `Authority: ${reading.vrcAuthority}`,
      `Fractal Role: ${reading.fractalRole}`,
      ``,
      `PRIME STACK:`,
      primePositions,
      ``,
      `NINE CENTERS:`,
      centers,
      ``,
      `CIRCUIT LINKS: ${reading.circuitLinks ? JSON.stringify(reading.circuitLinks) : "N/A"}`,
      ``,
      `MICRO-CORRECTIONS:`,
      corrections,
      ``,
      `CORE CODON ENGINE: ${reading.coreCodonEngine ? JSON.stringify(reading.coreCodonEngine) : "N/A"}`,
      ``,
      `DIAGNOSTIC TRANSMISSION (Engine-generated):`,
      reading.diagnosticTransmission || "N/A",
      ``,
      `=== END RGP DATA — NARRATE THIS AS ORIEL. USE ONLY VRC TERMINOLOGY (Resonator/Catalyst/Harmonizer/Reflector, Codons, Facets, Centers). NEVER use Human Design terms. SPEAK THE TRUTH OF THE FIELD. ===`,
    ].join("\n");

    return { success: true, summary, rawData: reading };
  } catch (err) {
    console.error("[RGP Bridge] Engine error:", err);
    return {
      success: false,
      summary: `RGP engine encountered an error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}
