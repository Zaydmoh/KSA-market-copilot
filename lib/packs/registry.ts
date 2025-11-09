/**
 * Phase 2: Policy Pack Registry
 * Central registry for all available packs
 * CLIENT-SAFE: Can be imported by client components
 */

import { PolicyPack, PackId } from './types';
import { NitaqatPack } from './nitaqat/index';
import { ZATCAPhase2Pack } from './zatca_phase2/index';

/**
 * Registry of all available policy packs
 * Initially contains placeholders; actual implementations added in subsequent tasks
 */
export const PACKS: Record<PackId, PolicyPack> = {
  nitaqat: NitaqatPack,
  zatca_phase2: ZATCAPhase2Pack,
  pdpl: {
    id: 'pdpl',
    title: 'PDPL & Data Residency',
    version: 'v2025.10',
    description: 'Personal Data Protection Law compliance',
    inputsSchema: {} as never, // Placeholder
    analyze: async () => {
      throw new Error('PDPL pack not yet implemented');
    },
    score: () => 0,
  },
  saber_sfda: {
    id: 'saber_sfda',
    title: 'SABER/SFDA Certification',
    version: 'v2025.10',
    description: 'Product certification and conformity assessment',
    inputsSchema: {} as never, // Placeholder
    analyze: async () => {
      throw new Error('SABER/SFDA pack not yet implemented');
    },
    score: () => 0,
  },
  rhq: {
    id: 'rhq',
    title: 'RHQ Eligibility',
    version: 'v2025.10',
    description: 'Regional Headquarters eligibility assessment',
    inputsSchema: {} as never, // Placeholder
    analyze: async () => {
      throw new Error('RHQ pack not yet implemented');
    },
    score: () => 0,
  },
};

/**
 * Get a specific pack by ID
 * @param id - Pack identifier
 * @returns PolicyPack instance or undefined
 */
export function getPack(id: PackId): PolicyPack | undefined {
  return PACKS[id];
}

/**
 * Get all available pack IDs
 */
export function getAvailablePackIds(): PackId[] {
  return Object.keys(PACKS) as PackId[];
}

/**
 * Check if a pack ID is valid
 */
export function isValidPackId(id: string): id is PackId {
  return id in PACKS;
}

