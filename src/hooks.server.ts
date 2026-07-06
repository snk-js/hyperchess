import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/session';
import { SESSION_COOKIE, setSessionCookie, deleteSessionCookie } from '$lib/server/auth/cookie';

export const handle: Handle = async ({ resolve, event }) => {
	const sessionId = event.cookies.get(SESSION_COOKIE);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSession(sessionId);
	if (session) {
		// refresh the cookie on sliding renewal
		setSessionCookie(event.cookies, session.id, session.expiresAt);
	} else {
		deleteSessionCookie(event.cookies);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};
