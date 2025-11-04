import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, isValidPDFBuffer } from '@/lib/pdf-extractor';
import { buildMISAAnalysisPrompt } from '@/lib/misa-prompt';
import { analyzeDocument } from '@/lib/openai-client';
import type { AnalysisResponse } from '@/lib/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/analyze
 * Analyzes an uploaded PDF document against MISA licensing requirements
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalysisResponse>> {
  try {
    console.log('Received analysis request');

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate that a file was provided
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No file provided. Please upload a PDF document.',
            code: 'NO_FILE',
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid file type. Only PDF files are supported.',
            code: 'INVALID_FILE_TYPE',
            details: `Received: ${file.type}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File size (${sizeMB}MB) exceeds the maximum limit of 10MB.`,
            code: 'FILE_TOO_LARGE',
            details: `Maximum size: 10MB, Received: ${sizeMB}MB`,
          },
        },
        { status: 400 }
      );
    }

    // Validate file is not empty
    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'The uploaded file is empty.',
            code: 'EMPTY_FILE',
          },
        },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF structure
    if (!isValidPDFBuffer(buffer)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'The file does not appear to be a valid PDF document.',
            code: 'INVALID_PDF',
          },
        },
        { status: 400 }
      );
    }

    // Step 1: Extract text from PDF
    console.log('Extracting text from PDF...');
    let documentText: string;
    try {
      documentText = await extractTextFromPDF(buffer);
      console.log(`Extracted ${documentText.length} characters from PDF`);
    } catch (error) {
      console.error('PDF extraction error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Failed to extract text from PDF',
            code: 'PDF_EXTRACTION_FAILED',
          },
        },
        { status: 400 }
      );
    }

    // Validate that we extracted meaningful content
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

    // Step 2: Build MISA analysis prompt
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

    // Step 3: Analyze document using OpenAI
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
      description: 'Analyzes PDF documents against MISA licensing requirements',
      acceptedFileTypes: ['application/pdf'],
      maxFileSize: '10MB',
      requiredFields: {
        file: 'PDF file (multipart/form-data)',
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

