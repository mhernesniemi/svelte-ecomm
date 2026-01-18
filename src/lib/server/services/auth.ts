/**
 * Admin authentication service
 * Handles admin user login, sessions, and password management
 */
import { db } from "$lib/server/db/index.js";
import { users, userSessions } from "$lib/server/db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";

const SESSION_DURATION_DAYS = 7;
const SCRYPT_KEYLEN = 64;

/**
 * Hash a password using scrypt (memory-hard, resistant to brute force)
 */
async function hashPassword(password: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const salt = randomBytes(16).toString("hex");
		scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
			if (err) reject(err);
			resolve(`${salt}:${derivedKey.toString("hex")}`);
		});
	});
}

/**
 * Verify a password against a hash using timing-safe comparison
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [salt, hash] = storedHash.split(":");
	if (!salt || !hash) return false;

	return new Promise((resolve, reject) => {
		scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
			if (err) reject(err);
			const storedBuffer = Buffer.from(hash, "hex");
			resolve(timingSafeEqual(derivedKey, storedBuffer));
		});
	});
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
	return randomBytes(32).toString("hex");
}

export type User = typeof users.$inferSelect;
export type Session = typeof userSessions.$inferSelect;

class AuthService {
	/**
	 * Authenticate a user with email and password
	 */
	async login(email: string, password: string): Promise<{ user: User; sessionId: string } | null> {
		const user = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase())
		});

		if (!user) return null;

		const valid = await verifyPassword(password, user.passwordHash);
		if (!valid) return null;

		// Create session
		const sessionId = generateSessionToken();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

		await db.insert(userSessions).values({
			id: sessionId,
			userId: user.id,
			expiresAt
		});

		// Update last login
		await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

		return { user, sessionId };
	}

	/**
	 * Validate a session and return the user
	 */
	async validateSession(sessionId: string): Promise<User | null> {
		const session = await db.query.userSessions.findFirst({
			where: and(eq(userSessions.id, sessionId), gt(userSessions.expiresAt, new Date()))
		});

		if (!session) return null;

		const user = await db.query.users.findFirst({
			where: eq(users.id, session.userId)
		});

		return user ?? null;
	}

	/**
	 * Destroy a session (logout)
	 */
	async logout(sessionId: string): Promise<void> {
		await db.delete(userSessions).where(eq(userSessions.id, sessionId));
	}

	/**
	 * Create a new admin user
	 */
	async createUser(
		email: string,
		password: string,
		name: string,
		role: "admin" | "staff" = "staff"
	): Promise<User> {
		const passwordHash = await hashPassword(password);

		const [user] = await db
			.insert(users)
			.values({
				email: email.toLowerCase(),
				passwordHash,
				name,
				role
			})
			.returning();

		return user;
	}

	/**
	 * Change a user's password
	 */
	async changePassword(userId: number, newPassword: string): Promise<void> {
		const passwordHash = await hashPassword(newPassword);
		await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
	}

	/**
	 * Get user by ID
	 */
	async getById(id: number): Promise<User | null> {
		const user = await db.query.users.findFirst({
			where: eq(users.id, id)
		});
		return user ?? null;
	}

	/**
	 * Get user by email
	 */
	async getByEmail(email: string): Promise<User | null> {
		const user = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase())
		});
		return user ?? null;
	}

	/**
	 * Clean up expired sessions
	 */
	async cleanupExpiredSessions(): Promise<number> {
		const result = await db.delete(userSessions).where(gt(new Date(), userSessions.expiresAt));
		return result.rowCount ?? 0;
	}
}

export const authService = new AuthService();
