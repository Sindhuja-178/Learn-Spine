import Stripe from 'stripe';

const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();

if (!stripeSecretKey) {
  console.warn('[Stripe] Warning: STRIPE_SECRET_KEY is not set in environment variables.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'LearnSpine',
    version: '1.0.0',
    url: 'https://learnspine.se',
  },
});

/**
 * Returns the configured price ID or dynamically creates the LearnSpine Pro product & price (69 SEK/month).
 */
export async function getOrCreateProPrice(): Promise<string> {
  // If explicitly configured in environment, use that
  if (process.env.STRIPE_PRICE_ID?.trim()) {
    return process.env.STRIPE_PRICE_ID.trim();
  }

  // Check if LearnSpine Pro product already exists
  const products = await stripe.products.list({ active: true, limit: 20 });
  let proProduct = products.data.find(p => p.name.toLowerCase().includes('learnspine pro'));

  if (!proProduct) {
    proProduct = await stripe.products.create({
      name: 'LearnSpine Pro',
      description: 'Unlimited 50-100 page PDF study guide generation, parallel chunking, SVG/PNG/PDF flowchart exports, and persistent cloud sync.',
      metadata: {
        tier: 'pro',
      },
    });
    console.log('[Stripe] Created product:', proProduct.id);
  }

  // Check if a 69 SEK recurring price exists for this product
  const prices = await stripe.prices.list({
    product: proProduct.id,
    active: true,
    currency: 'sek',
    limit: 10,
  });

  const existingPrice = prices.data.find(
    p => p.unit_amount === 6900 && p.recurring?.interval === 'month'
  );

  if (existingPrice) {
    return existingPrice.id;
  }

  // Create 69 SEK/month price (6900 ore)
  const newPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 6900,
    currency: 'sek',
    recurring: {
      interval: 'month',
    },
    metadata: {
      tier: 'pro',
      plan: 'monthly_69_sek',
    },
  });

  console.log('[Stripe] Created 69 SEK/month recurring price:', newPrice.id);
  return newPrice.id;
}

/**
 * Creates or retrieves a Stripe Customer by email and Supabase userId.
 */
export async function getOrCreateStripeCustomer(email: string, userId?: string): Promise<Stripe.Customer> {
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    if (userId && customer.metadata?.userId !== userId) {
      await stripe.customers.update(customer.id, {
        metadata: { ...customer.metadata, userId },
      });
    }
    return customer;
  }

  return await stripe.customers.create({
    email,
    metadata: {
      userId: userId || '',
    },
  });
}
