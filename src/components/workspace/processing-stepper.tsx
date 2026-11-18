'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Sparkles, FileText, Cpu, BrainCircuit } from 'lucide-react';

interface ProcessingStepperProps {
  fileName?: string;
  isProcessing: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Extracting document structure...',
    description: 'Parsing headers, paragraphs, and hierarchical concepts',
    icon: FileText
  },
  {
    id: 2,
    title: 'Mapping core concepts...',
    description: 'Synthesizing conceptual connections and topic taxonomy with Gemini AI',
    icon: Cpu
  },
  {
    id: 3,
    title: 'Generating flowcharts, flashcards & quizzes...',
    description: 'Constructing interactive visual diagrams, 3D cards, and verified assessment items',
    icon: BrainCircuit
  }
];

export function ProcessingStepper({ fileName, isProcessing }: ProcessingStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStep(1);
      setSeconds(0);
      return;
    }

    // Step pacing based on typical Gemini 2.5/Flash processing times
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    const step1Timer = setTimeout(() => setCurrentStep(2), 2400);
    const step2Timer = setTimeout(() => setCurrentStep(3), 6500);

    return () => {
      clearInterval(timer);
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
    };
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <div
      className="card animate-scale-in"
      style={{
        padding: '2.5rem 2rem',
        maxWidth: '560px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: '16px',
        textAlign: 'center'
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#eef2ff',
        border: '1px solid #c7d2fe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.25rem'
      }}>
        <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
        Building Your Study Kit
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem' }}>
        {fileName ? `Analyzing "${fileName}"` : 'Processing submitted text...'} ({seconds}s elapsed)
      </p>

      {/* Step Progress List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isPending = currentStep < step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '0.875rem 1rem',
                borderRadius: '10px',
                backgroundColor: isActive ? '#f8fafc' : isCompleted ? '#f0fdf4' : '#ffffff',
                border: isActive ? '1.5px solid #6366f1' : isCompleted ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                ) : (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1.5px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#94a3b8'
                    }}
                  >
                    {step.id}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isActive ? '#4f46e5' : isCompleted ? '#166534' : '#94a3b8'
                  }}
                >
                  {step.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
        Using Google Gemini AI • Generates deterministic flowcharts & source-verified cards
      </div>
    </div>
  );
}
