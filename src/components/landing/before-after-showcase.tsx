'use client';

import { useState } from 'react';
import { 
  GitFork, 
  BookOpen, 
  CheckSquare, 
  ArrowRight, 
  FileText, 
  Sparkles,
  Zap
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '@/lib/sample-data';
import { FlowchartMode } from '@/components/study-modes/flowchart-mode';
import { FlashcardMode } from '@/components/study-modes/flashcard-mode';
import { QuizMode } from '@/components/study-modes/quiz-mode';

export function BeforeAfterShowcase() {
  const [selectedSampleKey, setSelectedSampleKey] = useState<'medicalCaseStudy' | 'corporateLawBrief' | 'systemsArchitecture'>('medicalCaseStudy');
  const [activeOutputTab, setActiveOutputTab] = useState<'flowchart' | 'flashcards' | 'quiz'>('flowchart');

  const currentSample = SAMPLE_DOCUMENTS[selectedSampleKey];

  return (
    <div
      className="card"
      style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner with Sample Picker */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
            Interactive Before & After Showcase
          </span>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: '#eef2ff',
            color: '#4f46e5'
          }}>
            Live Output Preview
          </span>
        </div>

        {/* 3 Academic Subject Toggle Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => setSelectedSampleKey('medicalCaseStudy')}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: selectedSampleKey === 'medicalCaseStudy' ? '#4f46e5' : '#e2e8f0',
              backgroundColor: selectedSampleKey === 'medicalCaseStudy' ? '#4f46e5' : '#ffffff',
              color: selectedSampleKey === 'medicalCaseStudy' ? '#ffffff' : '#475569',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Medical STEMI Triage
          </button>

          <button
            onClick={() => setSelectedSampleKey('corporateLawBrief')}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: selectedSampleKey === 'corporateLawBrief' ? '#4f46e5' : '#e2e8f0',
              backgroundColor: selectedSampleKey === 'corporateLawBrief' ? '#4f46e5' : '#ffffff',
              color: selectedSampleKey === 'corporateLawBrief' ? '#ffffff' : '#475569',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Delaware Corporate Law
          </button>

          <button
            onClick={() => setSelectedSampleKey('systemsArchitecture')}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: selectedSampleKey === 'systemsArchitecture' ? '#4f46e5' : '#e2e8f0',
              backgroundColor: selectedSampleKey === 'systemsArchitecture' ? '#4f46e5' : '#ffffff',
              color: selectedSampleKey === 'systemsArchitecture' ? '#ffffff' : '#475569',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Raft Consensus
          </button>
        </div>
      </div>

      {/* Split Showcase Body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 380px) 1fr',
          minHeight: '480px'
        }}
      >
        {/* Left: Before (Dense Academic Source) */}
        <div
          style={{
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Before: Dense Text & PDF
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Unstructured Source
            </span>
          </div>

          <div
            style={{
              padding: '1.25rem',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '460px',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: '#334155',
              fontFamily: 'monospace',
              backgroundColor: '#fafafa',
              whiteSpace: 'pre-wrap'
            }}
          >
            {currentSample.sourceText}
          </div>
        </div>

        {/* Right: After (Interactive Generated Flowchart, Flashcard, Quiz) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Output Switcher Header */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap className="w-4 h-4 text-emerald-600" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                After: Structured Study Kit
              </span>
            </div>

            {/* Segmented output switcher */}
            <div
              style={{
                display: 'inline-flex',
                padding: '0.2rem',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                gap: '0.2rem'
              }}
            >
              <button
                onClick={() => setActiveOutputTab('flowchart')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeOutputTab === 'flowchart' ? '#eef2ff' : 'transparent',
                  color: activeOutputTab === 'flowchart' ? '#4f46e5' : '#64748b'
                }}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Flowchart</span>
              </button>

              <button
                onClick={() => setActiveOutputTab('flashcards')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeOutputTab === 'flashcards' ? '#eef2ff' : 'transparent',
                  color: activeOutputTab === 'flashcards' ? '#4f46e5' : '#64748b'
                }}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Flashcards</span>
              </button>

              <button
                onClick={() => setActiveOutputTab('quiz')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeOutputTab === 'quiz' ? '#eef2ff' : 'transparent',
                  color: activeOutputTab === 'quiz' ? '#4f46e5' : '#64748b'
                }}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Quiz</span>
              </button>
            </div>
          </div>

          {/* Interactive Output Component Viewport */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '460px',
              padding: activeOutputTab === 'flowchart' ? '0' : '1.25rem',
              backgroundColor: activeOutputTab === 'flowchart' ? '#f8fafc' : '#ffffff'
            }}
          >
            {activeOutputTab === 'flowchart' && (
              <FlowchartMode code={currentSample.materials.mermaid_code} />
            )}

            {activeOutputTab === 'flashcards' && (
              <FlashcardMode flashcards={currentSample.materials.flashcards} />
            )}

            {activeOutputTab === 'quiz' && (
              <QuizMode questions={currentSample.materials.quiz} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
