import { writable } from 'svelte/store';

type Main = {
	playMode: boolean;
};

type RoomUser = {
	id: string;
	username: string;
	url: string;
};

export type Room = {
	id: number;
	owner: RoomUser;
	elseone: Partial<RoomUser>;
	name: string;
	time: string;
};

export const RoomsState = {
	rooms: []
};

export const mainPageState = {
	playMode: false
};

export function createMain() {
	const { subscribe, update } = writable<Main>(mainPageState);

	return {
		subscribe,
		play: () => update((n) => ({ ...n, playMode: true }))
	};
}

export function createRooms() {
	const { subscribe, update } = writable<Room[]>(RoomsState.rooms);

	return {
		subscribe,
		add: (room: Room) => update((n) => [...n, room]),
		remove: (id: number) => update((n) => n.filter((room) => room.id !== id))
	};
}
