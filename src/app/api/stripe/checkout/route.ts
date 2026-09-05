import { NextResponse } from 'next/server';
import { stripe, getOrCreateProPrice, getOrCreateStripeCustomer } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, email, returnUrl } = body;

    // Resolve application base URL
    const requestOrigin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://learnspine.se';
    const baseUrl = returnUrl || requestOrigin;

    // 1. Ensure 69 SEK/month Price exists
    const priceId = await getOrCreateProPrice();

    // 2. Attach or retrieve Stripe Customer if email is available
    let customerId: string | undefined = undefined;
    if (email) {
      const customer = await getOrCreateStripeCustomer(email, userId);
      customerId = customer.id;
    }

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customerId,
      customer_email: customerId ? undefined : email || undefined,
      client_reference_id: userId || undefined,
      metadata: {
        userId: userId || '',
        plan: 'pro_monthly_69_sek',
      },
      subscription_data: {
        metadata: {
          userId: userId || '',
          plan: 'pro_monthly_69_sek',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${baseUrl}?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?upgrade=canceled`,
    });

    if (!session.url) {
      throw new Error('Failed to generate Stripe checkout session URL.');
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    console.error('[Stripe Checkout Error]:', error);
    const message = error instanceof Error ? error.message : 'An error occurred initiating checkout.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
