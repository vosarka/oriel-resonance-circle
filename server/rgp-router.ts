import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import {
  generateStaticSignature,
  type StaticSignatureReading,
} from './rgp-static-signature-engine';
import { calculateCoherenceScore, type CarrierlockState } from './rgp-engine';
import { calculateBirthChart, getAllPlanetPositions } from './ephemeris-service';

export const rgpRouter = router({
  staticSignature: publicProcedure
    .input(z.object({
      birthDate: z.string(),
      birthTime: z.string().optional(),
      birthLocation: z.string().optional(),
      userId: z.string().optional(),
      coherenceScore: z.number().optional().default(50),
    }))
    .mutation(async ({ input }) => {
      try {
        const birthDateObj = new Date(input.birthDate);
        const userId = input.userId || 'anonymous';
        
        // Calculate real planetary positions using ephemeris
        let birthChart = null;
        let planetaryData = {
          sun: 0,
          moon: 0,
          chiron: 0,
        };
        
        if (input.birthTime && input.birthLocation) {
          try {
            // Parse birth location (format: "latitude,longitude,timezone")
            const locationParts = input.birthLocation.split(',');
            const latitude = parseFloat(locationParts[0]);
            const longitude = parseFloat(locationParts[1]);
            const timezone = locationParts[2] ? parseFloat(locationParts[2]) : 0;
            
            if (!isNaN(latitude) && !isNaN(longitude)) {
              birthChart = await calculateBirthChart(
                birthDateObj,
                input.birthTime,
                latitude,
                longitude,
                timezone
              );
              
              // Extract planetary positions for RGP calculation
              const planets = getAllPlanetPositions(birthChart);
              const sunPos = planets.find(p => p.planet === 'Sun');
              const moonPos = planets.find(p => p.planet === 'Moon');
              const chironPos = planets.find(p => p.planet === 'Chiron');
              
              if (sunPos) planetaryData.sun = sunPos.longitude;
              if (moonPos) planetaryData.moon = moonPos.longitude;
              if (chironPos) planetaryData.chiron = chironPos.longitude;
            }
          } catch (error) {
            console.error('[Ephemeris] Failed to calculate birth chart:', error);
            // Fall back to placeholder values
          }
        }
        
        const reading = await generateStaticSignature(
          userId,
          {
            birthDate: birthDateObj,
            birthTime: input.birthTime,
            sun: planetaryData.sun,
            moon: planetaryData.moon,
            chiron: planetaryData.chiron,
          },
          input.coherenceScore
        );
        
        const primeStackDetails = reading.primeStack.map((pos) => ({
          position: pos.position,
          codonId: pos.rootCodonId,
          codonName: pos.name,
          facet: pos.facet,
          weight: pos.weight,
          baseFrequency: pos.baseFrequency,
          weightedFrequency: pos.weightedFrequency,
        }));

        return {
          success: true,
          data: {
            readingId: reading.readingId,
            userId: reading.userId,
            birthDate: reading.birthChartData.birthDate?.toISOString(),
            birthTime: reading.birthChartData.birthTime,
            birthLocation: input.birthLocation,
            ephemerisData: birthChart ? {
              jd: birthChart.jd,
              planets: Object.values(birthChart.planets).map(p => ({
                name: p.planet,
                longitude: p.longitude,
                latitude: p.latitude,
                zodiacSign: p.zodiacSign,
                zodiacDegree: p.zodiacDegree,
              })),
            } : null,
            primeStack: primeStackDetails,
            ninecenters: reading.ninecenters,
            fractalRole: reading.fractalRole,
            authorityNode: reading.authorityNode,
            circuitLinks: reading.circuitLinks,
            baseCoherence: reading.baseCoherence,
            coherenceTrajectory: reading.coherenceTrajectory,
            microCorrections: reading.microCorrections,
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
      mentalNoise: z.number().min(0).max(10),
      bodyTension: z.number().min(0).max(10),
      emotionalTurbulence: z.number().min(0).max(10),
      breathCompletion: z.union([z.literal(0), z.literal(1)]),
      birthDate: z.string(),
      birthTime: z.string().optional(),
      birthLocation: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const state: CarrierlockState = {
          mentalNoise: input.mentalNoise,
          bodyTension: input.bodyTension,
          emotionalTurbulence: input.emotionalTurbulence,
          breathCompletion: input.breathCompletion as 0 | 1,
        };
        
        const coherenceScore = calculateCoherenceScore(state);

        return {
          success: true,
          data: {
            coherenceScore,
            mentalNoise: input.mentalNoise,
            bodyTension: input.bodyTension,
            emotionalTurbulence: input.emotionalTurbulence,
            breathCompletion: input.breathCompletion,
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
