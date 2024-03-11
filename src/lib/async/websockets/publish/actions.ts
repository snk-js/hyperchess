import type { ActionResult } from '@sveltejs/kit';
import { publish } from './post';
import { errors } from '$lib/errorMessages';

import type { RoomPayload } from '$lib/store/rooms';
import { registerClient } from '$lib/utils/ws';

// um programador ou desenvolvedor, que seja, são só pessoas que sabem ordenar bem os acontecimentos. E porque eu digo ordenar? porque
// no codigo é automatico começar a entender a ordem de determinado acontecimento ou micro comportamento nas regras de negócio.

// a programmer or developer, they are just people who know how to order events well. And why do I say order? because
// in the code it is automatic to start understanding the order of a certain event or micro behavior in the business rules.

export const createRoomSubmit = async (
	formData: FormData,
	formValues: Record<string, string>,
	user: {
		id: string;
		username: string;
		rating: number;
	}
) => {
	const { timeSelect, privacy, gameStyle, side } = formValues;
	const { id, username, rating } = user;

	formData.set('time', timeSelect);
	formData.set('privacy', privacy);
	formData.set('gameStyle', gameStyle);
	formData.set('side', side);
	formData.set('userId', id);
	formData.set('username', username);
	formData.set('rating', rating.toString());

	return async ({ result }: { result: ActionResult }) => {
		if (result.type === 'success') {
			if (result?.data?.roomValues) {
				const { roomValues } = result.data;

				const publishResult = await publish(roomValues as RoomPayload, 'ROOMS');
				const registerMatch = await registerClient('ROOMS');

				// errorHandler(publishResult);
				return publishResult;
			}
		} else {
			console.log('result type not success', result);
			return errors.rooms.actions.failure;
		}
	};
};
