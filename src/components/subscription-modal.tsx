'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Check, X, ShieldCheck, AlertTriangle, ExternalLink, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { isComplimentaryProEmail, UserSubscription } from '@/lib/subscription';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userId?: string;
  onSubscriptionChange?: (sub: UserSubscription) => void;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  userEmail,
  userId,
  onSubscriptionChange,
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [subData, setSubData] = useState<{
    isPro: boolean;
    status: string;
    customerId?: string;
    subscriptionId?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    plan?: string;
    amountSEK?: number;
  } | null>(null);

  const isComplimentary = isComplimentaryProEmail(userEmail);

  // Fetch latest subscription status whenever modal opens
  useEffect(() => {
    if (!isOpen) {
      setConfirmCancel(false);
      setError(null);
      setSuccessMessage(null);
      return;
    }

    if (isComplimentary) {
      setSubData({
        isPro: true,
        status: 'active',
        customerId: 'complimentary_pro',
        subscriptionId: 'complimentary_pro',
        cancelAtPeriodEnd: false,
      });
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch('/api/stripe/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: userEmail, includeDocuments: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.isPro) {
          setSubData({
            isPro: true,
            status: data.status || 'active',
            customerId: data.customerId,
            subscriptionId: data.subscriptionId,
            currentPeriodEnd: data.currentPeriodEnd,
            cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
            plan: data.documents?.subscription?.plan || 'LearnSpine Pro (Monthly)',
            amountSEK: data.documents?.subscription?.amountSEK || 69,
          });
        } else {
          setSubData(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load subscription status:', err);
        if (isMounted) setError('Failed to load subscription details. Please try again.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userEmail, userId, isComplimentary]);

  if (!isOpen) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Active billing cycle';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Handle Cancel or Resume
  const handleSubscriptionAction = async (action: 'cancel' | 'resume') => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          subscriptionId: subData?.subscriptionId,
          action,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to update subscription.');
      }

      setSuccessMessage(result.message);
      setConfirmCancel(false);

      const isCanceling = result.cancelAtPeriodEnd ?? (action === 'cancel');
      const updatedSub: UserSubscription = {
        isPro: true,
        status: isCanceling ? 'canceling' : 'active',
        customerId: subData?.customerId,
        subscriptionId: subData?.subscriptionId,
        currentPeriodEnd: result.currentPeriodEnd || subData?.currentPeriodEnd,
        cancelAtPeriodEnd: isCanceling,
      };

      setSubData((prev) =>
        prev
          ? {
              ...prev,
              cancelAtPeriodEnd: isCanceling,
              status: isCanceling ? 'canceling' : 'active',
              currentPeriodEnd: result.currentPeriodEnd || prev.currentPeriodEnd,
            }
          : null
      );

      if (onSubscriptionChange) {
        onSubscriptionChange(updatedSub);
      }
    } catch (err: unknown) {
      console.error('Subscription update error:', err);
      setError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle opening Stripe Billing Portal
  const handleOpenStripePortal = async () => {
    setPortalLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          customerId: subData?.customerId,
          returnUrl: window.location.origin,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Unable to open Stripe customer portal.');
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      console.error('Portal open error:', err);
      setError(err instanceof Error ? err.message : 'Could not open billing portal.');
      setPortalLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
          maxWidth: '480px',
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
            background: 'linear-gradient(90deg, #ea580c, #f59e0b)',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1c1917', margin: 0, letterSpacing: '-0.02em' }}>
                Subscription Management
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#78716c', margin: 0 }}>
              {userEmail ? `Logged in as ${userEmail}` : 'Your LearnSpine Pro membership'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#f5f5f4',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#78716c',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ padding: '2.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span style={{ fontSize: '0.875rem', color: '#78716c' }}>Checking subscription details...</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {!loading && (
          <>
            {/* VIP / Complimentary Pro View */}
            {isComplimentary ? (
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <strong style={{ fontSize: '1rem', color: '#92400e' }}>LearnSpine Pro VIP</strong>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      border: '1px solid #fde68a',
                    }}
                  >
                    Lifetime Access
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#78350f', lineHeight: 1.5, margin: 0 }}>
                  Your account has been granted complimentary lifetime Pro access. You have unrestricted access to all Pro features with no recurring charges or credit card on file.
                </p>
              </div>
            ) : (
              <>
                {/* Standard Paid Pro Subscription Card */}
                <div
                  style={{
                    backgroundColor: '#fafaf9',
                    border: '1px solid #e7e5e4',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1c1917' }}>
                        LearnSpine Pro
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#78716c' }}>
                        {subData?.amountSEK || 69} SEK / month
                      </div>
                    </div>

                    {subData?.cancelAtPeriodEnd ? (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          border: '1px solid #fde68a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Calendar className="w-3 h-3" />
                        Cancels at period end
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          border: '1px solid #a7f3d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #e7e5e4', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#57534e' }}>
                      <span>{subData?.cancelAtPeriodEnd ? 'Access ends on' : 'Next billing / renewal'}</span>
                      <strong style={{ color: '#1c1917' }}>{formatDate(subData?.currentPeriodEnd)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#57534e' }}>
                      <span>Recurring charges</span>
                      <span style={{ fontWeight: 600, color: subData?.cancelAtPeriodEnd ? '#dc2626' : '#16a34a' }}>
                        {subData?.cancelAtPeriodEnd ? 'Turned off (No renewal)' : 'Active (69 SEK/mo)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Notice or Unsubscribe Action */}
                {subData?.cancelAtPeriodEnd ? (
                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
                      <strong>You have unsubscribed.</strong> Auto-renewal is cancelled and you will not be charged again. You retain full Pro access (up to 100 pages, flowcharts, flashcards) until <strong>{formatDate(subData?.currentPeriodEnd)}</strong>.
                    </p>
                    <button
                      onClick={() => handleSubscriptionAction('resume')}
                      disabled={actionLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        width: '100%',
                        padding: '0.6rem 1rem',
                        backgroundColor: '#10b981',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Resume Pro Subscription
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Confirmation Dialog for Unsubscribe */}
                    {confirmCancel ? (
                      <div
                        style={{
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '14px',
                          padding: '1.15rem',
                          marginBottom: '1.25rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <strong style={{ fontSize: '0.9rem' }}>Confirm Unsubscribe from Pro</strong>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: '#7f1d1d', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                          You will not be billed again. Your Pro features (50–100 page document uploads, SVG/PNG/PDF flowcharts, quizzes) will remain completely accessible until <strong>{formatDate(subData?.currentPeriodEnd)}</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleSubscriptionAction('cancel')}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              padding: '0.6rem 0.75rem',
                              backgroundColor: '#dc2626',
                              border: 'none',
                              borderRadius: '10px',
                              color: '#ffffff',
                              fontSize: '0.825rem',
                              fontWeight: 700,
                              cursor: actionLoading ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Yes, Unsubscribe
                          </button>
                          <button
                            onClick={() => setConfirmCancel(false)}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              padding: '0.6rem 0.75rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid #d6d3d1',
                              borderRadius: '10px',
                              color: '#44403c',
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Keep Pro
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <button
                          onClick={() => setConfirmCancel(true)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.65rem 1rem',
                            backgroundColor: '#fff',
                            border: '1px solid #fca5a5',
                            borderRadius: '12px',
                            color: '#dc2626',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Unsubscribe from Pro
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Stripe Billing Portal Button */}
                <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '1rem' }}>
                  <button
                    onClick={handleOpenStripePortal}
                    disabled={portalLoading}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.65rem 1rem',
                      backgroundColor: '#f5f5f4',
                      border: '1px solid #e7e5e4',
                      borderRadius: '12px',
                      color: '#44403c',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: portalLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {portalLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-stone-500" />
                    )}
                    Open Stripe Billing Portal (Invoices & Card Settings)
                  </button>
                </div>
              </>
            )}

            {/* Pro Features Included Reminder */}
            <div
              style={{
                marginTop: '1.25rem',
                backgroundColor: '#fafaf9',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                fontSize: '0.75rem',
                color: '#78716c',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Payments and recurring subscriptions are handled securely through Stripe.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
