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
} | {
  success: false;
  error: string;
};
