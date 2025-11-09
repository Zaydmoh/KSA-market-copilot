/**
 * API Endpoint: GET /api/telemetry
 * Returns telemetry statistics for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { telemetry } from '@/lib/telemetry/logger';

export const runtime = 'nodejs';

/**
 * GET /api/telemetry
 * Returns telemetry statistics
 */
export async function GET(_request: NextRequest) {
  try {
    const packStats = telemetry.getPackStats();
    const retrievalStats = telemetry.getRetrievalStats();
    const errorStats = telemetry.getErrorStats();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        packs: packStats,
        retrieval: retrievalStats,
        errors: errorStats,
      },
    });
  } catch (error) {
    console.error('[Telemetry API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch telemetry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

