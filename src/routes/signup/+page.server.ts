import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	console.log('signup load page server', { session });
	if (session) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name');
		const username = formData.get('username');
		const password = formData.get('password');
		const email = formData.get('email');

		if (typeof name !== 'string' || name.length < 2 || name.length > 31) {
			return fail(400, {
				message: 'Invalid username'
			});
		}
		if (typeof username !== 'string' || username.length < 4 || username.length > 20) {
			return fail(400, {
				message: 'Invalid username'
			});
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		try {
			const user = await auth.createUser({
				key: {
					providerId: 'username', // auth method
					providerUserId: username.toLowerCase(), // unique id when using "username" auth method
					password // hashed by Lucia,
				},
				attributes: {
					username,
					name,
					email
				}
			});
			console.log('new user', { user });
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			// check for unique constraint error in user table
			if (e) {
				console.log({ e });
				return fail(400, {
					message: 'Username already taken'
				});
			}
			console.log('An unknown error occurred', { e });
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, '/');
	}
};
