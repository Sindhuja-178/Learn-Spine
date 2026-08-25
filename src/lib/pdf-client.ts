/**
 * Extract text from a PDF file in the browser using PDF.js loaded dynamically from CDN.
 */
export async function extractTextFromPDFClient(file: File): Promise<string> {
  if (typeof window === 'undefined') return '';

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
  
  // Set up the worker on the main thread to avoid CORS/worker origin errors
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(arrayBuffer),
      // Use single-thread mode if worker loading fails
      disableWorker: true
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    const numPages = pdf.numPages;

    // Limit extraction to ~25,000 characters to ensure fast client-side performance,
    // which is more than enough for Gemini's 15,000 max context truncation.
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
      
      if (fullText.length > 25000) {
        break;
      }
    }

    const trimmedText = fullText.trim();
    if (trimmedText.length === 0) {
      throw new Error(
        'Could not extract text from this PDF. It may be scanned or image-based. Please copy and paste the text directly.'
      );
    }

    return trimmedText;
  } catch (err: any) {
    console.error('PDF JS client-side extraction error:', err);
    throw new Error(err?.message || 'Failed to parse PDF file. Please ensure it is a valid text-based PDF.');
  }
}
