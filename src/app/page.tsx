'use client';

import { useState, useEffect } from 'react';
import { InputTabs } from '@/components/input-tabs';
import { StudyTabs } from '@/components/study-tabs';
import { AuthModal } from '@/components/auth-modal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Sparkles, 
  BookOpen, 
  GitFork, 
  CheckSquare, 
  History, 
  Trash2, 
  Plus, 
  ChevronLeft,
  Video,
  FileText,
  ArrowRight,
  HelpCircle,
  Mail,
  Share2,
  Check,
  Database,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import type { StudyMaterial } from '@/types';

interface HistoryItem {
  id: string;
  title: string;
  materials: StudyMaterial;
  date: string;
  type: 'text' | 'youtube';
  isSynced?: boolean;
}

export default function DashboardPage() {
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [currentMaterials, setCurrentMaterials] = useState<StudyMaterial | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [dbConfigured, setDbConfigured] = useState(false);

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch recent guides from Supabase (filtered by user if logged in)
  const fetchSupabaseGuides = async (userId?: string): Promise<HistoryItem[]> => {
    if (!supabase) return [];
    try {
      let query = supabase.from('study_materials').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // Guests only see guides they generated in this browser session (unsynced / null user_id)
        query = query.is('user_id', null);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Failed to fetch from Supabase:', error);
        return [];
      }
      
      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        materials: row.materials,
        date: new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        type: row.source_type as 'text' | 'youtube',
        isSynced: true,
      }));
    } catch (e) {
      console.error('Error fetching Supabase guides:', e);
      return [];
    }
  };

  // Check auth state & load history on mount
  useEffect(() => {
    setMounted(true);
    const configured = isSupabaseConfigured();
    setDbConfigured(configured);

    const initializeUserAndHistory = async () => {
      let activeUser = null;

      // 1. Get auth session if Supabase is connected
      if (configured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          activeUser = session?.user ?? null;
          setUser(activeUser);
        } catch (e) {
          console.error('Auth check error:', e);
        }
      }

      // 2. Fetch history
      let localItems: HistoryItem[] = [];
      const stored = localStorage.getItem('learnspine_history');
      if (stored) {
        try {
          localItems = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse history from localStorage', e);
        }
      }

      if (configured) {
        const dbItems = await fetchSupabaseGuides(activeUser?.id);
        // Merge: prioritize database items, append local items if not already matching
        const merged = [...dbItems];
        localItems.forEach(local => {
          const alreadyExists = dbItems.some(
            db => db.title.toLowerCase() === local.title.toLowerCase() || db.id === local.id
          );
          if (!alreadyExists) {
            merged.push(local);
          }
        });
        setHistory(merged);
      } else {
        setHistory(localItems);
      }
    };

    initializeUserAndHistory();

    // Listen for auth changes
    if (configured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // Reload history matching current auth status
        const dbItems = await fetchSupabaseGuides(currentUser?.id);
        setHistory(dbItems);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Save history helper (saves to localStorage only as fallback/cache)
  const saveLocalHistoryOnly = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('learnspine_history', JSON.stringify(newHistory));
  };

  // Sync sandbox guides to user account upon logging in
  const handleAuthSuccess = async () => {
    if (!supabase) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUser = session?.user;
      if (!activeUser) return;
      
      setUser(activeUser);

      // Upload unsynced local items to their new database account
      const unsynced = history.filter(item => !item.isSynced);
      if (unsynced.length > 0) {
        const syncRows = unsynced.map(item => ({
          title: item.title,
          source_type: item.type,
          materials: item.materials,
          user_id: activeUser.id
        }));

        const { data, error } = await supabase
          .from('study_materials')
          .insert(syncRows)
          .select();

        if (error) {
          console.error('Error syncing offline items:', error);
        } else {
          console.log(`Successfully synced ${data?.length} guides to user account.`);
        }
      }

      // Reload full synced guides list
      const dbItems = await fetchSupabaseGuides(activeUser.id);
      setHistory(dbItems);
    } catch (err) {
      console.error('Sync process failed:', err);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      
      // Load local unsynced sandbox items back into list
      const stored = localStorage.getItem('learnspine_history');
      if (stored) {
        try {
          const local = JSON.parse(stored).filter((h: any) => !h.isSynced);
          setHistory(local);
        } catch {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    }
  };

  // Callback when a document has been successfully processed
  const handleSuccess = async (title: string, materials: StudyMaterial, type: 'text' | 'youtube') => {
    const tempId = `session-${Date.now()}`;
    const newItem: HistoryItem = {
      id: tempId,
      title,
      materials,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      type,
      isSynced: false,
    };

    // If Supabase is connected, save to DB
    if (supabase) {
      try {
        const insertRow: any = {
          title,
          source_type: type,
          materials,
        };

        // Link to user if authenticated
        if (user) {
          insertRow.user_id = user.id;
        }

        const { data, error } = await supabase
          .from('study_materials')
          .insert([insertRow])
          .select();
        
        if (error) {
          console.error('Error saving to Supabase:', error);
        } else if (data && data[0]) {
          newItem.id = data[0].id;
          newItem.isSynced = true;
        }
      } catch (e) {
        console.error('Failed to save to Supabase:', e);
      }
    }

    const updatedHistory = [newItem, ...history];
    saveLocalHistoryOnly(updatedHistory);
    
    setCurrentTitle(title);
    setCurrentMaterials(materials);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load an item from history
  const loadHistoryItem = (item: HistoryItem) => {
    setCurrentTitle(item.title);
    setCurrentMaterials(item.materials);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete an item from history
  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 1. Delete locally
    const updated = history.filter(item => item.id !== id);
    saveLocalHistoryOnly(updated);

    // 2. Delete from Supabase if active
    const targetItem = history.find(item => item.id === id);
    if (supabase && id.includes('-')) {
      try {
        await supabase
          .from('study_materials')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.error('Failed to delete from Supabase:', err);
      }
    }
    
    // If the active item is deleted, reset back to dashboard
    if (currentMaterials && targetItem?.materials === currentMaterials) {
      handleBackToDashboard();
    }
  };

  // Share study guide
  const handleShareGuide = async (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!dbConfigured) {
      alert('Supabase is not configured yet. Add your Supabase keys in .env.local to share guides.');
      return;
    }

    let shareId = item.id;

    // If item was generated locally and not saved to DB, save it now
    if (!item.isSynced && supabase) {
      try {
        const insertRow: any = {
          title: item.title,
          source_type: item.type,
          materials: item.materials
        };

        if (user) {
          insertRow.user_id = user.id;
        }

        const { data, error } = await supabase
          .from('study_materials')
          .insert([insertRow])
          .select();
        
        if (error) {
          alert('Failed to upload study guide for sharing: ' + error.message);
          return;
        }

        if (data && data[0]) {
          shareId = data[0].id;
          // Update local history state to mark synced
          const updated = history.map(h => h.id === item.id ? { ...h, id: shareId, isSynced: true } : h);
          saveLocalHistoryOnly(updated);
        }
      } catch (err) {
        console.error('Error sharing guide on-the-fly:', err);
        return;
      }
    }

    // Copy sharing link
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSharedId(shareId);
      setTimeout(() => setSharedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentTitle(null);
    setCurrentMaterials(null);
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="loading-spinner">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-primary)' }}>
      
      {/* Auth modal instance */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
      />

      {/* Top Navbar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--color-border-default)',
        backgroundColor: 'rgba(252, 251, 249, 0.8)',
        backdropFilter: 'blur(8px)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem'
      }}>
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {currentMaterials ? (
            <button 
              onClick={handleBackToDashboard} 
              className="btn-ghost" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, paddingLeft: 0 }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Workspace
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={handleBackToDashboard}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-bg-secondary)',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '0.9rem'
                }}>
                  L
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>LearnSpine</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <a href="#how" className="hover-link" style={{ transition: 'color 0.15s' }}>How it works</a>
                <a href="#features" className="hover-link" style={{ transition: 'color 0.15s' }}>What you get</a>
                {history.length > 0 && <a href="#history" className="hover-link" style={{ transition: 'color 0.15s' }}>Recent Guides</a>}
              </div>
            </div>
          )}

          {currentMaterials ? (
            <span style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--color-text-primary)',
              maxWidth: '280px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {currentTitle}
            </span>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            
            {/* Supabase authentication trigger controls */}
            {dbConfigured && (
              <>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border-default)',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </span>
                    </div>
                    <button 
                      onClick={handleSignOut} 
                      className="btn-ghost" 
                      style={{ padding: '0.35rem', borderRadius: '9999px' }}
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="btn-secondary" 
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '9999px' }}
                  >
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </button>
                )}
              </>
            )}

            {currentMaterials ? (
              <button onClick={handleBackToDashboard} className="btn-primary" style={{ padding: '0.45rem 1.2rem', fontSize: '0.8rem' }}>
                <Plus className="w-3.5 h-3.5" /> New Guide
              </button>
            ) : (
              <a href="#generate" className="btn-primary" style={{ padding: '0.45rem 1.2rem', fontSize: '0.8rem' }}>
                Get Started
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Main Page Area */}
      <main style={{ flex: 1, padding: currentMaterials ? '2rem 1rem' : '0 1rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {currentMaterials ? (
            /* Active Workspace View */
            <div className="animate-slide-up" style={{ padding: '1rem 0' }}>
              <StudyTabs materials={currentMaterials} />
            </div>
          ) : (
            /* Clean Lovable Landing View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6rem', padding: '4rem 0 6rem' }}>
              
              {/* Section 1: Hero */}
              <div id="generate" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2rem', maxWidth: '760px', margin: '0 auto' }}>
                
                {/* Supabase connection status notice banner */}
                {!dbConfigured && (
                  <div className="animate-fade-in" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--color-border-default)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Database className="w-3.5 h-3.5 text-stone-400" />
                    <span>Local Sandbox Mode. Add your Supabase credentials in `.env.local` to enable account login & sharing.</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>
                    Turn any text or PDF upload into simple, learnable pieces.
                  </h1>
                  <p style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>
                    LearnSpine takes long articles and PDFs and gives them back to you as clean flowcharts, flashcards and quizzes — so what you study actually sticks.
                  </p>
                </div>

                <div style={{ width: '100%', maxWidth: '600px', marginTop: '1rem' }}>
                  <InputTabs onSuccess={(title, materials) => {
                    const type = title.startsWith('YouTube:') ? 'youtube' : 'text';
                    handleSuccess(title, materials, type);
                  }} />
                </div>
              </div>

              {/* Section 2: Recent Guides (Conditional) */}
              {history.length > 0 && (
                <div id="history" className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-default)', paddingBottom: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {user ? `${user.email.split('@')[0]}'s Study Guides` : 'Your Recent Study Guides'}
                    </h2>
                    <button
                      onClick={() => saveLocalHistoryOnly([])}
                      className="btn-ghost"
                      style={{ fontSize: '0.75rem', color: 'var(--color-accent-red)', padding: '0.25rem 0.75rem' }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '1rem' 
                  }}>
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        style={{
                          padding: '1rem',
                          borderRadius: '20px',
                          border: '1px solid var(--color-border-default)',
                          backgroundColor: 'var(--color-bg-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-text-primary)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border-default)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: item.type === 'youtube' ? 'var(--color-accent-red-light)' : 'var(--color-accent-indigo-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {item.type === 'youtube' ? (
                            <Video className="w-4 h-4" style={{ color: 'var(--color-accent-red)' }} />
                          ) : (
                            <FileText className="w-4 h-4" style={{ color: 'var(--color-accent-indigo)' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '0.1rem'
                          }}>
                            {item.title}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.date}</span>
                        </div>
                        
                        {/* Share Button (Conditional on Supabase presence) */}
                        {dbConfigured && (
                          <button
                            onClick={(e) => handleShareGuide(item, e)}
                            className="btn-ghost"
                            style={{
                              padding: '0.35rem',
                              borderRadius: '9999px',
                              color: sharedId === item.id ? 'var(--color-accent-green)' : 'var(--color-text-muted)',
                              transition: 'color 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              if (sharedId !== item.id) e.currentTarget.style.color = 'var(--color-text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              if (sharedId !== item.id) e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                            title="Copy Sharing URL"
                          >
                            {sharedId === item.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="btn-ghost"
                          style={{
                            padding: '0.35rem',
                            borderRadius: '9999px',
                            color: 'var(--color-text-muted)',
                            transition: 'color 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-red)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                          title="Delete Guide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: How it Works */}
              <div id="how" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', borderTop: '1px solid var(--color-border-default)', paddingTop: '4rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>How it works</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Three steps from raw material to something you actually remember.</p>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '2.5rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-display)' }}>01</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Paste content or PDF</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      Drop in any text, raw notes, or standard lecture PDF you want to learn from.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-display)' }}>02</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Analyze key concepts</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      LearnSpine reads through the material, parses the core text structure, and pulls out the ideas that matter.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-display)' }}>03</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Study Guides</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      Get a flowchart to see the relationships, a flippable flashcard deck to review terms, and a quiz to test your understanding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: What you get */}
              <div id="features" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', borderTop: '1px solid var(--color-border-default)', paddingTop: '4rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>What you get</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Three ways to make the same material stick, generated automatically.</p>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                  gap: '1.5rem' 
                }}>
                  <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(79, 70, 229, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-accent-indigo)'
                    }}>
                      <GitFork className="w-5 h-5" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Concept Flowcharts</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      See how ideas connect at a glance. High-contrast zoomable diagram canvas, perfect for process mappings and cause-and-effect logs.
                    </p>
                  </div>

                  <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(13, 148, 136, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-accent-teal)'
                    }}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Active Recall Flashcards</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      Auto-generated active recall decks for key terms and takeaways. Structured with flippable 3D animations and progress markers.
                    </p>
                  </div>

                  <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(219, 39, 119, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-accent-pink)'
                    }}>
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Interactive Quizzes</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      Short multiple-choice quizzes checking your comprehension. Instantly marks correct answers and details key concept explanations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 5: Ask a Question / Waitlist Mockup */}
              <div style={{
                borderTop: '1px solid var(--color-border-default)',
                paddingTop: '4rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '3rem',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Join the waitlist</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Be first to try LearnSpine when we open enterprise API access. We'll email your invite when it's ready — no spam.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input type="email" placeholder="you@example.com" className="input-field" style={{ maxWidth: '280px' }} />
                    <button className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Sign Up</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Have a question?</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Curious about integrations, pricing tiers, or how LearnSpine handles your material? Ask away — it lands straight in our inbox.
                  </p>
                  <a href="mailto:artist.sindhuja@gmail.com" className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                    <Mail className="w-4 h-4" />
                    Contact Support
                  </a>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border-default)',
        padding: '2.5rem 2rem',
        fontSize: '0.85rem',
        color: 'var(--color-text-secondary)',
        backgroundColor: 'var(--color-bg-secondary)',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-bg-secondary)',
              fontWeight: 'bold',
              fontFamily: 'var(--font-family-display)',
              fontSize: '0.65rem'
            }}>
              L
            </div>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>LearnSpine</span>
          </div>
          <span>© {new Date().getFullYear()} LearnSpine. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#how" className="hover-link">How it works</a>
            <a href="#features" className="hover-link">What you get</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
