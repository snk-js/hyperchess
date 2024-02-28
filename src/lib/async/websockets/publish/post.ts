import { errors } from '$lib/errorMessages';
import type { Room } from '$lib/store/rooms';
import userStore from '$lib/store/user';
import { get } from 'svelte/store';

export const publish = async (payload: Room) => {
	const userId = get(userStore).id;

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
