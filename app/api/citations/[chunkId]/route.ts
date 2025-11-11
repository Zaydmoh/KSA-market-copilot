/**
 * API Endpoint: GET /api/citations/[chunkId]
 * Fetches full text and metadata for a specific citation chunk
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/kb/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChunkData {
  id: string;
  text: string;
  section: string | null;
  article: string | null;
  regCode: string;
  url: string | null;
  title: string;
  version: string;
  publishedOn: string | null;
}

/**
 * GET /api/citations/[chunkId]
 * Returns full text and metadata for a citation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chunkId: string } }
) {
  try {
    const { chunkId } = params;

    if (!chunkId) {
      return NextResponse.json(
        { error: 'Chunk ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(chunkId)) {
      return NextResponse.json(
        { error: 'Invalid chunk ID format' },
        { status: 400 }
      );
    }

    // Fetch chunk data
    const sql = `
      SELECT 
        c.id,
        c.text,
        c.section,
        c.article,
        c.pack_id,
        c.version,
        s.reg_code,
        s.url,
        s.title,
        s.published_on
      FROM kb_chunks c
      JOIN kb_sources s ON c.source_id = s.source_id
      WHERE c.id = $1
    `;

    const results = await query<ChunkData>(sql, [chunkId]);

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Citation not found' },
        { status: 404 }
      );
    }

    const chunk = results[0];

    return NextResponse.json({
      success: true,
      citation: {
        id: chunk.id,
        text: chunk.text,
        section: chunk.section,
        article: chunk.article,
        regCode: chunk.regCode,
        url: chunk.url,
        sourceTitle: chunk.title,
        version: chunk.version,
        publishedOn: chunk.publishedOn,
      },
    });
  } catch (error) {
    console.error('Error fetching citation:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch citation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

