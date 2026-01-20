import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Snippet } from "svelte";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Type utilities for shadcn-svelte components
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
	ref?: E | null;
};

export type WithoutChildrenOrChild<T> = Omit<T, "children" | "child">;

/**
 * Throttle function calls to max once per wait period
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
	fn: T,
	wait: number
): (...args: Parameters<T>) => void {
	let lastCall = 0;
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return (...args: Parameters<T>) => {
		const now = Date.now();
		const remaining = wait - (now - lastCall);

		if (remaining <= 0) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			lastCall = now;
			fn(...args);
		} else if (!timeout) {
			timeout = setTimeout(() => {
				lastCall = Date.now();
				timeout = null;
				fn(...args);
			}, remaining);
		}
	};
}
