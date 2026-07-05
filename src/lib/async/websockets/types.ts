import type { Room } from '$lib/store/rooms';

export type TOPICS = 'ROOMS' | 'MATCH' | string;

// Deltas broadcast on the ROOMS topic. The full room list is fetched once as a
// snapshot on load; these keep every connected lobby in sync afterwards.
export type RoomDelta =
	| { kind: 'room_added'; room: Room }
	| { kind: 'room_removed'; id: number };
