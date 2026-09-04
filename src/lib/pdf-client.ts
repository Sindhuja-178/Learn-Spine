import type { PDFMetadata } from '@/types';

export interface PDFClientExtractionResult {
  text: string;
  metadata: PDFMetadata;
}

/**
 * Extract text and metadata from a PDF file in the browser using PDF.js loaded dynamically from CDN.
 */
export async function extractPDFWithMetadata(file: File): Promise<PDFClientExtractionResult> {
  if (typeof window === 'undefined') {
    return {
      text: '',
      metadata: { fileName: file.name, fileSize: file.size, pageCount: 0 }
    };
  }

  // Load PDF.js CDN dynamically if not already present
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF parser library.'));
      document.head.appendChild(script);
    });
  }

  const pdfjsLib = (window as any).pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableWorker: true
    });

    const pdf = await loadingTask.promise;
    let fullText = '';
    const numPages = pdf.numPages;

    // Extract text across pages up to 65,000 characters to match the 4-chunk parallel backend
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n\n';

      if (fullText.length > 65000) {
        break;
      }
    }

    const trimmedText = fullText.trim();
    if (trimmedText.length === 0) {
      throw new Error(
        'Could not extract text from this PDF. It may be scanned or image-based. Please copy and paste the text directly.'
      );
    }

    return {
      text: trimmedText,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        pageCount: numPages,
      }
    };
  } catch (err: any) {
    console.error('PDF JS client-side extraction error:', err);
    throw new Error(err?.message || 'Failed to parse PDF file. Please ensure it is a valid text-based PDF.');
  }
}

/**
 * Backward-compatible helper extracting text only.
 */
export async function extractTextFromPDFClient(file: File): Promise<string> {
  const result = await extractPDFWithMetadata(file);
  return result.text;
}
