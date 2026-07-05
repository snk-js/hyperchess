import { addRoom, removeRoom, roomsStore } from '$lib/store/rooms';
import { pushNotification } from '$lib/store/toast';
import { get } from 'svelte/store';
import type { RoomDelta } from '../types';

export const roomsEventHandler = (event: MessageEvent) => {
	if (!event?.data) {
		pushNotification({ message: 'Event has no data', type: 'error' });
		return;
	}

	let delta: RoomDelta;
	try {
		delta = JSON.parse(event.data);
	} catch {
		pushNotification({ message: 'Malformed room update', type: 'error' });
		return;
	}

	switch (delta.kind) {
		case 'room_added': {
			const incoming = delta.room;
			const rooms = get(roomsStore);
			// dedup: the creator also receives the echo of their own room
			if (!rooms.find((room) => room.id === incoming.id)) {
				addRoom(incoming);
			}
			break;
		}
		case 'room_removed':
			removeRoom(delta.id);
			break;
	}
};
