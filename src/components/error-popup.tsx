'use client';

import { useEffect } from 'react';
import { AlertCircle, X, ArrowRight, Sparkles } from 'lucide-react';

interface ErrorPopupProps {
  message: string | null;
  onClose: () => void;
  onUpgrade?: () => void;
  autoHideDuration?: number; // ms
}

export function ErrorPopup({ message, onClose, onUpgrade, autoHideDuration = 7000 }: ErrorPopupProps) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [message, autoHideDuration, onClose]);

  if (!message) return null;

  const isUpgradeRelated = message.toLowerCase().includes('uppgradera') || 
    message.toLowerCase().includes('pro') || 
    message.toLowerCase().includes('krediter') ||
    message.toLowerCase().includes('sidor');

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: 'calc(100% - 2rem)',
        maxWidth: '460px',
        animation: 'slideDownFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem',
          padding: '1rem 1.15rem',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #fee2e2',
          boxShadow: '0 12px 36px -4px rgba(28, 25, 23, 0.12), 0 4px 12px rgba(220, 38, 38, 0.06)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Minimalist Red Icon Badge */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1c1917', marginBottom: '0.2rem' }}>
            Meddelande
          </div>
          <p style={{ fontSize: '0.815rem', color: '#57534e', lineHeight: 1.45, margin: 0 }}>
            {message}
          </p>

          {isUpgradeRelated && onUpgrade && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              style={{
                marginTop: '0.6rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #ea580c, #d97706)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
              }}
            >
              <Sparkles style={{ width: '12px', height: '12px' }} />
              <span>Uppgradera till Pro</span>
              <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a8a29e',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1c1917')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#a8a29e')}
          aria-label="Stäng meddelande"
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
}
