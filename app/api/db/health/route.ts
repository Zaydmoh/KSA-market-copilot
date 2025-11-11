export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import { neon } from '@neondatabase/serverless';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: 'DATABASE_URL missing' }, { status: 500 });
  }

  try {
    // Neon serverless driver uses fetch/WebSocket over port 443 (works behind strict networks)
    const sql = neon(url);
    const t0 = Date.now();
    const rows = await sql`select now() as now`;
    return NextResponse.json({ ok: true, driver: 'neon-serverless', latencyMs: Date.now() - t0, now: rows[0].now });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
