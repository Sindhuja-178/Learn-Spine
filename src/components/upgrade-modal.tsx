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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Banner */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Stäng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Badge & Title */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              LearnSpine Pro
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">Avsluta när som helst</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Studera smartare med Pro
          </h2>

          {pageCountNotice ? (
            <div className="mt-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-xs text-orange-900 dark:text-orange-200 flex items-start gap-2">
              <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <span>
                Ditt dokument innehåller <strong>{pageCountNotice} sidor</strong>. Gratisversionen stödjer upp till 10 sidor. Uppgradera till Pro för att bearbeta hela dokumentet!
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Lås upp full AI-kapacitet för kursböcker, stora PDF-dokument och obegränsade flödesschemaexporter.
            </p>
          )}

          {/* Pricing Display */}
          <div className="my-6 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-baseline justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">69 SEK</span>
              <span className="text-sm font-medium text-stone-500 dark:text-stone-400"> / månad</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
              30–50 dokument/mån
            </span>
          </div>

          {/* Features List */}
          <ul className="space-y-3 mb-6 text-sm text-stone-700 dark:text-stone-300">
            <li className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span><strong>Upp till 100 sidor per dokument</strong> (Kompletta kurskompendier)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span><strong>Parallell AI-chunking</strong> (Blixtsnabb bearbetning)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <Download className="w-3.5 h-3.5" />
              </div>
              <span><strong>Flödesscheman i SVG, PNG och PDF</strong> i hög upplösning</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span><strong>20+ Flashcards & Fullständiga provquizzar</strong> med förklaringar</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span><strong>Molnsparning & Obegränsad studiehistorik</strong></span>
            </li>
          </ul>

          {error && (
            <p className="mb-4 text-xs font-medium text-rose-600 dark:text-rose-400 text-center">
              {error}
            </p>
          )}

          {/* Upgrade CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Kopplar till säker betalning...</span>
              </>
            ) : (
              <>
                <span>Uppgradera till Pro (69 SEK/mån)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Security note */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Säker krypterad kortbetalning via Stripe. Inga bindningstider.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
