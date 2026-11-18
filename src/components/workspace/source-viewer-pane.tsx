'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Type, 
  Highlighter,
  Copy,
  Check
} from 'lucide-react';

interface SourceViewerPaneProps {
  title: string;
  sourceText?: string;
  highlightTarget?: string | null;
  onClearHighlight?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SourceViewerPane({
  title,
  sourceText = '',
  highlightTarget,
  onClearHighlight,
  isCollapsed = false,
  onToggleCollapse
}: SourceViewerPaneProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split source text into paragraphs
  const paragraphs = useMemo(() => {
    if (!sourceText) return [];
    return sourceText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  }, [sourceText]);

  // Clean target snippet for reference matching
  const cleanHighlightSnippet = useMemo(() => {
    if (!highlightTarget) return '';
    return highlightTarget
      .replace(/[^\w\s]/gi, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 8)
      .join(' ')
      .toLowerCase();
  }, [highlightTarget]);

  // Auto-scroll and highlight when highlightTarget changes
  useEffect(() => {
    if (!cleanHighlightSnippet || !containerRef.current) return;

    // Search for element containing matching words
    const elements = containerRef.current.querySelectorAll('.source-paragraph');
    for (const el of elements) {
      const text = el.textContent?.toLowerCase() || '';
      if (text.includes(cleanHighlightSnippet) || cleanHighlightSnippet.split(' ').some((word) => word.length > 4 && text.includes(word))) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-target');
        const timeout = setTimeout(() => {
          el.classList.remove('highlight-target');
          if (onClearHighlight) onClearHighlight();
        }, 3500);
        return () => clearTimeout(timeout);
      }
    }
  }, [cleanHighlightSnippet, onClearHighlight]);

  const handleCopySource = () => {
    navigator.clipboard.writeText(sourceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cycleFontSize = () => {
    if (fontSize === 'sm') setFontSize('md');
    else if (fontSize === 'md') setFontSize('lg');
    else setFontSize('sm');
  };

  const getFontSizeStyle = () => {
    if (fontSize === 'sm') return { fontSize: '0.8125rem', lineHeight: 1.6 };
    if (fontSize === 'lg') return { fontSize: '1rem', lineHeight: 1.7 };
    return { fontSize: '0.875rem', lineHeight: 1.65 };
  };

  if (isCollapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        style={{
          width: '42px',
          height: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0',
          cursor: 'pointer',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
        title="Expand Source Document Pane"
      >
        <button
          type="button"
          className="btn-ghost"
          style={{ width: '28px', height: '28px', padding: 0 }}
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#64748b',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Source Document
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      {/* Pane Header */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#0f172a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={title}
          >
            {title || 'Source Excerpt'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Font Size Toggle */}
          <button
            onClick={cycleFontSize}
            className="btn-ghost"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }}
            title={`Font Size: ${fontSize.toUpperCase()} (Click to change)`}
          >
            <Type className="w-3.5 h-3.5 mr-1" />
            <span style={{ textTransform: 'uppercase' }}>{fontSize}</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={handleCopySource}
            className="btn-ghost"
            style={{ width: '28px', height: '28px', padding: 0 }}
            title={copied ? 'Copied!' : 'Copy Source Text'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="btn-ghost"
              style={{ width: '28px', height: '28px', padding: 0 }}
              title="Collapse Source Pane"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Instant Search Bar within Source */}
      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search className="w-3.5 h-3.5 text-slate-400" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search source document..."
            style={{
              width: '100%',
              padding: '0.35rem 0.65rem 0.35rem 2rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              outline: 'none',
              backgroundColor: '#f8fafc',
              color: '#0f172a'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                border: 'none',
                background: 'transparent',
                fontSize: '0.75rem',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Active Reference Banner if highlighted */}
      {highlightTarget && (
        <div
          style={{
            padding: '0.35rem 0.75rem',
            backgroundColor: '#fef9c3',
            borderBottom: '1px solid #fef08a',
            fontSize: '0.75rem',
            color: '#854d0e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Highlighter className="w-3.5 h-3.5 text-amber-600" />
            <span>Referenced Section Highlighted</span>
          </div>
          {onClearHighlight && (
            <button
              onClick={onClearHighlight}
              style={{ border: 'none', background: 'transparent', fontSize: '0.7rem', color: '#a16207', cursor: 'pointer', fontWeight: 600 }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Paragraphs Display Viewport */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          ...getFontSizeStyle()
        }}
      >
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, idx) => {
            const matchesSearch = searchQuery.trim() && paragraph.toLowerCase().includes(searchQuery.toLowerCase());
            return (
              <div
                key={idx}
                className="source-paragraph"
                style={{
                  color: matchesSearch ? '#0f172a' : '#334155',
                  backgroundColor: matchesSearch ? '#fef9c3' : 'transparent',
                  padding: matchesSearch ? '4px 6px' : '0',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                {paragraph}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
            <p style={{ fontSize: '0.85rem' }}>Full source text is preserved for reference.</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div
        style={{
          padding: '0.5rem 1rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#64748b'
        }}
      >
        <span>{sourceText.split(/\s+/).filter(Boolean).length} words</span>
        <span>{paragraphs.length} paragraphs</span>
      </div>
    </div>
  );
}
