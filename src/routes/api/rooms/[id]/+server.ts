import { json, error } from '@sveltejs/kit';
import { deleteRoom } from '$lib/server/rooms/service';

export const DELETE = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid room id');

	const removed = await deleteRoom(id, locals.user.id);
	if (!removed) throw error(404, 'Room not found');

	return json({ message: 'success' });
};
