import type Pieces from '$lib/components/piece/Pieces.svelte';
import { BOARDSIZE, type PieceCoords, type Side } from '$lib/store';
import type { Delta } from './directions';
import { pieces } from './directions';

function expandMovesByPosition(moves: Delta[], position: PieceCoords): PieceCoords[] {
	const expanded: PieceCoords[] = [];
	for (const [dx, dy, dz] of moves) {
		let x = position[0];
		let y = position[1];
		let z = position[2];
		while (isWithinBounds(x, y, z)) {
			expanded.push([x, y, z]);
			x += dx;
			y += dy;
			z += dz;
		}
	}
	return expanded;
}

function getMovesByPosition(moves: Delta[], position: PieceCoords): PieceCoords[] {
	return moves.map(([dx, dy, dz]) => {
		return [position[0] + dx, position[1] + dy, position[2] + dz];
	});
}

export function isWithinBounds(x: number, y: number, z: number) {
	return x >= 0 && x < BOARDSIZE && y >= 0 && y < BOARDSIZE && z >= 0 && z < BOARDSIZE;
}

export const genQueenMoves = (position: PieceCoords) => {
	const moves = pieces.unlimited.queen;
	return expandMovesByPosition(moves, position);
};

export const genRookMoves = (position: PieceCoords) => {
	const moves = pieces.unlimited.rook;
	return expandMovesByPosition(moves, position);
};

export const genBishopMoves = (position: PieceCoords) => {
	const moves = pieces.unlimited.bishop;
	return expandMovesByPosition(moves, position);
};

export const genKingMoves = (position: PieceCoords) => {
	const moves = pieces.limited.king;
	return getMovesByPosition(moves, position);
};

export const genKnightMoves = (position: PieceCoords) => {
	const moves = pieces.limited.knight;
	return getMovesByPosition(moves, position);
};

export const genPawnMoves = (position: PieceCoords, side: Side) => {
	const moves = pieces.limited.pawn(side).moves;
	return getMovesByPosition(moves, position);
};

export const genPawnAttacks = (position: PieceCoords, side: Side) => {
	const moves = pieces.limited.pawn(side).attack;
	return getMovesByPosition(moves, position);
};

export const genPawnFirstMoves = (position: PieceCoords, side: Side) => {
	const moves = pieces.limited.pawn(side).first;
	return getMovesByPosition(moves, position);
};

export const genMoves = {
	queen: genQueenMoves,
	rook: genRookMoves,
	bishop: genBishopMoves,
	king: genKingMoves,
	knight: genKnightMoves,
	pawn: (side: Side) => ({
		moves: (position: PieceCoords) => genPawnMoves(position, side),
		attacks: (position: PieceCoords) => genPawnAttacks(position, side),
		first: (position: PieceCoords) => genPawnFirstMoves(position, side)
	})
};
