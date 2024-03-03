import type { ActionResult } from '@sveltejs/kit';
import { publish } from './post';
import { errors } from '$lib/errorMessages';
import { addErrorLog } from '$lib/store/toast';
import { get } from 'svelte/store';
import userStore from '$lib/store/user';
import { roomsStore } from '$lib/store/rooms';

// um programador ou desenvolvedor, que seja, são só pessoas que sabem ordenar bem os acontecimentos. E porque eu digo ordenar? porque
// no codigo é automatico começar a entender a ordem de determinado acontecimento ou micro comportamento nas regras de negócio.

// a programmer or developer, they are just people who know how to order events well. And why do I say order? because
// in the code it is automatic to start understanding the order of a certain event or micro behavior in the business rules.

const errorHandler = (res: { message: string } | string) => {
	const userId = get(userStore).id;
	const rooms = get(roomsStore);
	if (rooms.find((room) => room.owner.id === userId)) {
		addErrorLog({ message: errors.rooms.publish.alreadyCreated, type: 'error' });
		return;
	}
	if (typeof res === 'object' && res.message === 'success') {
		if (!!get(userStore).playing === true) {
			console.log('user is playing');
			addErrorLog({ message: 'Room created successfully', type: 'success' });
			console.log('Room created succesfully');
			return;
		} else if (res.message !== 'success') {
			console.log('res.message not success');
		} else {
			console.log('user is not playing');
			addErrorLog({ message: 'room not created by some reason', type: 'error' });
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
