import { NextRequest, NextResponse } from 'next/server';
import { buildMISAAnalysisPrompt } from '@/lib/misa-prompt';
import { analyzeDocument } from '@/lib/openai-client';
import type { AnalysisResponse } from '@/lib/types';

// Force Node.js runtime to allow PDF parsing without Edge runtime restrictions
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/analyze
 * Analyzes extracted PDF text against MISA licensing requirements
 * Expects JSON: { text: string, docName?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalysisResponse>> {
  try {
    console.log('Received analysis request');

    // Parse JSON body
    const body = await request.json().catch(() => ({}));
    const { text: documentText, docName = 'document.pdf' } = body;

    // Validate that text was provided
    if (!documentText || typeof documentText !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No text provided. Please provide extracted PDF text.',
            code: 'NO_TEXT',
          },
        },
        { status: 400 }
      );
    }

    // Validate that we have meaningful content
    if (documentText.trim().length < 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'The document contains insufficient text content (less than 100 characters). Please ensure the PDF contains readable text.',
            code: 'INSUFFICIENT_CONTENT',
          },
        },
        { status: 400 }
      );
    }

    console.log(`Analyzing document: ${docName} (${documentText.length} characters)`);

    // Step 1: Build MISA analysis prompt
    console.log('Building MISA analysis prompt...');
    let systemMessage: string;
    let userMessage: string;
    try {
      const prompt = buildMISAAnalysisPrompt(documentText);
      systemMessage = prompt.systemMessage;
      userMessage = prompt.userMessage;
    } catch (error) {
      console.error('Prompt building error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to build analysis prompt. MISA regulations may not be loaded correctly.',
            code: 'PROMPT_BUILD_FAILED',
            details: error instanceof Error ? error.message : undefined,
          },
        },
        { status: 500 }
      );
    }

    // Step 2: Analyze document using OpenAI
    console.log('Analyzing document with OpenAI...');
    try {
      const analysisResult = await analyzeDocument(
        documentText,
        systemMessage,
        userMessage
      );

      console.log('Analysis completed successfully');

      // Return successful response
      return NextResponse.json(
        {
          success: true,
          data: analysisResult,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      
      // Return error response
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Document analysis failed',
            code: 'ANALYSIS_FAILED',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in analyze endpoint:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred while processing your request.',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze
 * Returns information about the analyze endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      endpoint: '/api/analyze',
      method: 'POST',
      description: 'Analyzes extracted PDF text against MISA licensing requirements',
      contentType: 'application/json',
      requiredFields: {
        text: 'string - Extracted PDF text content',
        docName: 'string (optional) - Document name for reference',
      },
      responseFormat: {
        success: 'boolean',
        data: 'AnalysisResult (if success)',
        error: 'Error object (if failed)',
      },
    },
    { status: 200 }
  );
}

