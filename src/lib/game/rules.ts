// Pure hyperchess rules — no Svelte stores, no DOM. This is the authority the
// server uses to validate moves, and mirrors the geometry in
// `$lib/utils/moves.ts` that the client uses for highlighting.
//
// Faithful to the current game: pieces move onto EMPTY squares only (captures
// are not modelled yet), and sliding pieces are blocked by any occupant.
import { pieces } from '$lib/utils/directions';

export const BOARDSIZE = 8;

export type Side = 'white' | 'black';
export type Piece = 'queen' | 'king' | 'bishop' | 'knight' | 'rook' | 'pawn';
export type Coord = [number, number, number];
export type PieceState = { piece: Piece; side: Side };

/** Sparse board: key `"x,y,z"` → piece. Absent key = empty square. */
export type BoardState = Map<string, PieceState>;

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

export function isWithinBounds(x: number, y: number, z: number): boolean {
	return x >= 0 && x < BOARDSIZE && y >= 0 && y < BOARDSIZE && z >= 0 && z < BOARDSIZE;
}

export function pieceAt(state: BoardState, [x, y, z]: Coord): PieceState | null {
	return state.get(key(x, y, z)) ?? null;
}

function place(state: BoardState, [x, y, z]: Coord, piece: PieceState): void {
	state.set(key(x, y, z), piece);
}

export function cloneBoard(state: BoardState): BoardState {
	return new Map(state);
}

// Sliding pieces: walk each delta until out of bounds or blocked; empty squares
// only (the blocker itself is not a legal target — no captures yet).
function slidingTargets(state: BoardState, from: Coord, deltas: readonly number[][]): Coord[] {
	const out: Coord[] = [];
	for (const [dx, dy, dz] of deltas) {
		let [x, y, z] = [from[0] + dx, from[1] + dy, from[2] + dz];
		while (isWithinBounds(x, y, z) && !state.has(key(x, y, z))) {
			out.push([x, y, z]);
			x += dx;
			y += dy;
			z += dz;
		}
	}
	return out;
}

// Stepping pieces: each delta once; in bounds and empty.
function stepTargets(state: BoardState, from: Coord, deltas: readonly number[][]): Coord[] {
	const out: Coord[] = [];
	for (const [dx, dy, dz] of deltas) {
		const c: Coord = [from[0] + dx, from[1] + dy, from[2] + dz];
		if (isWithinBounds(...c) && !state.has(key(...c))) out.push(c);
	}
	return out;
}

/** All legal target squares for the piece standing on `from`. */
export function generateMoves(state: BoardState, from: Coord): Coord[] {
	const p = pieceAt(state, from);
	if (!p) return [];

	switch (p.piece) {
		case 'queen':
			return slidingTargets(state, from, pieces.unlimited.queen);
		case 'rook':
			return slidingTargets(state, from, pieces.unlimited.rook);
		case 'bishop':
			return slidingTargets(state, from, pieces.unlimited.bishop);
		case 'king':
			return stepTargets(state, from, pieces.limited.king);
		case 'knight':
			return stepTargets(state, from, pieces.limited.knight);
		case 'pawn': {
			const pawn = pieces.limited.pawn(p.side);
			// union of forward / first-double / diagonal moves (all empty-only today)
			return stepTargets(state, from, [...pawn.moves, ...pawn.first, ...pawn.attack]);
		}
	}
}

export function isLegalMove(state: BoardState, from: Coord, to: Coord): boolean {
	if (!isWithinBounds(...to)) return false;
	return generateMoves(state, from).some((m) => m[0] === to[0] && m[1] === to[1] && m[2] === to[2]);
}

/** Apply a move purely, returning a new board. Does not re-validate. */
export function applyMove(state: BoardState, from: Coord, to: Coord): BoardState {
	const next = cloneBoard(state);
	const moving = next.get(key(...from));
	next.delete(key(...from));
	if (moving) next.set(key(...to), moving);
	return next;
}

// Starting position (mirrors putPieces in $lib/store).
const START: { side: Side; piece: Piece; coords: Coord }[] = [
	{ side: 'white', piece: 'queen', coords: [3, 0, 3] },
	{ side: 'white', piece: 'bishop', coords: [3, 0, 4] },
	{ side: 'white', piece: 'king', coords: [4, 0, 4] },
	{ side: 'white', piece: 'bishop', coords: [4, 0, 3] },
	{ side: 'white', piece: 'rook', coords: [2, 0, 2] },
	{ side: 'white', piece: 'rook', coords: [5, 0, 5] },
	{ side: 'white', piece: 'knight', coords: [5, 0, 2] },
	{ side: 'white', piece: 'knight', coords: [2, 0, 5] },
	{ side: 'white', piece: 'pawn', coords: [3, 1, 3] },
	{ side: 'white', piece: 'pawn', coords: [3, 1, 4] },
	{ side: 'white', piece: 'pawn', coords: [4, 1, 4] },
	{ side: 'white', piece: 'pawn', coords: [4, 1, 3] },
	{ side: 'white', piece: 'pawn', coords: [2, 1, 2] },
	{ side: 'white', piece: 'pawn', coords: [5, 1, 5] },
	{ side: 'white', piece: 'pawn', coords: [5, 1, 2] },
	{ side: 'white', piece: 'pawn', coords: [2, 1, 5] },
	{ side: 'black', piece: 'queen', coords: [3, 7, 3] },
	{ side: 'black', piece: 'bishop', coords: [3, 7, 4] },
	{ side: 'black', piece: 'king', coords: [4, 7, 4] },
	{ side: 'black', piece: 'bishop', coords: [4, 7, 3] },
	{ side: 'black', piece: 'rook', coords: [2, 7, 2] },
	{ side: 'black', piece: 'rook', coords: [5, 7, 5] },
	{ side: 'black', piece: 'knight', coords: [5, 7, 2] },
	{ side: 'black', piece: 'knight', coords: [2, 7, 5] },
	{ side: 'black', piece: 'pawn', coords: [3, 6, 3] },
	{ side: 'black', piece: 'pawn', coords: [3, 6, 4] },
	{ side: 'black', piece: 'pawn', coords: [4, 6, 4] },
	{ side: 'black', piece: 'pawn', coords: [4, 6, 3] },
	{ side: 'black', piece: 'pawn', coords: [2, 6, 2] },
	{ side: 'black', piece: 'pawn', coords: [5, 6, 5] },
	{ side: 'black', piece: 'pawn', coords: [5, 6, 2] },
	{ side: 'black', piece: 'pawn', coords: [2, 6, 5] }
];

export function initialBoard(): BoardState {
	const state: BoardState = new Map();
	for (const { side, piece, coords } of START) place(state, coords, { piece, side });
	return state;
}

/** Serialize for the wire / DB: `{ "x,y,z": {piece, side} }`. */
export function boardToObject(state: BoardState): Record<string, PieceState> {
	return Object.fromEntries(state);
}

export function objectToBoard(obj: Record<string, PieceState>): BoardState {
	return new Map(Object.entries(obj));
}
