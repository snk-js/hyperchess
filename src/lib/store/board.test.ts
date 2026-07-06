import { describe, it, expect, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@skeletonlabs/skeleton', () => ({
	tableMapperValues: (source: Record<string, unknown>[], keys: string[]) =>
		source.map((row) => keys.map((k) => row[k]))
}));

import { board, hydrateBoard, snapshotBoard, movePiece } from '.';
import { boardToObject, initialBoard, pieceAt } from '$lib/game/rules';

describe('snapshotBoard / hydrateBoard', () => {
	it('the store starting position matches the rules-module starting position', () => {
		const snap = snapshotBoard();
		expect(snap.size).toBe(32);
		expect(boardToObject(snap)).toEqual(boardToObject(initialBoard()));
	});

	it('hydrateBoard applies a server board and clears flags', () => {
		// server board after white pawn [2,1,2] -> [2,2,2]
		const server = initialBoard();
		server.delete('2,1,2');
		server.set('2,2,2', { piece: 'pawn', side: 'white' });

		hydrateBoard(boardToObject(server));

		expect(get(board[2][2][2])).toMatchObject({ piece: 'pawn', side: 'white', selected: false });
		expect(get(board[2][1][2]).piece).toBe('');
		// round-trips back out
		expect(boardToObject(snapshotBoard())).toEqual(boardToObject(server));

		// restore the starting position for other tests
		hydrateBoard(boardToObject(initialBoard()));
	});

	it('movePiece still works for local/sandbox play', () => {
		hydrateBoard(boardToObject(initialBoard()));
		movePiece([5, 1, 5], [5, 2, 5]);
		expect(get(board[5][2][5]).piece).toBe('pawn');
		expect(get(board[5][1][5]).piece).toBe('');
		hydrateBoard(boardToObject(initialBoard()));
	});

	it('a snapshot feeds the rules module (spot check)', () => {
		const snap = snapshotBoard();
		expect(pieceAt(snap, [4, 0, 4])).toEqual({ piece: 'king', side: 'white' });
	});
});
