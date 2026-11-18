'use client';

import { useState } from 'react';
import { FlowchartMode } from '@/components/study-modes/flowchart-mode';
import { FlashcardMode } from '@/components/study-modes/flashcard-mode';
import { QuizMode } from '@/components/study-modes/quiz-mode';
import { GitFork, BookOpen, CheckSquare, Share2, Copy, Check } from 'lucide-react';
import type { StudyMaterial } from '@/types';

interface StudyTabsProps {
  materials: StudyMaterial;
  shareId?: string | null;
  onShare?: () => void;
  onSelectReference?: (text: string) => void;
}

export function StudyTabs({ materials, shareId, onShare, onSelectReference }: StudyTabsProps) {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'flashcards' | 'quiz'>('flowchart');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  const handleShareClick = () => {
    if (onShare) {
      onShare();
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleCopyClick = () => {
    let textToCopy = '';
    if (activeTab === 'flowchart') {
      textToCopy = materials.mermaid_code;
    } else if (activeTab === 'flashcards') {
      textToCopy = materials.flashcards.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n\n');
    } else if (activeTab === 'quiz') {
      textToCopy = materials.quiz.map((q, idx) => {
        const opts = q.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n');
        return `Q${idx + 1}: ${q.question}\n${opts}\nCorrect Answer: ${String.fromCharCode(65 + q.correct_option)}) ${q.options[q.correct_option]}\nExplanation: ${q.explanation}`;
      }).join('\n\n');
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Sticky segmented control & action buttons */}
      <div
        className="card"
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
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
            onClick={() => setActiveTab('flowchart')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'flowchart' ? '#ffffff' : 'transparent',
              color: activeTab === 'flowchart' ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === 'flowchart' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <GitFork className="w-4 h-4" />
            <span>Flowchart</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'flashcards' ? '#ffffff' : 'transparent',
              color: activeTab === 'flashcards' ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === 'flashcards' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <BookOpen className="w-4 h-4" />
            <span>Flashcards ({materials.flashcards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'quiz' ? '#ffffff' : 'transparent',
              color: activeTab === 'quiz' ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === 'quiz' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Quiz ({materials.quiz.length})</span>
          </button>
        </div>

        {/* Action Buttons: Copy & Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleCopyClick}
            className="btn-ghost"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.8rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#ffffff'
            }}
            title={`Copy ${activeTab} data to clipboard`}
          >
            {copiedContent ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span style={{ color: '#16a34a' }}>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareClick}
            className="btn-ghost"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.8rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#ffffff'
            }}
            title="Share Guide Link"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span style={{ color: '#16a34a' }}>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="card" style={{ padding: activeTab === 'flowchart' ? '0' : '1.5rem', backgroundColor: activeTab === 'flowchart' ? '#f8fafc' : '#ffffff', overflow: 'hidden' }}>
        {activeTab === 'flowchart' && (
          <FlowchartMode code={materials.mermaid_code} onSelectReference={onSelectReference} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardMode flashcards={materials.flashcards} onSelectReference={onSelectReference} />
        )}
        {activeTab === 'quiz' && (
          <QuizMode questions={materials.quiz} onSelectReference={onSelectReference} />
        )}
      </div>
    </div>
  );
}
