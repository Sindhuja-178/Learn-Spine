'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/auth-modal';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === 'signup' || window.location.pathname.includes('/signup')) {
        setMode('signup');
      } else if (m === 'forgot' || window.location.pathname.includes('/forgot-password') || params.get('forgot') === 'true') {
        setMode('forgot');
      }

      // If user arrived with a recovery token or code in URL, forward to /reset-password
      const hash = window.location.hash || '';
      const code = params.get('code');
      if (hash.includes('type=recovery') || code) {
        router.push(`/reset-password${window.location.search}${hash}`);
        return;
      }
    }

    async function checkUser() {
      if (supabase) {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !hash.includes('type=recovery')) {
          router.push('/');
          return;
        }
      }
      setLoading(false);
    }
    checkUser();
  }, [router]);

  if (loading) {
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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--color-bg-primary)',
      padding: '1rem' 
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <Logo href="/" size={36} />
      </div>

      <AuthModal 
        isOpen={true} 
        onSuccess={() => {
          // Force a full page reload to refresh all supabase contexts on the homepage
          window.location.href = '/';
        }}
        isFullPage={true}
        initialView={mode}
      />
    </div>
  );
}
