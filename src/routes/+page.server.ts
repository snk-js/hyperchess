import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { listOpenRooms } from '$lib/server/rooms/service';
import type { User } from '$lib/store/user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
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
		wsUrl: '',
		playing: false
	};

	// ws registration happens client-side only (registerClient in +page.svelte);
	// the room snapshot is fetched here so late joiners see rooms opened before
	// they connected — the ROOMS topic only carries deltas afterwards.
	return { user: userData, url: request.url, rooms: await listOpenRooms() };
};
