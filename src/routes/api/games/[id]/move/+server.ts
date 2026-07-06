import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { applyPlayerMove } from '$lib/server/game/service';
import type { Coord } from '$lib/game/rules';

const coord = z.tuple([z.number().int(), z.number().int(), z.number().int()]);
const moveSchema = z.object({ from: coord, to: coord });

// Move-decision errors from the service map to 409 (conflict); the rest are 5xx.
const MOVE_ERRORS = new Set([
	'Not your turn',
	'No piece on the source square',
	'That piece is not yours',
	'Illegal move',
	'GAME_OVER'
]);

export const POST = async ({ params, request, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const parsed = moveSchema.safeParse(await request.json());
	if (!parsed.success) throw error(400, 'Invalid move');

	try {
		const game = await applyPlayerMove(
			params.id,
			locals.user.id,
			parsed.data.from as Coord,
			parsed.data.to as Coord
		);
		return json({ game });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'UNKNOWN';
		if (msg === 'GAME_NOT_FOUND') throw error(404, msg);
		if (msg === 'NOT_A_PARTICIPANT') throw error(403, msg);
		if (MOVE_ERRORS.has(msg)) throw error(409, msg);
		throw error(500, msg);
	}
};
