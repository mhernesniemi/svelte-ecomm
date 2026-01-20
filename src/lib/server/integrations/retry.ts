/**
 * Retry Utilities
 *
 * Helpers for retrying failed operations with exponential backoff.
 * Uses Bun's native sleep for delays.
 */

export interface RetryOptions {
	/** Maximum number of attempts (default: 3) */
	maxAttempts?: number;

	/** Initial delay in milliseconds (default: 1000) */
	delayMs?: number;

	/** Use exponential backoff (default: true) */
	backoff?: boolean;

	/** Maximum delay when using backoff (default: 30000) */
	maxDelayMs?: number;

	/** Function to determine if error is retryable (default: all errors) */
	isRetryable?: (error: unknown) => boolean;

	/** Called before each retry */
	onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
}

/**
 * Execute a function with automatic retries
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	const {
		maxAttempts = 3,
		delayMs = 1000,
		backoff = true,
		maxDelayMs = 30000,
		isRetryable = () => true,
		onRetry
	} = options;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (e) {
			lastError = e;

			if (attempt >= maxAttempts || !isRetryable(e)) {
				throw e;
			}

			// Calculate delay with exponential backoff
			let delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

			// Add jitter (10% randomness)
			delay = delay * (0.9 + Math.random() * 0.2);

			// Cap at max delay
			delay = Math.min(delay, maxDelayMs);

			onRetry?.(attempt, e, delay);

			await Bun.sleep(delay);
		}
	}

	throw lastError;
}

/**
 * Check if an error is a transient/network error worth retrying
 */
export function isTransientError(error: unknown): boolean {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();

		// Network errors
		if (
			msg.includes("network") ||
			msg.includes("timeout") ||
			msg.includes("econnreset") ||
			msg.includes("econnrefused") ||
			msg.includes("socket") ||
			msg.includes("fetch failed")
		) {
			return true;
		}

		// Rate limiting
		if (msg.includes("rate limit") || msg.includes("too many requests")) {
			return true;
		}
	}

	// HTTP status codes that are retryable
	if (typeof error === "object" && error !== null && "status" in error) {
		const status = (error as { status: number }).status;
		return status === 429 || status === 502 || status === 503 || status === 504;
	}

	return false;
}

/**
 * Create a fetch wrapper with automatic retry
 */
export function createRetryFetch(options: RetryOptions = {}) {
	return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		return withRetry(
			async () => {
				const response = await fetch(input, init);

				// Throw on retryable HTTP errors so they get retried
				if (response.status === 429 || response.status >= 500) {
					const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
					(error as Error & { status: number }).status = response.status;
					throw error;
				}

				return response;
			},
			{
				isRetryable: isTransientError,
				...options
			}
		);
	};
}
