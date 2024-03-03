import { auth } from '$lib/server/lucia';
import { LuciaError } from 'lucia';
import { fail, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
// Generate a unique sessionId

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('localsLoginPageload', { localsLoginPageload: locals.auth });
	const session = await locals.auth.validate();
	console.log({ session });
	if (session) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		locals.auth.invalidate();
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		// basic check
		if (typeof username !== 'string' || username.length < 1 || username.length > 31) {
			return fail(400, {
				message: 'Invalid username'
			});
		}
		if (typeof password !== 'string' || password.length < 1 || password.length > 255) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		try {
			const sessionId = uuidv4();
			// find user by key
			// and validate password
			const key = await auth.useKey('username', username.toLowerCase(), password);

			console.log({ key });

			const session = await auth.createSession({
				userId: key.userId,
				attributes: {},
				sessionId: sessionId // Use the generated unique sessionId
			});

			locals.auth.setSession(session); // set session cookie

			// prod: disable this
			cookies.set('auth_session', session.sessionId, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: false,
				maxAge: 60 * 60 * 24 * 30
			});
		} catch (e) {
			console.log({ e });
			if (
				e instanceof LuciaError &&
				(e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')
			) {
				// user does not exist
				// or invalid password
				return fail(400, {
					message: 'Incorrect username or password'
				});
			}
			return fail(500, {
				message: 'An unknown error occurred --\n' + e
			});
		}

		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, '/');
	}
};
