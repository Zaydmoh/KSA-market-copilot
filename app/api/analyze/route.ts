/**
 * API Endpoint: POST /api/analyze
 * Per-pack analysis endpoint with database persistence
 * Orchestrates extraction → analysis → citation storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, getClient } from '@/lib/kb/db';
import { PACKS } from '@/lib/packs/registry';
import { PackId } from '@/lib/packs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for complex analyses

const AnalyzeRequestSchema = z.object({
  analysisId: z.string().uuid(),
  packId: z.string(),
  inputs: z.record(z.any()).optional(),
  docText: z.string().optional(),
});

/**
 * POST /api/analyze
 * Analyzes a document with a specific pack and persists results
 */
export async function POST(request: NextRequest) {
  const client = await getClient();
  
  try {
    // Parse and validate request
    const body = await request.json();
    const parsed = AnalyzeRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }
    
    const { analysisId, packId, inputs = {}, docText = '' } = parsed.data;
    
    // Validate pack exists
    const pack = PACKS[packId as PackId];
    if (!pack) {
      return NextResponse.json(
        { error: `Pack not found: ${packId}` },
        { status: 404 }
      );
    }
    
    console.log(`[Analyze] Starting analysis: ${analysisId} / ${packId}`);
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Check if analysis_pack exists
    const checkResult = await client.query(
      `SELECT analysis_pack_id, status FROM analysis_packs 
       WHERE analysis_id = $1 AND pack_id = $2`,
      [analysisId, packId]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Analysis pack not found' },
        { status: 404 }
      );
    }
    
    const analysisPackId = checkResult.rows[0].analysis_pack_id;
    const currentStatus = checkResult.rows[0].status;
    
    // Don't re-run if already completed
    if (currentStatus === 'completed') {
      await client.query('ROLLBACK');
      return NextResponse.json({
        success: true,
        message: 'Analysis already completed',
        analysisPackId,
      });
    }
    
    // 2. Update status to 'analyzing'
    await client.query(
      `UPDATE analysis_packs 
       SET status = 'analyzing', started_at = CURRENT_TIMESTAMP 
       WHERE analysis_pack_id = $1`,
      [analysisPackId]
    );
    
    await client.query('COMMIT');
    
    // 3. Validate inputs against pack schema
    let validatedInputs;
    try {
      validatedInputs = pack.inputsSchema.parse(inputs);
    } catch (error) {
      // Update status to failed
      await client.query(
        `UPDATE analysis_packs 
         SET status = 'failed', 
             error_message = $1, 
             completed_at = CURRENT_TIMESTAMP 
         WHERE analysis_pack_id = $2`,
        [
          error instanceof Error ? error.message : 'Invalid inputs',
          analysisPackId,
        ]
      );
      
      return NextResponse.json(
        {
          error: 'Invalid pack inputs',
          details: error instanceof z.ZodError ? error.issues : error,
        },
        { status: 400 }
      );
    }
    
    // 4. Run pack analysis
    console.log(`[Analyze] Running ${packId} pack...`);
    const startTime = Date.now();
    
    let result;
    try {
      result = await pack.analyze(docText, validatedInputs);
    } catch (error) {
      console.error(`[Analyze] Pack analysis failed:`, error);
      
      // Update status to failed
      await client.query(
        `UPDATE analysis_packs 
         SET status = 'failed', 
             error_message = $1, 
             completed_at = CURRENT_TIMESTAMP 
         WHERE analysis_pack_id = $2`,
        [
          error instanceof Error ? error.message : 'Analysis failed',
          analysisPackId,
        ]
      );
      
      return NextResponse.json(
        {
          error: 'Pack analysis failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Analyze] ${packId} completed in ${duration}ms`);
    
    // 5. Persist results
    await client.query('BEGIN');
    
    try {
      // Update analysis_pack with results
      await client.query(
        `UPDATE analysis_packs 
         SET status = $1, 
             inputs_json = $2, 
             output_json = $3, 
             score = $4, 
             completed_at = CURRENT_TIMESTAMP 
         WHERE analysis_pack_id = $5`,
        [
          result.status,
          JSON.stringify(validatedInputs),
          JSON.stringify(result),
          result.score,
          analysisPackId,
        ]
      );
      
      // 6. Store citations
      for (const item of result.checklist) {
        for (const citation of item.citations || []) {
          await client.query(
            `INSERT INTO citations (analysis_pack_id, checklist_item_key, chunk_id, confidence)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (analysis_pack_id, checklist_item_key, chunk_id) DO NOTHING`,
            [analysisPackId, item.key, citation.chunkId, citation.confidence]
          );
        }
      }
      
      // 7. Update parent analysis status if all packs are done
      const packsStatus = await client.query(
        `SELECT status FROM analysis_packs WHERE analysis_id = $1`,
        [analysisId]
      );
      
      const allCompleted = packsStatus.rows.every(
        (row) => row.status === 'completed' || row.status === 'failed'
      );
      
      if (allCompleted) {
        const anyFailed = packsStatus.rows.some((row) => row.status === 'failed');
        const overallStatus = anyFailed ? 'partial' : 'completed';
        
        await client.query(
          `UPDATE analyses 
           SET status = $1, completed_at = CURRENT_TIMESTAMP 
           WHERE analysis_id = $2`,
          [overallStatus, analysisId]
        );
      }
      
      await client.query('COMMIT');
      
      console.log(`[Analyze] Results persisted for ${packId}`);
      
      return NextResponse.json({
        success: true,
        analysisPackId,
        packId,
        score: result.score,
        status: result.status,
        checklistCount: result.checklist.length,
        citationCount: result.checklist.reduce(
          (sum, item) => sum + (item.citations?.length || 0),
          0
        ),
        duration,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Analyze] Failed to persist results:', error);
      
      return NextResponse.json(
        {
          error: 'Failed to persist results',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[Analyze] Rollback failed:', rollbackError);
    }
    
    console.error('[Analyze] Unexpected error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * GET /api/analyze?analysisPackId=<uuid>
 * Retrieve persisted analysis results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisPackId = searchParams.get('analysisPackId');
    
    if (!analysisPackId) {
      return NextResponse.json(
        { error: 'analysisPackId parameter required' },
        { status: 400 }
      );
    }
    
    // Fetch analysis pack with citations
    const result = await query(
      `SELECT 
        ap.analysis_pack_id,
        ap.analysis_id,
        ap.pack_id,
        ap.status,
        ap.inputs_json,
        ap.output_json,
        ap.score,
        ap.error_message,
        ap.started_at,
        ap.completed_at,
        json_agg(
          json_build_object(
            'citation_id', c.citation_id,
            'checklist_item_key', c.checklist_item_key,
            'chunk_id', c.chunk_id,
            'confidence', c.confidence
          )
        ) FILTER (WHERE c.citation_id IS NOT NULL) as citations
      FROM analysis_packs ap
      LEFT JOIN citations c ON ap.analysis_pack_id = c.analysis_pack_id
      WHERE ap.analysis_pack_id = $1
      GROUP BY ap.analysis_pack_id`,
      [analysisPackId]
    );
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Analysis pack not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      analysisPack: result[0],
    });
  } catch (error) {
    console.error('[Analyze GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
