import { redirect, type Actions, fail } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { User } from '$lib/store/user';
import type { PageServerLoad } from './$types';
import type { Room } from '$lib/store/rooms';
import { getDigitsFromString } from '$lib/utils';

const prisma = new PrismaClient();

export const load: PageServerLoad = async ({ locals, fetch, request }) => {
	const session = await locals.auth.validate();
	const userId = session?.user?.userId;
	if (!userId) {
		throw redirect(302, '/login');
	}
	const user = await prisma.authUser.findUnique({
		where: {
			id: userId
		}
	});

	if (!user) {
		console.log('no user');
		throw redirect(302, '/login');
	}

	const userData: User = {
		id: user.id,
		name: user.name,
		email: user.email || '',
		username: user.username,
		clientId: '',
		connected: false,
		wsUrl: '',
		playing: false
	};

	if (!userData.clientId) {
		const userId = user.id;
		const roomId = getDigitsFromString(userId);

		const registerWsPayload = {
			user_id: roomId,
			topic: 'ROOMS'
		};

		const response = await fetch('api/ws', {
			method: 'POST',
			body: JSON.stringify(registerWsPayload)
		});

		const { result } = await response.json();

		if (result?.url) {
			const client_id = result.url.split('/').pop() as string;
			return {
				user: {
					...userData,
					wsUrl: result.url,
					clientId: client_id
				},
				url: request.url
			};
		}
	}
	return { user: userData, url: request.url };
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();

		const time = formData.get('time') as Room['time'];
		const type = formData.get('privacy') as Room['type'];
		const style = formData.get('gameStyle') as Room['style'];
		const side = formData.get('side') as Room['side'];
		const id = formData.get('userId') as string;
		const username = formData.get('username') as string;

		if (!id || !username) {
			return fail(400, {
				message: 'Invalid user'
			});
		}

		[time, type, style, side].forEach((value) => {
			if (value.length > 10) {
				return fail(400, {
					message: 'Invalid room values'
				});
			}
		});

		const roomId = new Date().getTime();
		// use zod to validate the things
		const roomValues: Room = {
			id: roomId,
			owner: {
				id,
				username
			},
			time,
			type,
			style,
			side
		};

		return { roomValues };
	}
};
