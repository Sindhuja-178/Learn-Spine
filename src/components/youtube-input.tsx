'use client';

import { useState, useMemo } from 'react';
import { processDocument } from '@/actions/process-document';
import { Video, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import type { StudyMaterial } from '@/types';

function extractVideoId(url: string): string | null {
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

interface YoutubeInputProps {
  onSuccess: (title: string, materials: StudyMaterial) => void;
}

export function YoutubeInput({ onSuccess }: YoutubeInputProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizCount, setQuizCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(10);

  const videoId = useMemo(() => extractVideoId(url), [url]);
  const isValidUrl = videoId !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isValidUrl) {
      setError('Please enter a valid YouTube URL.');
      return;
    }

    setLoading(true);

    try {
      const result = await processDocument({
        title: title || `YouTube: ${videoId}`,
        sourceType: 'youtube',
        youtubeUrl: url,
        quizCount: Number(quizCount),
        flashcardCount: Number(flashcardCount),
      });

      if (result.success) {
        onSuccess(title || `YouTube: ${videoId}`, result.materials);
      } else {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && (
        <div className="animate-slide-down" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          backgroundColor: 'var(--color-accent-red-light)',
          border: '1px solid rgba(220, 38, 38, 0.15)',
          color: 'var(--color-accent-red)',
          fontSize: '0.875rem'
        }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span style={{ flex: 1 }}>{error}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="yt-title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
          Title (optional)
        </label>
        <input
          id="yt-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="Name these study materials..."
        />
      </div>

      {/* YouTube URL */}
      <div>
        <label htmlFor="yt-url" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
          YouTube Video URL
        </label>
        <div style={{ position: 'relative' }}>
          <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)', position: 'absolute', left: '0.85rem' }} />
          <input
            id="yt-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
          {url && (
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isValidUrl ? 'var(--color-accent-green)' : 'var(--color-accent-red)'
            }} />
          )}
        </div>
      </div>

      {/* Quiz & Flashcard Length Selects */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="yt-quiz-count" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
            Quiz Questions
          </label>
          <select
            id="yt-quiz-count"
            value={quizCount}
            onChange={(e) => setQuizCount(Number(e.target.value))}
            className="input-field"
            style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2378716c\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
          >
            <option value={10}>10 Questions</option>
            <option value={25}>25 Questions (Long video)</option>
            <option value={50}>50 Questions (Comprehensive)</option>
          </select>
        </div>

        <div>
          <label htmlFor="yt-flashcard-count" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
            Flashcards Count
          </label>
          <select
            id="yt-flashcard-count"
            value={flashcardCount}
            onChange={(e) => setFlashcardCount(Number(e.target.value))}
            className="input-field"
            style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2378716c\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
          >
            <option value={10}>10 Flashcards</option>
            <option value={25}>25 Flashcards (Detailed)</option>
            <option value={50}>50 Flashcards (Mastery)</option>
          </select>
        </div>
      </div>

      {/* Video Preview */}
      {isValidUrl && videoId && (
        <div className="animate-scale-in" style={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--color-border-default)'
        }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt="Video thumbnail"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{
                  color: 'white',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px'
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Open on YouTube
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !isValidUrl}
        className="btn-primary"
        style={{ width: '100%', padding: '0.85rem 1.5rem', fontSize: '1rem', marginTop: '0.5rem' }}
      >
        {loading ? (
          <>
            <div className="loading-spinner">
              <div className="dot" style={{ background: 'white' }} />
              <div className="dot" style={{ background: 'white' }} />
              <div className="dot" style={{ background: 'white' }} />
            </div>
            Transcribing & Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Study Materials
          </>
        )}
      </button>
    </form>
  );
}
