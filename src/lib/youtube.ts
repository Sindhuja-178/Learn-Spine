import { fetchTranscript, type TranscriptSegment } from 'youtube-transcript-plus';

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
  // Configure proxy dispatcher if YOUTUBE_PROXY environment variable is set
  let customFetch: any = undefined;
  
  if (process.env.YOUTUBE_PROXY) {
    try {
      const { ProxyAgent } = await import('undici');
      const proxyAgent = new ProxyAgent(process.env.YOUTUBE_PROXY);
      
      customFetch = async (params: any) => {
        const { url, lang, userAgent, method = 'GET', body, headers = {} } = params;
        const fetchHeaders: any = {
          'User-Agent': userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          ...headers
        };
        if (lang) {
          fetchHeaders['Accept-Language'] = lang;
        }
        
        const options: any = {
          method,
          headers: fetchHeaders,
          dispatcher: proxyAgent
        };
        
        if (body && method === 'POST') {
          options.body = body;
        }
        
        return fetch(url, options);
      };
      
      console.log('Using ProxyAgent for YouTube transcript fetch:', process.env.YOUTUBE_PROXY);
    } catch (proxyError) {
      console.error('Failed to configure ProxyAgent for YouTube fetch:', proxyError);
    }
  }

  try {
    let segments: TranscriptSegment[];
    const fetchOptions: any = customFetch ? {
      videoFetch: customFetch,
      playerFetch: customFetch,
      transcriptFetch: customFetch
    } : {};

    try {
      // Try fetching English transcript first
      segments = (await fetchTranscript(videoId, { ...fetchOptions, lang: 'en' })) as unknown as TranscriptSegment[];
    } catch (enError) {
      console.warn(`Failed to fetch English transcript for ${videoId}, falling back to default language:`, enError);
      // Fallback to default available transcript language
      segments = (await fetchTranscript(videoId, fetchOptions)) as unknown as TranscriptSegment[];
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
      const msg = error.message;
      if (
        msg.includes('Could not get transcript') ||
        msg.includes('No transcripts are available') ||
        msg.includes('disabled') ||
        msg.includes('TooManyRequest') ||
        msg.includes('status code')
      ) {
        throw new Error(
          'YouTube blocked this request or transcripts are unavailable. ' +
          'YouTube often blocks cloud platforms like Vercel. ' +
          'To fix this, you can copy-paste the video transcript/notes into the "Paste Text" tab, ' +
          'or configure a residential proxy by setting the YOUTUBE_PROXY environment variable in Vercel.'
        );
      }
      throw error;
    }
    throw new Error('Failed to fetch YouTube transcript. Please try again.');
  }
}
