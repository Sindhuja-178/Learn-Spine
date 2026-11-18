'use client';

import { useState, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  Printer, 
  FileText,
  Sparkles
} from 'lucide-react';
import type { QuizQuestion } from '@/types';

interface QuizModeProps {
  questions: QuizQuestion[];
  onSelectReference?: (text: string) => void;
}

export function QuizMode({ questions, onSelectReference }: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ questionIndex: number; selected: number; correct: number }[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const total = questions.length;
  const current = questions[currentIndex] || questions[0];

  // Immediate reveal upon option click
  const handleSelectOption = useCallback((optionIndex: number) => {
    if (isAnswered) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const isCorrect = optionIndex === current.correct_option;
    if (isCorrect) {
      setScore((s) => s + 1);
    }

    setAnswers((prev) => [
      ...prev,
      { questionIndex: currentIndex, selected: optionIndex, correct: current.correct_option }
    ]);
  }, [isAnswered, current, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, total]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setAnswers([]);
    setIsComplete(false);
  }, []);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const quizHtml = questions
      .map(
        (q, idx) => `
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; page-break-inside: avoid;">
          <div style="font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin-bottom: 6px;">Question ${idx + 1}</div>
          <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 10px;">${q.question}</div>
          <ul style="list-style: none; padding-left: 0; margin-bottom: 10px;">
            ${q.options.map((opt, oIdx) => `<li style="padding: 4px 0; font-size: 14px;"><strong>${String.fromCharCode(65 + oIdx)})</strong> ${opt}</li>`).join('')}
          </ul>
          <div style="font-size: 13px; color: #16a34a; font-weight: 600;">Correct: ${String.fromCharCode(65 + q.correct_option)}) ${q.options[q.correct_option]}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px; font-style: italic;">Why: ${q.explanation}</div>
        </div>
      `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>LearnSpine Practice Quiz</title>
          <style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; }</style>
        </head>
        <body>
          <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 24px;">LearnSpine Assessment Quiz</h1>
          ${quizHtml}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [questions]);

  if (!current) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <p style={{ color: '#64748b' }}>No quiz questions available in this study set.</p>
      </div>
    );
  }

  // Completion Screen
  if (isComplete) {
    const percentage = Math.round((score / total) * 100);
    const feedbackTitle = percentage >= 80 ? 'Exceptional Mastery! 🎯' : percentage >= 60 ? 'Solid Comprehension! 👍' : 'Review & Practice Recommended 💡';

    return (
      <div className="card animate-scale-in" style={{ padding: '3rem 2rem', maxWidth: '640px', margin: '0 auto', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#eef2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <Trophy className="w-8 h-8 text-indigo-600" />
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          Quiz Complete!
        </h3>
        <p style={{ fontSize: '1rem', color: '#4f46e5', fontWeight: 600, marginBottom: '1.5rem' }}>
          {feedbackTitle}
        </p>

        <div style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '0.5rem' }}>
          {score} / {total}
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2.5rem' }}>
          Score: {percentage}% correct
        </p>

        {/* Detailed Question Review Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left', marginBottom: '2rem' }}>
          {answers.map((answer, idx) => {
            const q = questions[answer.questionIndex];
            const isCorrect = answer.selected === answer.correct;
            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: isCorrect ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                      {q.question}
                    </p>
                    {!isCorrect && (
                      <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.25rem' }}>
                        Your choice: <span style={{ color: '#dc2626', fontWeight: 600 }}>{q.options[answer.selected]}</span>
                        {' • '}
                        Correct: <span style={{ color: '#16a34a', fontWeight: 600 }}>{q.options[answer.correct]}</span>
                      </p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.35rem' }}>
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={handleRestart} className="btn-primary">
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-4 h-4" />
            Print Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Quiz Progress & Score Header */}
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
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          Question {currentIndex + 1} of {total}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#64748b' }}>Score:</span>
          <span style={{ fontWeight: 700, color: '#16a34a' }}>{score}</span>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ color: '#64748b' }}>{answers.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
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

      {/* Main Question Card */}
      <div
        className="card"
        style={{
          padding: '2rem',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Question {currentIndex + 1}
          </span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5, marginTop: '0.35rem' }}>
            {current.question}
          </h3>
        </div>

        {/* Options List with Immediate Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {current.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === current.correct_option;

            let borderColor = '#e2e8f0';
            let bgColor = '#ffffff';
            let textColor = '#0f172a';

            if (isAnswered) {
              if (isCorrect) {
                borderColor = '#22c55e';
                bgColor = '#f0fdf4';
              } else if (isSelected) {
                borderColor = '#ef4444';
                bgColor = '#fef2f2';
              }
            } else if (isSelected) {
              borderColor = '#4f46e5';
              bgColor = '#eef2ff';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  color: textColor,
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Option Letter Pill */}
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: isAnswered && isCorrect ? '#22c55e' : isAnswered && isSelected ? '#ef4444' : '#f1f5f9',
                    color: (isAnswered && (isCorrect || isSelected)) ? '#ffffff' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>

                <span style={{ flex: 1, fontSize: '0.875rem', lineHeight: 1.4 }}>
                  {option}
                </span>

                {/* State Icons */}
                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 ml-auto" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 shrink-0 text-red-600 ml-auto" />
                )}
              </button>
            );
          })}
        </div>

        {/* Expandable Explanation Card with "Jump to Source" button */}
        {isAnswered && (
          <div
            className="animate-slide-down"
            style={{
              padding: '1.25rem',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Why this is right</span>
              </div>

              {onSelectReference && (
                <button
                  type="button"
                  onClick={() => onSelectReference(current.sourceExcerpt || current.explanation || current.question)}
                  className="btn-ghost"
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    color: '#4f46e5',
                    backgroundColor: '#eef2ff',
                    borderRadius: '6px'
                  }}
                  title="Jump to relevant excerpt in source document"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Jump to Source
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55 }}>
              {current.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handlePrint}
          className="btn-ghost"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
        >
          <Printer className="w-4 h-4" />
          Print Quiz
        </button>

        {isAnswered && (
          <button onClick={handleNext} className="btn-primary animate-scale-in">
            {currentIndex < total - 1 ? (
              <>
                Next Question
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              'Complete Quiz'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
