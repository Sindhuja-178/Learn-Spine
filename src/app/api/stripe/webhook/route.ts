import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { upsertSubscriptionRecord } from '@/lib/subscription';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In local development or before setting webhook secret in Stripe Dashboard
      event = JSON.parse(rawBody) as Stripe.Event;
      console.warn('[Stripe Webhook] Received unverified event (STRIPE_WEBHOOK_SECRET not set)');
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error(`[Stripe Webhook Signature Error]:`, message);
    return NextResponse.json({ error: `Webhook signature error: ${message}` }, { status: 400 });
  }

  try {
    console.log(`[Stripe Webhook] Processing event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (subscriptionId && customerId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

          if (userId) {
            await upsertSubscriptionRecord({
              userId,
              customerId,
              subscriptionId,
              status: subscription.status,
              priceId,
              currentPeriodEnd,
            });
            console.log(`[Stripe Webhook] Successfully activated subscription for user: ${userId}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        const userId = subscription.metadata?.userId;
        const priceId = subscription.items.data[0]?.price?.id;
        const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

        if (userId && customerId) {
          await upsertSubscriptionRecord({
            userId,
            customerId,
            subscriptionId: subscription.id,
            status: subscription.status,
            priceId,
            currentPeriodEnd,
          });
          console.log(`[Stripe Webhook] Updated subscription ${subscription.id} status to: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        const userId = subscription.metadata?.userId;

        if (userId && customerId) {
          await upsertSubscriptionRecord({
            userId,
            customerId,
            subscriptionId: subscription.id,
            status: 'canceled',
          });
          console.log(`[Stripe Webhook] Marked subscription ${subscription.id} as canceled`);
        }
        break;
      }

      default:
        // Other events can be safely acknowledged
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('[Stripe Webhook Handler Error]:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
