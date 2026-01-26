import { test, expect } from "@playwright/test";

// Test credentials - set via environment variables
const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "testpassword123";

test.describe("E-commerce checkout flow", () => {
	test.beforeEach(async ({ page }) => {
		// Clear any existing state
		await page.context().clearCookies();
	});

	test("complete checkout flow", async ({ page }) => {
		// 1. Sign in
		await test.step("Sign in", async () => {
			await page.goto("/sign-in");

			// Wait for Clerk to load
			await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });

			// Enter email
			await page.fill('input[name="identifier"]', TEST_EMAIL);
			await page.click('button[type="submit"]');

			// Wait for password field and enter password
			await page.waitForSelector('input[type="password"]', { timeout: 10000 });
			await page.fill('input[type="password"]', TEST_PASSWORD);
			await page.click('button[type="submit"]');

			// Wait for redirect after login
			await page.waitForURL((url) => !url.pathname.includes("sign-in"), { timeout: 15000 });
		});

		// 2. Browse products
		await test.step("Browse products", async () => {
			await page.goto("/products");
			await expect(page.locator("h1")).toContainText("Products");

			// Wait for products to load
			await page.waitForSelector('a[href^="/products/"]', { timeout: 10000 });
		});

		// 3. Select a product
		let productName: string;
		await test.step("Select product", async () => {
			// Click the first product
			const firstProduct = page.locator('a[href^="/products/"]').first();
			productName = (await firstProduct.locator("h3").textContent()) || "Product";
			await firstProduct.click();

			// Wait for product page to load
			await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 10000 });
		});

		// 4. Add to cart
		await test.step("Add to cart", async () => {
			// Click add to cart
			await page.click('button:has-text("Add to Cart")');

			// Wait for cart to open and show the item
			await page.waitForSelector('[data-testid="cart-sheet"]', { timeout: 5000 }).catch(() => {
				// Cart might show differently, just wait a moment
			});

			// Verify cart has items (check for checkout button)
			await expect(page.locator('a[href="/checkout"]')).toBeVisible({ timeout: 5000 });
		});

		// 5. Go to checkout
		await test.step("Go to checkout", async () => {
			await page.click('a[href="/checkout"]');
			await expect(page).toHaveURL("/checkout");
			await expect(page.locator("h1")).toContainText("Checkout");
		});

		// 6. Fill shipping address (for physical products)
		await test.step("Fill checkout form", async () => {
			// Check if we need to fill shipping address
			const addressForm = page.locator('form[action*="setShippingAddress"]');
			const contactForm = page.locator('form[action*="setContactInfo"]');

			if (await addressForm.isVisible({ timeout: 2000 }).catch(() => false)) {
				// Physical product - fill shipping address
				await page.fill('input[name="fullName"]', "Test User");
				await page.fill('input[name="streetLine1"]', "123 Test Street");
				await page.fill('input[name="city"]', "Helsinki");
				await page.fill('input[name="postalCode"]', "00100");
				await page.selectOption('select[name="country"]', "FI");
				await page.click('button[type="submit"]:has-text("Continue")');

				// Wait for shipping rates
				await page.waitForSelector('input[name="shippingRateId"]', { timeout: 10000 });

				// Select first shipping option
				await page.click('input[name="shippingRateId"]').catch(() => {
					// Might already be selected
				});
			} else if (await contactForm.isVisible({ timeout: 2000 }).catch(() => false)) {
				// Digital product - fill contact info
				await page.fill('input[name="fullName"]', "Test User");
				await page.fill('input[name="email"]', TEST_EMAIL);
				await page.click('button[type="submit"]:has-text("Continue")');
			}
		});

		// 7. Select payment method and pay
		await test.step("Complete payment", async () => {
			// Wait for payment section
			await page.waitForSelector('button:has-text("Pay")', { timeout: 15000 });

			// Click pay button
			await page.click('button:has-text("Pay")');

			// Handle Stripe checkout (if redirected)
			// Stripe test mode: use test card 4242424242424242
			const stripeFrame = page.frameLocator("iframe[name*='stripe']").first();

			// If Stripe Elements is embedded
			const cardInput = stripeFrame.locator('[placeholder*="Card number"]');
			if (await cardInput.isVisible({ timeout: 5000 }).catch(() => false)) {
				await cardInput.fill("4242424242424242");
				await stripeFrame.locator('[placeholder*="MM / YY"]').fill("12/30");
				await stripeFrame.locator('[placeholder*="CVC"]').fill("123");
				await page.click('button[type="submit"]:has-text("Pay")');
			}
		});

		// 8. Verify order confirmation
		await test.step("Verify order confirmation", async () => {
			// Wait for redirect to thank you page
			await page.waitForURL("**/checkout/thank-you**", { timeout: 30000 });

			// Verify order confirmation elements
			await expect(page.locator("h1")).toContainText(/thank you|order confirmed/i);

			// Check for order number
			const orderNumber = page.locator("text=/order.*#?\\d+/i");
			await expect(orderNumber).toBeVisible({ timeout: 5000 });
		});

		// 9. Verify order in account (proves it exists in DB)
		await test.step("Verify order exists in account", async () => {
			await page.goto("/account/orders");

			// Should see the order in the list
			await expect(page.locator("table, [data-testid='orders-list']")).toBeVisible({
				timeout: 10000
			});

			// Verify at least one order exists
			const orderRows = page.locator("tr, [data-testid='order-row']");
			await expect(orderRows.first()).toBeVisible();
		});
	});
});
