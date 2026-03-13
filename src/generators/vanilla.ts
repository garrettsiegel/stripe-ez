import { StripeEzConfig } from '../config/schema.js';

export function generateVanillaSnippet(config: StripeEzConfig): string {
  const defaultPrice = config.products[0]?.prices[0]?.stripePriceId ?? 'price_xxx';
  return `<!doctype html>\n<html>\n  <body>\n    <button id=\"checkout\">Pay</button>\n    <script>\n      document.getElementById('checkout').addEventListener('click', async () => {\n        try {\n          const response = await fetch('/api/checkout', {\n            method: 'POST',\n            headers: {\n              'Content-Type': 'application/json',\n              'X-Request-Id': crypto.randomUUID()\n            },\n            body: JSON.stringify({ priceId: '${defaultPrice}' })\n          });\n\n          const data = await response.json().catch(() => ({}));\n          if (!response.ok || typeof data.url !== 'string') {\n            throw new Error(data.error || 'Checkout failed');\n          }\n\n          window.location.href = data.url;\n        } catch (error) {\n          alert(error instanceof Error ? error.message : 'Checkout failed');\n        }\n      });\n    </script>\n  </body>\n</html>\n`;
}
