import { json, error } from '@sveltejs/kit';
import { createRoomSchema } from '$lib/server/rooms/schema';
import { createRoom, listOpenRooms } from '$lib/server/rooms/service';

export const GET = async () => {
	return json({ rooms: await listOpenRooms() });
};

export const POST = async ({ request, locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw error(401, 'Not authenticated');

	const parsed = createRoomSchema.safeParse(await request.json());
	if (!parsed.success) throw error(400, 'Invalid room values');

	const { room, created } = await createRoom(session.user.userId, parsed.data);

	return json({ room, created }, { status: created ? 201 : 200 });
};
