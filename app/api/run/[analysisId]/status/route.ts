/**
 * GET /api/run/[analysisId]/status
 * Returns the status of an analysis run with per-pack progress
 */

import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * In-memory analyses storage (imported from parent route)
 * Will be replaced with DB queries in Task 6.0
 */
const analyses = new Map<string, {
  analysisId: string;
  documentId?: string;
  text?: string;
  packs: Array<{
    packId: string;
    status: string;
    inputs: unknown;
    score?: number;
    outputJson?: unknown;
    error?: string;
  }>;
  locale: string;
  createdAt: string;
}>();

/**
 * GET /api/run/[analysisId]/status
 * Returns current status and progress for an analysis run
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await context.params;

    console.log(`Fetching status for analysis: ${analysisId}`);

    // Fetch analysis record (from in-memory store for now)
    const analysis = analyses.get(analysisId);

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Analysis not found: ${analysisId}`,
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    // Calculate overall progress
    const totalPacks = analysis.packs.length;
    const completedPacks = analysis.packs.filter(
      p => p.status === 'completed' || p.status === 'failed'
    ).length;
    const progress = totalPacks > 0 ? Math.round((completedPacks / totalPacks) * 100) : 0;

    // Determine overall status
    const allCompleted = analysis.packs.every(p => p.status === 'completed');
    const anyFailed = analysis.packs.some(p => p.status === 'failed');
    const overallStatus = allCompleted ? 'completed' : anyFailed ? 'partial' : 'processing';

    // Return status response
    return NextResponse.json(
      {
        success: true,
        data: {
          analysisId,
          overallStatus,
          progress,
          createdAt: analysis.createdAt,
          packs: analysis.packs.map(pack => ({
            packId: pack.packId,
            status: pack.status,
            score: pack.score,
            error: pack.error,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching analysis status:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch analysis status',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

