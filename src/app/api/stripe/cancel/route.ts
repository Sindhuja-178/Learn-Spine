import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isComplimentaryProEmail, upsertSubscriptionRecord } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, email, subscriptionId: explicitSubId, action = 'cancel' } = body;

    const cleanEmail = (email || '').trim().toLowerCase();

    let targetSubId = explicitSubId;
    let customerIdForSync = '';

    // 1. If targetSubId was not provided, look in Supabase first if userId is available
    if (!targetSubId && userId && supabase) {
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('stripe_subscription_id, stripe_customer_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (data?.stripe_subscription_id) {
          targetSubId = data.stripe_subscription_id;
          customerIdForSync = data.stripe_customer_id;
        }
      } catch (dbErr) {
        console.warn('[Stripe Cancel] DB lookup failed:', dbErr);
      }
    }

    // 2. If still not found, look up customer by email in Stripe directly
    if (!targetSubId && cleanEmail) {
      const customers = await stripe.customers.list({
        email: cleanEmail,
        limit: 10,
      });

      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10,
        });

        const activeSub = subs.data.find(
          s => s.status === 'active' || s.status === 'trialing'
        ) || subs.data[0];

        if (activeSub) {
          targetSubId = activeSub.id;
          customerIdForSync = customer.id;
          break;
        }
      }
    }

    if (!targetSubId) {
      // If no Stripe subscription exists and user is complimentary VIP
      if (cleanEmail && isComplimentaryProEmail(cleanEmail)) {
        return NextResponse.json({
          success: true,
          isComplimentary: true,
          message: 'Your account has complimentary lifetime LearnSpine Pro access. There are no recurring subscription charges to cancel.',
        });
      }

      return NextResponse.json({
        success: false,
        error: 'No active Stripe subscription found for this account. If you believe this is an error, please contact support.',
      }, { status: 404 });
    }

    // 4. Perform Stripe Subscription update
    if (action === 'resume') {
      // Resume / undo cancellation: cancel_at_period_end = false
      const updatedSub = await stripe.subscriptions.update(targetSubId, {
        cancel_at_period_end: false,
      });

      const rawPeriodEnd = (updatedSub as any).current_period_end || Math.floor(Date.now() / 1000);
      const currentPeriodEndDate = new Date(rawPeriodEnd * 1000);
      const custId = typeof updatedSub.customer === 'string' 
        ? updatedSub.customer 
        : (updatedSub.customer as any)?.id || customerIdForSync;

      // Sync with Supabase
      if (userId && custId) {
        try {
          await upsertSubscriptionRecord({
            userId,
            customerId: custId,
            subscriptionId: updatedSub.id,
            status: updatedSub.status,
            currentPeriodEnd: currentPeriodEndDate,
          });
        } catch (dbErr) {
          console.warn('[Stripe Cancel] Could not update Supabase status:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        action: 'resume',
        cancelAtPeriodEnd: false,
        status: updatedSub.status,
        currentPeriodEnd: currentPeriodEndDate.toISOString(),
        message: 'Your LearnSpine Pro subscription has been resumed! Auto-renewal is now active.',
      });
    } else {
      // Default: Cancel subscription at the end of the billing period
      const updatedSub = await stripe.subscriptions.update(targetSubId, {
        cancel_at_period_end: true,
      });

      const rawPeriodEnd = (updatedSub as any).current_period_end || Math.floor(Date.now() / 1000);
      const currentPeriodEndDate = new Date(rawPeriodEnd * 1000);
      const custId = typeof updatedSub.customer === 'string' 
        ? updatedSub.customer 
        : (updatedSub.customer as any)?.id || customerIdForSync;

      // Sync with Supabase
      if (userId && custId) {
        try {
          await upsertSubscriptionRecord({
            userId,
            customerId: custId,
            subscriptionId: updatedSub.id,
            status: 'canceling',
            currentPeriodEnd: currentPeriodEndDate,
          });
        } catch (dbErr) {
          console.warn('[Stripe Cancel] Could not update Supabase status:', dbErr);
        }
      }

      const formattedDate = currentPeriodEndDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      return NextResponse.json({
        success: true,
        action: 'cancel',
        cancelAtPeriodEnd: true,
        status: updatedSub.status,
        currentPeriodEnd: currentPeriodEndDate.toISOString(),
        message: `Your Pro subscription has been unsubscribed. You will not be charged again, and you retain full Pro access until ${formattedDate}.`,
      });
    }
  } catch (err: unknown) {
    console.error('[Stripe Cancel API Error]:', err);
    const msg = err instanceof Error ? err.message : 'Failed to update subscription.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
