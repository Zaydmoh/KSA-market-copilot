/**
 * Client-Safe Pack Registry
 * METADATA ONLY - No server-only code, safe for client components
 * Use this in 'use client' components; use registry.ts in server components/API routes
 */

import { PackId } from './types';

/**
 * Client-safe pack metadata (no analyze functions)
 */
export interface PackMetadata {
  id: PackId;
  title: string;
  version: string;
  description: string;
}

/**
 * Client-safe pack metadata registry
 * Safe to import in client components
 */
export const PACK_METADATA: Record<PackId, PackMetadata> = {
  nitaqat: {
    id: 'nitaqat',
    title: 'Nitaqat (Saudization)',
    version: 'v2025.10',
    description: 'Workforce localization and Saudization compliance requirements',
  },
  zatca_phase2: {
    id: 'zatca_phase2',
    title: 'ZATCA e-Invoicing (Phase 2)',
    version: 'v2025.10',
    description: 'Electronic invoicing Phase 2 readiness and compliance requirements',
  },
  pdpl: {
    id: 'pdpl',
    title: 'PDPL & Data Residency',
    version: 'v2025.10',
    description: 'Personal Data Protection Law compliance',
  },
  saber_sfda: {
    id: 'saber_sfda',
    title: 'SABER/SFDA Certification',
    version: 'v2025.10',
    description: 'Product certification and conformity assessment',
  },
  rhq: {
    id: 'rhq',
    title: 'RHQ Eligibility',
    version: 'v2025.10',
    description: 'Regional Headquarters eligibility assessment',
  },
};

/**
 * Get pack metadata by ID (client-safe)
 */
export function getPackMetadata(id: PackId): PackMetadata | undefined {
  return PACK_METADATA[id];
}

/**
 * Get all pack IDs (client-safe)
 */
export function getAvailablePackIds(): PackId[] {
  return Object.keys(PACK_METADATA) as PackId[];
}

/**
 * Check if a pack ID is valid (client-safe)
 */
export function isValidPackId(id: string): id is PackId {
  return id in PACK_METADATA;
}

