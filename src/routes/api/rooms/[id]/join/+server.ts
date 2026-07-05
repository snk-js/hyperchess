import { json, error } from '@sveltejs/kit';
import { joinRoom } from '$lib/server/game/service';

const STATUS: Record<string, number> = {
	ROOM_NOT_OPEN: 404,
	CANNOT_JOIN_OWN_ROOM: 409
};

export const POST = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw error(401, 'Not authenticated');

	const roomId = Number(params.id);
	if (!Number.isFinite(roomId)) throw error(400, 'Invalid room id');

	try {
		const game = await joinRoom(roomId, session.user.userId);
		return json({ game }, { status: 201 });
	} catch (e) {
		const code = e instanceof Error ? e.message : 'UNKNOWN';
		throw error(STATUS[code] ?? 500, code);
	}
};
