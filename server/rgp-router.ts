import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import {
  generateStaticSignature,
  type StaticSignatureReading,
} from './rgp-static-signature-engine';
import { calculateCoherenceScore, type CarrierlockState } from './rgp-engine';

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
        
        const reading = await generateStaticSignature(
          userId,
          {
            birthDate: birthDateObj,
            birthTime: input.birthTime,
            sun: 0,
            moon: 0,
            chiron: 0,
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
