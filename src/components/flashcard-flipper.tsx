'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, RotateCcw, X, Copy, FileSpreadsheet, Printer, CheckCheck } from 'lucide-react';
import type { Flashcard } from '@/types';

interface FlashcardFlipperProps {
  flashcards: Flashcard[];
}

export function FlashcardFlipper({ flashcards }: FlashcardFlipperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<Record<number, 'got_it' | 'practice'>>({});
  const [copiedText, setCopiedText] = useState(false);

  const handleCopyCardsText = useCallback(() => {
    const textContent = flashcards
      .map((card, index) => `${index + 1}. Q: ${card.question}\n   A: ${card.answer}`)
      .join('\n\n');
    navigator.clipboard.writeText(textContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }, [flashcards]);

  const exportAnkiCSV = useCallback(() => {
    const escape = (text: string) => `"${text.replace(/"/g, '""')}"`;
    const csvContent = flashcards
      .map((card) => `${escape(card.question)},${escape(card.answer)}`)
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'learnspine-flashcards-anki.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [flashcards]);

  const exportPrintPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = flashcards
      .map(
        (card, index) => `
        <div class="card">
          <div class="num">Card ${index + 1}</div>
          <div class="question"><strong>Question:</strong> ${card.question}</div>
          <div class="answer"><strong>Answer:</strong> ${card.answer}</div>
        </div>
      `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>LearnSpine Flashcards</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; color: #0f172a; }
            h1 { font-size: 1.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 2rem; }
            .card { page-break-inside: avoid; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; background: #f8fafc; }
            .num { font-size: 0.75rem; font-weight: 600; color: #4f46e5; text-transform: uppercase; margin-bottom: 0.5rem; }
            .question { font-size: 1rem; margin-bottom: 0.5rem; }
            .answer { font-size: 1rem; color: #0d9488; }
            .watermark { position: fixed; bottom: 15px; right: 20px; font-size: 0.75rem; font-weight: bold; color: #94a3b8; letter-spacing: 0.05em; opacity: 0.5; }
          </style>
        </head>
        <body>
          <h1>LearnSpine Flashcards Study Guide</h1>
          ${cardsHtml}
          <div class="watermark">LearnSpine</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [flashcards]);

  const current = flashcards[currentIndex];
  const total = flashcards.length;
  const gotItCount = Object.values(results).filter((r) => r === 'got_it').length;
  const practiceCount = Object.values(results).filter((r) => r === 'practice').length;

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const markGotIt = useCallback(() => {
    setResults((prev) => ({ ...prev, [currentIndex]: 'got_it' }));
    goNext();
  }, [currentIndex, goNext]);

  const markPractice = useCallback(() => {
    setResults((prev) => ({ ...prev, [currentIndex]: 'practice' }));
    goNext();
  }, [currentIndex, goNext]);

  const resetAll = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const allReviewed = Object.keys(results).length === total;

  if (allReviewed) {
    return (
      <div className="glass-card animate-scale-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
          Review Complete! 🎉
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent-green)' }}>{gotItCount}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Got It</div>
          </div>
          <div style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>/</div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent-red)' }}>{practiceCount}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Practice</div>
          </div>
        </div>
        <div style={{ width: '100%', backgroundColor: 'var(--color-border-default)', borderRadius: '999px', height: '10px', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              borderRadius: '999px',
              backgroundColor: 'var(--color-accent-green)',
              width: `${(gotItCount / total) * 100}%`,
              transition: 'width 0.4s ease'
            }}
          />
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          You remembered {Math.round((gotItCount / total) * 100)}% of the concepts on your first pass!
        </p>
        <button onClick={resetAll} className="btn-primary">
          <RotateCcw className="w-4 h-4" />
          Review Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Card {currentIndex + 1} of {total}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--color-accent-green)' }}>✓ {gotItCount}</span>
          <span style={{ color: 'var(--color-accent-red)' }}>✗ {practiceCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', backgroundColor: 'var(--color-border-default)', borderRadius: '999px', height: '6px', marginBottom: '2rem', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            borderRadius: '999px',
            backgroundColor: 'var(--color-accent-indigo)',
            width: `${((currentIndex + 1) / total) * 100}%`,
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Flashcard Container */}
      <div
        className="flashcard-container"
        style={{ height: '300px', cursor: 'pointer', marginBottom: '1.5rem', position: 'relative' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Overlay Watermark */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          opacity: 0.15,
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.05em',
          zIndex: 20
        }}>
          LearnSpine
        </div>
        <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-front glass-card" style={{ borderColor: 'rgba(79, 70, 229, 0.2)', backgroundColor: 'var(--color-bg-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-accent-indigo)',
                marginBottom: '1rem',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Question
              </span>
              <p style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                {current.question}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2rem' }}>Click to reveal answer</p>
            </div>
          </div>

          {/* Back */}
          <div className="flashcard-back glass-card" style={{ borderColor: 'rgba(13, 148, 136, 0.2)', backgroundColor: 'var(--color-bg-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-accent-teal)',
                marginBottom: '1rem',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Answer
              </span>
              <p style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                {current.answer}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="btn-ghost"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={markPractice}
            className="btn-secondary"
            style={{
              color: 'var(--color-accent-red)',
              borderColor: 'rgba(220, 38, 38, 0.2)',
              backgroundColor: 'var(--color-accent-red-light)'
            }}
          >
            <X className="w-4 h-4" />
            No Idea
          </button>
          <button
            onClick={markGotIt}
            className="btn-primary"
            style={{
              backgroundColor: 'var(--color-accent-green)',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.15)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-green)'}
          >
            <Check className="w-4 h-4" />
            Got It
          </button>
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === total - 1}
          className="btn-ghost"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
        Tip: Press Space to flip the card, ← → arrow keys to navigate
      </p>

      {/* Export Options */}
      <div style={{
        marginTop: '2.5rem',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px dashed var(--color-border-default)',
        backgroundColor: 'var(--color-bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Export Options
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={handleCopyCardsText} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {copiedText ? <CheckCheck className="w-3.5 h-3.5 text-[var(--color-accent-green)]" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Text
          </button>
          <button onClick={exportAnkiCSV} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Anki (CSV)
          </button>
          <button onClick={exportPrintPDF} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Printer className="w-3.5 h-3.5" />
            Print Study Guide
          </button>
        </div>
      </div>
    </div>
  );
}
