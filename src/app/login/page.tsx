'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/auth-modal';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'signup' || window.location.pathname.includes('/signup')) {
        setMode('signup');
      }
    }

    async function checkUser() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-bg-secondary)',
          fontWeight: 'bold',
          fontFamily: 'var(--font-family-display)',
          fontSize: '1rem'
        }}>
          L
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>LearnSpine</span>
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
