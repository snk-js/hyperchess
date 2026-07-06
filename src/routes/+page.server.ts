import { redirect } from '@sveltejs/kit';
import { listOpenRooms } from '$lib/server/rooms/service';
import type { User } from '$lib/store/user';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const userData: User = {
		id: locals.user.id,
		name: locals.user.name,
		email: locals.user.email || '',
		username: locals.user.username,
		clientId: '',
		wsUrl: '',
		playing: false
	};

	// ws registration happens client-side only (registerClient in +page.svelte);
	// the room snapshot is fetched here so late joiners see rooms opened before
	// they connected — the ROOMS topic only carries deltas afterwards.
	return { user: userData, url: request.url, rooms: await listOpenRooms() };
};
