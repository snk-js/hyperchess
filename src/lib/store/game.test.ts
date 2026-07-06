import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { gameStore, setGameFromState, clearGame, isMyTurn, type ServerGameState } from './game';

const state: ServerGameState = {
	id: 'g1',
	whitePlayerId: 'alice',
	blackPlayerId: 'bob',
	board: {},
	turn: 'white',
	status: 'active',
	winnerId: null
};

beforeEach(() => clearGame());

describe('game store', () => {
	it('derives myColor from the player ids', () => {
		expect(setGameFromState(state, 'alice').myColor).toBe('white');
		expect(setGameFromState(state, 'bob').myColor).toBe('black');
	});

	it('isMyTurn tracks turn, color, and status', () => {
		setGameFromState(state, 'alice'); // white to move, I am white
		expect(isMyTurn()).toBe(true);

		gameStore.update((g) => g && { ...g, turn: 'black' });
		expect(isMyTurn()).toBe(false);

		gameStore.update((g) => g && { ...g, turn: 'white', status: 'finished' });
		expect(isMyTurn()).toBe(false);

		clearGame();
		expect(isMyTurn()).toBe(false);
	});
});
