import { writable } from 'svelte/store';

type Main = {
	playMode: boolean;
};

export const mainPageState = {
	playMode: false
};

export function createMain() {
	const { subscribe, update } = writable<Main>(mainPageState);

	return {
		subscribe,
		play: () => update((n) => ({ ...n, playMode: true }))
	};
}
