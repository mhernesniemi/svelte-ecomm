/**
 * Payment Provider Interface and Types
 * Defines the contract for payment providers (Stripe, PayPal, Klarna, etc.)
 */
import type { OrderWithRelations } from '$lib/commerce/types.js';

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

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type RefundInfo = {
	refundedAmount: number; // Amount in cents
	refundId?: string;
	metadata?: Record<string, unknown>;
};
