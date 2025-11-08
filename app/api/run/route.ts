/**
 * POST /api/run
 * Creates a new analysis run with selected packs
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PackId, PackStatus } from '@/lib/packs/types';
import { isValidPackId } from '@/lib/packs/registry';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Request schema validation
 */
const RunRequestSchema = z.object({
  documentId: z.string().optional(),
  text: z.string().optional(),
  packs: z.array(z.string()),
  inputs: z.record(z.string(), z.unknown()),
  locale: z.string().optional().default('en'),
});

/**
 * In-memory storage for analyses (Phase 2.0 - will be replaced with DB in Task 6.0)
 */
interface AnalysisRecord {
  analysisId: string;
  documentId?: string;
  text?: string;
  packs: Array<{
    packId: PackId;
    status: PackStatus;
    inputs: unknown;
    score?: number;
    outputJson?: unknown;
    error?: string;
  }>;
  locale: string;
  createdAt: string;
}

const analyses = new Map<string, AnalysisRecord>();

/**
 * Generate a unique analysis ID
 */
function generateAnalysisId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * POST /api/run
 * Creates an analysis run with selected packs
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Received run request');

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validation = RunRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid request format',
            code: 'INVALID_REQUEST',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { documentId, text, packs: packIds, inputs, locale } = validation.data;

    // Validate that we have either documentId or text
    if (!documentId && !text) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Either documentId or text must be provided',
            code: 'MISSING_DOCUMENT',
          },
        },
        { status: 400 }
      );
    }

    // Validate that at least one pack is selected
    if (packIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'At least one pack must be selected',
            code: 'NO_PACKS_SELECTED',
          },
        },
        { status: 400 }
      );
    }

    // Validate all pack IDs
    const invalidPacks = packIds.filter(id => !isValidPackId(id));
    if (invalidPacks.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Invalid pack IDs: ${invalidPacks.join(', ')}`,
            code: 'INVALID_PACK_IDS',
          },
        },
        { status: 400 }
      );
    }

    // Create analysis record
    const analysisId = generateAnalysisId();
    const analysis: AnalysisRecord = {
      analysisId,
      documentId,
      text,
      packs: packIds.map(packId => ({
        packId: packId as PackId,
        status: 'queued' as PackStatus,
        inputs: inputs[packId],
      })),
      locale,
      createdAt: new Date().toISOString(),
    };

    // Store in memory (will be replaced with DB in Task 6.0)
    analyses.set(analysisId, analysis);

    console.log(`Created analysis run: ${analysisId} with ${packIds.length} pack(s)`);

    // Return success with analysisId
    return NextResponse.json(
      {
        success: true,
        data: {
          analysisId,
          packsQueued: packIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating analysis run:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to create analysis run',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Export the analyses map for use by status endpoint
 */
export { analyses };

