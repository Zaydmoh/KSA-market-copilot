// app/api/extract/route.ts
import type { NextRequest } from 'next/server';
import { createRequire } from 'module';

export const runtime = 'nodejs';

// Use CommonJS require for pdf2json (pure Node, no canvas needed)
const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (err: any) => {
      reject(new Error(err?.parserError || 'PDF parse error'));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        const pages = pdfData?.formImage?.Pages || [];
        const pageTexts: string[] = [];

        for (const page of pages) {
          const texts = page?.Texts || [];
          // Each Text has an array R with runs, each run has encoded text in T
          const line = texts
            .map((t: any) => {
              const runs = t?.R || [];
              return runs.map((r: any) => decodeURIComponent(r?.T || '')).join('');
            })
            .join(' ');
          pageTexts.push(line.trim());
        }

        resolve(pageTexts.join('\n\n').trim());
      } catch (e: any) {
        reject(new Error(e?.message || 'Failed to assemble PDF text'));
      }
    });

    // Parse from memory buffer (no temp files)
    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!file || !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: { message: 'No file uploaded' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const buffer = Buffer.from(await (file as Blob).arrayBuffer());
    const text = await extractTextFromPdfBuffer(buffer);

   // Instead of returning only { text }
return new Response(
  JSON.stringify({
    text,
    meta: { length: text.length, truncated: text.length > 600 },
    preview: text.slice(0, 600) // first 600 chars to sanity-check
  }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
);

  } catch (err: any) {
    console.error('PDF extract error:', err);
    return new Response(
      JSON.stringify({ error: { message: err?.message || 'Failed to extract text from PDF' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


