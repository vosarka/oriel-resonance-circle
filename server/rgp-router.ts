import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import {
  generateStaticSignature,
  type StaticSignatureReading,
} from './rgp-static-signature-engine';
import { calculateCoherenceScore, type CarrierlockState } from './rgp-engine';
import { calculateBothCharts, calculateBirthChart, getAllPlanetPositions } from './ephemeris-service';

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
      coherenceScore: z.number().optional().default(50),
    }))
    .mutation(async ({ input }) => {
      try {
        const birthDateObj = new Date(input.birthDate);
        const userId = input.userId || 'anonymous';

        let consciousChartData: Record<string, number> | undefined;
        let designChartData: Record<string, number> | undefined;
        let ephemerisData: object | null = null;

        // Resolve coordinates — prefer structured fields, fall back to raw string
        const hasStructured = input.birthLatitude !== undefined && input.birthLongitude !== undefined;
        const hasRawString  = input.birthTime && input.birthLocation;

        if (input.birthTime && (hasStructured || hasRawString)) {
          try {
            let latitude: number, longitude: number, timezone: number;

            if (hasStructured) {
              latitude  = input.birthLatitude!;
              longitude = input.birthLongitude!;
              timezone  = input.birthTimezoneOffset ?? 0;
            } else {
              const locationParts = input.birthLocation!.split(',');
              latitude  = parseFloat(locationParts[0]);
              longitude = parseFloat(locationParts[1]);
              timezone  = locationParts[2] ? parseFloat(locationParts[2]) : 0;
            }

            if (!isNaN(latitude) && !isNaN(longitude)) {
              // VRC § 2: Calculate BOTH Conscious (T_birth) and Design (T_design) charts
              const { conscious, design } = await calculateBothCharts(
                birthDateObj,
                input.birthTime,
                latitude,
                longitude,
                timezone
              );

              // Build planet name → longitude maps for each chart
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
            }
          } catch (error) {
            console.error('[Ephemeris] Failed to calculate charts:', error);
            // Fall back to legacy flat-field mode
          }
        }

        const reading = await generateStaticSignature(
          userId,
          {
            birthDate: birthDateObj,
            birthTime: input.birthTime,
            conscious: consciousChartData
              ? Object.fromEntries(Object.entries(consciousChartData))
              : undefined,
            design: designChartData
              ? Object.fromEntries(Object.entries(designChartData))
              : undefined,
            // Legacy fallbacks if no location provided
            sun:   consciousChartData?.['Sun'],
            moon:  consciousChartData?.['Moon'],
            chiron:consciousChartData?.['Chiron'],
          },
          input.coherenceScore
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
            circuitLinks:        reading.circuitLinks,
            baseCoherence:       reading.baseCoherence,
            coherenceTrajectory: reading.coherenceTrajectory,
            microCorrections:    reading.microCorrections,
            diagnosticTransmission: reading.diagnosticTransmission,
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

        return {
          success: true,
          data: {
            coherenceScore,
            mentalNoise:         input.mentalNoise,
            bodyTension:         input.bodyTension,
            emotionalTurbulence: input.emotionalTurbulence,
            breathCompletion:    input.breathCompletion,
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
