import { redirect, type Actions, fail } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import userStore, { userPlaceholder } from '$lib/store/user';
import type { PageServerLoad } from './$types';
import { get } from 'svelte/store';
import type { Room } from '$lib/store/rooms';

const prisma = new PrismaClient();

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const session = await locals.auth.validate();
	if (!session) {
		userStore.set(userPlaceholder);
		throw redirect(302, '/login');
	}

	const userState = get(userStore);

	if (userState.id && userState.username && userState.clientId) {
		return { user: userState };
	}

	const userId = session.user.userId;

	const user = await prisma.authUser.findUnique({
		where: {
			id: userId
		}
	});

	if (!user) {
		throw redirect(302, '/login');
	}

	const userData = {
		id: user.id,
		name: user.name,
		email: user.email || '',
		username: user.username,
		clientId: '',
		connected: false,
		wsUrl: ''
	};

	userStore.set(userData);

	if (!userState.clientId) {
		const userId = user.id;
		const roomId = Number(userId.replace(/\D/g, ''));

		const registerWsPayload = {
			user_id: roomId || Math.floor(Math.random() * 1000),
			topic: 'rooms'
		};

		const response = await fetch('api/ws', {
			method: 'POST',
			body: JSON.stringify(registerWsPayload)
		});

		const { result } = await response.json();

		if (result?.url) {
			const client_id = result.url.split('/').pop() as string;

			userStore.set({
				...userData,
				wsUrl: result.url,
				clientId: client_id
			});
		}
	}
	return { user: get(userStore) };
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const { id, username } = get(userStore);

		if (!id || !username) {
			return fail(400, {
				message: 'Invalid user'
			});
		}

		const formData = await request.formData();

		const roomId = new Date().getTime();
		// use zod to validate the things
		const roomValues: Room = {
			id: roomId,
			owner: {
				id: id,
				username: username
			},
			time: (formData.get('time') as Room['time']) || 'unlimited',
			type: (formData.get('type') as Room['type']) || '',
			style: (formData.get('type') as Room['style']) || 'match',
			side: (formData.get('type') as Room['side']) || 'random'
		};
	}
};
