/**
 * ZATCA e-Invoicing Phase 2 Pack - Client-Safe Entry Point
 * This file can be imported by client components (contains no server-only code)
 */

import { z } from 'zod';
import { PolicyPack, PackResult } from '../types';

/**
 * Input schema for ZATCA Phase 2 pack
 */
export const ZATCAPhase2InputsSchema = z.object({
  erp: z.string().min(1),
  format: z.enum(['XML', 'UBL', 'CSV', 'PDF', 'Other'] as const).default('Other'),
  apiCapable: z.boolean().default(false),
  exportInvoices: z.boolean().default(false),
  b2bPct: z.number().min(0).max(100).optional(),
  peppol: z.boolean().default(false),
});

export type ZATCAPhase2Inputs = z.infer<typeof ZATCAPhase2InputsSchema>;

/**
 * Execute ZATCA Phase 2 analysis (lazy-loads server code)
 */
export async function executeZATCAPhase2Analysis(
  docText: string,
  inputs: ZATCAPhase2Inputs
): Promise<PackResult> {
  // Dynamic import ensures server code is only loaded server-side
  const { runZATCAPhase2Analysis } = await import('./server');
  return runZATCAPhase2Analysis(docText, inputs);
}

/**
 * Calculate score from pack result
 */
export function scoreZATCAPhase2Result(result: PackResult): number {
  return result.score;
}

/**
 * ZATCA Phase 2 Pack Export (client-safe metadata + execution function)
 */
export const ZATCAPhase2Pack: PolicyPack<typeof ZATCAPhase2InputsSchema, PackResult> = {
  id: 'zatca_phase2',
  title: 'ZATCA e-Invoicing (Phase 2)',
  version: 'v2025.10',
  description: 'Electronic invoicing Phase 2 readiness and compliance requirements',
  inputsSchema: ZATCAPhase2InputsSchema,
  analyze: executeZATCAPhase2Analysis,
  score: scoreZATCAPhase2Result,
};

