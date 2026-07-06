// Argon2id password hashing (OWASP baseline params). Replaces Lucia's scrypt.
import { hash, verify } from '@node-rs/argon2';

const OPTS = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};

export function hashPassword(password: string): Promise<string> {
	return hash(password, OPTS);
}

export async function verifyPassword(digest: string, password: string): Promise<boolean> {
	try {
		return await verify(digest, password, OPTS);
	} catch {
		// malformed/legacy (e.g. old Lucia scrypt) hash -> treat as no match
		return false;
	}
}
