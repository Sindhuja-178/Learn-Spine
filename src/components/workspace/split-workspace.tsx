'use client';

import { useState, useCallback } from 'react';
import { 
  GitFork, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  Share2, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { FlowchartMode } from '@/components/study-modes/flowchart-mode';
import { FlashcardMode } from '@/components/study-modes/flashcard-mode';
import { QuizMode } from '@/components/study-modes/quiz-mode';
import { SourceViewerPane } from '@/components/workspace/source-viewer-pane';
import type { StudyMaterial } from '@/types';

interface SplitWorkspaceProps {
  title: string;
  materials: StudyMaterial;
  sourceText?: string;
  shareId?: string | null;
  onShare?: () => void;
  onNewGuide?: () => void;
}

type StudyModeTab = 'flowchart' | 'flashcards' | 'quiz';

export function SplitWorkspace({
  title,
  materials,
  sourceText = '',
  shareId,
  onShare,
  onNewGuide
}: SplitWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<StudyModeTab>('flowchart');
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'source' | 'study'>('study');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedModeContent, setCopiedModeContent] = useState(false);

  // Bidirectional reference handler
  const handleSelectReference = useCallback((text: string) => {
    setHighlightTarget(text);
    // On mobile viewports, automatically switch tab so user sees source highlighting
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileActiveView('source');
    }
  }, []);

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

  const handleCopyMode = () => {
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
    setCopiedModeContent(true);
    setTimeout(() => setCopiedModeContent(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      
      {/* Mobile viewport switcher: switches between Source & Study Tools on < 1024px */}
      <div
        className="lg-hidden"
        style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          padding: '0.25rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '0.25rem'
        }}
      >
        <button
          onClick={() => setMobileActiveView('study')}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: mobileActiveView === 'study' ? '#ffffff' : 'transparent',
            color: mobileActiveView === 'study' ? '#4f46e5' : '#64748b',
            boxShadow: mobileActiveView === 'study' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          Study Tools
        </button>
        <button
          onClick={() => setMobileActiveView('source')}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: mobileActiveView === 'source' ? '#ffffff' : 'transparent',
            color: mobileActiveView === 'source' ? '#4f46e5' : '#64748b',
            boxShadow: mobileActiveView === 'source' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          Source Document
        </button>
      </div>

      {/* Main Two-Pane Split View Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isSourceCollapsed ? '42px 1fr' : 'minmax(320px, 380px) 1fr',
          gap: '1.25rem',
          minHeight: '750px',
          height: 'calc(100vh - 140px)',
          transition: 'grid-template-columns 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Left Pane: Collapsible Source Viewer */}
        <div
          style={{
            height: '100%',
            overflow: 'hidden',
            display: typeof window !== 'undefined' && window.innerWidth < 1024 && mobileActiveView !== 'source' ? 'none' : 'block'
          }}
        >
          <SourceViewerPane
            title={title}
            sourceText={sourceText || materials.sourceText || ''}
            highlightTarget={highlightTarget}
            onClearHighlight={() => setHighlightTarget(null)}
            isCollapsed={isSourceCollapsed}
            onToggleCollapse={() => setIsSourceCollapsed(!isSourceCollapsed)}
          />
        </div>

        {/* Right Pane: Generated Study Tools Output with Sticky Segmented Control */}
        <div
          className="card"
          style={{
            height: '100%',
            display: typeof window !== 'undefined' && window.innerWidth < 1024 && mobileActiveView !== 'study' ? 'none' : 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Sticky Segmented Control Bar */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 30,
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            {/* Segmented Control Bar */}
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

            {/* Quick Action Buttons: Share & Copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handleCopyMode}
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
                {copiedModeContent ? (
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
                title="Share Study Kit link"
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

          {/* Active Study Tool Output Viewport */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: activeTab === 'flowchart' ? '0' : '1.5rem',
              backgroundColor: activeTab === 'flowchart' ? '#f8fafc' : '#ffffff'
            }}
          >
            {activeTab === 'flowchart' && (
              <FlowchartMode
                code={materials.mermaid_code}
                onSelectReference={handleSelectReference}
              />
            )}

            {activeTab === 'flashcards' && (
              <FlashcardMode
                flashcards={materials.flashcards}
                onSelectReference={handleSelectReference}
              />
            )}

            {activeTab === 'quiz' && (
              <QuizMode
                questions={materials.quiz}
                onSelectReference={handleSelectReference}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
