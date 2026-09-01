'use client';

import { useState, useCallback } from 'react';
import { MermaidViewer } from './mermaid-viewer';
import { FlashcardFlipper } from './flashcard-flipper';
import { QuizInterface } from './quiz-interface';
import { GitFork, BookOpen, CheckSquare, Share2, Copy, Download, Check } from 'lucide-react';
import type { StudyMaterial } from '@/types';

interface StudyTabsProps {
  materials: StudyMaterial;
  shareId?: string | null;
  onShare?: () => void;
}

export function StudyTabs({ materials, shareId, onShare }: StudyTabsProps) {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'flashcards' | 'quiz'>('flowchart');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // 1. Share Handler
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

  // 2. Copy Handler (Copies active tab content to clipboard)
  const handleCopyClick = () => {
    let textToCopy = '';
    if (activeTab === 'flowchart') {
      textToCopy = materials.mermaid_code;
    } else if (activeTab === 'flashcards') {
      textToCopy = materials.flashcards.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
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

  // 3. Download Handlers
  const getWatermarkedSVG = () => {
    const svgElement = document.querySelector('.mermaid-container svg');
    if (!svgElement) return null;

    const svgClone = svgElement.cloneNode(true) as SVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const viewBox = svgClone.getAttribute('viewBox');
    let width = 800;
    let height = 600;
    let x = 30;
    let y = 40;

    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length === 4) {
        width = parseFloat(parts[2]);
        height = parseFloat(parts[3]);
        x = width - 120;
        y = height - 25;
      }
    }

    textNode.setAttribute('x', String(x));
    textNode.setAttribute('y', String(y));
    textNode.setAttribute('fill', '#94a3b8');
    textNode.setAttribute('font-size', '16');
    textNode.setAttribute('font-family', 'sans-serif');
    textNode.setAttribute('font-weight', 'bold');
    textNode.setAttribute('opacity', '0.6');
    textNode.textContent = 'LearnSpine';
    svgClone.appendChild(textNode);

    return {
      svgString: new XMLSerializer().serializeToString(svgClone),
      width,
      height
    };
  };

  const downloadFlowchartSVG = () => {
    const data = getWatermarkedSVG();
    if (!data) return;

    const svgBlob = new Blob([data.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'learnspine-flowchart.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const downloadFlowchartPNG = () => {
    const data = getWatermarkedSVG();
    if (!data) return;

    const svgBlob = new Blob([data.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = data.width * 2;
      canvas.height = data.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'learnspine-flowchart.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const downloadFlowchartPDF = async () => {
    const data = getWatermarkedSVG();
    if (!data) return;

    const svgBlob = new Blob([data.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = data.width * 2;
      canvas.height = data.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = await import('jspdf');

        const orientation = data.width > data.height ? 'l' : 'p';
        const pdf = new jsPDF({
          orientation: orientation,
          unit: 'px',
          format: [data.width, data.height],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, data.width, data.height);
        pdf.save('learnspine-flowchart.pdf');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const downloadFlashcardsAnki = () => {
    const text = materials.flashcards.map(f => `${f.question}\t${f.answer}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learnspine-flashcards-anki.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadFlashcardsJSON = () => {
    const json = JSON.stringify(materials.flashcards, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learnspine-flashcards.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadQuizText = () => {
    const text = materials.quiz.map((q, idx) => {
      const options = q.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n');
      return `Q${idx + 1}: ${q.question}\n${options}\nCorrect Answer: ${String.fromCharCode(65 + q.correct_option)}) ${q.options[q.correct_option]}\nExplanation: ${q.explanation}\n`;
    }).join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learnspine-quiz.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadQuizJSON = () => {
    const json = JSON.stringify(materials.quiz, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learnspine-quiz.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Navigation Tabs Header with Circular Action Buttons */}
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

        {/* 3 Circular Action Buttons: Share, Copy, Download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* 1. Share Button */}
          <button
            onClick={handleShareClick}
            className="btn-ghost"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
              boxShadow: 'var(--shadow-sm)',
              color: copiedShare ? 'var(--color-accent-green)' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
            title={copiedShare ? 'Link Copied!' : 'Share Guide'}
          >
            {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* 2. Copy Button */}
          <button
            onClick={handleCopyClick}
            className="btn-ghost"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
              boxShadow: 'var(--shadow-sm)',
              color: copiedContent ? 'var(--color-accent-green)' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
            title={copiedContent ? 'Copied to clipboard!' : `Copy ${activeTab === 'flowchart' ? 'Flowchart Code' : activeTab === 'flashcards' ? 'Flashcards' : 'Quiz'}`}
          >
            {copiedContent ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* 3. Download Button with Dropdown */}
          <div style={{ position: 'relative' }} onMouseLeave={() => setShowDownloadMenu(false)}>
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="btn-ghost"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-default)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--color-text-secondary)',
                transition: 'all 0.15s ease',
              }}
              title="Download Options"
            >
              <Download className="w-4 h-4" />
            </button>

            {showDownloadMenu && (
              <div
                className="animate-slide-down"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.4rem',
                  minWidth: '160px',
                }}
              >
                {activeTab === 'flowchart' && (
                  <>
                    <button
                      onClick={() => { downloadFlowchartSVG(); setShowDownloadMenu(false); }}
                      className="btn-ghost"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', justifyContent: 'flex-start', borderRadius: '8px', width: '100%' }}
                    >
                      SVG Vector
                    </button>
                    <button
                      onClick={() => { downloadFlowchartPNG(); setShowDownloadMenu(false); }}
                      className="btn-ghost"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', justifyContent: 'flex-start', borderRadius: '8px', width: '100%' }}
                    >
                      PNG Image
                    </button>
                    <button
                      onClick={() => { downloadFlowchartPDF(); setShowDownloadMenu(false); }}
                      className="btn-ghost"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', justifyContent: 'flex-start', borderRadius: '8px', width: '100%' }}
                    >
                      PDF Document
                    </button>
                  </>
                )}

                {activeTab === 'flashcards' && (
                  <>
                    <button
                      onClick={() => { downloadFlashcardsAnki(); setShowDownloadMenu(false); }}
                      className="btn-ghost"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', justifyContent: 'flex-start', borderRadius: '8px', width: '100%' }}
                    >
                      Anki Deck (.txt)
                    </button>
                    <button
                      onClick={() => { downloadFlashcardsJSON(); setShowDownloadMenu(false); }}
                      className="btn-ghost"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', justifyContent: 'flex-start', borderRadius: '8px', width: '100%' }}
                    >
                      JSON Data
                    </button>
                  </>
                )}

                {activeTab === 'quiz' && (
                  <>
                    <button
                      onClick={() => { downloadQuizText(); setShowDownloadMenu(false); }}
                      className="btn-ghost"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', justifyContent: 'flex-start', borderRadius: '8px', width: '100%' }}
                    >
                      Quiz Text (.txt)
                    </button>
                    <button
                      onClick={() => { downloadQuizJSON(); setShowDownloadMenu(false); }}
                      className="btn-ghost"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', justifyContent: 'flex-start', borderRadius: '8px', width: '100%' }}
                    >
                      JSON Data
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
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
