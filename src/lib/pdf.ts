/**
 * Extract plain text from a PDF buffer.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    const result = await parser.getText();
    const text = result.text;

    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract text from this PDF. It may be image-based or scanned.');
    }
    return text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('This file does not appear to be a valid PDF.');
      }
      throw error;
    }
    throw new Error('Failed to parse PDF file. Please ensure it is a valid text-based PDF.');
  }
}
