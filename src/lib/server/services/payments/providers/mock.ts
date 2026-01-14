/**
 * Mock Payment Provider
 * Simple mock implementation for development and testing
 */
import type { PaymentProvider, PaymentInfo, PaymentStatus, RefundInfo } from '../types.js';
import type { OrderWithRelations } from '$lib/commerce/types.js';
import { nanoid } from 'nanoid';

export class MockProvider implements PaymentProvider {
	code = 'mock';

	/**
	 * Create a mock payment
	 */
	async createPayment(order: OrderWithRelations): Promise<PaymentInfo> {
		const mockTransactionId = `mock_${nanoid(16)}`;
		
		return {
			providerTransactionId: mockTransactionId,
			clientSecret: `mock_secret_${nanoid(32)}`,
			metadata: {
				provider: 'mock',
				orderId: order.id,
				orderCode: order.code,
				createdAt: new Date().toISOString()
			}
		};
	}

	/**
	 * Confirm payment - mock always succeeds unless amount ends in 99
	 */
	async confirmPayment(paymentId: string): Promise<PaymentStatus> {
		// Mock: fail payments with specific pattern
		if (paymentId.includes('_fail_')) {
			return 'failed';
		}
		
		// In a real implementation, you would check the payment status
		// For mock, we assume it succeeds
		return 'completed';
	}

	/**
	 * Refund payment
	 */
	async refundPayment(paymentId: string, amount?: number): Promise<RefundInfo> {
		const mockRefundId = `refund_${nanoid(16)}`;
		
		return {
			refundedAmount: amount ?? 0,
			refundId: mockRefundId,
			metadata: {
				provider: 'mock',
				paymentId,
				refundedAt: new Date().toISOString()
			}
		};
	}
}
