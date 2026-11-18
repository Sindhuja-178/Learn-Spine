'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  RotateCcw, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { Flashcard } from '@/types';

interface FlashcardModeProps {
  flashcards: Flashcard[];
  onSelectReference?: (text: string) => void;
}

type ConfidenceLevel = 'hard' | 'good' | 'easy';

export function FlashcardMode({ flashcards, onSelectReference }: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<number, ConfidenceLevel>>({});
  const [showExportMenu, setShowExportMenu] = useState(false);

  const total = flashcards.length;
  const current = flashcards[currentIndex] || flashcards[0];

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

  const toggleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const rateConfidence = useCallback((level: ConfidenceLevel) => {
    setRatings((prev) => ({ ...prev, [currentIndex]: level }));
    goNext();
  }, [currentIndex, goNext]);

  const resetDeck = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings({});
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === '1') {
        e.preventDefault();
        rateConfidence('hard');
      } else if (e.key === '2') {
        e.preventDefault();
        rateConfidence('good');
      } else if (e.key === '3') {
        e.preventDefault();
        rateConfidence('easy');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFlip, goNext, goPrev, rateConfidence]);

  // Confidence stats
  const hardCount = Object.values(ratings).filter((r) => r === 'hard').length;
  const goodCount = Object.values(ratings).filter((r) => r === 'good').length;
  const easyCount = Object.values(ratings).filter((r) => r === 'easy').length;
  const reviewedCount = Object.keys(ratings).length;
  const masteryPercentage = total > 0 ? Math.round(((easyCount * 1 + goodCount * 0.7) / total) * 100) : 0;

  // Exports
  const exportAnki = () => {
    const text = flashcards.map((f) => `${f.question}\t${f.answer}`).join('\n');
    const blob = new Blob([text], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learnspine-anki-deck.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportJSON = () => {
    const json = JSON.stringify(flashcards, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learnspine-flashcards.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = flashcards
      .map(
        (card, idx) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid;">
          <div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin-bottom: 6px;">Card ${idx + 1}</div>
          <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">${card.question}</div>
          <div style="font-size: 14px; color: #334155; line-height: 1.5;">${card.answer}</div>
        </div>
      `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>LearnSpine Flashcards Study Guide</title>
          <style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; }</style>
        </head>
        <body>
          <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">LearnSpine Flashcards</h1>
          ${cardsHtml}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowExportMenu(false);
  };

  if (!current) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <p style={{ color: '#64748b' }}>No flashcards available in this study set.</p>
      </div>
    );
  }

  // Summary screen when all cards are rated
  if (reviewedCount === total && total > 0) {
    return (
      <div className="card animate-scale-in" style={{ padding: '3rem 2rem', maxWidth: '640px', margin: '0 auto', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Flashcard Deck Complete!
        </h3>
        <p style={{ fontSize: '0.925rem', color: '#64748b', marginBottom: '2rem' }}>
          Estimated Mastery: <strong style={{ color: '#4f46e5' }}>{masteryPercentage}%</strong>
        </p>

        {/* Breakdown pills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{hardCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Hard (1)</div>
          </div>
          <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>{goodCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase' }}>Good (2)</div>
          </div>
          <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{easyCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Easy (3)</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={resetDeck} className="btn-primary">
            <RotateCcw className="w-4 h-4" />
            Review Deck Again
          </button>
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-4 h-4" />
            Print Deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Deck Header: Progress & Mastery Meter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            Card {currentIndex + 1} of {total}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
            Reviewed: {reviewedCount}/{total}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-ghost"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div
                className="animate-slide-down card"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.35rem',
                  zIndex: 40,
                  width: '180px',
                  padding: '0.35rem',
                  backgroundColor: '#ffffff',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <button
                  onClick={exportAnki}
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                >
                  Anki Deck (.txt)
                </button>
                <button
                  onClick={exportJSON}
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                >
                  JSON Format
                </button>
                <button
                  onClick={handlePrint}
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                >
                  Printable Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            backgroundColor: '#4f46e5',
            width: `${((currentIndex + 1) / total) * 100}%`,
            transition: 'width 0.25s ease'
          }}
        />
      </div>

      {/* 3D Tactile Flashcard Component */}
      <div
        onClick={toggleFlip}
        style={{
          perspective: '1200px',
          height: '320px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Card Front (Question) */}
          <div
            className="card"
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '2.5rem',
              boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Question
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Click card or press <kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.7rem' }}>Space</kbd> to flip
              </span>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
                {current.question}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.8rem' }}>
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tap to reveal answer</span>
            </div>
          </div>

          {/* Card Back (Answer) */}
          <div
            className="card"
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: '#ffffff',
              border: '1px solid #c7d2fe',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '2.5rem',
              boxShadow: '0 8px 24px -4px rgba(79, 70, 229, 0.12)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Answer & Key Takeaway
              </span>
              {onSelectReference && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectReference(current.sourceExcerpt || current.answer || current.question);
                  }}
                  className="btn-ghost"
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    color: '#4f46e5',
                    backgroundColor: '#eef2ff',
                    borderRadius: '6px'
                  }}
                  title="Highlight corresponding passage in source document"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Jump to Source
                </button>
              )}
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ fontSize: '1.15rem', fontWeight: 500, color: '#0f172a', lineHeight: 1.6 }}>
                {current.answer}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.8rem' }}>
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tap to return to question</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Rating Bar (Keys 1, 2, 3) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.75rem',
        marginTop: '0.25rem'
      }}>
        <button
          onClick={() => rateConfidence('hard')}
          className="btn-secondary"
          style={{
            borderColor: ratings[currentIndex] === 'hard' ? '#f87171' : '#e2e8f0',
            backgroundColor: ratings[currentIndex] === 'hard' ? '#fef2f2' : '#ffffff',
            color: '#b91c1c',
            justifyContent: 'center',
            padding: '0.65rem'
          }}
        >
          <span style={{ fontWeight: 700, marginRight: '4px' }}>1</span>
          <span>Hard</span>
        </button>

        <button
          onClick={() => rateConfidence('good')}
          className="btn-secondary"
          style={{
            borderColor: ratings[currentIndex] === 'good' ? '#60a5fa' : '#e2e8f0',
            backgroundColor: ratings[currentIndex] === 'good' ? '#eff6ff' : '#ffffff',
            color: '#1d4ed8',
            justifyContent: 'center',
            padding: '0.65rem'
          }}
        >
          <span style={{ fontWeight: 700, marginRight: '4px' }}>2</span>
          <span>Good</span>
        </button>

        <button
          onClick={() => rateConfidence('easy')}
          className="btn-secondary"
          style={{
            borderColor: ratings[currentIndex] === 'easy' ? '#4ade80' : '#e2e8f0',
            backgroundColor: ratings[currentIndex] === 'easy' ? '#f0fdf4' : '#ffffff',
            color: '#15803d',
            justifyContent: 'center',
            padding: '0.65rem'
          }}
        >
          <span style={{ fontWeight: 700, marginRight: '4px' }}>3</span>
          <span>Easy</span>
        </button>
      </div>

      {/* Bottom Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Keyboard shortcut hint pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>Shortcuts:</span>
          <span><kbd style={{ padding: '1px 4px', backgroundColor: '#f1f5f9', borderRadius: '3px', border: '1px solid #e2e8f0' }}>Space</kbd> Flip</span>
          <span><kbd style={{ padding: '1px 4px', backgroundColor: '#f1f5f9', borderRadius: '3px', border: '1px solid #e2e8f0' }}>← / →</kbd> Move</span>
          <span><kbd style={{ padding: '1px 4px', backgroundColor: '#f1f5f9', borderRadius: '3px', border: '1px solid #e2e8f0' }}>1-3</kbd> Rate</span>
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === total - 1}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
