---
sidebar_position: 7
---

# Assets & Images

Hoikka uses [ImageKit](https://imagekit.io) for image hosting and transformation.

## Why ImageKit?

- **CDN delivery** - Fast global delivery
- **On-the-fly transformations** - Resize, crop, format conversion
- **Optimization** - Automatic WebP/AVIF conversion
- **No local storage** - Images stored externally

## Configuration

### Environment Variables

```bash
# ImageKit credentials
IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_id"
```

### Client Setup

```typescript
// src/lib/server/imagekit.ts
import ImageKit from "imagekit";

export const imagekit = new ImageKit({
	publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
	urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});
```

## Uploading Images

### Server-side Upload

```typescript
const result = await imagekit.upload({
	file: base64OrBuffer,
	fileName: "product-image.jpg",
	folder: "/products"
});

// result.url = "https://ik.imagekit.io/your_id/products/product-image.jpg"
```

### Client-side Upload

Generate authentication parameters server-side:

```typescript
// +server.ts
export const GET = async () => {
	const authParams = imagekit.getAuthenticationParameters();
	return json(authParams);
};
```

Then upload from the browser:

```typescript
const authParams = await fetch("/api/imagekit-auth").then((r) => r.json());

const formData = new FormData();
formData.append("file", file);
formData.append("fileName", file.name);
formData.append("publicKey", PUBLIC_IMAGEKIT_KEY);
formData.append("signature", authParams.signature);
formData.append("expire", authParams.expire);
formData.append("token", authParams.token);

await fetch("https://upload.imagekit.io/api/v1/files/upload", {
	method: "POST",
	body: formData
});
```

## Image Transformations

ImageKit transforms images via URL parameters:

### Resize

```
https://ik.imagekit.io/your_id/image.jpg?tr=w-300,h-300
```

### Crop Modes

```
# Maintain aspect ratio (fit inside)
?tr=w-300,h-300,cm-pad_resize

# Cover (crop to fill)
?tr=w-300,h-300,c-maintain_ratio

# Focus on face
?tr=w-300,h-300,fo-face
```

### Quality & Format

```
# Set quality
?tr=q-80

# Force WebP
?tr=f-webp

# Auto format (best for browser)
?tr=f-auto
```

## Helper Function

```typescript
// src/lib/utils/image.ts
const IMAGEKIT_URL = process.env.IMAGEKIT_URL_ENDPOINT;

export function getImageUrl(
	path: string,
	options?: {
		width?: number;
		height?: number;
		quality?: number;
	}
): string {
	const transforms: string[] = [];

	if (options?.width) transforms.push(`w-${options.width}`);
	if (options?.height) transforms.push(`h-${options.height}`);
	if (options?.quality) transforms.push(`q-${options.quality}`);

	const tr = transforms.length > 0 ? `?tr=${transforms.join(",")}` : "";

	return `${IMAGEKIT_URL}${path}${tr}`;
}

// Usage
getImageUrl("/products/shirt.jpg", { width: 400, height: 400 });
// => https://ik.imagekit.io/your_id/products/shirt.jpg?tr=w-400,h-400
```

## In Components

```svelte
<script>
	import { getImageUrl } from "$lib/utils/image";

	let { product } = $props();
</script>

<img
	src={getImageUrl(product.featuredAsset.source, { width: 400 })}
	alt={product.name}
	loading="lazy"
/>
```

## Database Schema

Assets are stored in the `assets` table:

```typescript
assets
├── id: serial primary key
├── source: varchar      // ImageKit path: /products/image.jpg
├── preview: varchar     // Thumbnail URL (optional)
├── mimeType: varchar    // image/jpeg, image/png, etc.
├── width: integer
├── height: integer
├── fileSize: integer
├── createdAt: timestamp
```

Products reference assets:

```typescript
products.featuredAssetId → assets.id
product_variants.featuredAssetId → assets.id
```

## Admin Upload Flow

1. User selects file in admin
2. Client requests auth params from server
3. Client uploads directly to ImageKit
4. On success, save asset record to database
5. Link asset to product/variant

```typescript
// Admin product page
async function uploadImage(file: File) {
	// 1. Get auth params
	const auth = await fetch("/api/imagekit-auth").then((r) => r.json());

	// 2. Upload to ImageKit
	const formData = new FormData();
	formData.append("file", file);
	formData.append("fileName", `product-${Date.now()}.jpg`);
	formData.append("folder", "/products");
	// ... auth params

	const result = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
		method: "POST",
		body: formData
	}).then((r) => r.json());

	// 3. Save to database
	await fetch("/api/assets", {
		method: "POST",
		body: JSON.stringify({
			source: result.filePath,
			mimeType: result.fileType,
			width: result.width,
			height: result.height,
			fileSize: result.size
		})
	});
}
```
