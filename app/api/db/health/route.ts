export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ ok:false, error:'DATABASE_URL missing' }, { status:500 });

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX ?? 3),
      connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS ?? 20000),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 10000),
      keepAlive: true,
      // <-- important: accept Supabase's cert chain
      ssl: { rejectUnauthorized: false },
    });

    const t0 = Date.now();
    const r = await pool.query('select now() as now');
    await pool.end();

    return NextResponse.json({ ok:true, latencyMs: Date.now() - t0, now: r.rows[0].now });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status:500 });
  }
}

