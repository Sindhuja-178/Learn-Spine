import { supabase } from './supabase';

export interface UserSubscription {
  isPro: boolean;
  status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due' | 'none';
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string;
}

/**
 * Checks whether a given Supabase user has an active LearnSpine Pro subscription.
 */
export async function checkUserSubscription(userId?: string): Promise<UserSubscription> {
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
      return { isPro: false, status: 'none' };
    }

    if (!data) {
      return { isPro: false, status: 'none' };
    }

    const isActive = data.status === 'active' || data.status === 'trialing';
    return {
      isPro: isActive,
      status: data.status,
      customerId: data.stripe_customer_id,
      subscriptionId: data.stripe_subscription_id,
      currentPeriodEnd: data.current_period_end,
    };
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
