'use client';

import { useState } from 'react';
import { Sparkles, Check, X, ShieldCheck, Zap, Download, Layers, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageCountNotice?: number;
}

export function UpgradeModal({ isOpen, onClose, pageCountNotice }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleCheckout() {
    setLoading(true);
    setError('');

    try {
      let userEmail: string | undefined = undefined;
      let userId: string | undefined = undefined;

      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userEmail = session.user.email;
          userId = session.user.id;
        }
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          returnUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Kunde inte initiera betalning. Försök igen.');
      }

      // Redirect user to Stripe Hosted Checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Ett fel inträffade. Försök igen.');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e7e5e4',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: '2rem 1.75rem',
          animation: 'modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #ea580c, #f59e0b, #e11d48)',
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '32px',
            height: '32px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f4',
            color: '#78716c',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          aria-label="Stäng"
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>

        {/* Pill Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
            }}
          >
            <Sparkles style={{ width: '12px', height: '12px', color: '#f59e0b' }} />
            LearnSpine Pro
          </span>
          <span style={{ fontSize: '0.75rem', color: '#a8a29e' }}>Avsluta när som helst</span>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1c1917', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
          Studera smartare med Pro
        </h2>

        {/* Page Limit Warning if applicable */}
        {pageCountNotice ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              padding: '0.85rem 1rem',
              borderRadius: '14px',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#9a3412',
              fontSize: '0.825rem',
              lineHeight: 1.45,
              marginTop: '0.85rem',
              marginBottom: '0.85rem',
            }}
          >
            <Layers style={{ width: '18px', height: '18px', color: '#ea580c', flexShrink: 0, marginTop: '2px' }} />
            <span>
              Ditt dokument innehåller <strong>{pageCountNotice} sidor</strong>. Gratisversionen stödjer upp till 10 sidor. Uppgradera till Pro för att bearbeta hela dokumentet!
            </span>
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#78716c', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
            Lås upp full AI-kapacitet för kursböcker, stora PDF-dokument och obegränsade flödesschemaexporter.
          </p>
        )}

        {/* Pricing Display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderRadius: '16px',
            backgroundColor: '#fafaf9',
            border: '1px solid #e7e5e4',
            margin: '1.25rem 0',
          }}
        >
          <div>
            <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1c1917' }}>69 SEK</span>
            <span style={{ fontSize: '0.85rem', color: '#78716c' }}> / månad</span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
            }}
          >
            30–50 dokument/mån
          </span>
        </div>

        {/* Features List */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 1.5rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: '#44403c',
          }}
        >
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check style={{ width: '13px', height: '13px' }} />
            </div>
            <span><strong>Upp till 100 sidor per dokument</strong> (Hela kurskompendier)</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap style={{ width: '13px', height: '13px' }} />
            </div>
            <span><strong>Parallell AI-chunking</strong> (Blixtsnabb bearbetning)</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Download style={{ width: '13px', height: '13px' }} />
            </div>
            <span><strong>Flödesscheman i SVG, PNG och PDF</strong> i hög upplösning</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check style={{ width: '13px', height: '13px' }} />
            </div>
            <span><strong>20+ Flashcards & Fullständiga provquizzar</strong></span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck style={{ width: '13px', height: '13px' }} />
            </div>
            <span><strong>Molnsparning & Obegränsad studiehistorik</strong></span>
          </li>
        </ul>

        {error && (
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#dc2626', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Upgrade CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ea580c, #d97706)',
            color: '#ffffff',
            fontSize: '0.95rem',
            fontWeight: 600,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'opacity 0.2s',
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
              <span>Kopplar till säker betalning...</span>
            </>
          ) : (
            <>
              <span>Uppgradera till Pro (69 SEK/mån)</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </>
          )}
        </button>

        {/* Security Note */}
        <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#a8a29e' }}>
          <ShieldCheck style={{ width: '14px', height: '14px' }} />
          <span>Säker krypterad kortbetalning via Stripe. Inga bindningstider.</span>
        </div>
      </div>
    </div>
  );
}
