/**
 * POST /api/run
 * Creates a new analysis run with selected packs
 * Task 6.0: Database persistence implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PackId } from '@/lib/packs/types';
import { isValidPackId } from '@/lib/packs/registry';
import { getClient } from '@/lib/kb/db';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Request schema validation
 */
const RunRequestSchema = z.object({
  documentId: z.string().uuid().optional(),
  text: z.string().optional(),
  packs: z.array(z.string()),
  inputs: z.record(z.string(), z.unknown()),
  locale: z.string().optional().default('en'),
  projectName: z.string().optional(),
});

/**
 * POST /api/run
 * Creates an analysis run with selected packs (with DB persistence)
 */
export async function POST(request: NextRequest) {
  const client = await getClient();
  
  try {
    console.log('[Run] Received run request');

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validation = RunRequestSchema.safeParse(body);

    if (!validation.success) {
      client.release();
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

    const { 
      documentId, 
      text, 
      packs: packIds, 
      inputs, 
      locale,
      projectName = 'Default Project'
    } = validation.data;

    // Validate that we have either documentId or text
    if (!documentId && !text) {
      client.release();
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
      client.release();
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
      client.release();
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

    // Begin transaction
    await client.query('BEGIN');

    // 1. Create or get project
    const projectResult = await client.query(
      `INSERT INTO projects (name) 
       VALUES ($1) 
       ON CONFLICT DO NOTHING
       RETURNING project_id`,
      [projectName]
    );
    
    let projectId;
    if (projectResult.rows.length > 0) {
      projectId = projectResult.rows[0].project_id;
    } else {
      // Get existing project
      const existingProject = await client.query(
        `SELECT project_id FROM projects WHERE name = $1 LIMIT 1`,
        [projectName]
      );
      projectId = existingProject.rows[0].project_id;
    }

    // 2. Create document if text provided (no documentId)
    let finalDocumentId = documentId;
    if (!documentId && text) {
      const docResult = await client.query(
        `INSERT INTO documents (project_id, filename, extracted_text)
         VALUES ($1, $2, $3)
         RETURNING document_id`,
        [projectId, 'ad-hoc-text', text]
      );
      finalDocumentId = docResult.rows[0].document_id;
    }

    // 3. Create analysis
    const analysisResult = await client.query(
      `INSERT INTO analyses (project_id, document_id, status, locale)
       VALUES ($1, $2, $3, $4)
       RETURNING analysis_id`,
      [projectId, finalDocumentId || null, 'queued', locale]
    );
    const analysisId = analysisResult.rows[0].analysis_id;

    // 4. Create analysis_packs for each selected pack
    for (const packId of packIds) {
      await client.query(
        `INSERT INTO analysis_packs (analysis_id, pack_id, status, inputs_json)
         VALUES ($1, $2, $3, $4)`,
        [analysisId, packId, 'queued', JSON.stringify(inputs[packId] || {})]
      );
    }

    await client.query('COMMIT');

    console.log(`[Run] Created analysis: ${analysisId} with ${packIds.length} pack(s)`);

    // 5. Trigger analysis jobs (in a real system, this would queue jobs)
    // For now, we'll trigger them via client-side polling or separate worker
    
    // Return success with analysisId
    return NextResponse.json(
      {
        success: true,
        data: {
          analysisId,
          packsQueued: packIds.length,
          documentId: finalDocumentId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[Run] Rollback failed:', rollbackError);
    }
    
    console.error('[Run] Error creating analysis run:', error);

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
  } finally {
    client.release();
  }
}

