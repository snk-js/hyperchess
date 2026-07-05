import { json, error } from '@sveltejs/kit';
import { deleteRoom } from '$lib/server/rooms/service';

export const DELETE = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw error(401, 'Not authenticated');

	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid room id');

	const removed = await deleteRoom(id, session.user.userId);
	if (!removed) throw error(404, 'Room not found');

	return json({ message: 'success' });
};
