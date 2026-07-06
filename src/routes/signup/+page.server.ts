import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { hashPassword } from '$lib/server/auth/password';
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
		const name = formData.get('name');
		const username = formData.get('username');
		const password = formData.get('password');
		const email = formData.get('email');

		if (typeof name !== 'string' || name.length < 2 || name.length > 31) {
			return fail(400, { message: 'Invalid name' });
		}
		if (typeof username !== 'string' || username.length < 4 || username.length > 20) {
			return fail(400, { message: 'Invalid username' });
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, { message: 'Invalid password' });
		}

		const keyId = `username:${username.toLowerCase()}`;
		const hashed = await hashPassword(password);

		let userId: string;
		try {
			const user = await prisma.authUser.create({
				data: {
					name,
					username,
					email: typeof email === 'string' && email ? email : null,
					auth_key: { create: { id: keyId, hashed_password: hashed } }
				}
			});
			userId = user.id;
		} catch (e) {
			// unique violation on username / key id / email
			if (typeof e === 'object' && e && 'code' in e && e.code === 'P2002') {
				return fail(400, { message: 'Username already taken' });
			}
			return fail(500, { message: 'An unknown error occurred' });
		}

		const session = await createSession(userId);
		setSessionCookie(cookies, session.id, session.expiresAt);
		throw redirect(302, '/');
	}
};
