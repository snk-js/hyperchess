import { errors } from '$lib/errorMessages';
import type { RoomPayload } from '$lib/store/rooms';
import userStore from '$lib/store/user';
import { get } from 'svelte/store';
import type { TOPICS } from '../types';

export type RoomPayloadMessage = {
	payload: RoomPayload;
	topic: TOPICS;
	sender: string;
};

export const publish = async (payload: RoomPayload, topic: TOPICS) => {
	const userId = get(userStore).id;

	const roomPayload: RoomPayloadMessage = {
		payload,
		topic,
		sender: userId as string
	};

	try {
		const response = await fetch('api/publish', {
			method: 'POST',
			body: JSON.stringify({
				topic: topic,
				message: JSON.stringify(roomPayload)
			})
		});

		return await response.json();
	} catch (e) {
		console.log('unexpected error', e);
		return errors.rooms.publish.notPublished;
	}
};
