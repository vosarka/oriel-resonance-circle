/**
 * RGP DIAGNOSTIC ROUTER
 * 
 * Provides tRPC endpoints for the Resonance Genetics Protocol system.
 * Uses the comprehensive RGP engine for proper calculations.
 */

import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import {
  generateStaticSignature,
  generateDynamicReading,
  calculateCoherenceScore,
  generateFalsifiers,
  type CarrierlockState,
  type StaticSignature,
  type SLIResult,
} from './rgp-engine';
import { ROOT_CODONS } from './vossari-codex-knowledge';

export const rgpRouter = router({
  /**
   * Generate a Static Signature reading from birth data
   * This is the "birth chart" equivalent - the permanent blueprint
   */
  staticSignature: publicProcedure
    .input(z.object({
      birthDate: z.string(), // ISO date string
      birthTime: z.string().optional(), // HH:MM format
      birthLocation: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const birthDateObj = new Date(input.birthDate);
        
        // Generate the complete static signature
        const signature = generateStaticSignature(
          birthDateObj,
          input.birthTime,
          input.birthLocation
        );
        
        // Format the response with all relevant data
        const primeStackDetails = Object.entries(signature.primeStack).map(([position, data]) => {
          const codonKey = data.codonId as keyof typeof ROOT_CODONS;
          const codon = ROOT_CODONS[codonKey];
          return {
            position,
            codonId: data.codonId,
            codonName: codon?.name || 'Unknown',
            codonTitle: codon?.title || 'Unknown',
            facet: data.facet,
            facetName: data.facet === 'A' ? 'Somatic Seed' : 
                       data.facet === 'B' ? 'Relational Current' :
                       data.facet === 'C' ? 'Mental Architect' : 'Transcendent Witness',
            weight: data.weight,
            shadow: codon?.shadow || '',
            gift: codon?.gift || '',
            crown: codon?.crown || '',
          };
        });

        // Get the primary codon for main display
        const primaryCodon = signature.primeStack.conscious_sun;
        const primaryCodonKey = primaryCodon.codonId as keyof typeof ROOT_CODONS;
        const primaryCodonData = ROOT_CODONS[primaryCodonKey];

        // Generate falsifiers for this signature
        const falsifiers = generateFalsifiers(
          signature.fractalProfile,
          signature.primeStack,
          [] // No SLI results for static signature
        );

        return {
          success: true,
          data: {
            receiverId: signature.receiverId,
            birthDate: signature.birthDate.toISOString(),
            birthTime: signature.birthTime,
            birthLocation: signature.birthLocation,
            designOffset: signature.designOffset.toISOString(),
            
            // Primary codon info
            primaryCodon: {
              id: primaryCodon.codonId,
              name: primaryCodonData?.name || 'Unknown',
              title: primaryCodonData?.title || 'Unknown',
              facet: primaryCodon.facet,
              shadow: primaryCodonData?.shadow || '',
              gift: primaryCodonData?.gift || '',
              crown: primaryCodonData?.crown || '',
            },
            
            // Full Prime Stack
            primeStack: primeStackDetails,
            
            // 9-Center Map
            centerMap: signature.centerMap,
            
            // Circuit Links
            circuitLinks: signature.circuitLinks,
            
            // Fractal Profile
            fractalProfile: signature.fractalProfile,
            
            // Falsifiers for verification
            falsifiers,
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

  /**
   * Generate a Dynamic State (Carrierlock) reading
   * This captures the current moment's resonance state
   */
  dynamicState: publicProcedure
    .input(z.object({
      mentalNoise: z.number().min(0).max(10),
      bodyTension: z.number().min(0).max(10),
      emotionalTurbulence: z.number().min(0).max(10),
      breathCompletion: z.union([z.literal(0), z.literal(1)]),
      // Required: birth data to generate static signature first
      birthDate: z.string(),
      birthTime: z.string().optional(),
      birthLocation: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const carrierlockState: CarrierlockState = {
          mentalNoise: input.mentalNoise,
          bodyTension: input.bodyTension,
          emotionalTurbulence: input.emotionalTurbulence,
          breathCompletion: input.breathCompletion as 0 | 1,
        };

        // First generate the static signature
        const birthDateObj = new Date(input.birthDate);
        const staticSignature = generateStaticSignature(
          birthDateObj,
          input.birthTime,
          input.birthLocation
        );

        // Then generate the dynamic reading based on current state
        const dynamicReading = generateDynamicReading(
          carrierlockState,
          staticSignature
        );

        // Format SLI results with codon details
        const sliResults = dynamicReading.sliResults.map((sli: SLIResult) => {
          const codonKey = sli.codonId as keyof typeof ROOT_CODONS;
          const codon = ROOT_CODONS[codonKey];
          return {
            codonId: sli.codonId,
            fullId: sli.fullId,
            codonName: codon?.name || sli.codonName,
            codonTitle: codon?.title || 'Unknown',
            sliScore: sli.sliScore,
            level: sli.level,
            facet: sli.facet,
            facetName: sli.facetName,
            shadow: codon?.shadow || sli.shadow,
            gift: codon?.gift || sli.gift,
            crown: codon?.crown || sli.crown,
          };
        });

        return {
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            coherenceScore: dynamicReading.coherenceScore,
            stateAmplifier: dynamicReading.stateAmplifier,
            facetLoudness: dynamicReading.facetLoudness,
            dominantFacet: dynamicReading.dominantFacet,
            
            // SLI results sorted by score
            sliResults,
            
            // Primary interference (highest SLI)
            primaryInterference: dynamicReading.primaryInterference ? {
              codonId: dynamicReading.primaryInterference.codonId,
              codonName: dynamicReading.primaryInterference.codonName,
              sliScore: dynamicReading.primaryInterference.sliScore,
              shadow: dynamicReading.primaryInterference.shadow,
            } : null,
            
            // Secondary interferences
            secondaryInterferences: dynamicReading.secondaryInterferences.map((sli: SLIResult) => ({
              codonId: sli.codonId,
              codonName: sli.codonName,
              sliScore: sli.sliScore,
            })),
            
            // Micro-correction
            microCorrection: dynamicReading.microCorrection,
            
            // Falsifiers
            falsifiers: dynamicReading.falsifiers,
            
            // Raw Carrierlock values for display
            carrierlock: {
              mentalNoise: input.mentalNoise,
              bodyTension: input.bodyTension,
              emotionalTurbulence: input.emotionalTurbulence,
              breathCompletion: input.breathCompletion,
            },
          },
        };
      } catch (error) {
        console.error('[RGP] Dynamic state error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate dynamic state',
        };
      }
    }),

  /**
   * Get detailed codon information
   */
  getCodon: publicProcedure
    .input(z.object({
      codonId: z.string(),
    }))
    .query(({ input }) => {
      const codonKey = input.codonId as keyof typeof ROOT_CODONS;
      const codon = ROOT_CODONS[codonKey];
      
      if (!codon) {
        return {
          success: false,
          error: `Codon ${input.codonId} not found`,
        };
      }

      return {
        success: true,
        data: {
          id: input.codonId,
          name: codon.name,
          title: codon.title,
          essence: codon.essence,
          shadow: codon.shadow,
          gift: codon.gift,
          crown: codon.crown,
          domain: codon.domain,
        },
      };
    }),

  /**
   * Get all 64 root codons
   */
  getAllCodons: publicProcedure
    .query(() => {
      const codons = Object.entries(ROOT_CODONS).map(([id, codon]) => ({
        id,
        name: codon.name,
        title: codon.title,
        essence: codon.essence,
        shadow: codon.shadow,
        gift: codon.gift,
        crown: codon.crown,
        domain: codon.domain,
      }));

      return {
        success: true,
        data: codons,
      };
    }),

  /**
   * Calculate coherence score from Carrierlock values
   */
  calculateCoherence: publicProcedure
    .input(z.object({
      mentalNoise: z.number().min(0).max(10),
      bodyTension: z.number().min(0).max(10),
      emotionalTurbulence: z.number().min(0).max(10),
      breathCompletion: z.union([z.literal(0), z.literal(1)]),
    }))
    .query(({ input }) => {
      const carrierlockState: CarrierlockState = {
        mentalNoise: input.mentalNoise,
        bodyTension: input.bodyTension,
        emotionalTurbulence: input.emotionalTurbulence,
        breathCompletion: input.breathCompletion as 0 | 1,
      };

      const coherenceScore = calculateCoherenceScore(carrierlockState);

      return {
        success: true,
        data: {
          coherenceScore,
          breakdown: {
            mentalNoiseImpact: input.mentalNoise * 3,
            bodyTensionImpact: input.bodyTension * 3,
            emotionalTurbulenceImpact: input.emotionalTurbulence * 3,
            breathBonus: input.breathCompletion * 10,
          },
        },
      };
    }),
});

export type RgpRouter = typeof rgpRouter;
