/**
 * Asset Service
 * Handles image storage with ImageKit.io
 */
import { db } from '$lib/server/db/index.js';
import { assets, productAssets, products } from '$lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

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
			throw new Error('IMAGEKIT_PRIVATE_KEY not configured');
		}

		const token = crypto.randomUUID();
		const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes
		const signature = crypto
			.createHmac('sha1', privateKey)
			.update(token + expire)
			.digest('hex');

		return { token, expire, signature };
	}

	/**
	 * Get ImageKit public config for client-side upload
	 */
	getPublicConfig() {
		const publicKey = env.IMAGEKIT_PUBLIC_KEY;
		const urlEndpoint = env.IMAGEKIT_URL_ENDPOINT;

		if (!publicKey || !urlEndpoint) {
			throw new Error('ImageKit not configured');
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
				type: 'image',
				mimeType: 'image/jpeg', // ImageKit handles conversion
				source: input.url,
				preview: input.url + '?tr=w-200,h-200',
				width: input.width ?? 0,
				height: input.height ?? 0,
				fileSize: input.fileSize ?? 0
			})
			.returning();

		return asset;
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

		const nextPosition = position ?? (existing.length > 0 ? existing[existing.length - 1].position + 1 : 0);

		await db
			.insert(productAssets)
			.values({ productId, assetId, position: nextPosition })
			.onConflictDoNothing();

		// Set as featured if first image
		if (nextPosition === 0) {
			await db.update(products).set({ featuredAssetId: assetId }).where(eq(products.id, productId));
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
		await db.update(products).set({ featuredAssetId: assetId }).where(eq(products.id, productId));
	}

	/**
	 * Delete asset
	 */
	async delete(assetId: number) {
		await db.delete(assets).where(eq(assets.id, assetId));
	}
}

export const assetService = new AssetService();
