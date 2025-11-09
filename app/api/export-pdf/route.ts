import { NextRequest, NextResponse } from 'next/server';
import { generateReportPDF } from '@/lib/pdf-generator';
import type { AnalysisResult } from '@/lib/types';
import { z } from 'zod';

// Force Node.js runtime for PDF generation
export const runtime = 'nodejs';

// Zod schemas for validation
const ComplianceItemSchema = z.object({
  requirement: z.string(),
  status: z.enum(['addressed', 'missing', 'unclear']),
  recommendation: z.string(),
  citation: z.string(),
});

const CitationSchema = z.object({
  regulation: z.string(),
  article: z.string(),
  url: z.string(),
});

const AnalysisResultSchema = z.object({
  executiveSummary: z.string(),
  applicableLicenses: z.array(z.string()),
  checklist: z.array(ComplianceItemSchema),
  citations: z.array(CitationSchema),
});

/**
 * POST /api/export-pdf
 * Generates a PDF report from analysis results
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Received PDF export request');

    // Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate the analysis result structure
    let analysisResult: AnalysisResult;
    try {
      analysisResult = AnalysisResultSchema.parse(body);
    } catch (error) {
      console.error('Validation error:', error);
      return NextResponse.json(
        {
          error: 'Invalid analysis result format',
          details: error instanceof z.ZodError ? error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Validate that the analysis has meaningful content
    if (analysisResult.checklist.length === 0) {
      return NextResponse.json(
        { error: 'Analysis result must contain at least one checklist item' },
        { status: 400 }
      );
    }

    console.log('Generating PDF report...');

    // Generate the PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateReportPDF(analysisResult);
    } catch (error) {
      console.error('PDF generation error:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate PDF',
          details: error instanceof Error ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    console.log(`PDF generated successfully (${pdfBuffer.length} bytes)`);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `misa-analysis-${timestamp}.pdf`;

    // Return the PDF as a binary response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Unexpected error in export-pdf endpoint:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while generating the PDF',
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export-pdf
 * Returns information about the export-pdf endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      endpoint: '/api/export-pdf',
      method: 'POST',
      description: 'Generates a PDF report from analysis results',
      requestBody: {
        type: 'application/json',
        schema: 'AnalysisResult',
        requiredFields: [
          'executiveSummary',
          'applicableLicenses',
          'checklist',
          'citations',
        ],
      },
      response: {
        contentType: 'application/pdf',
        disposition: 'attachment',
        filename: 'misa-analysis-YYYY-MM-DD.pdf',
      },
    },
    { status: 200 }
  );
}

