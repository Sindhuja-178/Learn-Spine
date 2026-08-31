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

    // 3. Chunking System
    const maxChunkSize = 15000;
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

    console.log(`Processing document in ${chunks.length} chunks.`);

    // 4. Process each chunk in parallel using Promise.all
    const model = getGeminiModel(quizCount, flashcardCount);
    const systemPrompt = getSystemPrompt(quizCount, flashcardCount);

    const chunkPromises = chunks.map(async (chunkText, index) => {
      const result = await model.generateContent({
        contents: [
          { 
            role: 'user', 
            parts: [
              { text: `${systemPrompt}\n\n[Part ${index + 1} of ${chunks.length}]\nGenerate study materials for the following segment:\n\n${chunkText}` }
            ] 
          }
        ]
      });

      const responseText = result.response.text();
      if (!responseText) {
        throw new Error(`AI failed to generate content for part ${index + 1}.`);
      }

      // Clean up markdown block wraps if present
      const cleanJsonStr = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

      const parsed = JSON.parse(cleanJsonStr);
      if (!parsed || !parsed.mermaid_code || !parsed.flashcards || !parsed.quiz) {
        throw new Error(`AI returned invalid structure for part ${index + 1}.`);
      }

      return parsed;
    });

    const parsedChunks = await Promise.all(chunkPromises);

    // 5. Merge the results
    const title = input.title || 'Study Guide';
    const mergedMermaid = mergeMermaidFlowcharts(parsedChunks.map(c => c.mermaid_code), title);

    const flashcardsArrays = parsedChunks.map(c => c.flashcards || []);
    const quizArrays = parsedChunks.map(c => c.quiz || []);

    const finalFlashcards = distributeSelection(flashcardsArrays, flashcardCount);
    const finalQuiz = distributeSelection(quizArrays, quizCount);

    return NextResponse.json({
      success: true,
      materials: {
        mermaid_code: mergedMermaid,
        flashcards: finalFlashcards,
        quiz: finalQuiz,
      },
    });
  } catch (error: unknown) {
    console.error('Processing error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Merges multiple Mermaid flowchart strings under a single Root node.
 */
function mergeMermaidFlowcharts(flowcharts: string[], title: string): string {
  if (flowcharts.length === 0) return '';
  if (flowcharts.length === 1) return flowcharts[0];

  let combinedNodes = '';
  let combinedStyles = '';
  const classDefs = new Set<string>();

  // Add default classDefs
  classDefs.add('classDef center fill:#fafaf9,stroke:#1c1917,stroke-width:2px;');
  classDefs.add('classDef branch fill:#eff6ff,stroke:#2563eb,stroke-width:1px;');
  classDefs.add('classDef subbranch fill:#f0fdf4,stroke:#16a34a,stroke-width:1px;');
  classDefs.add('classDef research fill:#fff7ed,stroke:#ea580c,stroke-width:1px;');

  const mainChunkStartNodes: string[] = [];

  flowcharts.forEach((chart, index) => {
    const lines = chart.split('\n');
    let firstNodeId = '';

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Skip graph headers
      if (trimmed.startsWith('graph ') || trimmed.startsWith('flowchart ')) {
        return;
      }

      // Skip classDef definitions (we declare them globally)
      if (trimmed.startsWith('classDef ')) {
        return;
      }

      // Prefix node IDs (A, B, C...) with chunk prefix (c0_A, c0_B...) to avoid conflicts
      let processedLine = trimmed
        .replace(/\b([a-zA-Z0-9_]+)(?=\(\[|\[|\{|\(\[\(|\(\()/, `c${index}_$1`)
        .replace(/\b([a-zA-Z0-9_]+)(?=\s+--|\s+-->)/g, `c${index}_$1`)
        .replace(/-->\s*\b([a-zA-Z0-9_]+)\b/g, `--> c${index}_$1`)
        .replace(/class\s+([a-zA-Z0-9_,\s]+)\s+([a-zA-Z0-9_]+)/g, (match, nodeGroup, className) => {
          const prefixedNodes = nodeGroup
            .split(',')
            .map((n: string) => `c${index}_${n.trim()}`)
            .join(',');
          return `class ${prefixedNodes} ${className}`;
        })
        .replace(/click\s+\b([a-zA-Z0-9_]+)\b/g, `click c${index}_$1`);

      // Keep track of the first node defined in this flowchart chunk to link to Root
      if (!firstNodeId) {
        const nodeMatch = trimmed.match(/^([a-zA-Z0-9_]+)(?=\(\[|\[|\{|\(\[\(|\(\()/);
        if (nodeMatch) {
          firstNodeId = `c${index}_${nodeMatch[1]}`;
          mainChunkStartNodes.push(firstNodeId);
        }
      }

      if (processedLine.startsWith('class ') || processedLine.startsWith('click ')) {
        combinedStyles += '    ' + processedLine + '\n';
      } else {
        combinedNodes += '    ' + processedLine + '\n';
      }
    });
  });

  let mergedChart = 'graph TD\n';
  classDefs.forEach((def) => {
    mergedChart += '    ' + def + '\n';
  });
  mergedChart += '\n';

  const escapedTitle = title.replace(/[\[\]\(\)\{\}"]/g, ''); // strip characters that break Mermaid syntax
  mergedChart += `    Root([🎯 ${escapedTitle}])\n`;
  mergedChart += `    class Root center;\n`;
  
  mainChunkStartNodes.forEach((startNode, idx) => {
    mergedChart += `    Root -- "Part ${idx + 1}" --> ${startNode}\n`;
  });

  mergedChart += '\n';
  mergedChart += combinedNodes;
  mergedChart += combinedStyles;

  return mergedChart;
}

/**
 * Uniformly picks items across multiple arrays to construct a single array matching targetCount.
 */
function distributeSelection<T>(arrays: T[][], targetCount: number): T[] {
  const selected: T[] = [];
  const validArrays = arrays.filter(a => a.length > 0);
  if (validArrays.length === 0) return selected;

  const baseCount = Math.floor(targetCount / validArrays.length);
  let remainder = targetCount % validArrays.length;

  validArrays.forEach((arr, index) => {
    const countToTake = baseCount + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    selected.push(...arr.slice(0, countToTake));
  });

  return selected;
}
