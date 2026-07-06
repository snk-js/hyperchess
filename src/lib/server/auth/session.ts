// Hand-rolled sessions over Prisma, replacing Lucia (deprecated: v2 and v3).
// Follows lucia-auth.com/sessions/basic: random token id, sliding half-life
// renewal, delete-on-expiry.
import { webcrypto } from 'node:crypto';
import { prisma } from '$lib/server/prisma';

const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type SessionUser = {
	id: string;
	username: string;
	name: string;
	email: string | null;
};

export type Session = {
	id: string;
	userId: string;
	expiresAt: Date;
};

export type SessionValidation =
	| { session: Session; user: SessionUser }
	| { session: null; user: null };

const NO_SESSION: SessionValidation = { session: null, user: null };

// base32 (lowercase, no padding) of 25 random bytes — ~40 chars, 200 bits.
const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
export function generateSessionId(): string {
	const bytes = new Uint8Array(25);
	webcrypto.getRandomValues(bytes);
	let out = '';
	for (let i = 0; i < bytes.length; i += 5) {
		// encode 5 bytes -> 8 base32 chars
		const chunk = [0, 0, 0, 0, 0].map((_, j) => bytes[i + j] ?? 0);
		out += B32[chunk[0] >> 3];
		out += B32[((chunk[0] & 0x07) << 2) | (chunk[1] >> 6)];
		out += B32[(chunk[1] >> 1) & 0x1f];
		out += B32[((chunk[1] & 0x01) << 4) | (chunk[2] >> 4)];
		out += B32[((chunk[2] & 0x0f) << 1) | (chunk[3] >> 7)];
		out += B32[(chunk[3] >> 2) & 0x1f];
		out += B32[((chunk[3] & 0x03) << 3) | (chunk[4] >> 5)];
		out += B32[chunk[4] & 0x1f];
	}
	return out;
}

export async function createSession(userId: string): Promise<Session> {
	const id = generateSessionId();
	const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
	await prisma.authSession.create({ data: { id, user_id: userId, expires_at: expiresAt } });
	return { id, userId, expiresAt };
}

/**
 * Look up a session by id. Expired sessions are deleted and treated as absent.
 * Sessions past their half-life are extended (sliding window).
 */
export async function validateSession(sessionId: string): Promise<SessionValidation> {
	const row = await prisma.authSession.findUnique({
		where: { id: sessionId },
		include: { auth_user: true }
	});
	if (!row) return NO_SESSION;

	const now = Date.now();
	if (now >= row.expires_at.getTime()) {
		await prisma.authSession.delete({ where: { id: sessionId } }).catch(() => {});
		return NO_SESSION;
	}

	let expiresAt = row.expires_at;
	if (now >= row.expires_at.getTime() - SESSION_LIFETIME_MS / 2) {
		expiresAt = new Date(now + SESSION_LIFETIME_MS);
		await prisma.authSession.update({ where: { id: sessionId }, data: { expires_at: expiresAt } });
	}

	return {
		session: { id: row.id, userId: row.user_id, expiresAt },
		user: {
			id: row.auth_user.id,
			username: row.auth_user.username,
			name: row.auth_user.name,
			email: row.auth_user.email
		}
	};
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await prisma.authSession.deleteMany({ where: { id: sessionId } });
}

export async function invalidateAllSessions(userId: string): Promise<void> {
	await prisma.authSession.deleteMany({ where: { user_id: userId } });
}
