/**
 * Nitaqat (Saudization) Pack - Client-Safe Entry Point
 * This file can be imported by client components (contains no server-only code)
 */

import { z } from 'zod';
import { PolicyPack, PackResult } from '../types';

/**
 * Input schema for Nitaqat pack
 */
export const NitaqatInputsSchema = z.object({
  sector: z.enum([
    'retail',
    'construction',
    'information_technology',
    'manufacturing',
    'hospitality',
    'other',
  ] as const).default('other'),
  headcount: z.number().int().positive().min(1),
  currentSaudiPct: z.number().min(0).max(100).optional(),
});

export type NitaqatInputs = z.infer<typeof NitaqatInputsSchema>;

/**
 * Execute Nitaqat analysis (lazy-loads server code)
 */
export async function executeNitaqatAnalysis(
  docText: string,
  inputs: NitaqatInputs
): Promise<PackResult> {
  // Dynamic import ensures server code is only loaded server-side
  const { runNitaqatAnalysis } = await import('./server');
  return runNitaqatAnalysis(docText, inputs);
}

/**
 * Calculate score from pack result
 */
export function scoreNitaqatResult(result: PackResult): number {
  return result.score;
}

/**
 * Nitaqat Pack Export (client-safe metadata + execution function)
 */
export const NitaqatPack: PolicyPack<typeof NitaqatInputsSchema, PackResult> = {
  id: 'nitaqat',
  title: 'Nitaqat (Saudization)',
  version: 'v2025.10',
  description: 'Workforce localization and Saudization compliance requirements',
  inputsSchema: NitaqatInputsSchema,
  analyze: executeNitaqatAnalysis,
  score: scoreNitaqatResult,
};

