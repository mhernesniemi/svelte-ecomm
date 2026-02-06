/**
 * Asset Service
 * Handles image storage with ImageKit.io
 */
import { db } from "$lib/server/db/index.js";
import { assets, productAssets, products } from "$lib/server/db/schema.js";
import { eq, asc } from "drizzle-orm";
import { env } from "$env/dynamic/private";
import crypto from "crypto";

export interface UploadAuthParams {
	token: string;
	expire: number;
	signature: string;
}

export interface CreateAssetInput {
	name: string;
	url: string;
	fileId: string;
	width?: number;
	height?: number;
	fileSize?: number;
}

class AssetService {
	/**
	 * Generate ImageKit upload authentication parameters
	 */
	getUploadAuth(): UploadAuthParams {
		const privateKey = env.IMAGEKIT_PRIVATE_KEY;
		if (!privateKey) {
			throw new Error("IMAGEKIT_PRIVATE_KEY not configured");
		}

		const token = crypto.randomUUID();
		const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes
		const signature = crypto
			.createHmac("sha1", privateKey)
			.update(token + expire)
			.digest("hex");

		return { token, expire, signature };
	}

	/**
	 * Get ImageKit public config for client-side upload
	 */
	getPublicConfig() {
		const publicKey = env.IMAGEKIT_PUBLIC_KEY;
		const urlEndpoint = env.IMAGEKIT_URL_ENDPOINT;

		if (!publicKey || !urlEndpoint) {
			throw new Error("ImageKit not configured");
		}

		return { publicKey, urlEndpoint };
	}

	/**
	 * Create asset record after successful upload
	 */
	async create(input: CreateAssetInput) {
		const [asset] = await db
			.insert(assets)
			.values({
				name: input.name,
				type: "image",
				mimeType: "image/jpeg", // ImageKit handles conversion
				source: input.url,
				preview: input.url + "?tr=w-100,h-100,fo-auto",
				width: input.width ?? 0,
				height: input.height ?? 0,
				fileSize: input.fileSize ?? 0,
				imagekitFileId: input.fileId
			})
			.returning();

		// Pre-warm cache for common transformations
		this.warmCache(input.url);

		return asset;
	}

	/**
	 * Update asset alt text
	 */
	async updateAlt(assetId: number, alt: string) {
		const [asset] = await db
			.update(assets)
			.set({ alt })
			.where(eq(assets.id, assetId))
			.returning();

		return asset;
	}

	/**
	 * Pre-warm ImageKit cache by requesting common transformations
	 * Runs in background - doesn't block the upload response
	 *
	 * Sizes used across the site:
	 * - 100x100: thumbnails (cart, orders, wishlist, product page, admin)
	 * - 400x400: product grid listings (products, category, collections, front page)
	 * - 600x600: product detail main image
	 */
	private warmCache(baseUrl: string) {
		const transformations = [
			"tr=w-100,h-100,fo-auto",
			"tr=w-400,h-400,fo-auto",
			"tr=w-600,h-600,fo-auto"
		];

		Promise.all(
			transformations.map((tr) =>
				fetch(`${baseUrl}?${tr}`)
					.then((res) => res.ok)
					.catch(() => false)
			)
		).then((results) => {
			const success = results.filter(Boolean).length;
			console.log(
				`[ImageKit] Cache warmed for ${baseUrl}: ${success}/${transformations.length}`
			);
		});
	}

	/**
	 * Add asset to product
	 */
	async addToProduct(productId: number, assetId: number, position?: number) {
		// Get current max position
		const existing = await db
			.select({ position: productAssets.position })
			.from(productAssets)
			.where(eq(productAssets.productId, productId))
			.orderBy(asc(productAssets.position));

		const nextPosition =
			position ?? (existing.length > 0 ? existing[existing.length - 1].position + 1 : 0);

		await db
			.insert(productAssets)
			.values({ productId, assetId, position: nextPosition })
			.onConflictDoNothing();

		// Set as featured if first image
		if (nextPosition === 0) {
			await db
				.update(products)
				.set({ featuredAssetId: assetId })
				.where(eq(products.id, productId));
		}
	}

	/**
	 * Remove asset from product
	 */
	async removeFromProduct(productId: number, assetId: number) {
		await db
			.delete(productAssets)
			.where(eq(productAssets.productId, productId) && eq(productAssets.assetId, assetId));

		// Check if this was the featured asset
		const [product] = await db.select().from(products).where(eq(products.id, productId));
		if (product?.featuredAssetId === assetId) {
			// Set next image as featured or null
			const remaining = await db
				.select({ assetId: productAssets.assetId })
				.from(productAssets)
				.where(eq(productAssets.productId, productId))
				.orderBy(asc(productAssets.position))
				.limit(1);

			await db
				.update(products)
				.set({ featuredAssetId: remaining[0]?.assetId ?? null })
				.where(eq(products.id, productId));
		}
	}

	/**
	 * Set featured asset for product
	 */
	async setFeaturedAsset(productId: number, assetId: number) {
		await db
			.update(products)
			.set({ featuredAssetId: assetId })
			.where(eq(products.id, productId));
	}

	/**
	 * Delete asset
	 */
	async delete(assetId: number) {
		await db.delete(assets).where(eq(assets.id, assetId));
	}

	/**
	 * List files from ImageKit folder
	 */
	async listFromImageKit(folder: string = "/products"): Promise<ImageKitFile[]> {
		const privateKey = env.IMAGEKIT_PRIVATE_KEY;
		if (!privateKey) {
			throw new Error("IMAGEKIT_PRIVATE_KEY not configured");
		}

		const params = new URLSearchParams({
			path: folder,
			type: "file",
			limit: "100",
			sort: "DESC_CREATED"
		});

		const response = await fetch(`https://api.imagekit.io/v1/files?${params}`, {
			headers: {
				Authorization: `Basic ${Buffer.from(privateKey + ":").toString("base64")}`
			}
		});

		if (!response.ok) {
			throw new Error("Failed to list ImageKit files");
		}

		return response.json();
	}
}

export interface ImageKitFile {
	fileId: string;
	name: string;
	url: string;
	thumbnail: string;
	width: number;
	height: number;
	size: number;
	filePath: string;
	fileType: string;
}

export const assetService = new AssetService();
