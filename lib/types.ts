/**
 * Shared TypeScript type definitions for the KSA Market-Entry Copilot
 */

/**
 * Status of a compliance requirement
 */
export type ComplianceStatus = 'addressed' | 'missing' | 'unclear';

/**
 * A single compliance item in the checklist
 */
export interface ComplianceItem {
  requirement: string;
  status: ComplianceStatus;
  recommendation: string;
  citation: string;
}

/**
 * Citation to a specific regulation article
 */
export interface Citation {
  regulation: string;
  article: string;
  url: string;
}

/**
 * Complete analysis result from the AI
 */
export interface AnalysisResult {
  executiveSummary: string;
  applicableLicenses: string[];
  checklist: ComplianceItem[];
  citations: Citation[];
}

/**
 * Error response from file upload or analysis
 */
export interface UploadError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * API response wrapper for analysis endpoint
 */
export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: UploadError;
}

/**
 * Props for components that display compliance status
 */
export interface ComplianceStatusProps {
  status: ComplianceStatus;
  className?: string;
}

/**
 * File validation result
 */
export interface FileValidation {
  valid: boolean;
  error?: string;
}

