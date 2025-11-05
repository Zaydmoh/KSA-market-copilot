type ExtractResult = { text: string; numPages: number };

/**
 * Extracts text content from a PDF buffer without requiring canvas/DOMMatrix
 * @param buffer - The PDF file as a Buffer
 * @returns Object containing extracted text and page count
 * @throws Error if extraction fails
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<ExtractResult> {
  try {
    // Use require for CommonJS module in Node.js context
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdf = require('pdf-parse');
    
    // Custom page render that extracts text without canvas rendering
    const options = {
      max: 0, // Parse all pages
      // Critical: avoid rendering (no canvas, no DOMMatrix needed)
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();
        // pdfjs-dist returns items with 'str' fields
        const strings = textContent.items.map((item: any) => item.str);
        return strings.join(' ');
      },
      version: 'default',
    };
    
    // Parse the PDF with custom options
    const data = await pdf(buffer, options);

    // Check if any text was extracted
    const text = (data.text || '').trim();
    if (!text || text.length === 0) {
      throw new Error(
        'No text could be extracted from the PDF. The document may be image-based (scanned). ' +
        'Please ensure the PDF contains selectable text or consider using OCR.'
      );
    }

    // Return the extracted text and page count
    return {
      text,
      numPages: data.numpages ?? 0,
    };
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

