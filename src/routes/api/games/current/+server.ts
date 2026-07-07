import { json, error } from '@sveltejs/kit';
import { getCurrentGameFor } from '$lib/server/game/service';

// The caller's active game, if any (static segment wins over the [id] route).
export const GET = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');
	return json({ game: await getCurrentGameFor(locals.user.id) });
};
