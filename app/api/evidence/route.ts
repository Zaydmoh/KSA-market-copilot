/**
 * API Endpoint: GET /api/evidence
 * Generates evidence list markdown for an analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/kb/db';
import { generateEvidenceList } from '@/lib/evidence/generator';
import { PackResult } from '@/lib/packs/types';
import { PACKS } from '@/lib/packs/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/evidence?analysisId=<uuid>
 * Generates evidence list markdown document
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');
    const format = searchParams.get('format') || 'markdown'; // 'markdown' or 'json'

    if (!analysisId) {
      return NextResponse.json(
        { error: 'analysisId parameter required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(analysisId)) {
      return NextResponse.json(
        { error: 'Invalid analysis ID format' },
        { status: 400 }
      );
    }

    console.log(`[Evidence] Generating evidence list for analysis: ${analysisId}`);

    // Fetch analysis with all completed packs
    const analysisResult = await query(
      `SELECT 
        a.analysis_id,
        a.created_at,
        p.name as project_name,
        d.filename as document_name,
        json_agg(
          json_build_object(
            'pack_id', ap.pack_id,
            'status', ap.status,
            'output_json', ap.output_json
          )
        ) FILTER (WHERE ap.status = 'completed') as packs
      FROM analyses a
      LEFT JOIN projects p ON a.project_id = p.project_id
      LEFT JOIN documents d ON a.document_id = d.document_id
      LEFT JOIN analysis_packs ap ON a.analysis_id = ap.analysis_id
      WHERE a.analysis_id = $1
      GROUP BY a.analysis_id, p.name, d.filename`,
      [analysisId]
    );

    if (analysisResult.length === 0) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    const analysis = analysisResult[0];
    const packs = analysis.packs || [];

    if (packs.length === 0) {
      return NextResponse.json(
        { error: 'No completed packs found for this analysis' },
        { status: 404 }
      );
    }

    // Prepare pack results for evidence generation
    const packResults = packs
      .map((pack: any) => {
        const packInfo = PACKS[pack.pack_id as keyof typeof PACKS];
        if (!packInfo || !pack.output_json) {
          return null;
        }

        return {
          packId: pack.pack_id,
          packTitle: packInfo.title,
          result: pack.output_json as PackResult,
        };
      })
      .filter((p: any) => p !== null);

    if (packResults.length === 0) {
      return NextResponse.json(
        { error: 'No valid pack results found' },
        { status: 404 }
      );
    }

    // Generate evidence list
    const markdown = generateEvidenceList(packResults, {
      projectName: analysis.project_name,
      documentName: analysis.document_name,
      analysisDate: new Date(analysis.created_at),
    });

    console.log(`[Evidence] Generated evidence list (${markdown.length} chars)`);

    if (format === 'json') {
      // Return JSON format with structured data
      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          markdown,
          metadata: {
            projectName: analysis.project_name,
            documentName: analysis.document_name,
            analysisDate: analysis.created_at,
            packCount: packResults.length,
          },
        },
      });
    }

    // Return as downloadable markdown file
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="evidence-required-${analysisId.substring(0, 8)}.md"`,
      },
    });
  } catch (error) {
    console.error('[Evidence] Error generating evidence list:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate evidence list',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

