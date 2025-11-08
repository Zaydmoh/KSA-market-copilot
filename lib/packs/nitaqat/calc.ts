/**
 * Nitaqat Calculator
 * Determines Saudization quotas and band classifications
 */

import thresholdsData from '@/regulations/nitaqat/v2025.10/thresholds.json';

/**
 * Color band classification
 */
export type NitaqatBand = 'red' | 'yellow' | 'green' | 'platinum';

/**
 * Size band structure from thresholds.json
 */
interface SizeBand {
  minHeadcount: number;
  maxHeadcount: number;
  red: { min: number; max: number };
  yellow: { min: number; max: number };
  green: { min: number; max: number };
  platinum: { min: number; max: number };
  targetMin: number;
}

/**
 * Sector data structure
 */
interface SectorData {
  name: string;
  code: string;
  bands: SizeBand[];
}

/**
 * Thresholds data structure
 */
interface ThresholdsData {
  version: string;
  effectiveDate: string;
  description: string;
  sectors: Record<string, SectorData>;
}

const thresholds = thresholdsData as ThresholdsData;

/**
 * Available sector keys
 */
export const AVAILABLE_SECTORS = Object.keys(thresholds.sectors);

/**
 * Get the appropriate size band for a given headcount within a sector
 */
function getSizeBand(sector: string, headcount: number): SizeBand | null {
  const sectorData = thresholds.sectors[sector];
  if (!sectorData) {
    return null;
  }

  // Find the band that contains this headcount
  const band = sectorData.bands.find(
    b => headcount >= b.minHeadcount && headcount <= b.maxHeadcount
  );

  return band || null;
}

/**
 * Calculate the minimum target Saudi percentage for a company
 * @param sector - Economic sector code
 * @param headcount - Total number of employees
 * @returns Minimum target percentage (green band minimum)
 */
export function targetPct(sector: string, headcount: number): number {
  // Validate inputs
  if (headcount <= 0) {
    throw new Error('Headcount must be greater than 0');
  }

  // Normalize sector key (fallback to 'other' if unknown)
  const normalizedSector = AVAILABLE_SECTORS.includes(sector) ? sector : 'other';

  // Get the size band
  const band = getSizeBand(normalizedSector, headcount);

  if (!band) {
    throw new Error(`No size band found for headcount: ${headcount}`);
  }

  // Return the target minimum (green band minimum)
  return band.targetMin;
}

/**
 * Determine which Nitaqat band a company falls into
 * @param currentPct - Current Saudi employee percentage (0-100)
 * @param sector - Economic sector code
 * @param headcount - Total number of employees
 * @returns Color band classification
 */
export function bandFrom(
  currentPct: number,
  sector: string,
  headcount: number
): NitaqatBand {
  // Validate inputs
  if (currentPct < 0 || currentPct > 100) {
    throw new Error('Current percentage must be between 0 and 100');
  }

  if (headcount <= 0) {
    throw new Error('Headcount must be greater than 0');
  }

  // Normalize sector key
  const normalizedSector = AVAILABLE_SECTORS.includes(sector) ? sector : 'other';

  // Get the size band
  const band = getSizeBand(normalizedSector, headcount);

  if (!band) {
    throw new Error(`No size band found for headcount: ${headcount}`);
  }

  // Determine band based on current percentage
  if (currentPct >= band.platinum.min) {
    return 'platinum';
  } else if (currentPct >= band.green.min) {
    return 'green';
  } else if (currentPct >= band.yellow.min) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Get full band details for a company
 */
export interface BandDetails {
  band: NitaqatBand;
  currentPct: number;
  targetPct: number;
  gap: number;
  nextBand: NitaqatBand | null;
  nextBandThreshold: number | null;
  sector: string;
  sectorName: string;
  headcount: number;
  redRange: { min: number; max: number };
  yellowRange: { min: number; max: number };
  greenRange: { min: number; max: number };
  platinumRange: { min: number; max: number };
}

/**
 * Calculate comprehensive band details for a company
 */
export function calculateBandDetails(
  sector: string,
  headcount: number,
  currentPct: number
): BandDetails {
  // Normalize sector
  const normalizedSector = AVAILABLE_SECTORS.includes(sector) ? sector : 'other';
  const sectorData = thresholds.sectors[normalizedSector];

  // Get band
  const sizeBand = getSizeBand(normalizedSector, headcount);
  if (!sizeBand) {
    throw new Error(`No size band found for headcount: ${headcount}`);
  }

  const band = bandFrom(currentPct, normalizedSector, headcount);
  const target = targetPct(normalizedSector, headcount);
  const gap = target - currentPct;

  // Determine next band
  let nextBand: NitaqatBand | null = null;
  let nextBandThreshold: number | null = null;

  if (band === 'red') {
    nextBand = 'yellow';
    nextBandThreshold = sizeBand.yellow.min;
  } else if (band === 'yellow') {
    nextBand = 'green';
    nextBandThreshold = sizeBand.green.min;
  } else if (band === 'green') {
    nextBand = 'platinum';
    nextBandThreshold = sizeBand.platinum.min;
  }
  // platinum has no next band

  return {
    band,
    currentPct,
    targetPct: target,
    gap,
    nextBand,
    nextBandThreshold,
    sector: normalizedSector,
    sectorName: sectorData.name,
    headcount,
    redRange: sizeBand.red,
    yellowRange: sizeBand.yellow,
    greenRange: sizeBand.green,
    platinumRange: sizeBand.platinum,
  };
}

/**
 * Get sector display name
 */
export function getSectorName(sectorKey: string): string {
  const sector = thresholds.sectors[sectorKey];
  return sector ? sector.name : 'Unknown Sector';
}

