import { fetchTranscript } from 'youtube-transcript-plus';

export interface TranscriptResult {
  text: string;
  estimatedMinutes: number;
}

/**
 * Extract a YouTube video ID from various URL formats.
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Fetch the transcript for a YouTube video and return plain text + estimated duration.
 */
export async function getYouTubeTranscript(videoId: string): Promise<TranscriptResult> {
  try {
    let segments;
    try {
      // Try fetching English transcript first
      segments = await fetchTranscript(videoId, { lang: 'en' });
    } catch (enError) {
      console.warn(`Failed to fetch English transcript for ${videoId}, falling back to default language:`, enError);
      // Fallback to default available transcript language
      segments = await fetchTranscript(videoId);
    }

    if (!segments || segments.length === 0) {
      throw new Error('No transcript available for this video. The video may not have captions enabled.');
    }

    // Concatenate all segment texts
    const text = segments.map((s) => s.text).join(' ');

    // Estimate total duration from the last segment
    const lastSegment = segments[segments.length - 1];
    const estimatedSeconds = (lastSegment.offset || 0) + (lastSegment.duration || 0);
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

    return { text, estimatedMinutes };
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Re-throw with a cleaner message
      if (error.message.includes('Could not get transcript')) {
        throw new Error('No transcript available for this video. It may not have captions or auto-generated subtitles.');
      }
      throw error;
    }
    throw new Error('Failed to fetch YouTube transcript. Please try again.');
  }
}
