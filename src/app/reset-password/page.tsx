'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/logo';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Loader2, Check } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initRecovery() {
      if (!supabase) {
        if (isMounted) {
          setError('Supabase authentication is not configured.');
          setVerifying(false);
        }
        return;
      }

      // 1. Handle PKCE code if present in URL
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code);
          } catch (e) {
            console.warn('[Reset Password] PKCE exchange warning:', e);
          }
        }
      }

      // 2. Listen for PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (isMounted) {
          const hash = typeof window !== 'undefined' ? window.location.hash : '';
          const search = typeof window !== 'undefined' ? window.location.search : '';
          if (event === 'PASSWORD_RECOVERY' || (session && (hash.includes('type=recovery') || search.includes('code=')))) {
            setIsRecoverySession(true);
            setVerifying(false);
          }
        }
      });

      // 3. Check for existing session or recovery hash
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const { data: { session } } = await supabase.auth.getSession();

      if (session || hash.includes('type=recovery') || hash.includes('access_token')) {
        if (isMounted) {
          setIsRecoverySession(true);
          setVerifying(false);
        }
      } else {
        // Wait 1.5s grace period for Supabase client to parse URL hash tokens
        setTimeout(async () => {
          if (!isMounted || !supabase) return;
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          if (delayedSession || window.location.hash.includes('type=recovery')) {
            setIsRecoverySession(true);
          } else {
            setIsRecoverySession(false);
          }
          setVerifying(false);
        }, 1500);
      }

      return () => {
        subscription.unsubscribe();
      };
    }

    initRecovery();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!supabase) {
      setError('Authentication service is not configured.');
      return;
    }

    setUpdating(true);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSuccess(true);
        // Automatically redirect to homepage after 2.5 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password. Please try again.';
      setError(msg);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-primary)',
        padding: '1.5rem',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <Logo href="/" size={38} />
      </div>

      <div
        className="card animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--color-bg-secondary)',
          position: 'relative',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border-default)',
          borderRadius: '24px',
        }}
      >
        {/* State 1: Verifying link */}
        {verifying && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Verifying reset link...
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Checking your password recovery token.
            </p>
          </div>
        )}

        {/* State 2: Invalid or expired link */}
        {!verifying && !isRecoverySession && !success && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
              }}
            >
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
              Reset Link Expired or Invalid
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              This password reset link has expired, was already used, or is invalid. For your security, password reset links are single-use only.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href="/forgot-password"
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                }}
              >
                <span>Request New Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/login"
                className="btn-ghost"
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Return to Sign In
              </a>
            </div>
          </div>
        )}

        {/* State 3: Success state */}
        {!verifying && success && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                border: '1px solid #d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
              }}
            >
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
              Password Reset Complete!
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Your password has been successfully updated. You are now logged in and being redirected to your workspace...
            </p>

            <a
              href="/"
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                width: '100%',
                padding: '0.75rem 1.25rem',
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              <span>Go to Workspace Now</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* State 4: Active Reset Form */}
        {!verifying && isRecoverySession && !success && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(234, 88, 12, 0.1)',
                  border: '1px solid rgba(234, 88, 12, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <KeyRound className="w-6 h-6 text-amber-600" />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Set a New Password
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                Enter your new password below to regain access to your LearnSpine account.
              </p>
            </div>

            {error && (
              <div
                className="animate-slide-down"
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-accent-red-light)',
                  border: '1px solid rgba(220, 38, 38, 0.15)',
                  color: 'var(--color-accent-red)',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" style={{ marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label
                  htmlFor="new-password"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    className="w-4 h-4"
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
                  />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="At least 6 characters"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '0.2rem',
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}
                >
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    className="w-4 h-4"
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
                  />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="Repeat new password"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                    {newPassword === confirmPassword ? (
                      <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Check className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={updating}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border-default)' }}>
              <a
                href="/login"
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                }}
              >
                Cancel and return to <strong style={{ color: 'var(--color-text-primary)' }}>Sign In</strong>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
