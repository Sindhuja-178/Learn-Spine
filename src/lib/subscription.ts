import { supabase } from './supabase';

export interface UserSubscription {
  isPro: boolean;
  status: 'active' | 'trialing' | 'canceling' | 'canceled' | 'incomplete' | 'past_due' | 'none';
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Whitelist of email addresses granted complimentary lifetime LearnSpine Pro access without payment.
 */
export const COMPLIMENTARY_PRO_EMAILS: string[] = [
  'artist.sindhuja@gmail.com',
];

export function isComplimentaryProEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return COMPLIMENTARY_PRO_EMAILS.some(e => e.toLowerCase() === cleanEmail);
}

/**
 * Checks whether a given Supabase user has an active LearnSpine Pro subscription.
 */
export async function checkUserSubscription(userId?: string, userEmail?: string | null): Promise<UserSubscription> {
  const cleanEmail = (userEmail || '').trim().toLowerCase();

  // 1. Check real active subscription directly from Stripe API via backend sync first
  if (cleanEmail && typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/stripe/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: cleanEmail }),
      });
      if (res.ok) {
        const stripeStatus = await res.json();
        if (stripeStatus.isPro && stripeStatus.subscriptionId && stripeStatus.subscriptionId !== 'complimentary_pro') {
          return {
            isPro: true,
            status: stripeStatus.status || 'active',
            customerId: stripeStatus.customerId,
            subscriptionId: stripeStatus.subscriptionId,
            currentPeriodEnd: stripeStatus.currentPeriodEnd,
            cancelAtPeriodEnd: stripeStatus.cancelAtPeriodEnd,
          };
        }
      }
    } catch (stripeErr) {
      console.warn('[Subscription] Error querying Stripe status:', stripeErr);
    }
  }

  // 2. Check for complimentary Pro whitelist if no real Stripe subscription
  if (cleanEmail && isComplimentaryProEmail(cleanEmail)) {
    return {
      isPro: true,
      status: 'active',
      customerId: 'complimentary_pro',
      subscriptionId: 'complimentary_pro',
      cancelAtPeriodEnd: false,
    };
  }

  // 3. If userEmail wasn't passed directly, check active Supabase session
  if (!cleanEmail && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email && isComplimentaryProEmail(session.user.email)) {
        return {
          isPro: true,
          status: 'active',
          customerId: 'complimentary_pro',
          subscriptionId: 'complimentary_pro',
          cancelAtPeriodEnd: false,
        };
      }
    } catch {
      // Ignore session lookup failures
    }
  }

  if (!userId || !supabase) {
    return { isPro: false, status: 'none' };
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // If table does not exist yet or error occurs, fail defensively
      console.warn('[Subscription] Error checking subscription status:', error.message);
    } else if (data) {
      const isPeriodValid = data.current_period_end ? new Date(data.current_period_end).getTime() > Date.now() : true;
      const isActive = (data.status === 'active' || data.status === 'trialing' || data.status === 'canceling') && isPeriodValid;
      if (isActive) {
        return {
          isPro: isActive,
          status: data.status,
          customerId: data.stripe_customer_id,
          subscriptionId: data.stripe_subscription_id,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.status === 'canceling',
        };
      }
    }

    // 3. Fallback: Check active subscription directly from Stripe API via backend sync
    if (userEmail && typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/stripe/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email: userEmail }),
        });
        if (res.ok) {
          const stripeStatus = await res.json();
          if (stripeStatus.isPro) {
            return {
              isPro: true,
              status: stripeStatus.status || 'active',
              customerId: stripeStatus.customerId,
              subscriptionId: stripeStatus.subscriptionId,
              currentPeriodEnd: stripeStatus.currentPeriodEnd,
              cancelAtPeriodEnd: stripeStatus.cancelAtPeriodEnd,
            };
          }
        }
      } catch (stripeErr) {
        console.warn('[Subscription] Error querying Stripe status fallback:', stripeErr);
      }
    }

    return { isPro: false, status: 'none' };
  } catch (err) {
    console.warn('[Subscription] Exception checking subscription:', err);
    return { isPro: false, status: 'none' };
  }
}

/**
 * Records or updates a subscription in Supabase.
 */
export async function upsertSubscriptionRecord(record: {
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: string;
  priceId?: string;
  currentPeriodEnd?: Date;
}): Promise<boolean> {
  if (!supabase) {
    console.warn('[Subscription] Supabase is not configured to save subscription record.');
    return false;
  }

  try {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: record.userId,
        stripe_customer_id: record.customerId,
        stripe_subscription_id: record.subscriptionId,
        status: record.status,
        price_id: record.priceId,
        current_period_end: record.currentPeriodEnd ? record.currentPeriodEnd.toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'stripe_subscription_id',
      });

    if (error) {
      console.error('[Subscription] Failed to upsert subscription:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Subscription] Exception upserting subscription:', err);
    return false;
  }
}

/**
 * SQL migration schema for user reference in Supabase SQL Editor.
 */
export const SUBSCRIPTIONS_SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);
`;
