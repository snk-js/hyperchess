import { addRoom, roomsStore } from '$lib/store/rooms';
import { pushNotification } from '$lib/store/toast';
import userStore from '$lib/store/user';
import { get } from 'svelte/store';
import type { RoomPayloadMessage } from '../publish/post';

export const roomsEventHandler = (event: MessageEvent) => {
	if (!event?.data) {
		pushNotification({ message: 'Event has no data', type: 'error' });
		throw new Error('Event has no data');
	}
	const message: RoomPayloadMessage = JSON.parse(event.data);

	if (!message?.topic) {
		pushNotification({ message: 'Message has no topic', type: 'error' });
		throw new Error('Message has no topic');
	}

	if (message.topic === 'ROOMS') {
		roomsMessageEffect(message);
	}
};

const roomsMessageEffect = (roomMessage: RoomPayloadMessage) => {
	if (!roomMessage.sender || !roomMessage.payload) {
		const erroMsg = 'Message has no sender or payload';
		pushNotification({ message: erroMsg, type: 'error' });
		throw new Error(erroMsg);
	}

	const rooms = get(roomsStore);
	if (!rooms.find((room) => room.id === roomMessage.payload.id)) {
		addRoom(roomMessage.payload);
	}
	if (roomMessage.sender === get(userStore).id) {
		userStore.update((user) => {
			return {
				...user,
				playing: true
			};
		});
	}
};
