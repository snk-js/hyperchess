import { redirect, type Actions, fail } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import userStore, { userPlaceholder } from '$lib/store/user';
import type { PageServerLoad } from './$types';
import { get } from 'svelte/store';
import redis from '$lib/server/redis';
import type { Room } from '$lib/store/rooms';

function createRoom(roomData: Room) {
	redis.publish('rooms', JSON.stringify({ method: 'createRoom', room: roomData }));
}

function deleteRoom(roomData: { id: string }) {
	redis.publish('rooms', JSON.stringify({ method: 'deleteRoom', room: roomData }));
}

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

		const response = await fetch('api/ws', {
			method: 'POST',
			body: JSON.stringify({ user_id: roomId })
		});

		return response.json().then((data) => {
			if (data.message === 'sucess') {
				userStore.update((n) => ({
					...n,
					currentWsUrl: data.result.url
				}));
				createRoom(roomValues);

				return {
					result: 'success'
				};
			}
		});
	}
};
