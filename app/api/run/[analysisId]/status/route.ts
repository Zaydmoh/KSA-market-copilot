/**
 * GET /api/run/[analysisId]/status
 * Returns the status of an analysis run with per-pack progress
 * Task 6.0: Database persistence implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/kb/db';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AnalysisPackRow {
  analysis_pack_id: string;
  pack_id: string;
  status: string;
  score: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * GET /api/run/[analysisId]/status
 * Returns current status and progress for an analysis run from database
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await context.params;

    console.log(`[Status] Fetching status for analysis: ${analysisId}`);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(analysisId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid analysis ID format',
            code: 'INVALID_ID',
          },
        },
        { status: 400 }
      );
    }

    // Fetch analysis with packs
    const analysisResult = await query(
      `SELECT 
        a.analysis_id,
        a.status as overall_status,
        a.created_at,
        a.completed_at,
        a.locale,
        d.filename,
        json_agg(
          json_build_object(
            'analysis_pack_id', ap.analysis_pack_id,
            'pack_id', ap.pack_id,
            'status', ap.status,
            'score', ap.score,
            'error_message', ap.error_message,
            'started_at', ap.started_at,
            'completed_at', ap.completed_at
          ) ORDER BY ap.pack_id
        ) as packs
      FROM analyses a
      LEFT JOIN documents d ON a.document_id = d.document_id
      LEFT JOIN analysis_packs ap ON a.analysis_id = ap.analysis_id
      WHERE a.analysis_id = $1
      GROUP BY a.analysis_id, d.filename`,
      [analysisId]
    );

    if (analysisResult.length === 0) {
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

    const analysis = analysisResult[0];
    const packs = analysis.packs || [];

    // Calculate overall progress
    const totalPacks = packs.length;
    const completedPacks = packs.filter(
      (p: AnalysisPackRow) => p.status === 'completed' || p.status === 'failed'
    ).length;
    const progress = totalPacks > 0 ? Math.round((completedPacks / totalPacks) * 100) : 0;

    // Determine overall status
    const allCompleted = packs.every((p: AnalysisPackRow) => p.status === 'completed');
    const anyFailed = packs.some((p: AnalysisPackRow) => p.status === 'failed');
    const overallStatus = allCompleted 
      ? 'completed' 
      : anyFailed 
        ? 'partial' 
        : completedPacks > 0 
          ? 'processing' 
          : 'queued';

    // Return status response
    return NextResponse.json(
      {
        success: true,
        data: {
          analysisId,
          overallStatus,
          progress,
          createdAt: analysis.created_at,
          completedAt: analysis.completed_at,
          locale: analysis.locale,
          filename: analysis.filename,
          packs: packs.map((pack: AnalysisPackRow) => ({
            analysisPackId: pack.analysis_pack_id,
            packId: pack.pack_id,
            status: pack.status,
            score: pack.score,
            error: pack.error_message,
            startedAt: pack.started_at,
            completedAt: pack.completed_at,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Status] Error fetching analysis status:', error);

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

