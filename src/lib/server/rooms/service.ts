import { prisma } from '$lib/server/prisma';
import { publish } from '$lib/server/ws/registry.js';
import type { Room } from '$lib/store/rooms';
import type { RoomDelta } from '$lib/async/websockets/types';
import { toClientRoom, type CreateRoomInput } from './schema';

const ROOMS_TOPIC = 'ROOMS';

function broadcast(delta: RoomDelta) {
	publish(ROOMS_TOPIC, JSON.stringify(delta));
}

/** Snapshot of all open rooms, newest first — served to a client on load. */
export async function listOpenRooms(): Promise<Room[]> {
	const rows = await prisma.room.findMany({
		where: { status: 'open' },
		orderBy: { createdAt: 'desc' }
	});
	return rows.map(toClientRoom);
}

/**
 * Persist a room owned by `ownerId` and broadcast the delta. The room id is
 * server-generated (a timestamp, kept as a plain number for the client).
 * One open room per owner: an existing open room is returned as-is.
 *
 * The username is read from the DB rather than the session: Lucia v2 ignores
 * this project's legacy `transformDatabaseUser`, so `session.user` only carries
 * `userId` — see the Lucia note in docs/05-improvement-plan.md.
 */
export async function createRoom(
	ownerId: string,
	input: CreateRoomInput
): Promise<{ room: Room; created: boolean }> {
	const owner = await prisma.authUser.findUnique({ where: { id: ownerId } });
	if (!owner) throw new Error(`room owner ${ownerId} not found`);

	const existing = await prisma.room.findFirst({
		where: { ownerId, status: 'open' }
	});
	if (existing) return { room: toClientRoom(existing), created: false };

	const row = await prisma.room.create({
		data: {
			id: BigInt(Date.now()),
			ownerId,
			username: owner.username,
			rating: 0,
			time: input.time,
			style: input.style,
			side: input.side,
			type: input.privacy, // legacy: `type` mirrored privacy in the old payload
			privacy: input.privacy,
			status: 'open'
		}
	});

	const room = toClientRoom(row);
	broadcast({ kind: 'room_added', room });
	return { room, created: true };
}

/**
 * Delete a room if it belongs to `ownerId`, and broadcast the removal.
 * Returns false if the room doesn't exist or isn't owned by the caller.
 */
export async function deleteRoom(id: number, ownerId: string): Promise<boolean> {
	const result = await prisma.room.deleteMany({
		where: { id: BigInt(id), ownerId }
	});
	if (result.count === 0) return false;
	broadcast({ kind: 'room_removed', id });
	return true;
}
