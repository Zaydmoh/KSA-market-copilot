/**
 * KB Search Utilities
 * Semantic search over knowledge base using vector similarity
 */

import OpenAI from 'openai';
import { query as dbQuery } from './db';

export interface SearchResult {
  id: string;
  text: string;
  regCode: string;
  url: string | null;
  article: string | null;
  section: string | null;
  similarity: number;
}

export interface SearchOptions {
  packId: string;
  version: string;
  query: string;
  k?: number;
  minSimilarity?: number;
}

/**
 * Generate embedding for search query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  const openai = new OpenAI({ apiKey });
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query.substring(0, 8191),
  });
  
  return response.data[0].embedding;
}

/**
 * Search knowledge base using semantic similarity
 * 
 * @param options - Search options
 * @returns Array of search results sorted by similarity
 */
export async function searchChunks(
  options: SearchOptions
): Promise<SearchResult[]> {
  const { packId, version, query: searchQuery, k = 10, minSimilarity = 0.0 } = options;
  
  // Generate embedding for query
  const queryEmbedding = await generateQueryEmbedding(searchQuery);
  
  // Search using pgvector cosine similarity
  const sql = `
    SELECT 
      c.id,
      c.text,
      s.reg_code,
      s.url,
      c.article,
      c.section,
      1 - (c.embedding <=> $1::vector) AS similarity
    FROM kb_chunks c
    JOIN kb_sources s ON c.source_id = s.source_id
    WHERE c.pack_id = $2
    AND c.version = $3
    AND (1 - (c.embedding <=> $1::vector)) >= $4
    ORDER BY c.embedding <=> $1::vector
    LIMIT $5
  `;
  
  const results = await dbQuery<{
    id: string;
    text: string;
    reg_code: string;
    url: string | null;
    article: string | null;
    section: string | null;
    similarity: number;
  }>(sql, [
    JSON.stringify(queryEmbedding),
    packId,
    version,
    minSimilarity,
    k,
  ]);
  
  return results.map(row => ({
    id: row.id,
    text: row.text,
    regCode: row.reg_code,
    url: row.url,
    article: row.article,
    section: row.section,
    similarity: Number(row.similarity),
  }));
}

/**
 * Hybrid search: combines keyword matching with vector similarity
 * Useful for finding specific article numbers or exact terms
 */
export interface HybridSearchOptions extends SearchOptions {
  keywords?: string[];
  keywordWeight?: number;
}

export async function hybridSearch(
  options: HybridSearchOptions
): Promise<SearchResult[]> {
  const { keywords = [], keywordWeight = 0.3 } = options;
  
  // Get vector search results
  const vectorResults = await searchChunks(options);
  
  if (keywords.length === 0) {
    return vectorResults;
  }
  
  // Boost scores for keyword matches
  const boostedResults = vectorResults.map(result => {
    let keywordScore = 0;
    const lowerText = result.text.toLowerCase();
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        keywordScore += 1;
      }
    }
    
    // Normalize keyword score (0-1)
    keywordScore = Math.min(keywordScore / keywords.length, 1);
    
    // Combine scores
    const combinedScore =
      (1 - keywordWeight) * result.similarity + keywordWeight * keywordScore;
    
    return {
      ...result,
      similarity: combinedScore,
    };
  });
  
  // Re-sort by combined score
  boostedResults.sort((a, b) => b.similarity - a.similarity);
  
  return boostedResults;
}

/**
 * Search for specific article number
 */
export async function searchByArticle(
  packId: string,
  version: string,
  article: string
): Promise<SearchResult[]> {
  const sql = `
    SELECT 
      c.id,
      c.text,
      s.reg_code,
      s.url,
      c.article,
      c.section,
      1.0 AS similarity
    FROM kb_chunks c
    JOIN kb_sources s ON c.source_id = s.source_id
    WHERE c.pack_id = $1
    AND c.version = $2
    AND c.article = $3
    ORDER BY c.created_at
  `;
  
  const results = await dbQuery<{
    id: string;
    text: string;
    reg_code: string;
    url: string | null;
    article: string | null;
    section: string | null;
    similarity: number;
  }>(sql, [packId, version, article]);
  
  return results.map(row => ({
    id: row.id,
    text: row.text,
    regCode: row.reg_code,
    url: row.url,
    article: row.article,
    section: row.section,
    similarity: 1.0,
  }));
}

/**
 * Get random chunks for testing
 */
export async function getRandomChunks(
  packId: string,
  version: string,
  count: number = 5
): Promise<SearchResult[]> {
  const sql = `
    SELECT 
      c.id,
      c.text,
      s.reg_code,
      s.url,
      c.article,
      c.section,
      1.0 AS similarity
    FROM kb_chunks c
    JOIN kb_sources s ON c.source_id = s.source_id
    WHERE c.pack_id = $1
    AND c.version = $2
    ORDER BY RANDOM()
    LIMIT $3
  `;
  
  const results = await dbQuery<{
    id: string;
    text: string;
    reg_code: string;
    url: string | null;
    article: string | null;
    section: string | null;
    similarity: number;
  }>(sql, [packId, version, count]);
  
  return results.map(row => ({
    id: row.id,
    text: row.text,
    regCode: row.reg_code,
    url: row.url,
    article: row.article,
    section: row.section,
    similarity: 1.0,
  }));
}

/**
 * Get KB statistics
 */
export interface KBStats {
  packId: string;
  version: string;
  sourceCount: number;
  chunkCount: number;
  avgChunkTokens: number;
}

export async function getKBStats(
  packId?: string,
  version?: string
): Promise<KBStats[]> {
  let sql = `
    SELECT 
      pack_id,
      version,
      COUNT(DISTINCT source_id) AS source_count,
      COUNT(*) AS chunk_count,
      AVG(token_count) AS avg_chunk_tokens
    FROM kb_chunks
  `;
  
  const params: string[] = [];
  
  if (packId) {
    sql += ` WHERE pack_id = $1`;
    params.push(packId);
    
    if (version) {
      sql += ` AND version = $2`;
      params.push(version);
    }
  }
  
  sql += ` GROUP BY pack_id, version ORDER BY pack_id, version`;
  
  const results = await dbQuery<{
    pack_id: string;
    version: string;
    source_count: string;
    chunk_count: string;
    avg_chunk_tokens: string;
  }>(sql, params);
  
  return results.map(row => ({
    packId: row.pack_id,
    version: row.version,
    sourceCount: parseInt(row.source_count, 10),
    chunkCount: parseInt(row.chunk_count, 10),
    avgChunkTokens: Math.round(parseFloat(row.avg_chunk_tokens)),
  }));
}
