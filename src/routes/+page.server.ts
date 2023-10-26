import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { PrismaClient } from '@prisma/client';
import userStore, { userPlaceholder } from '$lib/store/user';

const prisma = new PrismaClient();

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) {
		userStore.set(userPlaceholder);
		throw redirect(302, '/login');
	}

	const user = await prisma.authUser.findUnique({
		where: {
			id: session.user.userId
		}
	});

	console.log({ user });

	return {
		user
	};
};
