'use server';

import { getGeminiModel, getSystemPrompt } from '@/lib/gemini';
import { extractVideoId, getYouTubeTranscript } from '@/lib/youtube';
import { extractTextFromPDF } from '@/lib/pdf';
import type { ProcessingResult } from '@/types';

interface ProcessDocumentInput {
  title: string;
  sourceType: 'text_upload' | 'youtube';
  rawText?: string;
  fileBase64?: string;
  fileName?: string;
  youtubeUrl?: string;
  quizCount?: number;
  flashcardCount?: number;
}

export async function processDocument(input: ProcessDocumentInput): Promise<ProcessingResult> {
  try {
    let finalText = '';

    // 1. Extract content
    if (input.sourceType === 'youtube') {
      if (!input.youtubeUrl) {
        return { success: false, error: 'YouTube URL is required.' };
      }

      const videoId = extractVideoId(input.youtubeUrl);
      if (!videoId) {
        return { success: false, error: 'Invalid YouTube URL. Please paste a valid YouTube video link.' };
      }

      const transcript = await getYouTubeTranscript(videoId);
      finalText = transcript.text;
    } else {
      // Text upload or paste
      if (input.fileBase64 && input.fileName) {
        const buffer = Buffer.from(input.fileBase64, 'base64');

        if (input.fileName.toLowerCase().endsWith('.pdf')) {
          finalText = await extractTextFromPDF(buffer);
        } else {
          // TXT or other text files
          finalText = buffer.toString('utf-8');
        }
      } else if (input.rawText) {
        finalText = input.rawText;
      } else {
        return { success: false, error: 'Please provide text content or upload a file.' };
      }
    }

    // 2. Validate content
    if (!finalText || finalText.trim().length < 50) {
      return { success: false, error: 'The text content is too short. Please provide at least 50 characters of meaningful content.' };
    }

    const quizCount = input.quizCount || 10;
    const flashcardCount = input.flashcardCount || 10;

    // Limit character size for Gemini context
    const maxChars = 15000;
    const truncatedText = finalText.slice(0, maxChars);

    // 3. Call Gemini for structured output
    const model = getGeminiModel(quizCount, flashcardCount);
    const systemPrompt = getSystemPrompt(quizCount, flashcardCount);
    const result = await model.generateContent({
      contents: [
        { 
          role: 'user', 
          parts: [
            { text: `${systemPrompt}\n\nGenerate study materials for the following text:\n\n${truncatedText}` }
          ] 
        }
      ]
    });

    const responseText = result.response.text();
    if (!responseText) {
      return { success: false, error: 'Gemini AI failed to generate study materials. Please try again.' };
    }

    const parsed = JSON.parse(responseText);

    if (!parsed || !parsed.mermaid_code || !parsed.flashcards || !parsed.quiz) {
      return { success: false, error: 'AI generated invalid content structure. Please try again.' };
    }

    return {
      success: true,
      materials: {
        mermaid_code: parsed.mermaid_code,
        flashcards: parsed.flashcards,
        quiz: parsed.quiz,
      },
    };
  } catch (error: unknown) {
    console.error('Processing error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
