import type { ActionResult } from '@sveltejs/kit';
import { publish } from './post';
import { errors } from '$lib/errorMessages';
import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';

const callback = (res: { message: string } | string, toastStore: ToastStore) => {
	if (typeof res === 'string' && res === errors.rooms.publish.alreadyCreated) {
		const t: ToastSettings = {
			message: errors.rooms.publish.alreadyCreated,
			timeout: 5000,
			background: 'variant-filled-warning'
		};
		toastStore.trigger(t);
		return 'error';
	}

	if (typeof res === 'object' && res.message === 'success') {
		const t: ToastSettings = {
			message: 'room created',
			timeout: 5000,
			background: 'variant-filled-success'
		};
		toastStore.trigger(t);
		return 'success';
	}
};

export const createRoomSubmit = async (
	formData: FormData,
	formValues: Record<string, string>,
	toastStore: ToastStore,
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

	console.log({ user });
	return async ({ result }: { result: ActionResult }) => {
		console.log({ result });
		if (result.type === 'success') {
			console.log({ result });
			if (result?.data?.roomValues) {
				console.log({ result });
				const { roomValues } = result.data;
				const publishResult = await publish(roomValues);
				callback(publishResult, toastStore);
				return publishResult;
			}
		} else {
			console.log('result type not success', result.type);
			return errors.rooms.actions.failure;
		}
	};
};
