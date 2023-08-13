import { writable, get } from 'svelte/store';
export const offsetY = writable(0);

export const increaseOffsetY = () => {
	if (get(offsetY) > 3) return;
	offsetY.update((val) => val + 1);
};

export const decreaseOffsetY = () => {
	if (get(offsetY) < -3) return;
	offsetY.update((val) => val - 1);
};
