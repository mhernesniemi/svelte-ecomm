/**
 * Payment Provider Interface and Types
 * Defines the contract for payment providers (Stripe, PayPal, Klarna, etc.)
 */
import type { OrderWithRelations } from "$lib/types.js";

export interface PaymentProvider {
	code: string; // unique code like 'stripe', 'paypal'

	createPayment: (order: OrderWithRelations) => Promise<PaymentInfo>;
	confirmPayment?: (paymentId: string) => Promise<PaymentStatus>;
	refundPayment?: (paymentId: string, amount?: number) => Promise<RefundInfo>;
}

export type PaymentInfo = {
	providerTransactionId: string;
	clientSecret?: string; // For Stripe Elements / frontend integration
	redirectUrl?: string; // For PayPal / Klarna redirect flows
	metadata?: Record<string, unknown>;
};

// Payment status values must match the database enum
export type PaymentStatus = "pending" | "authorized" | "settled" | "declined" | "refunded";

// Statuses that indicate a successful/captured payment
const SUCCESSFUL_STATUSES: PaymentStatus[] = ["settled"];

/**
 * Check if a payment status indicates successful payment capture
 */
export function isPaymentSuccessful(status: PaymentStatus): boolean {
	return SUCCESSFUL_STATUSES.includes(status);
}

export type RefundInfo = {
	refundedAmount: number; // Amount in cents
	refundId?: string;
	metadata?: Record<string, unknown>;
};
