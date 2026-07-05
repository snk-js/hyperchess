import { describe, it, expect } from 'vitest';
import {
	initialBoard,
	generateMoves,
	isLegalMove,
	applyMove,
	pieceAt,
	cloneBoard,
	boardToObject,
	objectToBoard,
	type BoardState,
	type Coord,
	type PieceState
} from './rules';

const withPiece = (coord: Coord, piece: PieceState): BoardState => {
	const s = initialBoard();
	s.set(`${coord[0]},${coord[1]},${coord[2]}`, piece);
	return s;
};

const has = (moves: Coord[], c: Coord) => moves.some((m) => m[0] === c[0] && m[1] === c[1] && m[2] === c[2]);

describe('initialBoard', () => {
	it('has 32 pieces in the starting position', () => {
		expect(initialBoard().size).toBe(32);
	});
	it('generateMoves on an empty square is empty', () => {
		expect(generateMoves(initialBoard(), [4, 4, 4])).toEqual([]);
	});
});

describe('generateMoves — parity with the client geometry (empty-only, blocked by pieces)', () => {
	it('knight in the middle has 22 of 24 moves (2 blocked by black pawns)', () => {
		const moves = generateMoves(withPiece([4, 4, 4], { piece: 'knight', side: 'white' }), [4, 4, 4]);
		expect(moves).toHaveLength(22);
		expect(has(moves, [4, 6, 3])).toBe(false); // occupied by a black pawn
		expect(has(moves, [3, 6, 4])).toBe(false);
	});

	it('king in the empty middle has all 26 neighbours', () => {
		expect(generateMoves(withPiece([4, 4, 4], { piece: 'king', side: 'white' }), [4, 4, 4])).toHaveLength(26);
	});

	it('rook at [2,0,2] is blocked by its own pawn (UP) and the knights on the rank', () => {
		const moves = generateMoves(initialBoard(), [2, 0, 2]);
		// UP blocked by pawn at [2,1,2], DOWN out of bounds; LEFT x2, RIGHT x2 (to
		// knight at [5,0,2]), FRONT x2 (to knight at [2,0,5]), BACK x2 = 8
		expect(moves).toHaveLength(8);
		expect(has(moves, [2, 1, 2])).toBe(false); // own pawn blocks UP immediately
	});

	it('a sliding piece stops before an occupant (no captures)', () => {
		// white rook at [2,0,2]; a black knight sits at [5,0,2] on the +x ray
		const moves = generateMoves(initialBoard(), [2, 0, 2]);
		expect(has(moves, [4, 0, 2])).toBe(true); // square before the knight
		expect(has(moves, [5, 0, 2])).toBe(false); // the knight's square is not a target
		expect(has(moves, [6, 0, 2])).toBe(false); // and nothing beyond it
	});
});

describe('isLegalMove', () => {
	const board = withPiece([4, 4, 4], { piece: 'king', side: 'white' });
	it('accepts a generated move and rejects a non-move', () => {
		expect(isLegalMove(board, [4, 4, 4], [4, 5, 4])).toBe(true);
		expect(isLegalMove(board, [4, 4, 4], [7, 7, 7])).toBe(false);
	});
	it('rejects out-of-bounds targets', () => {
		expect(isLegalMove(board, [4, 4, 4], [4, 8, 4])).toBe(false);
	});
	it('rejects moving from an empty square', () => {
		expect(isLegalMove(initialBoard(), [0, 4, 0], [1, 4, 0])).toBe(false);
	});
});

describe('applyMove', () => {
	it('moves the piece and clears the source, without mutating the original', () => {
		const before = initialBoard();
		const after = applyMove(before, [2, 1, 2], [2, 2, 2]); // white pawn forward

		expect(pieceAt(after, [2, 2, 2])).toEqual({ piece: 'pawn', side: 'white' });
		expect(pieceAt(after, [2, 1, 2])).toBeNull();
		// original untouched
		expect(pieceAt(before, [2, 1, 2])).toEqual({ piece: 'pawn', side: 'white' });
		expect(before.size).toBe(after.size);
	});
});

describe('serialization', () => {
	it('round-trips through a plain object', () => {
		const board = initialBoard();
		const restored = objectToBoard(boardToObject(board));
		expect(restored.size).toBe(board.size);
		expect(pieceAt(restored, [4, 0, 4])).toEqual({ piece: 'king', side: 'white' });
	});

	it('cloneBoard is an independent copy', () => {
		const a = initialBoard();
		const b = cloneBoard(a);
		b.delete('4,0,4');
		expect(pieceAt(a, [4, 0, 4])).not.toBeNull();
	});
});
