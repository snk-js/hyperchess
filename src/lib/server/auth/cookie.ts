import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE = 'hyperchess_session';

const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

export function setSessionCookie(cookies: Cookies, sessionId: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev, // omit Secure on localhost so http dev works
		expires: expiresAt,
		maxAge: MAX_AGE_S
	});
}

export function deleteSessionCookie(cookies: Cookies): void {
	cookies.set(SESSION_COOKIE, '', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 0
	});
}
