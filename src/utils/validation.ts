export function validateProductName(name: string): string | true {
  if (!name.trim()) {
    return "Product name can't be empty. What should we call this product?";
  }
  return true;
}

export function parseUsdToCents(input: string): number {
  const amount = Number.parseFloat(input);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Price needs to be greater than $0. What should the price be?');
  }
  return Math.round(amount * 100);
}

export function keyHint(secretKey: string): string {
  if (secretKey.length <= 8) {
    return '***';
  }
  return `${secretKey.slice(0, 7)}...${secretKey.slice(-4)}`;
}
