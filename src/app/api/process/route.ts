import { NextResponse } from 'next/server';
import { getGeminiModel, getSystemPrompt } from '@/lib/gemini';
import { extractTextFromPDF } from '@/lib/pdf';

export const maxDuration = 60; // Set route timeout to 60 seconds on Vercel

export async function POST(request: Request) {
  try {
    const input = await request.json();

    let finalText = '';

    // 1. Extract content (Text upload or paste)
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
      return NextResponse.json({ success: false, error: 'Please provide text content or upload a file.' }, { status: 400 });
    }

    // 2. Validate content
    if (!finalText || finalText.trim().length < 50) {
      return NextResponse.json({ success: false, error: 'The text content is too short. Please provide at least 50 characters of meaningful content.' }, { status: 400 });
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
      return NextResponse.json({ success: false, error: 'Gemini AI failed to generate study materials. Please try again.' }, { status: 500 });
    }

    const parsed = JSON.parse(responseText);

    if (!parsed || !parsed.mermaid_code || !parsed.flashcards || !parsed.quiz) {
      return NextResponse.json({ success: false, error: 'AI generated invalid content structure. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      materials: {
        mermaid_code: parsed.mermaid_code,
        flashcards: parsed.flashcards,
        quiz: parsed.quiz,
      },
    });
  } catch (error: unknown) {
    console.error('Processing error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
