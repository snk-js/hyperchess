import { json, error } from '@sveltejs/kit';
import { getGame } from '$lib/server/game/service';

// Game state snapshot — for a joining player or a reconnect.
export const GET = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const game = await getGame(params.id);
	if (!game) throw error(404, 'Game not found');

	const uid = locals.user.id;
	if (uid !== game.whitePlayerId && uid !== game.blackPlayerId) {
		throw error(403, 'Not a participant');
	}

	return json({ game });
};
