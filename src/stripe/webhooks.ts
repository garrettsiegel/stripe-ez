import Stripe from 'stripe';

export async function createWebhookEndpoint(
  stripe: Stripe,
  input: { url: string; events: string[] }
): Promise<{ endpointId: string; secret?: string; secretHint?: string }> {
  const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = existingEndpoints.data.find((endpoint) => endpoint.url === input.url);

  if (existing) {
    return { endpointId: existing.id };
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: input.url,
    enabled_events: input.events as Stripe.WebhookEndpointCreateParams.EnabledEvent[]
  });

  const secret = endpoint.secret;
  return {
    endpointId: endpoint.id,
    secret,
    secretHint: secret ? `${secret.slice(0, 8)}...${secret.slice(-4)}` : undefined
  };
}
