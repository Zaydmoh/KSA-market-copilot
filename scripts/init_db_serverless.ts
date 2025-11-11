// scripts/init_db_serverless.ts
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

const envLocal = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL not set in .env.local');
  process.exit(1);
}

async function main() {
  try {
    const sql = neon(url, { fetchConnectionCache: true });
    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
    const ddl = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔌 Connected over Neon serverless. Applying schema…');
    // Run whole DDL batch
    await sql.unsafe(ddl);
    console.log('✅ Schema applied successfully.');
  } catch (e: any) {
    console.error('❌ Failed to apply schema:', e?.message || e);
    process.exit(1);
  }
}

main();

