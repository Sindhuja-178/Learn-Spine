import { getDocumentProxy, extractText } from 'unpdf';

export interface ServerPDFExtractionResult {
  text: string;
  pageCount: number;
}

/**
 * Extract plain text and page count from a PDF buffer on the server.
 */
export async function extractPDFWithMetadataServer(buffer: Buffer): Promise<ServerPDFExtractionResult> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const pageCount = pdf.numPages || 1;
    const result = await extractText(pdf, { mergePages: true });
    const text = result.text;

    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract text from this PDF. It may be image-based or scanned.');
    }
    return { text, pageCount };
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

/**
 * Extract plain text from a PDF buffer.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const result = await extractPDFWithMetadataServer(buffer);
  return result.text;
}
