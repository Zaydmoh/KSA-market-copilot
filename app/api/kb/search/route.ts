/**
 * KB Search Debug Endpoint
 * For development and testing of KB retrieval
 * 
 * GET /api/kb/search?q=saudization&pack=nitaqat&version=v2025.10&k=5
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchChunks, getKBStats } from '@/lib/kb/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/kb/search
 * Search knowledge base
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const packId = searchParams.get('pack');
    const version = searchParams.get('version');
    const k = parseInt(searchParams.get('k') || '10', 10);
    const minSimilarity = parseFloat(searchParams.get('min_similarity') || '0.0');

    // If no query, return stats
    if (!query) {
      const stats = await getKBStats(
        packId || undefined,
        version || undefined
      );
      
      return NextResponse.json({
        success: true,
        data: {
          stats,
          usage: {
            query: 'Search query text',
            pack: 'Pack ID (nitaqat, zatca_phase2, etc.)',
            version: 'Version (v2025.10)',
            k: 'Number of results (default 10)',
            min_similarity: 'Minimum similarity score 0-1 (default 0)',
          },
        },
      });
    }

    // Validate required params
    if (!packId || !version) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required parameters: pack, version',
            code: 'MISSING_PARAMS',
          },
        },
        { status: 400 }
      );
    }

    console.log(`KB Search: "${query}" in ${packId}/${version} (k=${k})`);

    // Perform search
    const results = await searchChunks({
      packId,
      version,
      query,
      k,
      minSimilarity,
    });

    return NextResponse.json({
      success: true,
      data: {
        query,
        packId,
        version,
        resultCount: results.length,
        results: results.map(r => ({
          id: r.id,
          regCode: r.regCode,
          article: r.article,
          section: r.section,
          similarity: r.similarity.toFixed(3),
          url: r.url,
          preview: r.text.substring(0, 200) + (r.text.length > 200 ? '...' : ''),
          fullText: r.text,
        })),
      },
    });
  } catch (error) {
    console.error('KB search error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'KB search failed',
          code: 'SEARCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
