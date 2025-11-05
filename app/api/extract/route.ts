import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const BASE = 'https://llmwhisperer-api.us-central.unstract.com/api/v2';
const KEY = process.env.LLMWHISPERER_API_KEY || '';

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!KEY) return json({ error: { message: 'Missing LLMWHISPERER_API_KEY' } }, 500);

    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof Blob)) {
      return json({ error: { message: 'No file uploaded' } }, 400);
    }

    const pdf = Buffer.from(await (file as Blob).arrayBuffer());

    const res = await fetch(`${BASE}/whisper?mode=native_text&output_mode=layout_preserving`, {
      method: 'POST',
      headers: {
        'unstract-key': KEY,
        'Content-Type': 'application/pdf',
      },
      body: pdf,
    });

    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('text/plain')) {
      const text = (await res.text()).trim();
      return json({
        text,
        length: text.length,
        preview: text.slice(0, 600),
        source: 'unstract',
      });
    }

    const body = ct.includes('application/json') ? await res.json().catch(() => ({})) : {};
    if (!res.ok) {
      const msg = typeof body === 'string' ? body : body?.message || 'Unstract error';
      return json({ error: { message: msg } }, res.status);
    }

    const status = body?.status || 'processing';
    const hash = body?.whisper_hash || body?.hash || body?.job_id || null;
    return json({ status, hash }, 202);
  } catch (e: any) {
    return json({ error: { message: e?.message || 'Submit failed' } }, 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!KEY) return json({ error: { message: 'Missing LLMWHISPERER_API_KEY' } }, 500);

    const { searchParams } = new URL(req.url);
    const hash = searchParams.get('hash');
    if (!hash) return json({ error: { message: 'Missing hash' } }, 400);

    // 1) Status
    const statusRes = await fetch(`${BASE}/whisper-status?whisper_hash=${encodeURIComponent(hash)}`, {
      headers: { 'unstract-key': KEY },
    });

    const statusCT = statusRes.headers.get('content-type') || '';
    const statusBody = statusCT.includes('application/json')
      ? await statusRes.json().catch(() => ({}))
      : {};

    if (!statusRes.ok) {
      const msg = typeof statusBody === 'string' ? statusBody : statusBody?.message || 'Status error';
      return json({ error: { message: msg } }, statusRes.status);
    }

    const status = (statusBody?.status || '').toLowerCase();
    if (status !== 'processed') {
      return json({ status: status || 'processing' }, 202);
    }

    // 2) Retrieve (one-time)
    const retRes = await fetch(
      `${BASE}/whisper-retrieve?whisper_hash=${encodeURIComponent(hash)}&text_only=true`,
      { headers: { 'unstract-key': KEY } }
    );

    const retCT = retRes.headers.get('content-type') || '';
    if (!retRes.ok) {
      const err = retCT.includes('application/json')
        ? await retRes.json().catch(() => ({}))
        : await retRes.text().catch(() => '');
      const msg = typeof err === 'string' ? err : err?.message || 'Retrieve error';
      return json({ error: { message: msg } }, retRes.status);
    }

    const text = (await retRes.text()).trim();
    return json({
      status: 'completed',
      text,
      length: text.length,
      preview: text.slice(0, 600),
      source: 'unstract',
    });
  } catch (e: any) {
    return json({ error: { message: e?.message || 'Status/Retrieve failed' } }, 500);
  }
}
