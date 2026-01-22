import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	formatPrice,
	formatPriceNumber,
	convertPrice,
	getCurrencySymbol,
	throttle
} from "./utils";

describe("formatPrice", () => {
	it("formats EUR price with Finnish locale", () => {
		expect(formatPrice(2999)).toBe("29,99\u00a0€");
	});

	it("formats USD price with US locale", () => {
		expect(formatPrice(2999, "USD")).toBe("$29.99");
	});

	it("formats zero amount", () => {
		expect(formatPrice(0)).toBe("0,00\u00a0€");
	});

	it("falls back for unsupported currency", () => {
		expect(formatPrice(1000, "JPY")).toBe("10.00 JPY");
	});
});

describe("formatPriceNumber", () => {
	it("formats number with Finnish locale for EUR", () => {
		expect(formatPriceNumber(2999)).toBe("29,99");
	});

	it("formats number with US locale for USD", () => {
		expect(formatPriceNumber(2999, "USD")).toBe("29.99");
	});

	it("handles small amounts", () => {
		expect(formatPriceNumber(5)).toBe("0,05");
	});
});

describe("convertPrice", () => {
	it("converts with exchange rate 1", () => {
		expect(convertPrice(1000, 1)).toBe(1000);
	});

	it("converts EUR to USD", () => {
		expect(convertPrice(1000, 1.1)).toBe(1100);
	});

	it("rounds to nearest cent", () => {
		expect(convertPrice(1000, 1.115)).toBe(1115);
		expect(convertPrice(1001, 1.115)).toBe(1116);
	});
});

describe("getCurrencySymbol", () => {
	it("returns symbol for known currencies", () => {
		expect(getCurrencySymbol("EUR")).toBe("€");
		expect(getCurrencySymbol("USD")).toBe("$");
		expect(getCurrencySymbol("GBP")).toBe("£");
		expect(getCurrencySymbol("SEK")).toBe("kr");
	});

	it("returns code for unknown currencies", () => {
		expect(getCurrencySymbol("JPY")).toBe("JPY");
	});
});

describe("throttle", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("calls function immediately on first call", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("throttles subsequent calls", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		throttled();
		throttled();

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("calls function again after wait period", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		vi.advanceTimersByTime(100);
		throttled();

		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("schedules trailing call during throttle period", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		throttled(); // This schedules a trailing call

		vi.advanceTimersByTime(100);

		expect(fn).toHaveBeenCalledTimes(2);
	});
});
