import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isComplimentaryProEmail, upsertSubscriptionRecord } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, email, includeDocuments } = body;

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ isPro: false, status: 'none' });
    }

    // 1. Query Stripe for customer by email
    const customers = await stripe.customers.list({
      email: cleanEmail,
      limit: 10,
    });

    let foundCustomer = null;
    let foundSub = null;
    let documents: any = null;

    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });

      const activeSub = subscriptions.data.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      ) || subscriptions.data[0];

      if (activeSub || includeDocuments) {
        foundCustomer = customer;
        foundSub = activeSub;

        // Fetch official Stripe billing documents (Invoices & Receipts)
        const [invoices, charges] = await Promise.all([
          stripe.invoices.list({ customer: customer.id, limit: 5 }).catch(() => ({ data: [] })),
          stripe.charges.list({ customer: customer.id, limit: 5 }).catch(() => ({ data: [] })),
        ]);

        documents = {
          customer: {
            id: customer.id,
            email: customer.email,
            created: new Date(customer.created * 1000).toISOString(),
          },
          subscription: activeSub ? {
            id: activeSub.id,
            status: activeSub.status,
            currentPeriodStart: new Date(((activeSub as any).current_period_start || Date.now() / 1000) * 1000).toISOString(),
            currentPeriodEnd: new Date(((activeSub as any).current_period_end || Date.now() / 1000) * 1000).toISOString(),
            plan: activeSub.items.data[0]?.price?.nickname || activeSub.items.data[0]?.price?.id,
            amountSEK: (activeSub.items.data[0]?.price?.unit_amount || 0) / 100,
          } : null,
          invoices: invoices.data.map(inv => ({
            id: inv.id,
            number: inv.number,
            status: inv.status,
            amountPaid: (inv.amount_paid || 0) / 100,
            currency: inv.currency?.toUpperCase(),
            invoicePdf: inv.invoice_pdf,
            hostedInvoiceUrl: inv.hosted_invoice_url,
            created: new Date(inv.created * 1000).toISOString(),
          })),
          receipts: charges.data.map(ch => ({
            id: ch.id,
            receiptUrl: ch.receipt_url,
            amount: (ch.amount || 0) / 100,
            currency: ch.currency?.toUpperCase(),
            paid: ch.paid,
            paymentMethod: ch.payment_method_details?.card ? `${ch.payment_method_details.card.brand} •••• ${ch.payment_method_details.card.last4}` : 'Card',
            created: new Date(ch.created * 1000).toISOString(),
          })),
        };

        if (activeSub) {
          const priceId = activeSub.items.data[0]?.price?.id;
          const currentPeriodEnd = new Date((activeSub as any).current_period_end * 1000);

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
            documents,
          });
        }
      }
    }

    if (documents) {
      return NextResponse.json({
        isPro: isComplimentaryProEmail(cleanEmail),
        status: isComplimentaryProEmail(cleanEmail) ? 'active' : 'none',
        documents,
      });
    }

    // Fallback for complimentary VIP emails
    if (cleanEmail && isComplimentaryProEmail(cleanEmail)) {
      return NextResponse.json({
        isPro: true,
        status: 'active',
        customerId: 'complimentary_pro',
        subscriptionId: 'complimentary_pro',
        documents: null,
      });
    }

    return NextResponse.json({ isPro: false, status: 'none', documents: null });
  } catch (err: unknown) {
    console.error('[Stripe Status Check Error]:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ isPro: false, status: 'error', error: msg }, { status: 500 });
  }
}
