import { errors } from '$lib/errorMessages';
import { roomsStore, type Room } from '$lib/store/rooms';
import userStore from '$lib/store/user';
import { get } from 'svelte/store';

export const publish = async (payload: Room) => {
	const userId = get(userStore).id;
	const rooms = get(roomsStore);
	if (rooms.find((room) => room.owner.id === userId)) {
		return errors.rooms.publish.alreadyCreated;
	}

	try {
		const response = await fetch('api/publish', {
			method: 'POST',
			body: JSON.stringify({
				topic: 'rooms',
				message: JSON.stringify({ sender: userId, payload, topic: 'rooms' })
			})
		});

		return await response.json();
	} catch (e) {
		console.log('unexpected error', e);
		return errors.rooms.publish.notPublished;
	}
};
