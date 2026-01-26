import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false, // Run tests sequentially for checkout flow
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? "github" : "html",
	use: {
		baseURL: process.env.BASE_URL || "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure"
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] }
		}
	]
});
