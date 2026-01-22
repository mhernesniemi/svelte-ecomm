/**
 * Tax Service
 * Handles VAT calculations for Finnish e-commerce
 *
 * Key concepts:
 * - All prices in the system are gross (VAT-inclusive)
 * - Tax is back-calculated from gross price
 * - B2B customers with valid VAT ID are tax-exempt
 */
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { taxRates, customers } from "../db/schema.js";
import {
	calculateTax,
	calculateTaxExemptPrice,
	calculateLineTax,
	type TaxCalculation
} from "./tax-utils.js";

export type { TaxCalculation };

export interface TaxRateInfo {
	code: string;
	rate: number; // Decimal (0.24 for 24%)
	name: string;
}

// Default tax rates for Finland
const DEFAULT_TAX_RATES: TaxRateInfo[] = [
	{ code: "standard", rate: 0.24, name: "Standard VAT (24%)" },
	{ code: "food", rate: 0.14, name: "Food VAT (14%)" },
	{ code: "books", rate: 0.1, name: "Books/Newspapers VAT (10%)" },
	{ code: "zero", rate: 0, name: "Zero VAT (0%)" }
];

export class TaxService {
	/**
	 * Get tax rate for a given tax code
	 * Falls back to standard rate (24%) if not found
	 */
	async getTaxRate(taxCode: string): Promise<number> {
		const [rate] = await db.select().from(taxRates).where(eq(taxRates.code, taxCode));

		if (rate) {
			return parseFloat(rate.rate);
		}

		// Fallback to default rates
		const defaultRate = DEFAULT_TAX_RATES.find((r) => r.code === taxCode);
		return defaultRate?.rate ?? 0.24;
	}

	/**
	 * Get all available tax rates
	 */
	async getAllTaxRates(): Promise<TaxRateInfo[]> {
		const rates = await db.select().from(taxRates);

		if (rates.length > 0) {
			return rates.map((r) => ({
				code: r.code,
				rate: parseFloat(r.rate),
				name: r.name
			}));
		}

		return DEFAULT_TAX_RATES;
	}

	/**
	 * Calculate tax breakdown from a gross price
	 */
	calculateTax(grossPrice: number, taxRate: number): TaxCalculation {
		return calculateTax(grossPrice, taxRate);
	}

	/**
	 * Calculate tax-exempt price (for B2B customers)
	 */
	calculateTaxExemptPrice(grossPrice: number, taxRate: number): number {
		return calculateTaxExemptPrice(grossPrice, taxRate);
	}

	/**
	 * Calculate tax for a line item
	 */
	calculateLineTax(
		grossUnitPrice: number,
		quantity: number,
		taxRate: number,
		isTaxExempt: boolean = false
	) {
		return calculateLineTax(grossUnitPrice, quantity, taxRate, isTaxExempt);
	}

	/**
	 * Check if a customer is tax-exempt
	 * B2B customers with approved status and valid VAT ID are exempt
	 */
	async isCustomerTaxExempt(customerId: number | null | undefined): Promise<boolean> {
		if (!customerId) return false;

		const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));

		if (!customer) return false;

		// Customer must be approved B2B AND have a VAT ID
		return customer.b2bStatus === "approved" && !!customer.vatId;
	}

	/**
	 * Seed default tax rates into the database
	 * Call this during initialization or migration
	 */
	async seedDefaultRates(): Promise<void> {
		for (const rate of DEFAULT_TAX_RATES) {
			await db
				.insert(taxRates)
				.values({
					code: rate.code,
					rate: rate.rate.toString(),
					name: rate.name
				})
				.onConflictDoNothing();
		}
	}
}

// Export singleton instance
export const taxService = new TaxService();
