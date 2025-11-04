/**
 * Extracts text content from a PDF buffer
 * @param buffer - The PDF file as a Buffer
 * @returns The extracted text content from the PDF
 * @throws Error if extraction fails
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Polyfill DOMMatrix for Node.js environment before loading pdf-parse
    if (typeof globalThis.DOMMatrix === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const canvas = require('@napi-rs/canvas');
        globalThis.DOMMatrix = canvas.DOMMatrix;
      } catch (err) {
        console.warn('Could not load @napi-rs/canvas for DOMMatrix polyfill:', err);
      }
    }

    // Use require for CommonJS module in Node.js context
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdf = require('pdf-parse');
    
    // Parse the PDF
    const data = await pdf(buffer);

    // Check if any text was extracted
    if (!data.text || data.text.trim().length === 0) {
      throw new Error(
        'No text could be extracted from the PDF. The document may be image-based or corrupted. ' +
        'Please ensure the PDF contains selectable text.'
      );
    }

    // Return the extracted text
    return data.text;
  } catch (error) {
    // Handle specific PDF parsing errors
    if (error instanceof Error) {
      // If it's already our custom error, re-throw it
      if (error.message.includes('No text could be extracted')) {
        throw error;
      }

      // Handle corrupted or invalid PDF errors
      if (error.message.includes('Invalid PDF') || error.message.includes('PDF')) {
        throw new Error(
          'The PDF file appears to be corrupted or invalid. Please try re-saving the PDF or using a different file.'
        );
      }

      // Generic error with more context
      throw new Error(
        `Failed to extract text from PDF: ${error.message}. Please ensure the file is a valid, text-based PDF.`
      );
    }

    // Unknown error type
    throw new Error('An unexpected error occurred while processing the PDF file.');
  }
}

/**
 * Validates that a buffer is likely a valid PDF
 * Checks for PDF magic bytes at the start of the file
 * @param buffer - The file buffer to check
 * @returns true if the buffer appears to be a PDF
 */
export function isValidPDFBuffer(buffer: Buffer): boolean {
  // PDF files start with "%PDF-" (hex: 25 50 44 46 2D)
  const pdfMagicBytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]);
  
  if (buffer.length < pdfMagicBytes.length) {
    return false;
  }

  // Check if the buffer starts with PDF magic bytes
  return buffer.subarray(0, pdfMagicBytes.length).equals(pdfMagicBytes);
}

/**
 * Gets basic metadata from a PDF buffer (optional helper)
 * @param buffer - The PDF file as a Buffer
 * @returns Basic metadata like number of pages
 */
export async function getPDFMetadata(buffer: Buffer): Promise<{
  pages: number;
  info?: Record<string, unknown>;
}> {
  try {
    // Use require for CommonJS module in Node.js context
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdf = require('pdf-parse');
    
    const data = await pdf(buffer);
    
    return {
      pages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    throw new Error('Failed to extract PDF metadata');
  }
}

