import { find as findTimeZones } from 'geo-tz';
import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import {
  generateStaticSignature,
  type StaticSignatureReading,
} from './rgp-static-signature-engine';
import { calculateCoherenceScore, type CarrierlockState } from './rgp-coherence';
import { calculateBothCharts } from './ephemeris-service';
import {
  calculateStateAmplifier,
  determineFacetLoudness,
  type FacetLetter,
} from './rgp-256-codon-engine';
import {
  analyzeInterferencePattern,
  calculateSLIScores,
  generateFalsifiers,
  generateMicroCorrections,
  type SLIScore,
} from './rgp-sli-micro-correction-engine';
import type { PrimeStackCodon, PrimeStackMap } from './rgp-prime-stack-engine';

const FACET_LETTERS: FacetLetter[] = ['A', 'B', 'C', 'D'];

function isFacetLetter(value: unknown): value is FacetLetter {
  return typeof value === 'string' && FACET_LETTERS.includes(value as FacetLetter);
}

function parseBirthTimeParts(birthTime: string) {
  const [rawHours, rawMinutes = '0', rawSeconds = '0'] = birthTime.split(':');
  const hours = Number.parseInt(rawHours, 10);
  const minutes = Number.parseInt(rawMinutes, 10);
  const seconds = Number.parseInt(rawSeconds, 10);

  if (![hours, minutes, seconds].every(Number.isFinite)) {
    throw new Error('Valid birth time is required for timezone resolution.');
  }

  return { hours, minutes, seconds };
}

function buildLocalDateAsUtc(birthDate: Date, birthTime: string) {
  const { hours, minutes, seconds } = parseBirthTimeParts(birthTime);

  return new Date(Date.UTC(
    birthDate.getUTCFullYear(),
    birthDate.getUTCMonth(),
    birthDate.getUTCDate(),
    hours,
    minutes,
    seconds,
    0
  ));
}

function partsValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find(part => part.type === type)?.value;
}

function getTimezoneOffsetHours(timezoneId: string, instant: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezoneId,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const zonedTimestamp = Date.UTC(
    Number(partsValue(parts, 'year')),
    Number(partsValue(parts, 'month')) - 1,
    Number(partsValue(parts, 'day')),
    Number(partsValue(parts, 'hour')),
    Number(partsValue(parts, 'minute')),
    Number(partsValue(parts, 'second'))
  );

  return (zonedTimestamp - instant.getTime()) / 3_600_000;
}

function deriveTimezoneOffsetHours(
  birthDate: Date,
  birthTime: string,
  latitude: number,
  longitude: number
) {
  const timezoneId = findTimeZones(latitude, longitude)[0];

  if (!timezoneId) {
    throw new Error('Unable to resolve a timezone for the supplied birth coordinates.');
  }

  const localDateAsUtc = buildLocalDateAsUtc(birthDate, birthTime);
  let offset = getTimezoneOffsetHours(timezoneId, localDateAsUtc);

  // Re-check at the UTC instant implied by the first offset. This keeps DST
  // boundaries tied to the actual local birth moment rather than client input.
  for (let i = 0; i < 2; i += 1) {
    const impliedUtcInstant = new Date(localDateAsUtc.getTime() - offset * 3_600_000);
    const nextOffset = getTimezoneOffsetHours(timezoneId, impliedUtcInstant);

    if (Math.abs(nextOffset - offset) < 0.000001) break;
    offset = nextOffset;
  }

  return offset;
}

function normalizeStoredPrimeStack(value: unknown): PrimeStackCodon[] | null {
  if (!Array.isArray(value) || value.length !== 9) return null;

  const positions = value.map((entry): PrimeStackCodon | null => {
    if (!entry || typeof entry !== 'object') return null;
    const row = entry as Record<string, unknown>;
    const rawCodon = row.codon ?? row.codonId ?? row.rootCodonId;
    const codon = typeof rawCodon === 'number'
      ? rawCodon
      : parseInt(String(rawCodon ?? '').replace(/^RC/i, ''), 10);
    const rawFacet = row.facet;
    const facetFromId = typeof row.codon256Id === 'string'
      ? row.codon256Id.match(/-([ABCD])$/)?.[1]
      : undefined;
    const facet = isFacetLetter(rawFacet) ? rawFacet : facetFromId;
    const position = typeof row.position === 'number' ? row.position : NaN;
    const weightedFrequency = typeof row.weightedFrequency === 'number'
      ? row.weightedFrequency
      : typeof row.baseFrequency === 'number'
        ? row.baseFrequency
        : NaN;

    if (!Number.isFinite(codon) || codon < 1 || codon > 64) return null;
    if (!isFacetLetter(facet)) return null;
    if (!Number.isFinite(position)) return null;
    if (!Number.isFinite(weightedFrequency)) return null;

    return {
      ...(row as unknown as PrimeStackCodon),
      position,
      codon,
      facet,
      codon256Id: `${codon}-${facet}`,
      weightedFrequency,
      baseFrequency: typeof row.baseFrequency === 'number' ? row.baseFrequency : weightedFrequency,
      weight: typeof row.weight === 'number' ? row.weight : 1,
      codonName: typeof row.codonName === 'string' ? row.codonName : `Codon ${codon}`,
      name: typeof row.name === 'string' ? row.name : `Position ${position}`,
    } as PrimeStackCodon;
  });

  if (positions.some(position => position === null)) return null;
  return positions as PrimeStackCodon[];
}

function buildPrimeStackMapForDynamic(positions: PrimeStackCodon[]): PrimeStackMap {
  return {
    positions,
    activations: [],
    totalWeight: positions.reduce((sum, position) => sum + (position.weight ?? 0), 0),
    dominantPosition: positions[0]?.position ?? 1,
    circuitLinks: [],
    coreCodonEngine: {
      dominant: positions.slice(0, 3),
      supporting: positions.slice(3, 6),
    },
    channelStatuses: [],
    centerStatuses: {} as PrimeStackMap['centerStatuses'],
    vrcType: 'Reflector',
    vrcAuthority: 'None/Outer',
  };
}

function confidenceForInterference(interference: SLIScore['interference']) {
  if (interference === 'severe') return 0.9;
  if (interference === 'moderate') return 0.7;
  return 0.5;
}

function sliScoreKey(score: SLIScore) {
  return `${score.position}:${score.codon256Id}`;
}

export const rgpRouter = router({
  staticSignature: publicProcedure
    .input(z.object({
      birthDate: z.string(),
      birthTime: z.string().optional(),
      birthLocation: z.string().optional(),
      // Structured location (preferred over raw birthLocation string)
      birthLatitude: z.number().optional(),
      birthLongitude: z.number().optional(),
      birthTimezoneOffset: z.number().optional(),
      birthCity: z.string().optional(),
      userId: z.string().optional(),
      coherenceScore: z.number().optional().default(55),
    }))
      .mutation(async ({ input }) => {
      try {
        const birthDateObj = new Date(input.birthDate);
        const userId = input.userId || 'anonymous';

        let consciousChartData: Record<string, number>;
        let designChartData: Record<string, number>;
        let ephemerisData: object | null = null;

        // Resolve coordinates — prefer structured fields, fall back to raw string
        const hasStructured = input.birthLatitude !== undefined && input.birthLongitude !== undefined;
        const hasRawString  = input.birthTime && input.birthLocation;

        if (!input.birthTime || (!hasStructured && !hasRawString)) {
          throw new Error('Exact birth time and coordinates are required for a confirmed Static Signature.');
        }

        let latitude: number, longitude: number;

        if (hasStructured) {
          latitude  = input.birthLatitude!;
          longitude = input.birthLongitude!;
        } else {
          const locationParts = input.birthLocation!.split(',');
          latitude  = parseFloat(locationParts[0]);
          longitude = parseFloat(locationParts[1]);
        }

        if (isNaN(latitude) || isNaN(longitude)) {
          throw new Error('Valid birth latitude and longitude are required for a confirmed Static Signature.');
        }

        const timezone = deriveTimezoneOffsetHours(
          birthDateObj,
          input.birthTime,
          latitude,
          longitude
        );

        // VRC § 2: Calculate BOTH Conscious (T_birth) and Design (T_design) charts.
        const { conscious, design } = await calculateBothCharts(
          birthDateObj,
          input.birthTime,
          latitude,
          longitude,
          timezone
        );

        // Build planet name → longitude maps for each chart.
        consciousChartData = {};
        for (const [name, pos] of Object.entries(conscious.planets)) {
          consciousChartData[name] = pos.longitude;
        }

        designChartData = {};
        for (const [name, pos] of Object.entries(design.planets)) {
          designChartData[name] = pos.longitude;
        }

        ephemerisData = {
          conscious: {
            jd: conscious.jd,
            planets: Object.values(conscious.planets).map(p => ({
              name: p.planet,
              longitude: p.longitude,
              zodiacSign: p.zodiacSign,
              zodiacDegree: p.zodiacDegree,
            })),
          },
          design: {
            jd: design.jd,
            planets: Object.values(design.planets).map(p => ({
              name: p.planet,
              longitude: p.longitude,
              zodiacSign: p.zodiacSign,
              zodiacDegree: p.zodiacDegree,
            })),
          },
        };

        const reading = await generateStaticSignature(
          userId,
          {
            birthDate: birthDateObj,
            birthTime: input.birthTime,
            conscious: Object.fromEntries(Object.entries(consciousChartData)),
            design: Object.fromEntries(Object.entries(designChartData)),
          }
        );

        const primeStackDetails = reading.primeStack.map(pos => ({
          position:         pos.position,
          name:             pos.name,
          source:           pos.source,
          codonId:          String(pos.codon),
          codonName:        pos.codonName,
          facet:            pos.facet,
          facetFull:        pos.facetFull,
          center:           pos.center,
          weight:           pos.weight,
          longitude:        pos.longitude,
          baseFrequency:    pos.baseFrequency,
          weightedFrequency:pos.weightedFrequency,
        }));

        return {
          success: true,
          data: {
            readingId:           reading.readingId,
            userId:              reading.userId,
            birthDate:           reading.birthChartData.birthDate?.toISOString(),
            birthTime:           reading.birthChartData.birthTime,
            birthLocation:       input.birthLocation,
            ephemerisData,
            primeStack:          primeStackDetails,
            ninecenters:         reading.ninecenters,
            fractalRole:         reading.fractalRole,
            authorityNode:       reading.authorityNode,
            vrcType:             reading.vrcType,
            vrcAuthority:        reading.vrcAuthority,
            activations:         reading.activations,
            channelStatuses:     reading.channelStatuses,
            circuitLinks:        reading.circuitLinks,
            legacyCircuitLinks:  reading.legacyCircuitLinks,
            baseCoherence:       reading.baseCoherence,
            hasRealCoherence: false,
            coherenceTrajectory: reading.coherenceTrajectory,
            microCorrections:    reading.microCorrections,
            diagnosticTransmission: reading.diagnosticTransmission,
            coreCodonEngine:     reading.coreCodonEngine,
            specVersion:         reading.specVersion,
            calculationStatus:   reading.calculationStatus,
          },
        };
      } catch (error) {
        console.error('[RGP] Static signature error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate static signature',
        };
      }
    }),

  dynamicState: publicProcedure
    .input(z.object({
      mentalNoise:          z.number().min(0).max(10),
      bodyTension:          z.number().min(0).max(10),
      emotionalTurbulence:  z.number().min(0).max(10),
      breathCompletion:     z.union([z.literal(0), z.literal(1)]),
      birthDate:            z.string(),
      birthTime:            z.string().optional(),
      birthLocation:        z.string().optional(),
      userId:               z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const state: CarrierlockState = {
          mentalNoise:         input.mentalNoise,
          bodyTension:         input.bodyTension,
          emotionalTurbulence: input.emotionalTurbulence,
          breathCompletion:    input.breathCompletion as 0 | 1,
        };

        const coherenceScore = calculateCoherenceScore(state);
        const stateAmplifier = calculateStateAmplifier(coherenceScore);
        const facetLoudness = determineFacetLoudness(
          input.mentalNoise,
          input.bodyTension,
          input.emotionalTurbulence,
          coherenceScore
        );
        const facetAmplitudes = {
          A: facetLoudness.A,
          B: facetLoudness.B,
          C: facetLoudness.C,
          D: facetLoudness.D,
        };

        // ── Personalise with user's static signature if available ─────────────
        let vrcType: string | undefined;
        let vrcAuthority: string | undefined;
        let fractalRole: string | undefined;
        let primeCodonName: string | undefined;
        let primeCodonCenter: string | undefined;
        let primeStackPositions: PrimeStackCodon[] | null = null;

        if (input.userId) {
          try {
            const numericId = parseInt(input.userId, 10);
            if (!isNaN(numericId)) {
              const { getUserStaticProfile } = await import('./db');
              const latest = await getUserStaticProfile(numericId);
              if (latest) {
                vrcType      = latest.vrcType     ?? undefined;
                vrcAuthority = latest.vrcAuthority ?? undefined;
                fractalRole  = latest.fractalRole  ?? undefined;
                if (latest.primeStack) {
                  try {
                    const stack = Array.isArray(latest.primeStack)
                      ? latest.primeStack
                      : JSON.parse(String(latest.primeStack));
                    primeStackPositions = normalizeStoredPrimeStack(stack);
                    const prime = Array.isArray(stack) ? stack[0] : null;
                    if (prime) {
                      primeCodonName   = prime.codonName ?? undefined;
                      primeCodonCenter = prime.center    ?? undefined;
                    }
                  } catch { /* primeStack unreadable — skip personalisation */ }
                }
              }
            }
          } catch (err) {
            console.warn('[RGP] Could not load static signature for dynamic state:', err);
          }
        }

        if (!primeStackPositions) {
          return {
            success: false,
            requiresStaticProfile: true,
            error: 'Create your natal profile before opening a Carrierlock SLI diagnostic.',
          };
        }

        const primeStackMap = buildPrimeStackMapForDynamic(primeStackPositions);
        const sliScoreRows = calculateSLIScores(primeStackMap, stateAmplifier, facetAmplitudes);
        const interferencePattern = analyzeInterferencePattern(sliScoreRows);
        const microCorrections = generateMicroCorrections(sliScoreRows, interferencePattern);
        const falsifiers = generateFalsifiers(sliScoreRows, interferencePattern);
        const flaggedScores = [...sliScoreRows]
          .sort((a, b) => b.sliValue - a.sliValue)
          .slice(0, 3);
        const flaggedCodons = flaggedScores.map(score => score.codon256Id);
        const sliScores = Object.fromEntries(
          sliScoreRows.map(score => [sliScoreKey(score), Number(score.sliValue.toFixed(2))])
        );
        const activeFacets = Object.fromEntries(
          flaggedScores.map(score => [
            score.codon256Id,
            score.codon256Id.match(/-([ABCD])$/)?.[1] ?? '',
          ]).filter(([, facet]) => Boolean(facet))
        );
        const confidenceLevels = Object.fromEntries(
          flaggedScores.map(score => [
            score.codon256Id,
            confidenceForInterference(score.interference),
          ])
        );
        const primaryScore = flaggedScores[0];
        const primaryPosition = primaryScore
          ? primeStackPositions.find(position => position.position === primaryScore.position)
          : undefined;
        const primaryCorrection = microCorrections[0];
        const correctionFacet = primaryScore?.codon256Id.match(/-([ABCD])$/)?.[1] as FacetLetter | undefined;
        const falsifier = primaryCorrection?.falsifiers[0] ?? falsifiers[0] ?? '';
        const microCorrection = primaryCorrection?.description;

        // ── Generate ORIEL transmission ───────────────────────────────────────
        const { generateORIELDynamicTransmission } = await import('./oriel-dynamic-transmission');
        const transmission = await generateORIELDynamicTransmission({
          coherenceScore,
          mentalNoise:         input.mentalNoise,
          bodyTension:         input.bodyTension,
          emotionalTurbulence: input.emotionalTurbulence,
          breathCompletion:    input.breathCompletion === 1,
          vrcType,
          vrcAuthority,
          fractalRole,
          primeCodonName,
          primeCodonCenter,
          primaryInterferenceCodon: primaryScore?.codon256Id,
          primaryInterferenceName: primaryPosition?.codonName,
          primaryInterferenceFacet: correctionFacet,
          primaryInterferenceSli: primaryScore?.sliValue,
          interferencePattern: interferencePattern.type,
          microCorrection,
          falsifier,
        });

        return {
          success: true,
          data: {
            coherenceScore,
            orielTransmission: transmission.orielTransmission,
            coherenceLabel:    transmission.coherenceLabel,
            collapsed:         transmission.collapsed,
            mentalNoise:         input.mentalNoise,
            bodyTension:         input.bodyTension,
            emotionalTurbulence: input.emotionalTurbulence,
            breathCompletion:    input.breathCompletion,
            // Static signature context for Resonance Context view
            hasStaticSignature: !!vrcType,
            vrcType,
            vrcAuthority,
            fractalRole,
            primeCodonName,
            primeCodonCenter,
            stateAmplifier,
            facetAmplitudes,
            interferencePattern: {
              type: interferencePattern.type,
              severity: interferencePattern.severity,
              affectedPositions: interferencePattern.affectedPositions,
              description: interferencePattern.description,
            },
            flaggedCodons,
            sliScores,
            activeFacets,
            confidenceLevels,
            microCorrection,
            correctionFacet,
            falsifier,
          },
        };
      } catch (error) {
        console.error('[RGP] Dynamic state error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate dynamic state reading',
        };
      }
    }),
});
