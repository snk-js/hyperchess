import { writable } from 'svelte/store';
// src/lib/store/index.ts

export const roomsStore = writable([]);

type RoomUser = {
	id: string;
	username: string;
};

type Time =
	| '30+10'
	| '30+0'
	| '15+15'
	| '15+0'
	| '10+0'
	| '5+5'
	| '5+0'
	| '3+0'
	| '1+0'
	| 'unlimited'
	| '';
type RoomType = 'public' | 'private' | '';
type Style = 'match' | 'sandbox' | '';
type Side = 'black' | 'white' | 'random' | '';
export type Room = {
	id: number;
	owner: RoomUser;
	time: Time;
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
