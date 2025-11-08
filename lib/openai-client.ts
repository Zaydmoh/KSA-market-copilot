import OpenAI from 'openai';
import { z } from 'zod';
import type { AnalysisResult } from '@/lib/types';

// Validate that OpenAI API key is configured
if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    'OPENAI_API_KEY is not configured. Please add it to your .env.local file.'
  );
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 120 seconds (2 minutes)
});

// Zod schema to validate OpenAI response structure
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
 * Analyzes a document using OpenAI API against MISA regulations
 * @param documentText - The extracted text from the PDF
 * @param systemMessage - The system prompt with MISA regulations
 * @param userMessage - The user prompt with document text
 * @returns Structured analysis result
 * @throws Error if API call fails or response is invalid
 */
export async function analyzeDocument(
  _documentText: string,
  systemMessage: string,
  userMessage: string
): Promise<AnalysisResult> {
  try {
    console.log('Calling OpenAI API for document analysis...');

    // Call OpenAI API with retry logic
    const completion = await callOpenAIWithRetry(systemMessage, userMessage);

    // Extract the response content
    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('OpenAI returned an empty response');
    }

    // Parse the JSON response
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Failed to parse OpenAI response as JSON:', responseContent);
      throw new Error(
        'OpenAI returned an invalid JSON response. Please try again.'
      );
    }

    // Validate the response structure using Zod
    const validatedResult = AnalysisResultSchema.parse(parsedResponse);

    console.log('Document analysis completed successfully');
    return validatedResult;
  } catch (error) {
    // Handle OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error.message);

      if (error.status === 401) {
        throw new Error(
          'OpenAI API authentication failed. Please check your API key configuration.'
        );
      }

      if (error.status === 429) {
        throw new Error(
          'OpenAI API rate limit exceeded. Please try again in a few moments.'
        );
      }

      if (error.status === 500 || error.status === 503) {
        throw new Error(
          'OpenAI service is temporarily unavailable. Please try again later.'
        );
      }

      throw new Error(
        `OpenAI API error (${error.status}): ${error.message}`
      );
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('Response validation failed:', error.issues);
      throw new Error(
        'The AI response did not match the expected format. Please try again.'
      );
    }

    // Re-throw if it's already a formatted error
    if (error instanceof Error) {
      throw error;
    }

    // Unknown error
    throw new Error('An unexpected error occurred during document analysis.');
  }
}

/**
 * Calls OpenAI API with automatic retry logic for transient errors
 * @param systemMessage - System prompt
 * @param userMessage - User prompt
 * @param maxRetries - Maximum number of retry attempts
 * @returns OpenAI completion response
 */
async function callOpenAIWithRetry(
  systemMessage: string,
  userMessage: string,
  maxRetries = 2
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If this is a retry, wait before trying again (exponential backoff)
      if (attempt > 0) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.log(`Retrying OpenAI API call (attempt ${attempt + 1}/${maxRetries + 1}) after ${delayMs}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      // Make the API call
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview', // Use GPT-4-turbo for better quality and speed
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: 2000, // Limit response length
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        response_format: { type: 'json_object' }, // Request JSON format
      });

      return completion;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on non-transient errors
      if (error instanceof OpenAI.APIError) {
        // Only retry on rate limits and server errors
        if (error.status === 429 || error.status === 500 || error.status === 503) {
          console.log(`Transient error (${error.status}), will retry...`);
          continue;
        }

        // Don't retry on other errors (auth, bad request, etc.)
        throw error;
      }

      // Retry on network errors
      console.log('Network error, will retry...');
    }
  }

  // All retries exhausted
  throw new Error(
    `Failed to complete OpenAI API request after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Estimates the cost of analyzing a document (for budget tracking)
 * @param documentLength - Length of document text in characters
 * @returns Estimated cost in USD
 */
export function estimateAnalysisCost(documentLength: number): number {
  // GPT-4-turbo pricing (approximate):
  // Input: $0.01 per 1K tokens
  // Output: $0.03 per 1K tokens
  
  // Rough estimate: 1 token ≈ 4 characters
  const inputTokens = documentLength / 4;
  const outputTokens = 2000; // max_tokens setting
  
  const inputCost = (inputTokens / 1000) * 0.01;
  const outputCost = (outputTokens / 1000) * 0.03;
  
  return inputCost + outputCost;
}

