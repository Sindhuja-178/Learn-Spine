// ============================================================
// Shared TypeScript types for LearnSpine
// ============================================================

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_option: number; // 0-3
  explanation: string;
}

export interface StudyMaterial {
  mermaid_code: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export type ProcessingResult = {
  success: true;
  materials: StudyMaterial;
  metrics?: DocumentMetrics;
} | {
  success: false;
  error: string;
  metrics?: DocumentMetrics;
};

export interface PDFMetadata {
  fileName?: string;
  fileSize?: number; // in bytes
  pageCount?: number;
}

export interface DocumentMetrics {
  jobId: string;
  timestamp: string;
  title: string;
  sourceType: string;
  pdfInfo?: PDFMetadata;
  contentStats: {
    characterCount: number;
    wordCount: number;
    estimatedReadingTimeMinutes: number;
    detectedLanguage: string;
  };
  chunkMetrics: {
    chunkCount: number;
    chunkSizes: number[];
  };
  tokenMetrics: {
    model: string;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    totalTokens: number;
    estimatedCostUSD: number;
    estimatedCostSEK: number;
  };
  outputStats?: {
    mermaidNodes: number;
    mermaidEdges: number;
    flashcardsGenerated: number;
    quizQuestionsGenerated: number;
  };
  timingMetrics: {
    totalDurationMs: number;
    extractionDurationMs?: number;
    generationDurationMs: number;
  };
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

export interface ProcessingLogEntry {
  level: 'INFO' | 'WARN' | 'ERROR';
  timestamp: string;
  metrics: DocumentMetrics;
}

