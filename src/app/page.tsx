'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/logo';
import { HeroDropzone } from '@/components/landing/hero-dropzone';
import { BeforeAfterShowcase } from '@/components/landing/before-after-showcase';
import { SplitWorkspace } from '@/components/workspace/split-workspace';
import { DocumentSidebar } from '@/components/workspace/document-sidebar';
import { ProcessingStepper } from '@/components/workspace/processing-stepper';
import { AuthModal } from '@/components/auth-modal';
import { UpgradeModal } from '@/components/upgrade-modal';
import { SubscriptionModal } from '@/components/subscription-modal';
import { SAMPLE_DOCUMENTS } from '@/lib/sample-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkUserSubscription } from '@/lib/subscription';
import { 
  Sparkles, 
  ChevronLeft, 
  Plus, 
  LogOut, 
  User, 
  Database, 
  Mail, 
  Check, 
  FolderOpen,
  GitFork,
  BookOpen,
  CheckSquare,
  Zap,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import type { StudyMaterial, HistoryItem } from '@/types';

export default function DashboardPage() {
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [currentMaterials, setCurrentMaterials] = useState<StudyMaterial | null>(null);
  const [currentSourceText, setCurrentSourceText] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [dbConfigured, setDbConfigured] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Processing state for step-by-step indicator
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFileName, setProcessingFileName] = useState('');

  // Workspace Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auth & Subscription States
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [upgradeNoticePages, setUpgradeNoticePages] = useState<number | undefined>(undefined);
  const [upgradeSuccessToast, setUpgradeSuccessToast] = useState(false);

  // Subscription management & unsubscribe handler
  const handleManageSubscription = () => {
    setIsSubscriptionModalOpen(true);
  };

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
        .limit(25);
      
      if (error) {
        console.error('Failed to fetch from Supabase:', error);
        return [];
      }
      
      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        materials: row.materials,
        sourceText: row.materials?.sourceText || '',
        subject: row.materials?.subject || 'General',
        tags: row.materials?.tags || [],
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

    // Forward recovery tokens directly to reset password page
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const params = new URLSearchParams(window.location.search);
      if (hash.includes('type=recovery') || params.get('type') === 'recovery') {
        window.location.href = `/reset-password${window.location.search}${hash}`;
        return;
      }
    }

    const initializeUserAndHistory = async () => {
      let activeUser = null;

      // 1. Get auth session if Supabase is connected
      if (configured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          activeUser = session?.user ?? null;
          setUser(activeUser);

          // Check subscription status
          if (activeUser?.id || activeUser?.email) {
            checkUserSubscription(activeUser.id, activeUser.email).then((sub) => {
              setIsPro(sub.isPro);
            });
          }
        } catch (e) {
          console.error('Auth check error:', e);
        }
      }

      // Check URL query for upgrade success
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('upgrade') === 'success') {
          setUpgradeSuccessToast(true);
          setIsPro(true);
          window.history.replaceState({}, '', window.location.pathname);
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
        const merged = [...dbItems];
        localItems.forEach((local) => {
          const alreadyExists = dbItems.some(
            (db) => db.title.toLowerCase() === local.title.toLowerCase() || db.id === local.id
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

        if (currentUser?.id || currentUser?.email) {
          checkUserSubscription(currentUser.id, currentUser.email).then((sub) => {
            setIsPro(sub.isPro);
          });
        } else {
          setIsPro(false);
        }

        const dbItems = await fetchSupabaseGuides(currentUser?.id);
        setHistory(dbItems);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Save history helper (local cache)
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

      const unsynced = history.filter((item) => !item.isSynced);
      if (unsynced.length > 0) {
        const syncRows = unsynced.map((item) => ({
          title: item.title,
          source_type: item.type,
          materials: item.materials,
          user_id: activeUser.id
        }));

        await supabase.from('study_materials').insert(syncRows);
      }

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
  const handleSuccess = async (title: string, materials: StudyMaterial, sourceText?: string) => {
    const tempId = `session-${Date.now()}`;
    const effectiveSourceText = sourceText || materials.sourceText || '';

    const newItem: HistoryItem = {
      id: tempId,
      title,
      materials: {
        ...materials,
        sourceText: effectiveSourceText
      },
      sourceText: effectiveSourceText,
      subject: materials.subject || 'General',
      tags: materials.tags || [],
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      type: 'text',
      isSynced: false,
    };

    if (supabase) {
      try {
        const insertRow: any = {
          title,
          source_type: 'text',
          materials: newItem.materials,
        };

        if (user) {
          insertRow.user_id = user.id;
        }

        const { data, error } = await supabase
          .from('study_materials')
          .insert([insertRow])
          .select();
        
        if (!error && data && data[0]) {
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
    setCurrentMaterials(newItem.materials);
    setCurrentSourceText(effectiveSourceText);
    setActiveItemId(newItem.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Instant Sample Pill Selection Handler (Try Without Signup)
  const handleSelectSample = (sampleKey: 'medicalCaseStudy' | 'corporateLawBrief' | 'systemsArchitecture') => {
    const sample = SAMPLE_DOCUMENTS[sampleKey];
    if (!sample) return;

    setCurrentTitle(sample.title);
    setCurrentMaterials(sample.materials);
    setCurrentSourceText(sample.sourceText);
    setActiveItemId(sample.id);

    // Also add to local history preview so it appears in the sidebar library
    const sampleHistoryItem: HistoryItem = {
      id: sample.id,
      title: sample.title,
      materials: sample.materials,
      sourceText: sample.sourceText,
      subject: sample.subject,
      tags: sample.tags,
      date: 'Sample Kit',
      type: 'text',
      isSynced: false
    };

    const exists = history.some((h) => h.id === sample.id);
    if (!exists) {
      setHistory([sampleHistoryItem, ...history]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load an item from history
  const loadHistoryItem = (item: HistoryItem) => {
    setCurrentTitle(item.title);
    setCurrentMaterials(item.materials);
    setCurrentSourceText(item.sourceText || item.materials?.sourceText || '');
    setActiveItemId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete an item from history
  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updated = history.filter((item) => item.id !== id);
    saveLocalHistoryOnly(updated);

    const targetItem = history.find((item) => item.id === id);
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
    
    if (currentMaterials && targetItem?.materials === currentMaterials) {
      handleBackToDashboard();
    }
  };

  // Share study guide
  const handleShareGuide = async (item: HistoryItem) => {
    if (!dbConfigured) {
      alert('Supabase is not configured yet. Add your Supabase keys in .env.local to share guides.');
      return;
    }

    let shareId = item.id;

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
          const updated = history.map((h) => (h.id === item.id ? { ...h, id: shareId, isSynced: true } : h));
          saveLocalHistoryOnly(updated);
        }
      } catch (err) {
        console.error('Error sharing guide on-the-fly:', err);
        return;
      }
    }

    const shareUrl = `${window.location.origin}/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSharedId(shareId);
      setTimeout(() => setSharedId(null), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentTitle(null);
    setCurrentMaterials(null);
    setCurrentSourceText('');
    setActiveItemId(null);
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div className="loading-spinner">
          <div className="dot" style={{ backgroundColor: '#4f46e5' }} />
          <div className="dot" style={{ backgroundColor: '#4f46e5' }} />
          <div className="dot" style={{ backgroundColor: '#4f46e5' }} />
        </div>
      </div>
    );
  }

  // Database notice fallback
  if (!dbConfigured) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '2rem' }}>
        <div className="card animate-scale-in" style={{ padding: '3rem', maxWidth: '520px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginBottom: '1rem', fontWeight: 700, color: '#0f172a' }}>Database Configuration Required</h2>
          <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
            LearnSpine requires Supabase to handle user authentication, history sync, and sharing features.
          </p>
          <p style={{ fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            Please add your <strong>NEXT_PUBLIC_SUPABASE_URL</strong> and <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> in your <code>.env.local</code> file or Vercel Environment Variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      
      {/* Auth modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
      />

      {/* Upgrade to Pro modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        pageCountNotice={upgradeNoticePages}
      />

      {/* Subscription Management & Unsubscribe modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        userId={user?.id}
        userEmail={user?.email}
        onSubscriptionChange={(updatedSub) => {
          setIsPro(updatedSub.isPro);
        }}
      />

      {/* Upgrade success toast */}
      {upgradeSuccessToast && (
        <div style={{
          backgroundColor: '#ecfdf5',
          borderBottom: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          zIndex: 60,
          position: 'relative'
        }}>
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>🎉 <strong>Welcome to LearnSpine Pro!</strong> Your account is upgraded with access to 100-page documents and high-resolution diagram exports.</span>
          <button 
            onClick={() => setUpgradeSuccessToast(false)} 
            className="btn-ghost" 
            style={{ padding: '0.2rem 0.5rem', marginLeft: '1rem', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Academic Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem'
      }}>
        <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {currentMaterials ? (
              <button 
                onClick={handleBackToDashboard} 
                className="btn-ghost" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#0f172a' }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
            ) : (
              <Logo onClick={handleBackToDashboard} size={28} />
            )}

            {currentMaterials && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#cbd5e1' }}>/</span>
                <span style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  maxWidth: '320px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {currentTitle}
                </span>
              </div>
            )}
          </div>

          {/* Right Navigation Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="/contact" className="hover-link" style={{ fontSize: '0.85rem', color: '#475569' }}>Contact</a>
            <a href="#pricing" className="hover-link" style={{ fontSize: '0.85rem', color: '#475569' }}>Pricing</a>
            
            {/* Pro badge / Upgrade CTA */}
            {isPro ? (
              <button
                onClick={handleManageSubscription}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#b45309',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Manage Subscription / Unsubscribe"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>PRO ACTIVE</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setUpgradeNoticePages(undefined);
                  setIsUpgradeModalOpen(true);
                }}
                className="btn-primary"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to Pro</span>
              </button>
            )}

            {/* Auth Buttons */}
            {dbConfigured && (
              <>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.8rem',
                      color: '#475569'
                    }}>
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </span>
                    </div>

                    {isPro && (
                      <button 
                        onClick={handleManageSubscription}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.35rem 0.65rem',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          color: '#b91c1c',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                        title="Unsubscribe from Pro"
                      >
                        Unsubscribe
                      </button>
                    )}

                    <button 
                      onClick={handleSignOut} 
                      className="btn-ghost" 
                      style={{ padding: '0.35rem' }}
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a href="/login" className="hover-link" style={{ fontSize: '0.85rem', color: '#475569', padding: '0.4rem 0.6rem' }}>
                      Log in
                    </a>
                    <a href="/signup" className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      Sign up
                    </a>
                  </div>
                )}
              </>
            )}

            {currentMaterials && (
              <button
                onClick={handleBackToDashboard}
                className="btn-primary"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Guide</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Workspace or Landing Viewport */}
      <main style={{ flex: 1, padding: currentMaterials ? '1.25rem' : '0 1.5rem' }}>
        
        {/* Step-by-Step Processing Overlay */}
        {isProcessing ? (
          <div style={{ padding: '4rem 1rem' }}>
            <ProcessingStepper fileName={processingFileName} isProcessing={isProcessing} />
          </div>
        ) : currentMaterials ? (
          /* Two-Pane Split Study Workspace View with Collapsible Navigation Sidebar */
          <div
            style={{
              maxWidth: '1600px',
              margin: '0 auto',
              display: 'flex',
              gap: '1.25rem',
              height: 'calc(100vh - 100px)'
            }}
          >
            {/* Collapsible Document Library Sidebar */}
            <DocumentSidebar
              items={history}
              activeId={activeItemId}
              onSelectItem={loadHistoryItem}
              onDeleteItem={deleteHistoryItem}
              onNewGuide={handleBackToDashboard}
              isPro={isPro}
              onUpgradeClick={() => setIsUpgradeModalOpen(true)}
              isOpen={isSidebarOpen}
              onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Split Workspace: Left Source Viewer + Right Output Switcher */}
            <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
              <SplitWorkspace
                title={currentTitle || 'Study Kit'}
                materials={currentMaterials}
                sourceText={currentSourceText}
                shareId={activeItemId}
                onShare={async () => {
                  const targetItem = history.find((h) => h.id === activeItemId) || history[0];
                  if (targetItem) {
                    await handleShareGuide(targetItem);
                  }
                }}
                onNewGuide={handleBackToDashboard}
              />
            </div>
          </div>
        ) : (
          /* Comprehensive Academic Landing View */
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '5rem', padding: '3.5rem 0 6rem' }}>
            
            {/* Hero Section */}
            <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem' }}>
              
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  backgroundColor: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#4f46e5'
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Study Intelligence for Professional Students & Educators</span>
              </div>

              {/* Title & Subtitle */}
              <div style={{ maxWidth: '820px' }}>
                <h1 style={{ fontSize: '3.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '1rem' }}>
                  Transform Complex Text & PDFs into Visual Flowcharts, Flashcards, and Quizzes.
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#475569', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto' }}>
                  Designed for medical, legal, and engineering professionals who need to master dense academic literature with zero cognitive fatigue.
                </p>
              </div>

              {/* Frictionless Try-Without-Signup Dropzone */}
              <div style={{ width: '100%', marginTop: '0.75rem' }}>
                <HeroDropzone
                  onSuccess={(t, m, st) => handleSuccess(t, m, st)}
                  onSelectSample={handleSelectSample}
                  onStartProcessing={(name) => {
                    setProcessingFileName(name);
                    setIsProcessing(true);
                  }}
                  onFinishProcessing={() => setIsProcessing(false)}
                  isPro={isPro}
                  onRequirePro={(pages) => {
                    setUpgradeNoticePages(pages);
                    setIsUpgradeModalOpen(true);
                  }}
                />
              </div>
            </section>

            {/* Interactive Before & After Showcase Above The Fold */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', maxWidth: '640px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  See the Transformation Live
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
                  Compare raw academic prose directly against interactive visual diagrams, active recall cards, and assessment items.
                </p>
              </div>

              <BeforeAfterShowcase />
            </section>

            {/* 3 Core Output Pillars Section */}
            <section id="features" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  Three Pedagogical Modalities in One Workspace
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
                  Every uploaded document produces three synchronized active-learning artifacts with bidirectional source tracking.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Feature 1 */}
                <div className="card" style={{ padding: '2rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4f46e5'
                  }}>
                    <GitFork className="w-5 h-5" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Interactive Flowcharts</h3>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                    Floating canvas controls with pan, zoom, fit-to-screen, and mini-map. Export ready-to-present lecture slides in PNG, SVG, or Mermaid markdown.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="card" style={{ padding: '2rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a'
                  }}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Tactile 3D Flashcards</h3>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                    Full keyboard shortcut support (Space, Arrows, 1-3 ratings), live mastery tracking, Anki deck export, and instant source passage lookups.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="card" style={{ padding: '2rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706'
                  }}>
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Immediate-Feedback Quizzes</h3>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                    Option clicks reveal correct answers instantly. Expandable "Why this is right" cards include one-click buttons to highlight source text evidence.
                  </p>
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem'
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fair & Simple Academic Pricing</span>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  Invest in Mastery, Not Busywork
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
                  Start free with your first study kits, or unlock full course compendiums and textbooks with Pro.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
                
                {/* Free Tier */}
                <div className="card" style={{ padding: '2.25rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Academic Free</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>For individual papers and article summaries.</p>
                    <div style={{ margin: '1.5rem 0' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>0 SEK</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}> / forever</span>
                    </div>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#475569' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 10 pages per document
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Flowcharts, flashcards & quizzes
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Bidirectional reference highlighting
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> 3 document processing slots
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="btn-secondary"
                    style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}
                  >
                    Get Started Free
                  </button>
                </div>

                {/* Pro Tier */}
                <div
                  className="card"
                  style={{
                    padding: '2.25rem',
                    backgroundColor: '#ffffff',
                    border: '2px solid #4f46e5',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 30px rgba(79, 70, 229, 0.12)'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '24px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.75rem',
                      borderRadius: '999px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Recommended
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>LearnSpine Pro</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>For professional students and academic faculty.</p>
                    <div style={{ margin: '1.5rem 0' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>69 SEK</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}> / month</span>
                    </div>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#475569' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> <strong>Up to 100 pages per PDF</strong> (full books & guides)
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> <strong>High-res PNG, SVG & PDF flowchart downloads</strong>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> <strong>30+ Flashcards & comprehensive quiz sets</strong>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> <strong>Parallel AI chunking for instant processing</strong>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Cancel anytime with 1-click in account settings
                      </li>
                    </ul>
                  </div>

                  <div style={{ marginTop: '2rem' }}>
                    <button
                      onClick={() => {
                        if (isPro) {
                          handleManageSubscription();
                        } else {
                          setUpgradeNoticePages(undefined);
                          setIsUpgradeModalOpen(true);
                        }
                      }}
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
                    >
                      {isPro ? 'Manage / Unsubscribe from Pro' : 'Upgrade to Pro (69 SEK/mo)'}
                    </button>

                    {isPro && (
                      <div style={{ textAlign: 'center', marginTop: '0.65rem' }}>
                        <button
                          onClick={handleManageSubscription}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Cancel subscription / Opt out of Pro
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </section>

          </div>
        )}
      </main>

      {/* Academic Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        padding: '2.5rem 2rem',
        fontSize: '0.85rem',
        color: '#64748b',
        backgroundColor: '#ffffff',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <Logo size={24} />
          <span>© {new Date().getFullYear()} LearnSpine (learnspine.se). Dedicated to focused learning and low cognitive load.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/contact" className="hover-link">Contact</a>
            <a href="#features" className="hover-link">Features</a>
            <a href="#pricing" className="hover-link">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
