#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sqlPath = join(__dirname, '..', 'db', 'migrations', '2025-11-Phase2.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Running Phase 2 migrations...');
    console.log('📁 File:', sqlPath);
    console.log('🗄️  Database:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'unknown');
    console.log('');
    
    await client.query(sql);
    
    console.log('✅ Migrations completed successfully!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('  - kb_sources');
    console.log('  - kb_chunks');
    console.log('  - projects');
    console.log('  - documents');
    console.log('  - analyses');
    console.log('  - analysis_packs');
    console.log('  - citations');
    console.log('');
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

