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

describe('generateMoves — stepping pieces (empty or enemy square)', () => {
	it('knight in the middle has all 24 moves (2 land on capturable black pawns)', () => {
		const moves = generateMoves(withPiece([4, 4, 4], { piece: 'knight', side: 'white' }), [4, 4, 4]);
		expect(moves).toHaveLength(24);
		expect(has(moves, [4, 6, 3])).toBe(true); // black pawn -> capturable
		expect(has(moves, [3, 6, 4])).toBe(true);
	});

	it('a knight cannot land on a friendly piece', () => {
		// white knight at [4,2,4]; [3,0,3] etc are far — put a friendly pawn on a knight square
		const s = withPiece([4, 4, 4], { piece: 'knight', side: 'white' });
		s.set('4,6,3', { piece: 'pawn', side: 'white' }); // make that target friendly
		const moves = generateMoves(s, [4, 4, 4]);
		expect(has(moves, [4, 6, 3])).toBe(false);
		expect(moves).toHaveLength(23);
	});

	it('king in the empty middle has all 26 neighbours', () => {
		expect(generateMoves(withPiece([4, 4, 4], { piece: 'king', side: 'white' }), [4, 4, 4])).toHaveLength(26);
	});
});

describe('generateMoves — sliding pieces (capture enemy, stop; friendly blocks)', () => {
	it('on the initial board the rook is boxed in by friendly pieces (8 moves)', () => {
		// [2,0,2] is a white rook; the knights at [5,0,2]/[2,0,5] are also WHITE
		// (y=0 is white's back rank), so every ray is blocked by a friendly piece
		// or its own pawn. LEFT x2, RIGHT x2, FRONT x2, BACK x2 = 8; UP blocked.
		const moves = generateMoves(initialBoard(), [2, 0, 2]);
		expect(moves).toHaveLength(8);
		expect(has(moves, [5, 0, 2])).toBe(false); // friendly knight, not a capture
		expect(has(moves, [2, 1, 2])).toBe(false); // own pawn blocks UP
	});

	it('captures an enemy on the ray and stops there', () => {
		// lone white rook, black knight two squares along +x
		const s: BoardState = new Map();
		s.set('0,0,0', { piece: 'rook', side: 'white' });
		s.set('2,0,0', { piece: 'knight', side: 'black' });
		const moves = generateMoves(s, [0, 0, 0]);
		expect(has(moves, [1, 0, 0])).toBe(true); // empty square before the enemy
		expect(has(moves, [2, 0, 0])).toBe(true); // enemy knight -> capture
		expect(has(moves, [3, 0, 0])).toBe(false); // nothing beyond it
	});

	it('a friendly piece blocks without being a target', () => {
		const s: BoardState = new Map();
		s.set('0,0,0', { piece: 'rook', side: 'white' });
		s.set('2,0,0', { piece: 'pawn', side: 'white' }); // friendly on the +x ray
		const moves = generateMoves(s, [0, 0, 0]);
		expect(has(moves, [1, 0, 0])).toBe(true);
		expect(has(moves, [2, 0, 0])).toBe(false); // friendly, not a target
		expect(has(moves, [3, 0, 0])).toBe(false); // blocked
	});
});

describe('generateMoves — pawns', () => {
	it('moves forward onto an empty square and two from the home rank', () => {
		const moves = generateMoves(initialBoard(), [2, 1, 2]); // white pawn, home rank
		expect(has(moves, [2, 2, 2])).toBe(true); // one forward
		expect(has(moves, [2, 3, 2])).toBe(true); // two forward (first move)
	});

	it('cannot move forward onto an occupied square', () => {
		const s = initialBoard();
		s.set('2,2,2', { piece: 'pawn', side: 'black' }); // block directly ahead
		const moves = generateMoves(s, [2, 1, 2]);
		expect(has(moves, [2, 2, 2])).toBe(false); // forward blocked (no forward capture)
		expect(has(moves, [2, 3, 2])).toBe(false); // and the double is blocked too
	});

	it('captures only diagonally onto an enemy', () => {
		const s = initialBoard();
		s.set('3,2,2', { piece: 'knight', side: 'black' }); // diagonal enemy
		const moves = generateMoves(s, [2, 1, 2]);
		expect(has(moves, [3, 2, 2])).toBe(true); // diagonal capture
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
