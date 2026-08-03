import { getDocumentProxy, extractText } from 'unpdf';

/**
 * Extract plain text from a PDF buffer.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    const text = result.text;

    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract text from this PDF. It may be image-based or scanned.');
    }
    return text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF') || error.message.includes('PDF format')) {
        throw new Error('This file does not appear to be a valid PDF.');
      }
      throw error;
    }
    throw new Error('Failed to parse PDF file. Please ensure it is a valid text-based PDF.');
  }
}
