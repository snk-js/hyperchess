import type { ActionResult } from '@sveltejs/kit';
import { publish } from './post';
import { errors } from '$lib/errorMessages';
import { addErrorLog, errorStore } from '$lib/store/toast';
import { get } from 'svelte/store';
import userStore from '$lib/store/user';
import { roomsStore } from '$lib/store/rooms';

const errorHandler = (res: { message: string } | string) => {
	const userId = get(userStore).id;
	const rooms = get(roomsStore);
	if (rooms.find((room) => room.owner.id === userId)) {
		errorStore.update((logs) => {
			if (logs.length > 4) {
				logs.shift();
			}
			const newLogs = logs.slice();
			newLogs.push({ message: errors.rooms.publish.alreadyCreated, type: 'error' });

			return newLogs;
		});
		return errors.rooms.actions.failure;
	}
	if (typeof res === 'object' && res.message === 'success') {
		if (!!get(userStore).playing === true) {
			console.log('user is playing');
			addErrorLog({ message: 'Room created successfully', type: 'success' }, errorStore);
			console.log('Room created succesfully');
			return;
		} else {
			console.log('user is not playing');
			addErrorLog({ message: 'room not created by some reason', type: 'error' }, errorStore);
			console.log('Room not created succesfully');
			return;
		}
	}
	console.log('something I dont know went wrong', res);
	return;
};

export const createRoomSubmit = async (
	formData: FormData,
	formValues: Record<string, string>,
	user: {
		id: string;
		username: string;
	}
) => {
	const { timeSelect, privacy, gameStyle, side } = formValues;
	const { id, username } = user;

	formData.set('time', timeSelect);
	formData.set('privacy', privacy);
	formData.set('gameStyle', gameStyle);
	formData.set('side', side);
	formData.set('userId', id);
	formData.set('username', username);

	return async ({ result }: { result: ActionResult }) => {
		if (result.type === 'success') {
			if (result?.data?.roomValues) {
				const { roomValues } = result.data;

				const publishResult = await publish(roomValues);
				errorHandler(publishResult);
				return publishResult;
			}
		} else {
			console.log('result type not success', result.type);
			return errors.rooms.actions.failure;
		}
	};
};
