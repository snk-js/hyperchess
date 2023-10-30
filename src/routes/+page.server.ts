import { redirect, type Actions, fail } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import userStore, { userPlaceholder } from '$lib/store/user';
import type { PageServerLoad } from './$types';
import { get } from 'svelte/store';

import { createRooms } from '$lib/store/main';

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

	return {
		user
	};
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const time = formData.get('time') as string;
		const id = get(userStore).id;
		const username = get(userStore).username;
		if (!id || !username) {
			return fail(400, {
				message: 'Invalid user'
			});
		}

		const newId = Math.floor(Math.random() * Math.floor(Math.random() * 1000));

		const response = await fetch('api/ws', {
			method: 'POST',
			body: JSON.stringify({ user_id: newId })
		});

		return response.json().then((data) => {
			if (data.message === 'sucess') {
				createRooms().add({
					id: newId,
					owner: {
						id: id,
						username: username,
						url: data.result.url
					},
					elseone: {},
					name: name || 'Untitled',
					time: time || 'unlimited'
				});

				return {
					url: data.result.url,
					matchId: newId
				};
			}
		});
	}
};
