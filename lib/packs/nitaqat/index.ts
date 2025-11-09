/**
 * Nitaqat (Saudization) Pack
 * Analyzes workforce localization compliance
 */

import { z } from 'zod';
import { PolicyPack, PackResult, ChecklistItem, ChecklistItemStatus, CitationRef } from '../types';
import { calculateBandDetails } from './calc';
import { searchChunks } from '@/lib/kb/search';

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
 * Fetch citations for a checklist item
 */
async function fetchCitations(
  itemKey: string,
  query: string,
  k: number = 2
): Promise<CitationRef[]> {
  try {
    // Only fetch if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping citation retrieval');
      return [];
    }

    const results = await searchChunks({
      packId: 'nitaqat',
      version: 'v2025.10',
      query,
      k,
      minSimilarity: 0.65,
    });

    return results.map(r => ({
      chunkId: r.id,
      regCode: r.regCode,
      url: r.url || '',
      article: r.article || undefined,
      version: 'v2025.10',
      confidence: r.similarity,
      publishedOn: undefined,
    }));
  } catch (error) {
    console.error(`Error fetching citations for ${itemKey}:`, error);
    return [];
  }
}

/**
 * Analyze Nitaqat compliance
 */
async function analyzeNitaqat(
  _docText: string,
  inputs: NitaqatInputs
): Promise<PackResult> {
  try {
    const { sector, headcount, currentSaudiPct } = inputs;

    // If currentSaudiPct is not provided, we can't do full analysis
    if (currentSaudiPct === undefined) {
      return {
        status: 'partial',
        score: 0,
        checklist: [
          {
            key: 'current_percentage_missing',
            title: 'Current Saudization Percentage Required',
            description: 'Please provide your current Saudi employee percentage to complete the analysis.',
            status: 'unknown',
            criticality: 5,
            recommendation: 'Calculate: (Number of Saudi employees / Total employees) × 100',
            citations: [],
          },
        ],
        packVersion: 'v2025.10',
        summary: 'Cannot complete analysis without current Saudi employee percentage.',
      };
    }

    // Calculate band details
    const details = calculateBandDetails(sector, headcount, currentSaudiPct);

    // Build checklist items
    const checklist: ChecklistItem[] = [];

    // 1. Quota Threshold Check
    const quotaMet = details.currentPct >= details.targetPct;
    checklist.push({
      key: 'quota_threshold',
      title: 'Minimum Saudization Quota',
      description: `Your company (${details.sectorName}, ${headcount} employees) has a current Saudization rate of ${currentSaudiPct.toFixed(1)}%. The minimum green band target is ${details.targetPct}%.`,
      status: quotaMet ? 'pass' : 'fail',
      criticality: 5,
      recommendation: quotaMet
        ? 'You are meeting the minimum quota. Maintain or improve this ratio.'
        : `You need to increase Saudi hiring by approximately ${Math.ceil((details.targetPct - details.currentPct) * headcount / 100)} employees to reach the green band minimum.`,
      citations: [],
    });

    // 2. Band Status
    const bandStatus: ChecklistItemStatus = 
      details.band === 'platinum' || details.band === 'green' ? 'pass' :
      details.band === 'yellow' ? 'warn' : 'fail';

    checklist.push({
      key: 'nitaqat_band',
      title: 'Nitaqat Band Classification',
      description: `Your company is currently in the ${details.band.toUpperCase()} band (${details.currentPct.toFixed(1)}%).${
        details.nextBand 
          ? ` To reach ${details.nextBand.toUpperCase()}, you need ${details.nextBandThreshold}% Saudization.`
          : ' You are in the highest band with incentive benefits.'
      }`,
      status: bandStatus,
      criticality: 5,
      recommendation: 
        details.band === 'red' 
          ? 'RED BAND: Immediate action required. You may face penalties, work visa restrictions, and cannot access government services.'
          : details.band === 'yellow'
          ? 'YELLOW BAND: Improve hiring to avoid restrictions on new foreign worker visas.'
          : details.band === 'green'
          ? 'GREEN BAND: Compliant. You can apply for work visas and access government services.'
          : 'PLATINUM BAND: Excellent! You qualify for priority government services and incentives.',
      citations: [],
    });

    // 3. Monthly Monitoring
    checklist.push({
      key: 'monthly_monitoring',
      title: 'Monthly HRSD Reporting',
      description: 'Nitaqat status is calculated monthly based on data from the Ministry of Human Resources and Social Development (HRSD) systems.',
      status: 'unknown',
      criticality: 3,
      recommendation: 'Ensure all Saudi employees are registered in GOSI and Mudad systems. Monitor your Nitaqat status monthly via Qiwa portal.',
      citations: [],
    });

    // 4. Training and Development
    const trainingNeeded = details.band !== 'platinum';
    checklist.push({
      key: 'training_plan',
      title: 'Saudi Employee Training Program',
      description: trainingNeeded 
        ? 'Implementing training programs for Saudi employees can help improve retention and count favorably in Nitaqat calculations.'
        : 'Continue investing in Saudi employee development to maintain platinum status.',
      status: trainingNeeded ? 'warn' : 'pass',
      criticality: 2,
      recommendation: trainingNeeded
        ? 'Develop a structured training and career development program for Saudi nationals. Consider partnerships with HRDF (Human Resources Development Fund) for subsidized training.'
        : 'Maintain your training programs and consider expanding mentorship initiatives.',
      citations: [],
    });

    // 5. Hiring Plan (if below green)
    if (details.band === 'red' || details.band === 'yellow') {
      checklist.push({
        key: 'hiring_plan',
        title: 'Saudi Hiring Action Plan',
        description: `You are ${Math.abs(details.gap).toFixed(1)}% below the green band minimum. Immediate hiring plan required.`,
        status: 'fail',
        criticality: 5,
        recommendation: `Create a 90-day action plan to hire approximately ${Math.ceil(Math.abs(details.gap) * headcount / 100)} Saudi nationals. Utilize Jadarat, HRDF programs, and recruitment agencies specializing in Saudi talent.`,
        citations: [],
      });
    }

    // 6. Compliance Documentation
    checklist.push({
      key: 'documentation',
      title: 'Compliance Documentation',
      description: 'Maintain records of all Saudi employee contracts, GOSI registrations, and Nitaqat status reports.',
      status: 'unknown',
      criticality: 2,
      recommendation: 'Keep monthly Nitaqat status exports from Qiwa portal. Document all hiring efforts and training programs for audits.',
      citations: [],
    });

    // Attach citations from KB
    console.log('Fetching citations for Nitaqat checklist items...');
    for (const item of checklist) {
      const query = `${item.title} ${item.description}`.substring(0, 500);
      item.citations = await fetchCitations(item.key, query, 2);
      
      if (item.citations.length > 0) {
        console.log(`✓ Found ${item.citations.length} citation(s) for ${item.key}`);
      }
    }

    // Calculate score
    const score = scoreNitaqat({ status: 'completed', score: 0, checklist, packVersion: 'v2025.10' });

    return {
      status: 'completed',
      score,
      checklist,
      packVersion: 'v2025.10',
      summary: `Nitaqat Analysis: ${details.band.toUpperCase()} band with ${currentSaudiPct.toFixed(1)}% Saudization. ${
        details.gap > 0 
          ? `Need ${details.gap.toFixed(1)}% more to reach target.` 
          : 'Meeting minimum requirements.'
      }`,
    };
  } catch (error) {
    console.error('Nitaqat analysis error:', error);
    return {
      status: 'failed',
      score: 0,
      checklist: [],
      packVersion: 'v2025.10',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Calculate weighted score from checklist
 */
function scoreNitaqat(result: PackResult): number {
  const items = result.checklist;
  if (items.length === 0) return 0;

  let totalWeight = 0;
  let earnedPoints = 0;

  for (const item of items) {
    totalWeight += item.criticality;

    if (item.status === 'pass') {
      earnedPoints += item.criticality;
    } else if (item.status === 'warn') {
      earnedPoints += item.criticality * 0.5;
    }
    // 'fail' and 'unknown' earn 0 points
  }

  return totalWeight > 0 ? Math.round((earnedPoints / totalWeight) * 100) : 0;
}

/**
 * Nitaqat Pack Implementation
 */
export const NitaqatPack: PolicyPack<typeof NitaqatInputsSchema, PackResult> = {
  id: 'nitaqat',
  title: 'Nitaqat (Saudization)',
  version: 'v2025.10',
  description: 'Saudi workforce localization requirements and compliance',
  inputsSchema: NitaqatInputsSchema,
  analyze: analyzeNitaqat,
  score: scoreNitaqat,
};

