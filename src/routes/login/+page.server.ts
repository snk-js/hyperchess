import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession } from '$lib/server/auth/session';
import { setSessionCookie } from '$lib/server/auth/cookie';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (typeof username !== 'string' || username.length < 1 || username.length > 31) {
			return fail(400, { message: 'Invalid username' });
		}
		if (typeof password !== 'string' || password.length < 1 || password.length > 255) {
			return fail(400, { message: 'Invalid password' });
		}

		const key = await prisma.authKey.findUnique({
			where: { id: `username:${username.toLowerCase()}` }
		});
		// verify even when the user is missing to keep timing uniform-ish
		const valid =
			key?.hashed_password != null && (await verifyPassword(key.hashed_password, password));
		if (!key || !valid) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const session = await createSession(key.user_id);
		setSessionCookie(cookies, session.id, session.expiresAt);
		throw redirect(302, '/');
	}
};
