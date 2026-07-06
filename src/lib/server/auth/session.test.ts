import { describe, it, expect } from 'vitest';
import { generateSessionId } from './session';

// Session create/validate/renew/invalidate are exercised end-to-end by the auth
// e2e (login -> validate on request -> logout). Here we just pin the id format.
describe('generateSessionId', () => {
	it('is 40 lowercase base32 chars', () => {
		for (let i = 0; i < 50; i++) {
			expect(generateSessionId()).toMatch(/^[a-z2-7]{40}$/);
		}
	});

	it('is unique across many calls', () => {
		const seen = new Set(Array.from({ length: 1000 }, () => generateSessionId()));
		expect(seen.size).toBe(1000);
	});
});
