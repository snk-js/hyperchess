import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import {
	isWithinBounds,
	genKingMoves,
	genKnightMoves,
	genRookMoves,
	genPawnMoves,
	genPawnFirstMoves
} from './moves';
import { board, movePiece, BOARDSIZE } from '$lib/store';

const sorted = (moves: number[][]) => [...moves].map((m) => m.join(',')).sort();

describe('isWithinBounds', () => {
	it('accepts the whole 0..BOARDSIZE-1 cube and rejects outside', () => {
		expect(isWithinBounds(0, 0, 0)).toBe(true);
		expect(isWithinBounds(BOARDSIZE - 1, BOARDSIZE - 1, BOARDSIZE - 1)).toBe(true);
		expect(isWithinBounds(-1, 0, 0)).toBe(false);
		expect(isWithinBounds(0, BOARDSIZE, 0)).toBe(false);
		expect(isWithinBounds(0, 0, 8)).toBe(false);
	});
});

describe('move generation on the initial board', () => {
	it('king in the empty middle of the cube has all 26 neighbours', () => {
		expect(genKingMoves([4, 4, 4])).toHaveLength(26);
	});

	it('knight at the middle has 22 of 24 3D moves (2 blocked by black pawns)', () => {
		const moves = genKnightMoves([4, 4, 4]);
		// occupied squares are excluded from move gen (captures not modelled yet):
		// [4,6,3] and [3,6,4] hold black pawns on the initial board
		expect(moves).toHaveLength(22);
		expect(sorted(moves)).not.toContain('4,6,3');
		expect(sorted(moves)).not.toContain('3,6,4');
	});

	it('rook at [2,0,2] is blocked by own pawn above and knights on rank', () => {
		// initial setup: pawn at [2,1,2], knights at [5,0,2] and [2,0,5]
		expect(sorted(genRookMoves([2, 0, 2]))).toEqual(
			sorted([
				[1, 0, 2],
				[0, 0, 2], // LEFT until edge
				[3, 0, 2],
				[4, 0, 2], // RIGHT until knight at [5,0,2]
				[2, 0, 3],
				[2, 0, 4], // FRONT until knight at [2,0,5]
				[2, 0, 1],
				[2, 0, 0] // BACK until edge
			])
		);
	});

	it('pawns step towards the opponent side', () => {
		expect(sorted(genPawnMoves([3, 1, 3], 'white'))).toEqual(sorted([[3, 2, 3]]));
		expect(sorted(genPawnFirstMoves([3, 1, 3], 'white'))).toEqual(sorted([[3, 3, 3]]));
		expect(sorted(genPawnMoves([3, 6, 3], 'black'))).toEqual(sorted([[3, 5, 3]]));
	});
});

describe('movePiece', () => {
	it('moves the piece and empties the source cell', () => {
		// keep this test last: it mutates the module-level board singleton
		expect(get(board[2][1][2]).piece).toBe('pawn');

		movePiece([2, 1, 2], [2, 2, 2]);

		expect(get(board[2][2][2])).toMatchObject({ piece: 'pawn', side: 'white' });
		expect(get(board[2][1][2]).piece).toBe('');
	});
});
