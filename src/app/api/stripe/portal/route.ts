import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { checkUserSubscription } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, customerId: directCustomerId, returnUrl } = body;

    const requestOrigin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://learnspine.se';
    const baseUrl = returnUrl || requestOrigin;

    let targetCustomerId = directCustomerId;

    if (!targetCustomerId && userId) {
      const sub = await checkUserSubscription(userId);
      targetCustomerId = sub.customerId;
    }

    if (!targetCustomerId) {
      return NextResponse.json({
        success: false,
        error: 'No active Stripe customer found for this account.',
      }, { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: baseUrl,
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error: unknown) {
    console.error('[Stripe Portal Error]:', error);
    const message = error instanceof Error ? error.message : 'Failed to create billing portal session.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
