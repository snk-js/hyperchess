import { writable } from 'svelte/store';
// src/lib/store/index.ts

export const roomsStore = writable([]);

type RoomUser = {
	id: string;
	username: string;
};

type RoomType = 'public' | 'private' | '';
type Style = 'match' | 'sandbox' | '';
type Side = 'black' | 'white' | 'random' | '';
export type Room = {
	id: number;
	owner: RoomUser;
	time: string;
	type: RoomType;
	style: Style;
	side: Side;
};

export const RoomsState = {
	rooms: []
};

export function createRooms() {
	const { subscribe, update } = writable<Room[]>(RoomsState.rooms);

	return {
		subscribe,
		update,
		add: (room: Room) => update((n) => [...n, room]),
		remove: (id: number) => update((n) => n.filter((room) => room.id !== id))
	};
}
