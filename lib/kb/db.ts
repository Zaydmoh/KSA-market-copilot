/**
 * Database Client for KB Operations
 * Requires PostgreSQL with pgvector extension
 */

import { Pool, PoolClient } from 'pg';

// Singleton pool instance
let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is required. ' +
        'Example: postgresql://user:password@localhost:5432/ksa_copilot'
      );
    }
    
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }
  
  return pool;
}

/**
 * Close database pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute a query
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Get a client for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
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

