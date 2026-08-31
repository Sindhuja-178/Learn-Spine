'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('learnspine_gdpr_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('learnspine_gdpr_consent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div 
      className="animate-slide-up"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        right: '1.5rem',
        zIndex: 1000,
        margin: '0 auto',
        maxWidth: '560px',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'flex-start'
      }}
    >
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        We use essential cookies and local storage to authenticate your account and save your generated study guides. By continuing to use LearnSpine, you agree to our{' '}
        <Link 
          href="/privacy" 
          style={{ 
            color: 'var(--color-text-primary)', 
            fontWeight: 600, 
            textDecoration: 'underline' 
          }}
        >
          Privacy Policy
        </Link>.
      </div>
      <button 
        onClick={handleAccept} 
        className="btn-primary" 
        style={{ 
          padding: '0.45rem 1.5rem', 
          fontSize: '0.8rem', 
          borderRadius: '9999px',
          alignSelf: 'flex-end'
        }}
      >
        Accept
      </button>
    </div>
  );
}
