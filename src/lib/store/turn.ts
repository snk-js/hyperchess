// create a svelte store for the turn of a chess game

import { writable } from 'svelte/store';

export const turn = writable(0);

export const increment = () => {
	turn.update((n) => n + 1);
};

export const decrement = () => {
	turn.update((n) => n - 1);
};

export const reset = () => {
	turn.set(0);
};
