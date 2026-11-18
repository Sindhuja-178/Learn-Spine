'use client';

import { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  X, 
  Check, 
  FileUp, 
  Type, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import type { StudyMaterial, PDFMetadata } from '@/types';
import { extractPDFWithMetadata } from '@/lib/pdf-client';
import { SAMPLE_DOCUMENTS } from '@/lib/sample-data';
import { ErrorPopup } from '@/components/error-popup';

interface HeroDropzoneProps {
  onSuccess: (title: string, materials: StudyMaterial, sourceText?: string) => void;
  onSelectSample: (sampleKey: 'medicalCaseStudy' | 'corporateLawBrief' | 'systemsArchitecture') => void;
  onStartProcessing?: (fileName: string) => void;
  onFinishProcessing?: () => void;
  isPro?: boolean;
  onRequirePro?: (pageCount: number) => void;
}

export function HeroDropzone({
  onSuccess,
  onSelectSample,
  onStartProcessing,
  onFinishProcessing,
  isPro = false,
  onRequirePro
}: HeroDropzoneProps) {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [quizCount, setQuizCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.pdf') || droppedFile.name.endsWith('.txt'))) {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file && !rawText.trim()) {
      setError('Please upload a PDF or paste your study material.');
      return;
    }

    setLoading(true);
    const effectiveTitle = title || (file ? file.name.replace(/\.[^/.]+$/, '') : 'Pasted Document');
    if (onStartProcessing) {
      onStartProcessing(file ? file.name : 'Pasted Document');
    }

    try {
      let rawTextToSend = rawText;
      let fileBase64ToSend: string | undefined = undefined;
      let pdfInfo: PDFMetadata | undefined = undefined;

      if (file) {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          try {
            const pdfResult = await extractPDFWithMetadata(file);
            if (!isPro && pdfResult.metadata.pageCount && pdfResult.metadata.pageCount > 10) {
              setLoading(false);
              if (onFinishProcessing) onFinishProcessing();
              if (onRequirePro) {
                onRequirePro(pdfResult.metadata.pageCount);
                return;
              }
            }
            rawTextToSend = pdfResult.text;
            pdfInfo = pdfResult.metadata;
          } catch (pdfErr) {
            console.warn('Client extraction failed, uploading base64 fallback:', pdfErr);
            fileBase64ToSend = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const res = reader.result as string;
                resolve(res.split(',')[1] || res);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            pdfInfo = { fileName: file.name, fileSize: file.size };
          }
        } else {
          // TXT file
          rawTextToSend = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
          pdfInfo = { fileName: file.name, fileSize: file.size };
        }
      }

      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: effectiveTitle,
          sourceType: file ? (file.name.toLowerCase().endsWith('.pdf') ? 'pdf_upload' : 'txt_upload') : 'text_paste',
          rawText: rawTextToSend || undefined,
          fileBase64: fileBase64ToSend || undefined,
          fileName: file?.name || undefined,
          pdfInfo,
          quizCount: Number(quizCount),
          flashcardCount: Number(flashcardCount)
        })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const errText = await response.text();
        let errMsg = 'Failed to process document.';
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed.error || errText;
        } catch {
          errMsg = errText;
        }
        setError(errMsg);
        return;
      }

      const result = await response.json();
      if (result.success) {
        const materialsWithSource: StudyMaterial = {
          ...result.materials,
          sourceText: rawTextToSend
        };
        onSuccess(effectiveTitle, materialsWithSource, rawTextToSend);
      } else {
        setError(result.error || 'Failed to generate study materials.');
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      if (onFinishProcessing) onFinishProcessing();
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Error Popup */}
      <ErrorPopup
        message={error}
        onClose={() => setError('')}
        onUpgrade={() => {
          if (onRequirePro) onRequirePro(20);
        }}
      />

      {/* Main Upload Dropzone Container */}
      <div
        className="card"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {/* Toggle between Upload PDF and Paste Text */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.25rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              gap: '0.25rem'
            }}
          >
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: inputMode === 'upload' ? '#ffffff' : 'transparent',
                color: inputMode === 'upload' ? '#4f46e5' : '#64748b',
                boxShadow: inputMode === 'upload' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload PDF / TXT</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('paste')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: inputMode === 'paste' ? '#ffffff' : 'transparent',
                color: inputMode === 'paste' ? '#4f46e5' : '#64748b',
                boxShadow: inputMode === 'paste' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            No credit card or signup needed to preview
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Optional Title input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title (optional)..."
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>

          {/* Conditional Dropzone or Textarea */}
          {inputMode === 'upload' ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#4f46e5' : '#cbd5e1'}`,
                borderRadius: '12px',
                padding: '2.25rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? '#eef2ff' : '#f8fafc',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
                  }
                }}
                style={{ display: 'none' }}
              />

              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{file.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="btn-ghost"
                    style={{ padding: '0.25rem', marginLeft: '0.5rem' }}
                    title="Remove file"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-red-600" />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Upload className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                      Drag and drop your academic PDF here,
                    </span>{' '}
                    <span style={{ fontSize: '0.9rem', color: '#4f46e5', fontWeight: 600 }}>or browse files</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Supports textbook chapters, lecture notes, case studies, and research briefs (PDF or TXT)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste articles, lecture transcripts, study guides, or case briefs here..."
                style={{
                  width: '100%',
                  minHeight: '160px',
                  padding: '0.875rem',
                  fontSize: '0.875rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* Question / Card Counts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Quiz Questions
              </label>
              <select
                value={quizCount}
                onChange={(e) => setQuizCount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              >
                <option value={10}>10 Questions (Quick Review)</option>
                <option value={20}>20 Questions (Standard)</option>
                <option value={30}>30 Questions (Deep Assessment)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Flashcard Deck
              </label>
              <select
                value={flashcardCount}
                onChange={(e) => setFlashcardCount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              >
                <option value={10}>10 Flashcards (Core Concepts)</option>
                <option value={20}>20 Flashcards (Comprehensive)</option>
                <option value={30}>30 Flashcards (Exam Mastery)</option>
              </select>
            </div>
          </div>

          {/* Primary High-Contrast Indigo CTA */}
          <button
            type="submit"
            disabled={loading || (!file && !rawText.trim())}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              backgroundColor: '#4f46e5',
              marginTop: '0.25rem'
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Study Kit</span>
          </button>
        </form>
      </div>

      {/* 3 Clickable Sample Document Pills Below Dropzone */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
          Or explore an instant zero-latency sample:
        </span>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onSelectSample('medicalCaseStudy')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4f46e5';
              e.currentTarget.style.backgroundColor = '#eef2ff';
              e.currentTarget.style.color = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#0f172a';
            }}
          >
            <span>🩺 Medical Case Study</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => onSelectSample('corporateLawBrief')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4f46e5';
              e.currentTarget.style.backgroundColor = '#eef2ff';
              e.currentTarget.style.color = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#0f172a';
            }}
          >
            <span>⚖️ Corporate Law Brief</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => onSelectSample('systemsArchitecture')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4f46e5';
              e.currentTarget.style.backgroundColor = '#eef2ff';
              e.currentTarget.style.color = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#0f172a';
            }}
          >
            <span>💻 Systems Architecture</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
