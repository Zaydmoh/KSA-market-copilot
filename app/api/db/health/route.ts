// app/api/db/health/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getClient } from '@/lib/kb/db';

export async function GET() {
  const c = await getClient();
  try {
    const t0 = Date.now();
    const r = await c.query('select now() as now');
    return NextResponse.json({ 
      ok: true, 
      latencyMs: Date.now() - t0, 
      now: r.rows[0].now 
    });
  } catch (e) {
    return NextResponse.json({ 
      ok: false, 
      error: String(e) 
    }, { status: 500 });
  } finally {
    c.release();
  }
}

