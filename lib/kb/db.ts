/**
 * Database Client for KB Operations
 * Requires PostgreSQL with pgvector extension
 * SERVER-ONLY: This module must never be imported by client components
 */

import 'server-only';

// Singleton pool instance
let _pool: import('pg').Pool | null = null;

/**
 * Get or create database connection pool (lazy import)
 */
export async function getPool(): Promise<import('pg').Pool> {
  if (_pool) return _pool;
  
  // Lazy import pg to ensure it's never bundled in client
  const { Pool } = await import('pg');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
      'Example: postgresql://user:password@localhost:5432/ksa_copilot'
    );
  }
  
  _pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased to 10 seconds for Supabase
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL in all environments
  });
  
  _pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });
  
  return _pool;
}

/**
 * Close database pool
 */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

/**
 * Execute a query
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = await getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Get a client for transactions
 */
export async function getClient(): Promise<import('pg').PoolClient> {
  const pool = await getPool();
  return pool.connect();
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

