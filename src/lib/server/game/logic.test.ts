import { describe, it, expect } from 'vitest';
import { assignColors, decideMove } from './logic';
import { boardToObject, initialBoard, type PieceState } from '$lib/game/rules';

describe('assignColors', () => {
	it('gives the owner their chosen side', () => {
		expect(assignColors('white', 'owner', 'joiner')).toEqual({
			whitePlayerId: 'owner',
			blackPlayerId: 'joiner'
		});
		expect(assignColors('black', 'owner', 'joiner')).toEqual({
			whitePlayerId: 'joiner',
			blackPlayerId: 'owner'
		});
	});

	it('randomises when the owner picked "random"', () => {
		expect(assignColors('random', 'owner', 'joiner', () => 0.1).whitePlayerId).toBe('owner');
		expect(assignColors('random', 'owner', 'joiner', () => 0.9).whitePlayerId).toBe('joiner');
	});
});

describe('decideMove', () => {
	const start = boardToObject(initialBoard());

	it('rejects moving out of turn', () => {
		const r = decideMove(start, 'white', 'black', [2, 6, 2], [2, 5, 2]);
		expect(r).toEqual({ ok: false, error: 'Not your turn' });
	});

	it('rejects moving from an empty square', () => {
		const r = decideMove(start, 'white', 'white', [4, 4, 4], [4, 5, 4]);
		expect(r).toEqual({ ok: false, error: 'No piece on the source square' });
	});

	it("rejects moving the opponent's piece", () => {
		// white's turn, white tries to move a black pawn
		const r = decideMove(start, 'white', 'white', [2, 6, 2], [2, 5, 2]);
		expect(r).toEqual({ ok: false, error: 'That piece is not yours' });
	});

	it('rejects an illegal destination', () => {
		const r = decideMove(start, 'white', 'white', [2, 1, 2], [7, 7, 7]);
		expect(r).toEqual({ ok: false, error: 'Illegal move' });
	});

	it('accepts a legal move: flips the turn and moves the piece', () => {
		const r = decideMove(start, 'white', 'white', [2, 1, 2], [2, 2, 2]);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.turn).toBe('black');
		expect(r.captured).toBeNull();
		expect(r.winnerSide).toBeNull();
		expect(r.board['2,2,2']).toEqual({ piece: 'pawn', side: 'white' });
		expect(r.board['2,1,2']).toBeUndefined();
	});

	it('records a capture', () => {
		const board: Record<string, PieceState> = {
			'0,0,0': { piece: 'rook', side: 'white' },
			'0,0,2': { piece: 'knight', side: 'black' }
		};
		const r = decideMove(board, 'white', 'white', [0, 0, 0], [0, 0, 2]);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.captured).toEqual({ piece: 'knight', side: 'black' });
		expect(r.board['0,0,2']).toEqual({ piece: 'rook', side: 'white' });
		expect(r.winnerSide).toBeNull();
	});

	it('capturing the king wins the game', () => {
		const board: Record<string, PieceState> = {
			'0,0,0': { piece: 'rook', side: 'white' },
			'0,0,1': { piece: 'king', side: 'black' }
		};
		const r = decideMove(board, 'white', 'white', [0, 0, 0], [0, 0, 1]);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.captured).toEqual({ piece: 'king', side: 'black' });
		expect(r.winnerSide).toBe('white');
	});
});
