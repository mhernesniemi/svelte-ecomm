/**
 * Create an admin user interactively
 * Runs outside SvelteKit, so we create our own db connection
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { users } from "../src/lib/server/db/schema.js";
import { randomBytes, scrypt } from "crypto";

// Load DATABASE_URL from .env
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("DATABASE_URL environment variable is not set");
	process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

const SCRYPT_KEYLEN = 64;

async function hashPassword(password: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const salt = randomBytes(16).toString("hex");
		scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
			if (err) reject(err);
			resolve(`${salt}:${derivedKey.toString("hex")}`);
		});
	});
}

const prompt = (question: string): Promise<string> => {
	process.stdout.write(question);
	return new Promise((resolve) => {
		process.stdin.setRawMode?.(false);
		process.stdin.resume();
		process.stdin.setEncoding("utf8");
		process.stdin.once("data", (data) => {
			resolve(data.toString().trim());
		});
	});
};

console.log("Create Admin User\n");

const email = await prompt("Email: ");
const password = await prompt("Password: ");
const name = await prompt("Name: ");

if (!email || !password || !name) {
	console.error("\nAll fields are required");
	process.exit(1);
}

try {
	const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
	if (existing) {
		console.error(`\nUser with email ${email} already exists`);
		process.exit(1);
	}

	const passwordHash = await hashPassword(password);
	const [user] = await db
		.insert(users)
		.values({
			email: email.toLowerCase(),
			passwordHash,
			name,
			role: "admin"
		})
		.returning();

	console.log(`\nAdmin user created: ${user.email} (${user.name})`);
	process.exit(0);
} catch (error) {
	console.error("\nFailed to create admin user:", error);
	process.exit(1);
}
