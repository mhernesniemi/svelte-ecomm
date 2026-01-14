/**
 * Payment Service
 * Handles payment processing with mock gateway
 * Designed to be easily swapped with real payment providers (Stripe, etc.)
 */
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { payments, orders } from '../db/schema.js';
import type { Payment, PaymentState } from '$lib/types.js';
import { nanoid } from 'nanoid';

export interface PaymentResult {
	success: boolean;
	payment?: Payment;
	error?: string;
}

export interface RefundResult {
	success: boolean;
	payment?: Payment;
	refundAmount?: number;
	error?: string;
}

export class PaymentService {
	/**
	 * Create a new payment for an order
	 */
	async createPayment(orderId: number, amount: number, method = 'mock'): Promise<Payment> {
		const [payment] = await db
			.insert(payments)
			.values({
				orderId,
				method,
				amount,
				state: 'pending'
			})
			.returning();

		return payment;
	}

	/**
	 * Get payment by ID
	 */
	async getById(id: number): Promise<Payment | null> {
		const [payment] = await db.select().from(payments).where(eq(payments.id, id));

		return payment ?? null;
	}

	/**
	 * Get payments for an order
	 */
	async getByOrderId(orderId: number): Promise<Payment[]> {
		return db
			.select()
			.from(payments)
			.where(eq(payments.orderId, orderId))
			.orderBy(desc(payments.createdAt));
	}

	/**
	 * Process a payment (mock implementation)
	 * In a real implementation, this would call Stripe, etc.
	 */
	async processPayment(paymentId: number): Promise<PaymentResult> {
		const payment = await this.getById(paymentId);

		if (!payment) {
			return { success: false, error: 'Payment not found' };
		}

		if (payment.state !== 'pending') {
			return { success: false, error: `Cannot process payment in state: ${payment.state}` };
		}

		// Mock payment processing
		// In real implementation, this would:
		// 1. Create a Stripe PaymentIntent
		// 2. Confirm the payment
		// 3. Handle webhook responses
		const success = this.mockPaymentProcessor(payment.amount);

		if (success) {
			const [updated] = await db
				.update(payments)
				.set({
					state: 'settled',
					transactionId: `mock_${nanoid(16)}`,
					updatedAt: new Date()
				})
				.where(eq(payments.id, paymentId))
				.returning();

			return { success: true, payment: updated };
		} else {
			const [updated] = await db
				.update(payments)
				.set({
					state: 'declined',
					errorMessage: 'Mock payment declined',
					updatedAt: new Date()
				})
				.where(eq(payments.id, paymentId))
				.returning();

			return { success: false, payment: updated, error: 'Payment declined' };
		}
	}

	/**
	 * Authorize a payment (two-step: authorize then capture)
	 */
	async authorizePayment(paymentId: number): Promise<PaymentResult> {
		const payment = await this.getById(paymentId);

		if (!payment) {
			return { success: false, error: 'Payment not found' };
		}

		if (payment.state !== 'pending') {
			return { success: false, error: `Cannot authorize payment in state: ${payment.state}` };
		}

		// Mock authorization
		const [updated] = await db
			.update(payments)
			.set({
				state: 'authorized',
				transactionId: `mock_auth_${nanoid(16)}`,
				updatedAt: new Date()
			})
			.where(eq(payments.id, paymentId))
			.returning();

		return { success: true, payment: updated };
	}

	/**
	 * Capture an authorized payment
	 */
	async capturePayment(paymentId: number): Promise<PaymentResult> {
		const payment = await this.getById(paymentId);

		if (!payment) {
			return { success: false, error: 'Payment not found' };
		}

		if (payment.state !== 'authorized') {
			return { success: false, error: `Cannot capture payment in state: ${payment.state}` };
		}

		const [updated] = await db
			.update(payments)
			.set({
				state: 'settled',
				updatedAt: new Date()
			})
			.where(eq(payments.id, paymentId))
			.returning();

		return { success: true, payment: updated };
	}

	/**
	 * Refund a payment (full or partial)
	 */
	async refundPayment(paymentId: number, amount?: number): Promise<RefundResult> {
		const payment = await this.getById(paymentId);

		if (!payment) {
			return { success: false, error: 'Payment not found' };
		}

		if (payment.state !== 'settled') {
			return { success: false, error: `Cannot refund payment in state: ${payment.state}` };
		}

		const refundAmount = amount ?? payment.amount;

		if (refundAmount > payment.amount) {
			return { success: false, error: 'Refund amount exceeds payment amount' };
		}

		// For mock, we just mark as refunded
		// In real implementation, this would call Stripe refund API
		const [updated] = await db
			.update(payments)
			.set({
				state: 'refunded',
				metadata: JSON.stringify({ refundAmount, refundedAt: new Date().toISOString() }),
				updatedAt: new Date()
			})
			.where(eq(payments.id, paymentId))
			.returning();

		return { success: true, payment: updated, refundAmount };
	}

	/**
	 * Cancel a pending or authorized payment
	 */
	async cancelPayment(paymentId: number): Promise<PaymentResult> {
		const payment = await this.getById(paymentId);

		if (!payment) {
			return { success: false, error: 'Payment not found' };
		}

		if (!['pending', 'authorized'].includes(payment.state)) {
			return { success: false, error: `Cannot cancel payment in state: ${payment.state}` };
		}

		const [updated] = await db
			.update(payments)
			.set({
				state: 'declined',
				errorMessage: 'Payment cancelled',
				updatedAt: new Date()
			})
			.where(eq(payments.id, paymentId))
			.returning();

		return { success: true, payment: updated };
	}

	/**
	 * Create and immediately process a payment (convenience method)
	 */
	async createAndProcess(orderId: number, amount: number): Promise<PaymentResult> {
		const payment = await this.createPayment(orderId, amount);
		return this.processPayment(payment.id);
	}

	// ============================================================================
	// MOCK PAYMENT PROCESSOR
	// ============================================================================

	/**
	 * Mock payment processor - simulates success/failure
	 * Always succeeds unless amount ends in 99 (for testing failures)
	 */
	private mockPaymentProcessor(amount: number): boolean {
		// Fail payments ending in 99 cents (for testing)
		if (amount % 100 === 99) {
			return false;
		}

		// Simulate processing delay
		// In real implementation, this would be async with webhooks
		return true;
	}
}

// Export singleton instance
export const paymentService = new PaymentService();
