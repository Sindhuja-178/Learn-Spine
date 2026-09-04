import { readRawLogs } from './logger';
import type { ProcessingLogEntry, DocumentMetrics } from '@/types';

export interface AggregateMetricsSummary {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  successRatePercentage: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUSD: number;
  totalCostSEK: number;
  totalPdfPagesProcessed: number;
  averageDurationMs: number;
  averageWordCount: number;
  totalFlashcardsGenerated: number;
  totalQuizQuestionsGenerated: number;
  recentJobs: DocumentMetrics[];
}

/**
 * Parses raw JSONL log file into structured ProcessingLogEntry items.
 */
export async function parseLogEntries(limit?: number): Promise<ProcessingLogEntry[]> {
  const rawContent = await readRawLogs();
  if (!rawContent.trim()) {
    return [];
  }

  const lines = rawContent.split('\n').map(l => l.trim()).filter(Boolean);
  const entries: ProcessingLogEntry[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as ProcessingLogEntry;
      if (parsed && parsed.metrics) {
        entries.push(parsed);
      }
    } catch {
      // Ignore unparseable or corrupted lines
    }
  }

  // Reverse so newest entries are first
  entries.reverse();

  if (limit && limit > 0) {
    return entries.slice(0, limit);
  }

  return entries;
}

/**
 * Computes high-level aggregated metrics across all logged processing runs.
 */
export async function getMetricsSummary(): Promise<AggregateMetricsSummary> {
  const entries = await parseLogEntries();

  let successfulJobs = 0;
  let failedJobs = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  let totalCostUSD = 0;
  let totalCostSEK = 0;
  let totalPdfPages = 0;
  let totalDurationMs = 0;
  let totalWords = 0;
  let totalFlashcards = 0;
  let totalQuizzes = 0;

  entries.forEach(entry => {
    const m = entry.metrics;
    if (m.status === 'SUCCESS') {
      successfulJobs++;
      totalDurationMs += m.timingMetrics.totalDurationMs;
      totalWords += m.contentStats.wordCount || 0;
      totalInputTokens += m.tokenMetrics.estimatedInputTokens || 0;
      totalOutputTokens += m.tokenMetrics.estimatedOutputTokens || 0;
      totalTokens += m.tokenMetrics.totalTokens || 0;
      totalCostUSD += m.tokenMetrics.estimatedCostUSD || 0;
      totalCostSEK += m.tokenMetrics.estimatedCostSEK || 0;

      if (m.pdfInfo?.pageCount) {
        totalPdfPages += m.pdfInfo.pageCount;
      }
      if (m.outputStats) {
        totalFlashcards += m.outputStats.flashcardsGenerated || 0;
        totalQuizzes += m.outputStats.quizQuestionsGenerated || 0;
      }
    } else {
      failedJobs++;
    }
  });

  const totalJobs = entries.length;
  const successRate = totalJobs > 0 ? Number(((successfulJobs / totalJobs) * 100).toFixed(1)) : 0;
  const avgDuration = successfulJobs > 0 ? Math.round(totalDurationMs / successfulJobs) : 0;
  const avgWords = successfulJobs > 0 ? Math.round(totalWords / successfulJobs) : 0;

  return {
    totalJobs,
    successfulJobs,
    failedJobs,
    successRatePercentage: successRate,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCostUSD: Number(totalCostUSD.toFixed(4)),
    totalCostSEK: Number(totalCostSEK.toFixed(2)),
    totalPdfPagesProcessed: totalPdfPages,
    averageDurationMs: avgDuration,
    averageWordCount: avgWords,
    totalFlashcardsGenerated: totalFlashcards,
    totalQuizQuestionsGenerated: totalQuizzes,
    recentJobs: entries.slice(0, 10).map(e => e.metrics),
  };
}

/**
 * Formats the summary into a readable markdown report.
 */
export async function formatSummaryMarkdown(): Promise<string> {
  const summary = await getMetricsSummary();

  return `
# 📊 LearnSpine Processing Metrics Summary

- **Total Documents Processed**: ${summary.totalJobs} (${summary.successfulJobs} Success, ${summary.failedJobs} Failed — ${summary.successRatePercentage}% Success Rate)
- **Total PDF Pages Processed**: ${summary.totalPdfPagesProcessed} pages
- **Average Document Length**: ${summary.averageWordCount.toLocaleString()} words
- **Average Processing Latency**: ${(summary.averageDurationMs / 1000).toFixed(2)} seconds

### 🪙 Token & Financial Metrics
- **Input Tokens**: ${summary.totalInputTokens.toLocaleString()}
- **Output Tokens**: ${summary.totalOutputTokens.toLocaleString()}
- **Combined Tokens**: ${summary.totalTokens.toLocaleString()}
- **Total API Cost**: $${summary.totalCostUSD.toFixed(4)} USD (~${summary.totalCostSEK.toFixed(2)} SEK)

### 📚 Study Content Created
- **Flashcards Generated**: ${summary.totalFlashcardsGenerated.toLocaleString()}
- **Quiz Questions Generated**: ${summary.totalQuizQuestionsGenerated.toLocaleString()}
`.trim();
}
