'use client';

import { useState, useRef } from 'react';

import { Upload, FileText, Sparkles, AlertCircle, X } from 'lucide-react';
import type { StudyMaterial } from '@/types';

interface TextInputProps {
  onSuccess: (title: string, materials: StudyMaterial) => void;
}

export function TextInput({ onSuccess }: TextInputProps) {
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizCount, setQuizCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!rawText && !file) {
      setError('Please paste some text or upload a file.');
      return;
    }

    setLoading(true);

    try {
      let fileBase64: string | undefined;
      let fileName: string | undefined;

      if (file) {
        // Read file as base64 for Server Action
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const resultStr = reader.result as string;
            // Strip out data:application/pdf;base64,
            const base64 = resultStr.split(',')[1];
            resolve(base64);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
        fileBase64 = base64Data;
        fileName = file.name;
      }

      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title || (file ? file.name : 'Pasted Document'),
          sourceType: 'text_upload',
          rawText: rawText || undefined,
          fileBase64,
          fileName,
          quizCount: Number(quizCount),
          flashcardCount: Number(flashcardCount)
        })
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(title || (file ? file.name.replace(/\.[^/.]+$/, "") : 'Pasted Document'), result.materials);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      console.error('Document processing error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.pdf') || droppedFile.name.endsWith('.txt'))) {
      setFile(droppedFile);
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
        <label htmlFor="title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
          Title (optional)
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="Give your study material a name..."
        />
      </div>

      {/* Quiz & Flashcard Length Selects */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="quiz-count" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
            Quiz Questions
          </label>
          <select
            id="quiz-count"
            value={quizCount}
            onChange={(e) => setQuizCount(Number(e.target.value))}
            className="input-field"
            style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2378716c\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
          >
            <option value={10}>10 Questions</option>
            <option value={25}>25 Questions (For longer texts)</option>
            <option value={50}>50 Questions (For comprehensive study)</option>
          </select>
        </div>

        <div>
          <label htmlFor="flashcard-count" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
            Flashcards Count
          </label>
          <select
            id="flashcard-count"
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

      {/* File Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed var(--color-border-default)',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: 'var(--color-bg-secondary)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.4)';
          e.currentTarget.style.backgroundColor = 'var(--color-accent-indigo-light)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
          className="hidden"
          style={{ display: 'none' }}
        />

        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <FileText className="w-5 h-5" style={{ color: 'var(--color-accent-indigo)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="btn-ghost"
              style={{ padding: '0.25rem' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-text-muted)', display: 'block', margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Drag & drop a <strong>PDF</strong> or <strong>TXT</strong> file here, or click to browse
            </p>
          </>
        )}
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-default)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or paste text</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-default)' }} />
      </div>

      {/* Text Area */}
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        className="input-field"
        style={{ minHeight: '160px', fontFamily: 'inherit', resize: 'vertical' }}
        placeholder="Paste your study content here (articles, notes, lectures)..."
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || (!rawText && !file)}
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
            Generating Study Materials...
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
