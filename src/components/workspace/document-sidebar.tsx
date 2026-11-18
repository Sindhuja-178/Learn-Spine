'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  FileText, 
  GitFork, 
  BookOpen, 
  CheckSquare, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  FolderOpen,
  ArrowUpRight
} from 'lucide-react';
import type { HistoryItem } from '@/types';

interface DocumentSidebarProps {
  items: HistoryItem[];
  activeId: string | null;
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string, e: React.MouseEvent) => void;
  onNewGuide: () => void;
  isPro?: boolean;
  onUpgradeClick?: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const TAG_FILTERS = ['All', 'Medicine', 'Law', 'Tech', 'Recent'];

export function DocumentSidebar({
  items,
  activeId,
  onSelectItem,
  onDeleteItem,
  onNewGuide,
  isPro = false,
  onUpgradeClick,
  isOpen,
  onToggleOpen
}: DocumentSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  // Filtered documents
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      if (selectedTag === 'All') return true;
      if (selectedTag === 'Recent') return true; // Already ordered by recent
      if (selectedTag === 'Medicine') {
        return (
          item.subject?.toLowerCase().includes('med') ||
          item.tags?.some((t) => t.toLowerCase().includes('cardio') || t.toLowerCase().includes('med')) ||
          item.title.toLowerCase().includes('stemi')
        );
      }
      if (selectedTag === 'Law') {
        return (
          item.subject?.toLowerCase().includes('law') ||
          item.tags?.some((t) => t.toLowerCase().includes('law') || t.toLowerCase().includes('delaware')) ||
          item.title.toLowerCase().includes('fiduciary') ||
          item.title.toLowerCase().includes('caremark')
        );
      }
      if (selectedTag === 'Tech') {
        return (
          item.subject?.toLowerCase().includes('tech') ||
          item.subject?.toLowerCase().includes('computer') ||
          item.tags?.some((t) => t.toLowerCase().includes('tech') || t.toLowerCase().includes('raft') || t.toLowerCase().includes('distributed')) ||
          item.title.toLowerCase().includes('raft') ||
          item.title.toLowerCase().includes('architecture')
        );
      }

      return true;
    });
  }, [items, searchQuery, selectedTag]);

  // Usage stats: 3 free document processing slots on basic tier
  const freeDocsUsed = Math.min(items.length, 3);
  const freeDocsMax = 3;
  const isAtLimit = !isPro && freeDocsUsed >= freeDocsMax;

  if (!isOpen) {
    return (
      <div
        onClick={onToggleOpen}
        style={{
          width: '42px',
          height: '100%',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0',
          cursor: 'pointer',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 20
        }}
        title="Open Document Library Sidebar"
      >
        <button type="button" className="btn-ghost" style={{ width: '28px', height: '28px', padding: 0 }}>
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
          Document Library ({items.length})
        </div>
      </div>
    );
  }

  return (
    <aside
      className="card"
      style={{
        width: '300px',
        height: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Sidebar Header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
              Study Library
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              backgroundColor: '#e2e8f0',
              color: '#475569',
              padding: '1px 6px',
              borderRadius: '999px'
            }}>
              {items.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={onNewGuide}
              className="btn-primary"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', height: '28px' }}
              title="Create New Study Kit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button
              onClick={onToggleOpen}
              className="btn-ghost"
              style={{ width: '28px', height: '28px', padding: 0 }}
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search className="w-3.5 h-3.5 text-slate-400" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides..."
            style={{
              width: '100%',
              padding: '0.35rem 0.65rem 0.35rem 2rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid #f1f5f9',
          overflowX: 'auto',
          backgroundColor: '#ffffff'
        }}
      >
        {TAG_FILTERS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            style={{
              padding: '0.2rem 0.6rem',
              fontSize: '0.725rem',
              fontWeight: 500,
              borderRadius: '999px',
              border: '1px solid',
              borderColor: selectedTag === tag ? '#4f46e5' : '#e2e8f0',
              backgroundColor: selectedTag === tag ? '#eef2ff' : '#ffffff',
              color: selectedTag === tag ? '#4f46e5' : '#64748b',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Document Items List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {filteredItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {filteredItems.map((item) => {
              const isActive = activeId === item.id;
              const hasFlowchart = !!item.materials?.mermaid_code;
              const hasCards = (item.materials?.flashcards?.length || 0) > 0;
              const hasQuiz = (item.materials?.quiz?.length || 0) > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isActive ? '#6366f1' : '#f1f5f9',
                    backgroundColor: isActive ? '#f8fafc' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#f1f5f9';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: isActive ? '#4f46e5' : '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '210px'
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </div>

                    <button
                      onClick={(e) => onDeleteItem(item.id, e)}
                      className="btn-ghost"
                      style={{ width: '22px', height: '22px', padding: 0, opacity: 0.6 }}
                      title="Delete study kit"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                    </button>
                  </div>

                  {/* Compact Status Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {hasFlowchart && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: '#eef2ff',
                          color: '#4f46e5',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <GitFork className="w-2.5 h-2.5" />
                        Flow
                      </span>
                    )}

                    {hasCards && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: '#f0fdf4',
                          color: '#16a34a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        {item.materials.flashcards.length} Cards
                      </span>
                    )}

                    {hasQuiz && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <CheckSquare className="w-2.5 h-2.5" />
                        {item.materials.quiz.length} Qs
                      </span>
                    )}

                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 'auto' }}>
                      {item.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p style={{ fontSize: '0.8rem' }}>No study kits found</p>
          </div>
        )}
      </div>

      {/* Non-Intrusive Freemium Usage Widget */}
      <div
        style={{
          padding: '0.875rem 1rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        {isPro ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontSize: '0.78rem', fontWeight: 600 }}>
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>LearnSpine Pro • Unlimited Documents & Exports</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Free Tier Credits</span>
              <span style={{ color: isAtLimit ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                {freeDocsUsed} / {freeDocsMax} kits used
              </span>
            </div>

            {/* Credit Progress bar */}
            <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(freeDocsUsed / freeDocsMax) * 100}%`,
                  backgroundColor: isAtLimit ? '#dc2626' : '#4f46e5',
                  transition: 'width 0.2s ease'
                }}
              />
            </div>

            {/* Contextual Value-Driven Upgrade CTA */}
            <button
              onClick={onUpgradeClick}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #c7d2fe',
                backgroundColor: '#ffffff',
                color: '#4f46e5',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginTop: '0.25rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eef2ff';
                e.currentTarget.style.borderColor = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#c7d2fe';
              }}
            >
              <span>Upgrade for 100-page PDFs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
