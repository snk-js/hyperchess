import { z } from 'zod';
import type { Room } from '$lib/store/rooms';

// Pure (no DB) so it can be unit-tested and imported anywhere.

// The lobby radio groups constrain these; owner identity comes from the
// session, never the request body.
export const createRoomSchema = z.object({
	time: z.string().min(1).max(16),
	style: z.enum(['match', 'sandbox']),
	side: z.enum(['black', 'white', 'random']),
	privacy: z.enum(['public', 'private'])
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

/** The shape persisted in the `room` table (subset needed for mapping). */
export type RoomRow = {
	id: bigint;
	ownerId: string;
	username: string;
	rating: number;
	time: string;
	style: string;
	side: string;
	type: string;
	privacy: string;
};

/** Map a persisted room row to the shape the client store/table expect. */
export function toClientRoom(row: RoomRow): Room {
	return {
		id: Number(row.id),
		owner: { id: row.ownerId, username: row.username, rating: row.rating },
		time: row.time as Room['time'],
		type: row.type as Room['type'],
		style: row.style as Room['style'],
		side: row.side as Room['side'],
		rating: 0,
		privacy: row.privacy
	};
}
