'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, X, AlertCircle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
  isFullPage?: boolean;
  initialView?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, isFullPage = false, initialView = 'signin' }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(initialView === 'signup');

  useEffect(() => {
    setIsSignUp(initialView === 'signup');
  }, [initialView]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);

  if (!isOpen) return null;

  async function handleResendEmail() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !supabase) return;
    setResending(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(`Verification link resent to ${cleanEmail}. Please check your inbox and spam folder.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setShowResend(false);
    setLoading(true);

    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isSignUp) {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          }
        });

        if (signUpError) {
          setError(signUpError.message);
        } else if (data.user && data.session) {
          // Instantly logged in
          onSuccess();
          if (onClose) onClose();
        } else {
          // Needs verification
          setMessage(`Check your email inbox at ${cleanEmail} for a validation link to complete registration.`);
          setShowResend(true);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes('email not confirmed')) {
            setError('Your email is not verified yet. Please check your inbox (and spam folder) for the verification link, or click below to resend it.');
            setShowResend(true);
          } else {
            setError(signInError.message);
          }
        } else {
          onSuccess();
          if (onClose) onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  }

  const cardContent = (
    <div 
      className="card animate-scale-in" 
      style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--color-bg-secondary)',
        position: 'relative',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border-default)'
      }}
    >
      {/* Close Button - Only show if not full page */}
      {!isFullPage && onClose && (
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            padding: '0.35rem',
            borderRadius: '9999px',
            color: 'var(--color-text-muted)',
            transition: 'color 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Modal Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <Logo size={48} showText={false} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {isSignUp ? 'Sign up to generate and save your study guides' : 'Sign in to access your Pro features & study guides'}
        </p>
      </div>

      {/* Prominent Tab Switcher */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--color-bg-tertiary, #f3f4f6)',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '1.5rem'
      }}>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError('');
            setMessage('');
            setShowResend(false);
          }}
          style={{
            flex: 1,
            padding: '0.55rem',
            borderRadius: '9px',
            fontSize: '0.85rem',
            fontWeight: !isSignUp ? 600 : 500,
            border: 'none',
            backgroundColor: !isSignUp ? '#ffffff' : 'transparent',
            color: !isSignUp ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            boxShadow: !isSignUp ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setError('');
            setMessage('');
            setShowResend(false);
          }}
          style={{
            flex: 1,
            padding: '0.55rem',
            borderRadius: '9px',
            fontSize: '0.85rem',
            fontWeight: isSignUp ? 600 : 500,
            border: 'none',
            backgroundColor: isSignUp ? '#ffffff' : 'transparent',
            color: isSignUp ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            boxShadow: isSignUp ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          Create Account
        </button>
      </div>

      {/* Info/Message Notifications */}
      {error && (
        <div className="animate-slide-down" style={{
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          backgroundColor: 'var(--color-accent-red-light)',
          border: '1px solid rgba(220, 38, 38, 0.15)',
          color: 'var(--color-accent-red)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          lineHeight: 1.45
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <AlertCircle className="w-4 h-4 shrink-0" style={{ marginTop: '2px' }} />
            <div>{error}</div>
          </div>
          {showResend && (
            <div style={{ marginTop: '0.75rem', paddingLeft: '1.5rem' }}>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-red)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.8rem'
                }}
              >
                {resending ? 'Sending...' : 'Click here to resend verification email'}
              </button>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className="animate-slide-down" style={{
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          backgroundColor: 'var(--color-accent-green-light)',
          border: '1px solid rgba(22, 163, 74, 0.15)',
          color: 'var(--color-accent-green)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          lineHeight: 1.45
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Sparkles className="w-4 h-4 shrink-0" style={{ marginTop: '2px' }} />
            <div>{message}</div>
          </div>
          {showResend && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center', paddingLeft: '1.5rem', fontSize: '0.8rem' }}>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-green)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {resending ? 'Sending...' : 'Resend link'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setMessage('');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-green)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Switch to Sign In
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label htmlFor="auth-email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail className="w-4 h-4" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="auth-password" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock className="w-4 h-4" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="••••••••"
              minLength={6}
            />
          </div>
        </div>

        {isSignUp && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input 
              id="gdpr-consent" 
              type="checkbox" 
              required 
              style={{ marginTop: '0.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="gdpr-consent" style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, cursor: 'pointer' }}>
              I agree to the{' '}
              <a href="/privacy" target="_blank" style={{ textDecoration: 'underline', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                Privacy Policy
              </a>{' '}
              and allow LearnSpine to process my documents.
            </label>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem 1.5rem', marginTop: '0.5rem' }}
        >
          {loading ? (
            <span className="loading-spinner">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </span>
          ) : (
            isSignUp ? 'Sign Up' : 'Sign In'
          )}
        </button>
      </form>

      {/* Mode Toggle Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--color-border-default)',
        fontSize: '0.85rem',
        color: 'var(--color-text-secondary)'
      }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setMessage('');
            setShowResend(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-primary)',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );

  if (isFullPage) {
    return cardContent;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'rgba(28, 25, 23, 0.4)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {cardContent}
    </div>
  );
}
