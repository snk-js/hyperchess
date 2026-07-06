import { writable, get } from 'svelte/store';
import type { PieceState, Side } from '$lib/game/rules';

/** Client-side state of the match being played (null = not in a match). */
export type ActiveGame = {
	id: string;
	myColor: Side;
	turn: Side;
	status: 'active' | 'finished';
	winnerId: string | null;
	whitePlayerId: string;
	blackPlayerId: string;
};

export const gameStore = writable<ActiveGame | null>(null);

/** Server game-state payload (GET /api/games/[id] or join response). */
export type ServerGameState = {
	id: string;
	whitePlayerId: string;
	blackPlayerId: string;
	board: Record<string, PieceState>;
	turn: Side;
	status: 'active' | 'finished';
	winnerId: string | null;
};

export function setGameFromState(state: ServerGameState, myUserId: string): ActiveGame {
	const game: ActiveGame = {
		id: state.id,
		myColor: state.whitePlayerId === myUserId ? 'white' : 'black',
		turn: state.turn,
		status: state.status,
		winnerId: state.winnerId,
		whitePlayerId: state.whitePlayerId,
		blackPlayerId: state.blackPlayerId
	};
	gameStore.set(game);
	return game;
}

export const clearGame = () => gameStore.set(null);

/** True when it's this player's turn in an active match. */
export function isMyTurn(): boolean {
	const g = get(gameStore);
	return !!g && g.status === 'active' && g.turn === g.myColor;
}
