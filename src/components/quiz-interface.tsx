'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Printer } from 'lucide-react';
import type { QuizQuestion } from '@/types';

interface QuizInterfaceProps {
  questions: QuizQuestion[];
}

export function QuizInterface({ questions }: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ questionIndex: number; selected: number; correct: number }[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const exportPrintPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const quizHtml = questions
      .map(
        (q, index) => `
        <div class="question-block">
          <div class="num">Question ${index + 1}</div>
          <div class="question">${q.question}</div>
          <ul class="options">
            ${q.options.map((opt, oIdx) => `<li>${String.fromCharCode(65 + oIdx)}) ${opt}</li>`).join('')}
          </ul>
          <div class="answer"><strong>Correct Answer:</strong> Option ${String.fromCharCode(65 + q.correct_option)}</div>
          <div class="explanation"><strong>Explanation:</strong> ${q.explanation}</div>
        </div>
      `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>LearnSpine Quiz</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; color: #0f172a; }
            h1 { font-size: 1.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 2rem; }
            .question-block { page-break-inside: avoid; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
            .num { font-size: 0.75rem; font-weight: 600; color: #4f46e5; text-transform: uppercase; margin-bottom: 0.5rem; }
            .question { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }
            .options { list-style: none; padding-left: 0; margin-bottom: 1rem; }
            .options li { padding: 0.25rem 0; }
            .answer { font-size: 0.9rem; color: #16a34a; font-weight: 600; }
            .explanation { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>LearnSpine Practice Quiz</h1>
          ${quizHtml}
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
  }, [questions]);

  const current = questions[currentIndex];
  const total = questions.length;

  const handleCheck = useCallback(() => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === current.correct_option) {
      setScore((s) => s + 1);
    }
    setAnswers((prev) => [
      ...prev,
      { questionIndex: currentIndex, selected: selectedOption, correct: current.correct_option },
    ]);
  }, [selectedOption, current, currentIndex]);

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

  // Completion screen
  if (isComplete) {
    const percentage = Math.round((score / total) * 100);
    const label = percentage >= 80 ? 'Mastermind! 🧠' : percentage >= 60 ? 'Good effort! 👍' : 'Keep studying! 💪';

    return (
      <div className="glass-card animate-scale-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-accent-indigo-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Trophy className="w-8 h-8" style={{ color: 'var(--color-accent-indigo)' }} />
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          Quiz Complete!
        </h3>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-accent-indigo)', fontWeight: 600, marginBottom: '1.5rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          {score}/{total}
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Your score: {percentage}%
        </p>

        {/* Results breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', marginBottom: '2rem' }}>
          {answers.map((answer, idx) => {
            const q = questions[answer.questionIndex];
            const isCorrect = answer.selected === answer.correct;
            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: isCorrect ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(220, 38, 38, 0.2)',
                  backgroundColor: isCorrect ? 'var(--color-accent-green-light)' : 'var(--color-accent-red-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-accent-green)', marginTop: '0.125rem' }} />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-accent-red)', marginTop: '0.125rem' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                      {q.question}
                    </p>
                    {!isCorrect && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                        Your answer: <span style={{ color: 'var(--color-accent-red)', fontWeight: 500 }}>{q.options[answer.selected]}</span>
                        {' • '}
                        Correct: <span style={{ color: 'var(--color-accent-green)', fontWeight: 500 }}>{q.options[answer.correct]}</span>
                      </p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
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
          <button onClick={exportPrintPDF} className="btn-secondary">
            <Printer className="w-4 h-4" />
            Print Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Question {currentIndex + 1} of {total}
        </span>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Score: <span style={{ color: 'var(--color-accent-green)', fontWeight: 600 }}>{score}</span>/{answers.length}
        </span>
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

      {/* Question Card */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '1.5rem', backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {current.question}
        </h3>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {current.options.map((option, idx) => {
            let borderColor = 'var(--color-border-default)';
            let bgColor = 'var(--color-bg-secondary)';
            let hoverStyles = true;

            if (isAnswered) {
              hoverStyles = false;
              if (idx === current.correct_option) {
                borderColor = 'var(--color-accent-green)';
                bgColor = 'var(--color-accent-green-light)';
              } else if (idx === selectedOption) {
                borderColor = 'var(--color-accent-red)';
                bgColor = 'var(--color-accent-red-light)';
              }
            } else if (idx === selectedOption) {
              borderColor = 'var(--color-accent-indigo)';
              bgColor = 'var(--color-accent-indigo-light)';
            }

            return (
              <button
                key={idx}
                onClick={() => !isAnswered && setSelectedOption(idx)}
                disabled={isAnswered}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  transition: 'all 0.15s ease',
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                className={hoverStyles ? 'input-field' : ''}
              >
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid currentColor',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  opacity: 0.7,
                  flexShrink: 0
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', flex: 1 }}>{option}</span>
                {isAnswered && idx === current.correct_option && (
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-accent-green)', marginLeft: 'auto' }} />
                )}
                {isAnswered && idx === selectedOption && idx !== current.correct_option && (
                  <XCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-accent-red)', marginLeft: 'auto' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Card */}
        {isAnswered && (
          <div className="animate-slide-down" style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '10px',
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-default)'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Explanation: </strong>
              {current.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <button onClick={exportPrintPDF} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Printer className="w-4 h-4" />
          Download Quiz (PDF)
        </button>

        {!isAnswered ? (
          <button
            onClick={handleCheck}
            disabled={selectedOption === null}
            className="btn-primary"
            style={{ padding: '0.625rem 2rem' }}
          >
            Check Answer
          </button>
        ) : (
          <button onClick={handleNext} className="btn-primary" style={{ padding: '0.625rem 2rem' }}>
            {currentIndex < total - 1 ? (
              <>
                Next Question
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              'See Results'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
