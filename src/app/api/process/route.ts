import { NextResponse } from 'next/server';
import { getGeminiModel, getSystemPrompt } from '@/lib/gemini';
import { extractPDFWithMetadataServer } from '@/lib/pdf';
import { ProcessingAgent } from '@/lib/processing-agent';
import { mergeMermaidFlowcharts, sanitizeMermaid } from '@/lib/mermaid-utils';
import type { PDFMetadata, Flashcard, QuizQuestion, StudyMaterial } from '@/types';

export const maxDuration = 60; // Set route timeout to 60 seconds on Vercel

async function generateChunkWithRetry(
  quizCount: number,
  flashcardCount: number,
  promptText: string,
  chunkIndex: number,
  totalChunks: number,
  agent: ProcessingAgent | null
) {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash'];
  let lastError: any = null;

  for (const modelName of models) {
    if (agent) {
      agent.setModel(modelName);
    }
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = getGeminiModel(quizCount, flashcardCount, modelName);
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }]
            }
          ]
        });

        const responseText = result.response.text();
        if (!responseText) {
          throw new Error(`AI returned an empty response for part ${chunkIndex + 1}.`);
        }

        const cleanJsonStr = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanJsonStr);
        if (!parsed || !parsed.mermaid_code || !parsed.flashcards || !parsed.quiz) {
          throw new Error(`Invalid JSON structure returned for part ${chunkIndex + 1}.`);
        }

        // Sanitize chunk Mermaid code immediately
        parsed.mermaid_code = sanitizeMermaid(parsed.mermaid_code);

        return parsed;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || '');
        const is503 = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('Service Unavailable');
        const is429 = errMsg.includes('429') || errMsg.includes('ResourceExhausted') || errMsg.includes('quota');

        console.warn(`[Process Chunk ${chunkIndex + 1}/${totalChunks}] ${modelName} attempt ${attempt} failed:`, errMsg);

        if ((is503 || is429) && attempt < maxRetries) {
          const delay = 1000 * attempt + Math.random() * 300;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        break; // failover to next model
      }
    }
  }

  throw lastError;
}

export async function POST(request: Request) {
  let agent: ProcessingAgent | null = null;

  try {
    const input = await request.json();

    let finalText = '';
    let pdfInfo: PDFMetadata | undefined = input.pdfInfo;
    let extractionDurationMs = 0;

    // 1. Extract content (Server-side fallback or client-provided text)
    const extractionStart = Date.now();
    if (input.fileBase64 && input.fileName) {
      const buffer = Buffer.from(input.fileBase64, 'base64');

      if (input.fileName.toLowerCase().endsWith('.pdf')) {
        const serverPdf = await extractPDFWithMetadataServer(buffer);
        finalText = serverPdf.text;
        pdfInfo = {
          fileName: input.fileName,
          fileSize: buffer.length,
          pageCount: serverPdf.pageCount,
        };
      } else {
        // TXT or other text files
        finalText = buffer.toString('utf-8');
        pdfInfo = {
          fileName: input.fileName,
          fileSize: buffer.length,
        };
      }
      extractionDurationMs = Date.now() - extractionStart;
    } else if (input.rawText) {
      finalText = input.rawText;
    } else {
      return NextResponse.json({ success: false, error: 'Please provide text content or upload a file.' }, { status: 400 });
    }

    // 2. Validate content
    if (!finalText || finalText.trim().length < 50) {
      return NextResponse.json({ success: false, error: 'The text content is too short. Please provide at least 50 characters of meaningful content.' }, { status: 400 });
    }

    const title = input.title || (pdfInfo?.fileName ? pdfInfo.fileName.replace(/\.[^/.]+$/, '') : 'Study Guide');
    const sourceType = input.sourceType || (pdfInfo?.fileName ? 'pdf_upload' : 'text_paste');
    const quizCount = input.quizCount || 10;
    const flashcardCount = input.flashcardCount || 10;

    // 3. Initialize Processing Agent
    agent = new ProcessingAgent({
      title,
      sourceType,
      rawText: finalText,
      pdfInfo,
      extractionDurationMs,
    });

    // 4. Chunking System
    const maxChunkSize = (quizCount >= 25 || flashcardCount >= 25) ? 10000 : 15000;
    const maxChunks = 4; // limit to maximum 4 chunks to avoid API abuse/timeouts

    const paragraphs = finalText.split('\n');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + '\n' + para).length > maxChunkSize) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + para;
      }

      if (chunks.length >= maxChunks - 1) {
        break; // stop adding chunks if we reach the limit
      }
    }
    if (currentChunk.trim().length > 0 && chunks.length < maxChunks) {
      chunks.push(currentChunk.trim());
    }

    agent.recordChunks(chunks);
    console.log(`[ProcessingAgent] Document "${title}" segmented into ${chunks.length} chunks.`);

    // 5. Process chunks with proportional quota and smart batching
    const countForChunk = (total: number, idx: number, numChunks: number) => {
      const base = Math.floor(total / numChunks);
      const remainder = total % numChunks;
      return base + (idx < remainder ? 1 : 0);
    };

    // Run in pairs of 2 to avoid burst 503 limits from Google API
    const parsedChunks: any[] = [];
    const batchSize = 2;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchPromises = batch.map((chunkText, offset) => {
        const index = i + offset;
        const chunkQuizCount = Math.max(1, countForChunk(quizCount, index, chunks.length));
        const chunkFlashcardCount = Math.max(1, countForChunk(flashcardCount, index, chunks.length));

        const systemPrompt = getSystemPrompt(chunkQuizCount, chunkFlashcardCount);
        const promptText = `${systemPrompt}\n\n[Part ${index + 1} of ${chunks.length}]\nGenerate study materials for the following segment:\n\n${chunkText}`;
        return generateChunkWithRetry(chunkQuizCount, chunkFlashcardCount, promptText, index, chunks.length, agent);
      });

      const batchResults = await Promise.all(batchPromises);
      parsedChunks.push(...batchResults);
    }

    // 6. Merge the results cleanly
    const mergedMermaid = mergeMermaidFlowcharts(parsedChunks.map(c => c.mermaid_code), title);

    const allFlashcards: Flashcard[] = parsedChunks.flatMap(c => c.flashcards || []);
    const allQuiz: QuizQuestion[] = parsedChunks.flatMap(c => c.quiz || []);

    const finalFlashcards = allFlashcards.slice(0, flashcardCount);
    const finalQuiz = allQuiz.slice(0, quizCount);

    const materials: StudyMaterial = {
      mermaid_code: mergedMermaid,
      flashcards: finalFlashcards,
      quiz: finalQuiz,
    };

    // 7. Complete Agent Metrics Logging
    const promptLength = getSystemPrompt(quizCount, flashcardCount).length;
    const metrics = await agent.completeSuccess(materials, promptLength);

    return NextResponse.json({
      success: true,
      materials,
      metrics,
    });
  } catch (error: unknown) {
    console.error('Processing error:', error);
    let message = error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (message.includes('503') || message.includes('high demand') || message.includes('Service Unavailable')) {
      message = 'Google AI is currently experiencing high demand (503). Please wait a few seconds and try again.';
    } else if (message.includes('429') || message.includes('ResourceExhausted') || message.includes('quota')) {
      message = 'Google AI rate limit reached (429). Please check your Gemini API quota or try again in a moment.';
    }

    let failureMetrics = undefined;
    if (agent) {
      try {
        failureMetrics = await agent.completeFailure(message);
      } catch (logErr) {
        console.error('Failed to log failure metrics:', logErr);
      }
    }

    return NextResponse.json({
      success: false,
      error: message,
      metrics: failureMetrics,
    }, { status: 500 });
  }
}
