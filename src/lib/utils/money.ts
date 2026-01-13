/**
 * Money utilities - all prices stored in cents
 */

export function formatPrice(cents: number, currency = 'EUR'): string {
	return `${(cents / 100).toFixed(2)} ${currency}`;
}

export function centsToDecimal(cents: number): string {
	return (cents / 100).toFixed(2);
}

export function decimalToCents(decimal: number): number {
	return Math.round(decimal * 100);
}
