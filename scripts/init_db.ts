// scripts/init_db.ts
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load .env.local first, then .env as fallback
const envLocal = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const { Client } = await import('pg');
  const sqlPath = path.join(process.cwd(), 'sql', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: true,
  });

  try {
    await client.connect();
    console.log('🔌 Connected. Applying schema…');
    await client.query(sql);
    console.log('✅ Schema applied.');
  } catch (e: any) {
    console.error('❌ Failed:', e?.message || e);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

