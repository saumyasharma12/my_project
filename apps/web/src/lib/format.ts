export function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
