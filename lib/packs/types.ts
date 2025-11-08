/**
 * Phase 2: Policy Pack Types
 * Core interfaces and types for modular compliance packs
 */

import { z } from 'zod';

/**
 * Unique identifier for each policy pack
 */
export type PackId = 
  | 'nitaqat' 
  | 'zatca_phase2' 
  | 'pdpl' 
  | 'saber_sfda' 
  | 'rhq';

/**
 * Status of pack analysis
 */
export type PackStatus = 
  | 'queued' 
  | 'extracting' 
  | 'analyzing' 
  | 'completed' 
  | 'failed';

/**
 * Status of individual checklist items
 */
export type ChecklistItemStatus = 'pass' | 'warn' | 'fail' | 'unknown';

/**
 * Citation reference to a specific regulation clause
 */
export interface CitationRef {
  /** UUID of the chunk in kb_chunks */
  chunkId: string;
  /** Regulation code (e.g., "PDPL", "ZATCA_Phase2") */
  regCode: string;
  /** Official URL to the source regulation */
  url: string;
  /** Specific article or section reference (e.g., "§12.b") */
  article?: string;
  /** Version of the regulation (e.g., "v2025.10") */
  version: string;
  /** Confidence score [0..1] */
  confidence: number;
  /** Published date of the regulation */
  publishedOn?: string;
}

/**
 * Individual item in a pack's compliance checklist
 */
export interface ChecklistItem {
  /** Unique key for this item within the pack */
  key: string;
  /** Human-readable title */
  title: string;
  /** Detailed description or finding */
  description: string;
  /** Pass/warn/fail/unknown */
  status: ChecklistItemStatus;
  /** Criticality weight (1-5, where 5 is most critical) */
  criticality: number;
  /** Actionable recommendation if not passing */
  recommendation?: string;
  /** Supporting citations from KB */
  citations: CitationRef[];
}

/**
 * Result returned by a pack's analyze() function
 */
export interface PackResult {
  /** Overall status of the pack analysis */
  status: 'completed' | 'partial' | 'failed';
  /** Normalized score 0-100 */
  score: number;
  /** Checklist items with status + citations */
  checklist: ChecklistItem[];
  /** Pack version used for this analysis */
  packVersion: string;
  /** Summary text (optional) */
  summary?: string;
  /** Errors encountered (if status is 'failed' or 'partial') */
  errors?: string[];
}

/**
 * Generic PolicyPack interface
 * Each pack implements this with specific input/output types
 */
export interface PolicyPack<I extends z.ZodTypeAny = z.ZodTypeAny, O = PackResult> {
  /** Unique pack identifier */
  id: PackId;
  /** Display title */
  title: string;
  /** Pack version (e.g., "v2025.10") */
  version: string;
  /** Short description */
  description: string;
  /** Zod schema for pack-specific inputs */
  inputsSchema: I;
  /** 
   * Main analysis function
   * @param docText - Extracted document text
   * @param inputs - Validated pack inputs (parsed via inputsSchema)
   * @returns PackResult with checklist and citations
   */
  analyze: (docText: string, inputs: z.infer<I>) => Promise<O>;
  /**
   * Scoring function (computes 0-100 from checklist items)
   * @param result - Pack output
   * @returns Score 0-100
   */
  score: (result: O) => number;
  /**
   * Evidence mapping (optional)
   * Returns templates for missing evidence items
   */
  evidenceMap?: (result: O) => Record<string, string>;
}

/**
 * Type-safe helper to infer input type from a pack
 */
export type PackInputs<P extends PolicyPack> = z.infer<P['inputsSchema']>;

/**
 * Type-safe helper to infer output type from a pack
 */
export type PackOutput<P extends PolicyPack> = P extends PolicyPack<z.ZodTypeAny, infer O> ? O : never;

