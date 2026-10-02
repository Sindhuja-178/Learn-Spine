import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isComplimentaryProEmail, upsertSubscriptionRecord } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, email } = body;

    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Check complimentary VIP emails first
    if (cleanEmail && isComplimentaryProEmail(cleanEmail)) {
      return NextResponse.json({
        isPro: true,
        status: 'active',
        customerId: 'complimentary_pro',
        subscriptionId: 'complimentary_pro',
      });
    }

    if (!cleanEmail) {
      return NextResponse.json({ isPro: false, status: 'none' });
    }

    // 2. Query Stripe for customer by email
    const customers = await stripe.customers.list({
      email: cleanEmail,
      limit: 10,
    });

    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });

      const activeSub = subscriptions.data.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSub) {
        const priceId = activeSub.items.data[0]?.price?.id;
        const currentPeriodEnd = new Date((activeSub as any).current_period_end * 1000);

        // If userId is provided, sync this subscription to Supabase subscriptions table
        if (userId) {
          try {
            await upsertSubscriptionRecord({
              userId,
              customerId: customer.id,
              subscriptionId: activeSub.id,
              status: activeSub.status,
              priceId,
              currentPeriodEnd,
            });
            console.log(`[Stripe Sync] Linked Stripe subscription ${activeSub.id} to user ${userId} (${cleanEmail})`);
          } catch (syncErr) {
            console.warn('[Stripe Sync] Could not upsert to Supabase:', syncErr);
          }
        }

        return NextResponse.json({
          isPro: true,
          status: activeSub.status,
          customerId: customer.id,
          subscriptionId: activeSub.id,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
        });
      }
    }

    return NextResponse.json({ isPro: false, status: 'none' });
  } catch (err: unknown) {
    console.error('[Stripe Status Check Error]:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ isPro: false, status: 'error', error: msg }, { status: 500 });
  }
}
