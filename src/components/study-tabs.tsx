'use client';

import { useState } from 'react';
import { MermaidViewer } from './mermaid-viewer';
import { FlashcardFlipper } from './flashcard-flipper';
import { QuizInterface } from './quiz-interface';
import { GitFork, BookOpen, CheckSquare } from 'lucide-react';
import type { StudyMaterial } from '@/types';

interface StudyTabsProps {
  materials: StudyMaterial;
}

export function StudyTabs({ materials }: StudyTabsProps) {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'flashcards' | 'quiz'>('flowchart');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="tab-list">
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
