'use client';

import { useState } from 'react';
import { MermaidViewer } from './mermaid-viewer';
import { FlashcardFlipper } from './flashcard-flipper';
import { QuizInterface } from './quiz-interface';
import { GitFork, BookOpen, CheckSquare, Share2, Check } from 'lucide-react';
import type { StudyMaterial } from '@/types';

interface StudyTabsProps {
  materials: StudyMaterial;
  shareId?: string | null;
  onShare?: () => void;
}

export function StudyTabs({ materials, shareId, onShare }: StudyTabsProps) {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'flashcards' | 'quiz'>('flowchart');
  const [copiedShare, setCopiedShare] = useState(false);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="tab-list" style={{ margin: 0 }}>
          <button
            onClick={() => setActiveTab('flowchart')}
            className="tab-trigger"
            data-active={activeTab === 'flowchart'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <GitFork className="w-4 h-4" />
            Flowchart
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className="tab-trigger"
            data-active={activeTab === 'flashcards'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <BookOpen className="w-4 h-4" />
            Flashcards
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className="tab-trigger"
            data-active={activeTab === 'quiz'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <CheckSquare className="w-4 h-4" />
            Quiz
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === 'flowchart' && (
          <MermaidViewer code={materials.mermaid_code} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardFlipper flashcards={materials.flashcards} />
        )}
        {activeTab === 'quiz' && (
          <QuizInterface questions={materials.quiz} />
        )}
      </div>
    </div>
  );
}
