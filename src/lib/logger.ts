import fs from 'fs';
import path from 'path';
import type { ProcessingLogEntry } from '@/types';

/**
 * Resolves the appropriate writable log file path.
 * In local development, writes to `<projectRoot>/logs/processing.log`.
 * In Vercel / serverless environments (where root is read-only), falls back to `/tmp/processing.log`.
 */
export function getLogFilePath(): string {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return path.join(logsDir, 'processing.log');
  } catch {
    // Ephemeral /tmp fallback for serverless
    return path.join('/tmp', 'learnspine_processing.log');
  }
}

/**
 * Appends a structured log entry (JSON Lines format) to the log file.
 */
export async function appendProcessingLog(entry: ProcessingLogEntry): Promise<void> {
  const line = JSON.stringify(entry) + '\n';
  const filePath = getLogFilePath();

  try {
    await fs.promises.appendFile(filePath, line, 'utf-8');
  } catch (err) {
    console.warn(`[Logger] Failed to write to ${filePath}, trying /tmp fallback:`, err);
    try {
      const fallbackPath = path.join('/tmp', 'learnspine_processing.log');
      await fs.promises.appendFile(fallbackPath, line, 'utf-8');
    } catch (fallbackErr) {
      console.error('[Logger] Failed to append log to fallback file:', fallbackErr);
    }
  }

  // Always output clean structured log to stdout for Vercel/cloud log drain
  const levelPrefix = entry.level === 'ERROR' ? '❌ [ERROR]' : entry.level === 'WARN' ? '⚠️ [WARN]' : '📊 [INFO]';
  console.log(`${levelPrefix} [Job:${entry.metrics.jobId}] ${entry.metrics.title} (${entry.metrics.status}) | ${entry.metrics.tokenMetrics.totalTokens} tokens | $${entry.metrics.tokenMetrics.estimatedCostUSD} USD (${entry.metrics.tokenMetrics.estimatedCostSEK} SEK) | ${entry.metrics.timingMetrics.totalDurationMs}ms`);
}

/**
 * Reads the raw log file content.
 */
export async function readRawLogs(): Promise<string> {
  const filePath = getLogFilePath();
  try {
    if (fs.existsSync(filePath)) {
      return await fs.promises.readFile(filePath, 'utf-8');
    }
    const fallbackPath = path.join('/tmp', 'learnspine_processing.log');
    if (fs.existsSync(fallbackPath)) {
      return await fs.promises.readFile(fallbackPath, 'utf-8');
    }
    return '';
  } catch (err) {
    console.error('[Logger] Error reading log file:', err);
    return '';
  }
}
