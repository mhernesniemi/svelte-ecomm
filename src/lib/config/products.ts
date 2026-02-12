import type { ProductType } from "$lib/types.js";

/**
 * Default product type for newly created products.
 * Change to "digital" if the store only sells digital products.
 */
export const DEFAULT_PRODUCT_TYPE: ProductType = "digital";

/**
 * All available product types matching the schema enum.
 */
export const PRODUCT_TYPES: ProductType[] = ["physical", "digital"];
