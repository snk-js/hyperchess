import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
	it('verifies a correct password and rejects a wrong one', async () => {
		const digest = await hashPassword('correct horse battery staple');
		expect(digest).toMatch(/^\$argon2id\$/);
		expect(await verifyPassword(digest, 'correct horse battery staple')).toBe(true);
		expect(await verifyPassword(digest, 'Correct Horse Battery Staple')).toBe(false);
	});

	it('produces a different hash each time (random salt)', async () => {
		const a = await hashPassword('same');
		const b = await hashPassword('same');
		expect(a).not.toBe(b);
		expect(await verifyPassword(a, 'same')).toBe(true);
		expect(await verifyPassword(b, 'same')).toBe(true);
	});

	it('returns false for a malformed/legacy hash instead of throwing', async () => {
		expect(await verifyPassword('s2:not-a-real-argon2-hash', 'whatever')).toBe(false);
		expect(await verifyPassword('', 'whatever')).toBe(false);
	});
});
