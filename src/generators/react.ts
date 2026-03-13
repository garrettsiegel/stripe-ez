import { StripeEzConfig } from '../config/schema.js';

export function generateReactSnippet(_config: StripeEzConfig): string {
  return `'use client';\n\nimport { useState } from 'react';\n\nexport function CheckoutButton({ priceId, label = 'Pay now' }: { priceId: string; label?: string }) {\n  const [loading, setLoading] = useState(false);\n\n  const handleCheckout = async () => {\n    setLoading(true);\n    const response = await fetch('/api/checkout', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ priceId })\n    });\n    const { url } = await response.json();\n    window.location.href = url;\n  };\n\n  return (\n    <button onClick={handleCheckout} disabled={loading}>\n      {loading ? 'Redirecting...' : label}\n    </button>\n  );\n}\n`;
}
