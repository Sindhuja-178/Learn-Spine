import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, getOrCreateProPrice, getOrCreateStripeCustomer } from '@/lib/stripe';
import { isComplimentaryProEmail } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, email, returnUrl } = body;

    // Check for complimentary VIP Pro email
    if (isComplimentaryProEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'This account already has complimentary lifetime Pro access. No payment is required.',
      }, { status: 400 });
    }

    // Resolve application base URL
    const requestOrigin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://learnspine.se';
    const baseUrl = returnUrl || requestOrigin;

    // 1. Ensure 69 SEK/month Price exists
    let priceId = await getOrCreateProPrice();

    // 2. Attach or retrieve Stripe Customer if email is available
    let customerId: string | undefined = undefined;
    if (email) {
      const customer = await getOrCreateStripeCustomer(email, userId);
      customerId = customer.id;
    }

    // 3. Helper to create Stripe Checkout Session
    const createCheckoutSession = (targetPriceId: string) => {
      return stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: targetPriceId,
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
    };

    let session: Stripe.Checkout.Session;
    try {
      session = await createCheckoutSession(priceId);
    } catch (sessionErr: unknown) {
      const errMsg = sessionErr instanceof Error ? sessionErr.message : String(sessionErr);
      if (errMsg.toLowerCase().includes('price') || errMsg.toLowerCase().includes('no such')) {
        console.warn(`[Stripe Checkout] Session creation with price ${priceId} failed (${errMsg}). Forcing fresh price creation...`);
        priceId = await getOrCreateProPrice(true);
        session = await createCheckoutSession(priceId);
      } else {
        throw sessionErr;
      }
    }

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
