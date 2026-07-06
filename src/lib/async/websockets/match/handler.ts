import { get } from 'svelte/store';
import { hydrateBoard } from '$lib/store';
import { gameStore, setGameFromState, type ServerGameState } from '$lib/store/game';
import userStore from '$lib/store/user';
import { pushNotification } from '$lib/store/toast';
import type { MatchDelta } from '../types';

/** Subscribe this browser's ws client to the game's MATCH topic. */
export async function joinMatchTopic(gameId: string): Promise<void> {
	const clientId = get(userStore).clientId;
	if (!clientId) {
		pushNotification({ message: 'Not connected to the lobby socket', type: 'error' });
		return;
	}
	await fetch('/api/add', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ client_id: clientId, topic: `MATCH:${gameId}` })
	});
}

/**
 * Enter a match: set the game store, hydrate the 3D board from the server
 * state, subscribe to the MATCH topic, and switch to playing mode.
 */
export async function enterMatch(state: ServerGameState): Promise<void> {
	const me = get(userStore);
	if (!me.id) return;

	const game = setGameFromState(state, me.id);
	hydrateBoard(state.board);
	await joinMatchTopic(state.id);

	userStore.update((u) => ({ ...u, playing: true }));
	pushNotification({
		message: `Match started — you play ${game.myColor}`,
		type: 'success'
	});
}

/** Fetch a game by id and enter it (owner side, on game_started). */
export async function enterMatchById(gameId: string): Promise<void> {
	const res = await fetch(`/api/games/${gameId}`);
	if (!res.ok) {
		pushNotification({ message: 'Could not load the game', type: 'error' });
		return;
	}
	const { game } = await res.json();
	await enterMatch(game);
}

/** Apply a server-confirmed move: the delta's board is authoritative. */
export function matchDeltaHandler(delta: MatchDelta): void {
	const current = get(gameStore);
	if (!current) return;

	hydrateBoard(delta.board);
	gameStore.set({
		...current,
		turn: delta.turn,
		status: delta.status,
		winnerId: delta.winnerId
	});

	if (delta.status === 'finished') {
		const me = get(userStore);
		const won = delta.winnerId === me.id;
		pushNotification({
			message: won ? 'You won — king captured!' : 'You lost — your king was captured.',
			type: won ? 'success' : 'error'
		});
	}
}

/** POST a move; the resulting board arrives via the MATCH delta. */
export async function sendMove(from: number[], to: number[]): Promise<void> {
	const game = get(gameStore);
	if (!game) return;

	const res = await fetch(`/api/games/${game.id}/move`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ from, to })
	});
	if (!res.ok) {
		const { message } = await res.json().catch(() => ({ message: 'Move rejected' }));
		pushNotification({ message: message ?? 'Move rejected', type: 'error' });
	}
}
