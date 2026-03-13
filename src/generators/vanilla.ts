import { StripeEzConfig } from '../config/schema.js';

export function generateVanillaSnippet(config: StripeEzConfig): string {
  const defaultPrice = config.products[0]?.prices[0]?.stripePriceId ?? 'price_xxx';
  return `<!doctype html>\n<html>\n  <body>\n    <button id=\"checkout\">Pay</button>\n    <script>\n      document.getElementById('checkout').addEventListener('click', async () => {\n        const response = await fetch('/api/checkout', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({ priceId: '${defaultPrice}' })\n        });\n        const data = await response.json();\n        window.location.href = data.url;\n      });\n    </script>\n  </body>\n</html>\n`;
}
