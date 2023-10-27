import { writable } from 'svelte/store';

export const mainPageState = {
	playMode: false
};

export function createMain() {
	const { subscribe, update } = writable(mainPageState);

	return {
		subscribe,
		play: () => update((n) => ({ ...n, playMode: true }))
	};
}
