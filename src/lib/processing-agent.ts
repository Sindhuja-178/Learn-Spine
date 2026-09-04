import type { DocumentMetrics, PDFMetadata, ProcessingLogEntry, StudyMaterial } from '@/types';
import { appendProcessingLog } from './logger';

export interface StartJobOptions {
  title: string;
  sourceType: string;
  rawText: string;
  pdfInfo?: PDFMetadata;
  extractionDurationMs?: number;
}

export class ProcessingAgent {
  private jobId: string;
  private startTime: number;
  private title: string;
  private sourceType: string;
  private rawText: string;
  private pdfInfo?: PDFMetadata;
  private extractionDurationMs?: number;
  private chunkSizes: number[] = [];
  private modelName = 'gemini-3.6-flash';

  constructor(options: StartJobOptions) {
    this.jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.startTime = Date.now();
    this.title = options.title;
    this.sourceType = options.sourceType;
    this.rawText = options.rawText;
    this.pdfInfo = options.pdfInfo;
    this.extractionDurationMs = options.extractionDurationMs;
  }

  /**
   * Set model name used for generation.
   */
  public setModel(model: string) {
    this.modelName = model;
  }

  /**
   * Record chunk distribution.
   */
  public recordChunks(chunks: string[]) {
    this.chunkSizes = chunks.map(c => c.length);
  }

  /**
   * Detect predominant language using frequent stopword analysis.
   */
  private detectLanguage(text: string): string {
    const sample = text.slice(0, 3000).toLowerCase();
    const swedishWords = ['och', 'det', 'att', 'som', 'en', 'ett', 'på', 'är', 'med', 'för', 'av'];
    const englishWords = ['the', 'and', 'that', 'this', 'with', 'from', 'for', 'are', 'which', 'material'];

    let swedishScore = 0;
    let englishScore = 0;

    swedishWords.forEach(w => {
      const regex = new RegExp(`\\b${w}\\b`, 'g');
      swedishScore += (sample.match(regex) || []).length;
    });

    englishWords.forEach(w => {
      const regex = new RegExp(`\\b${w}\\b`, 'g');
      englishScore += (sample.match(regex) || []).length;
    });

    if (swedishScore > englishScore && swedishScore > 5) {
      return 'Swedish';
    }
    return 'English';
  }

  /**
   * Estimates tokens based on character length and English/technical tokenization factors (~3.8 chars/token).
   */
  private estimateTokens(charCount: number): number {
    return Math.max(1, Math.ceil(charCount / 3.8));
  }

  /**
   * Calculate exact cost in USD and SEK for Gemini 3.6 Flash.
   * Rates:
   * Input: $0.75 per 1M tokens
   * Output: $3.75 per 1M tokens
   * Mid-market rate: 1 USD = 9.54 SEK
   */
  private calculateCost(inputTokens: number, outputTokens: number) {
    const inputCostUSD = (inputTokens / 1_000_000) * 0.75;
    const outputCostUSD = (outputTokens / 1_000_000) * 3.75;
    const totalUSD = Number((inputCostUSD + outputCostUSD).toFixed(6));
    const totalSEK = Number((totalUSD * 9.54).toFixed(4));

    return {
      usd: totalUSD,
      sek: totalSEK,
    };
  }

  /**
   * Analyzes Mermaid flowchart complexity.
   */
  private analyzeMermaid(code: string): { nodes: number; edges: number } {
    if (!code) return { nodes: 0, edges: 0 };
    const edges = (code.match(/-->|--\s*".*?"\s*-->/g) || []).length;
    // Count distinct node definitions
    const nodeMatches = code.match(/\b[a-zA-Z0-9_]+(?=\(\[|\[|\{|\(\[\(|\(\()/g) || [];
    const uniqueNodes = new Set(nodeMatches).size;
    return {
      nodes: Math.max(uniqueNodes, 1),
      edges: edges,
    };
  }

  /**
   * Finalizes the job as SUCCESS, computes full metrics, writes to log file, and returns metrics.
   */
  public async completeSuccess(materials: StudyMaterial, systemPromptChars: number): Promise<DocumentMetrics> {
    const totalDurationMs = Date.now() - this.startTime;
    const generationDurationMs = Math.max(1, totalDurationMs - (this.extractionDurationMs || 0));

    const words = this.rawText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const characterCount = this.rawText.length;
    const estimatedReadingTimeMinutes = Math.ceil(wordCount / 200);
    const detectedLanguage = this.detectLanguage(this.rawText);

    // Calculate total input characters (text across chunks + system prompts)
    const totalChunkChars = this.chunkSizes.reduce((acc, len) => acc + len, 0) || characterCount;
    const chunkCount = Math.max(1, this.chunkSizes.length);
    const totalInputChars = totalChunkChars + (systemPromptChars * chunkCount);

    const inputTokens = this.estimateTokens(totalInputChars);
    const outputChars = JSON.stringify(materials).length;
    const outputTokens = this.estimateTokens(outputChars);
    const totalTokens = inputTokens + outputTokens;

    const costs = this.calculateCost(inputTokens, outputTokens);
    const mermaidStats = this.analyzeMermaid(materials.mermaid_code || '');

    const metrics: DocumentMetrics = {
      jobId: this.jobId,
      timestamp: new Date().toISOString(),
      title: this.title,
      sourceType: this.sourceType,
      pdfInfo: this.pdfInfo,
      contentStats: {
        characterCount,
        wordCount,
        estimatedReadingTimeMinutes,
        detectedLanguage,
      },
      chunkMetrics: {
        chunkCount,
        chunkSizes: this.chunkSizes,
      },
      tokenMetrics: {
        model: this.modelName,
        estimatedInputTokens: inputTokens,
        estimatedOutputTokens: outputTokens,
        totalTokens,
        estimatedCostUSD: costs.usd,
        estimatedCostSEK: costs.sek,
      },
      outputStats: {
        mermaidNodes: mermaidStats.nodes,
        mermaidEdges: mermaidStats.edges,
        flashcardsGenerated: materials.flashcards.length,
        quizQuestionsGenerated: materials.quiz.length,
      },
      timingMetrics: {
        totalDurationMs,
        extractionDurationMs: this.extractionDurationMs,
        generationDurationMs,
      },
      status: 'SUCCESS',
    };

    const logEntry: ProcessingLogEntry = {
      level: 'INFO',
      timestamp: metrics.timestamp,
      metrics,
    };

    await appendProcessingLog(logEntry);
    return metrics;
  }

  /**
   * Finalizes the job as FAILED and logs the error event.
   */
  public async completeFailure(errorMessage: string): Promise<DocumentMetrics> {
    const totalDurationMs = Date.now() - this.startTime;
    const characterCount = this.rawText.length;
    const wordCount = this.rawText.trim().split(/\s+/).filter(Boolean).length;

    const metrics: DocumentMetrics = {
      jobId: this.jobId,
      timestamp: new Date().toISOString(),
      title: this.title,
      sourceType: this.sourceType,
      pdfInfo: this.pdfInfo,
      contentStats: {
        characterCount,
        wordCount,
        estimatedReadingTimeMinutes: Math.ceil(wordCount / 200),
        detectedLanguage: this.detectLanguage(this.rawText),
      },
      chunkMetrics: {
        chunkCount: this.chunkSizes.length,
        chunkSizes: this.chunkSizes,
      },
      tokenMetrics: {
        model: this.modelName,
        estimatedInputTokens: this.estimateTokens(characterCount),
        estimatedOutputTokens: 0,
        totalTokens: this.estimateTokens(characterCount),
        estimatedCostUSD: 0,
        estimatedCostSEK: 0,
      },
      timingMetrics: {
        totalDurationMs,
        extractionDurationMs: this.extractionDurationMs,
        generationDurationMs: totalDurationMs,
      },
      status: 'FAILED',
      errorMessage,
    };

    const logEntry: ProcessingLogEntry = {
      level: 'ERROR',
      timestamp: metrics.timestamp,
      metrics,
    };

    await appendProcessingLog(logEntry);
    return metrics;
  }
}
