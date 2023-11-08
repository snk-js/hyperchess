import { writable } from 'svelte/store';
// src/lib/store/index.ts
import redis from '$lib/server/redis';

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

type Channels = 'rooms';

// Subscribe to Redis channel for room updates
redis.subscribe('rooms', (error, count) => {
	if (error) {
		console.error('Failed to subscribe: %s', error.message);
	} else {
		console.log(`Subscribed successfully! Currently subscribed to ${count} channel(s).`);
	}
});

redis.on('message', (channel, message) => {
	if (channel === 'rooms') {
		const { room, method } = JSON.parse(message);

		if (method === 'createRoom') {
			createRooms().add(room);
		}
		if (method === 'deleteRoom') {
			createRooms().remove(room.id);
		}
	}
});

export function unsubscribeRedis(channel: Channels) {
	redis.unsubscribe(channel, (error, count) => {
		if (error) {
			console.error(`Failed to unsubscribe from ${channel}: ${error.message}`);
		} else {
			console.log(
				`Unsubscribed successfully from ${channel}. Currently subscribed to ${count} channel(s).`
			);
		}
	});
}
