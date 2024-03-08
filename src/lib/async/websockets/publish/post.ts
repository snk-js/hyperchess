import { errors } from '$lib/errorMessages';
import type { Room } from '$lib/store/rooms';
import userStore from '$lib/store/user';
import { get } from 'svelte/store';

type TOPICS = 'rooms' | 'matches';

export const publish = async (payload: Room, topic: TOPICS) => {
	const userId = get(userStore).id;

	try {
		const response = await fetch('api/publish', {
			method: 'POST',
			body: JSON.stringify({
				topic: topic,
				message: JSON.stringify({ sender: userId, payload, topic })
			})
		});

		return await response.json();
	} catch (e) {
		console.log('unexpected error', e);
		return errors.rooms.publish.notPublished;
	}
};
