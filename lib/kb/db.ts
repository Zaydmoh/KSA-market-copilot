/**
 * Database Client for KB Operations (Neon serverless)
 * Uses @neondatabase/serverless over HTTPS/WebSocket (port 443)
 * SERVER-ONLY
 */

import 'server-only';

import type { SQLQueryResultRow } from '@neondatabase/serverless';

import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

let _sql: ReturnType<typeof neon> | null = null;

function requireUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  return url;
}

async function getSql() {
  if (_sql) return _sql;
  _sql = neon(requireUrl(), { fetchConnectionCache: true });
  return _sql;
}

/** run a text query with params (pg-like signature) */
export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const sql = await getSql();
  // neon serverless supports unsafe text + params
  const res = await sql.unsafe(text, params);
  return res as unknown as T[];
}

/** pg-like client shim with .query() and .release() */
export async function getClient(): Promise<{
  query: <T = unknown>(text: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  release: () => void;
  _releaseSafe: () => void;
}> {
  const sql = await getSql();
  return {
    async query<T = unknown>(text: string, params: unknown[] = []) {
      const rows = (await sql.unsafe(text, params)) as unknown as T[];
      return { rows };
    },
    release() {},
    _releaseSafe() {},
  };
}

/** begin/commit/rollback helpers (optional) */
export async function begin() {
  const sql = await getSql();
  await sql`BEGIN`;
}
export async function commit() {
  const sql = await getSql();
  await sql`COMMIT`;
}
export async function rollback() {
  const sql = await getSql();
  await sql`ROLLBACK`;
}

/** closePool no-op (serverless driver manages connections) */
export async function closePool(): Promise<void> {
  _sql = null;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query<{ version: string }>(
      'SELECT version() AS version'
    );
    console.log('✓ Database connected:', result[0]?.version.split(',')[0]);
    
    // Check for pgvector extension
    const extensions = await query<{ extname: string }>(
      "SELECT extname FROM pg_extension WHERE extname = 'vector'"
    );
    
    if (extensions.length === 0) {
      console.warn('⚠ pgvector extension not found. Run: CREATE EXTENSION vector;');
      return false;
    }
    
    console.log('✓ pgvector extension installed');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}
