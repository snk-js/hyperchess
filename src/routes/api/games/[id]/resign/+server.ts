import { json, error } from '@sveltejs/kit';
import { resignGame } from '$lib/server/game/service';

export const POST = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	try {
		const game = await resignGame(params.id, locals.user.id);
		return json({ game });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'UNKNOWN';
		if (msg === 'GAME_NOT_FOUND') throw error(404, msg);
		if (msg === 'NOT_A_PARTICIPANT') throw error(403, msg);
		if (msg === 'GAME_OVER') throw error(409, msg);
		throw error(500, msg);
	}
};
