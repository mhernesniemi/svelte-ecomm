/**
 * Form state utilities using Svelte 5 runes
 */

type FormMessage = { type: 'success' | 'error'; text: string } | null;

/**
 * Creates a reactive form state manager
 * Handles loading states, error messages, and form submissions
 */
export function createFormState<T extends Record<string, unknown>>(initial: T) {
	let data = $state(initial);
	let isSubmitting = $state(false);
	let message = $state<FormMessage>(null);

	return {
		get data() {
			return data;
		},
		set data(v: T) {
			data = v;
		},
		get isSubmitting() {
			return isSubmitting;
		},
		get message() {
			return message;
		},
		set message(v: FormMessage) {
			message = v;
		},

		/**
		 * Reset form to initial values
		 */
		reset() {
			data = initial;
			message = null;
		},

		/**
		 * Clear any message
		 */
		clearMessage() {
			message = null;
		},

		/**
		 * Set a success message
		 */
		success(text: string) {
			message = { type: 'success', text };
		},

		/**
		 * Set an error message
		 */
		error(text: string) {
			message = { type: 'error', text };
		},

		/**
		 * Submit the form with automatic loading state management
		 */
		async submit<R>(fn: (data: T) => Promise<R>): Promise<R | null> {
			isSubmitting = true;
			message = null;
			try {
				const result = await fn(data);
				return result;
			} catch (e) {
				message = {
					type: 'error',
					text: e instanceof Error ? e.message : 'An error occurred'
				};
				return null;
			} finally {
				isSubmitting = false;
			}
		}
	};
}

/**
 * Creates a simple async action state manager
 * For simple operations that don't need full form handling
 */
export function createActionState() {
	let isLoading = $state(false);
	let message = $state<FormMessage>(null);

	return {
		get isLoading() {
			return isLoading;
		},
		get message() {
			return message;
		},
		set message(v: FormMessage) {
			message = v;
		},

		clearMessage() {
			message = null;
		},

		async run<R>(fn: () => Promise<R>): Promise<R | null> {
			isLoading = true;
			message = null;
			try {
				return await fn();
			} catch (e) {
				message = {
					type: 'error',
					text: e instanceof Error ? e.message : 'An error occurred'
				};
				return null;
			} finally {
				isLoading = false;
			}
		}
	};
}
