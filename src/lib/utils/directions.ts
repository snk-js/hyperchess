import type { Side } from '$lib/store';

const VERTICALS = {
	UP: [0, 1, 0],
	DOWN: [0, -1, 0]
};

const HORIZONTALS = {
	LEFT: [-1, 0, 0],
	RIGHT: [1, 0, 0],
	FRONT: [0, 0, 1],
	BACK: [0, 0, -1]
};

const UP_PERPENDICULAR_DIAGONALS = {
	UP_LEFT: [-1, 1, 0],
	UP_RIGHT: [1, 1, 0],
	UP_FRONT: [0, 1, 1],
	UP_BACK: [0, 1, -1]
};

const DOWN_PERPENDICULAR_DIAGONALS = {
	DOWN_LEFT: [-1, -1, 0],
	DOWN_RIGHT: [1, -1, 0],
	DOWN_FRONT: [0, -1, 1],
	DOWN_BACK: [0, -1, -1]
};

const PERPENDICULAR_DIAGONALS = {
	...UP_PERPENDICULAR_DIAGONALS,
	...DOWN_PERPENDICULAR_DIAGONALS
};

const HORIZONTAL_DIAGONALS = {
	LEFT_FRONT: [-1, 0, 1],
	LEFT_BACK: [-1, 0, -1],
	RIGHT_FRONT: [1, 0, 1],
	RIGHT_BACK: [1, 0, -1]
};

const UP_DIAGONAL_DIAGONALS = {
	UP_LEFT_FRONT: [-1, 1, 1],
	UP_RIGHT_FRONT: [1, 1, 1],
	UP_LEFT_BACK: [-1, 1, -1],
	UP_RIGHT_BACK: [1, 1, -1]
};

const DOWN_DIAGONAL_DIAGONALS = {
	DOWN_LEFT_FRONT: [-1, -1, 1],
	DOWN_RIGHT_FRONT: [1, -1, 1],
	DOWN_LEFT_BACK: [-1, -1, -1],
	DOWN_RIGHT_BACK: [1, -1, -1]
};

const DIAGONAL_DIAGONALS = {
	...UP_DIAGONAL_DIAGONALS,
	...DOWN_DIAGONAL_DIAGONALS
};

const DELTAS = {
	...VERTICALS,
	...HORIZONTALS,
	// verticals * horizontals
	...PERPENDICULAR_DIAGONALS,
	// horizontals * horizontals
	...HORIZONTAL_DIAGONALS,
	// diagonals * diagonals
	...DIAGONAL_DIAGONALS
} as const;

export type Delta = (typeof DELTAS)[keyof typeof DELTAS];

const KNIGHT_MOVES = [
	[-2, 1, 1],
	[-2, 1, -1],
	[-1, 2, 1],
	[-1, 2, -1],

	[1, 2, 1],
	[1, 2, -1],
	[2, 1, 1],
	[2, 1, -1],

	[-2, -1, 1],
	[-2, -1, -1],
	[-1, -2, 1],
	[-1, -2, -1],

	[1, -2, 1],
	[1, -2, -1],
	[2, -1, 1],
	[2, -1, -1]
];

const whitePawnMoves = {
	first: [
		[0, 2, 0],
		[-2, 0, 0],
		[2, 0, 0],
		[0, 0, 2],
		[0, 0, -2]
	],
	moves: [VERTICALS.UP, ...Object.values(HORIZONTALS)],
	attack: [
		...Object.values(HORIZONTAL_DIAGONALS),
		...Object.values(UP_DIAGONAL_DIAGONALS),
		...Object.values(UP_PERPENDICULAR_DIAGONALS)
	]
};

const blackPawnMoves = {
	first: [
		[0, -2, 0],
		[-2, 0, 0],
		[2, 0, 0],
		[0, 0, 2],
		[0, 0, -2]
	],
	moves: [VERTICALS.DOWN, ...Object.values(HORIZONTALS)],
	attack: [
		...Object.values(HORIZONTAL_DIAGONALS),
		...Object.values(DOWN_DIAGONAL_DIAGONALS),
		...Object.values(DOWN_PERPENDICULAR_DIAGONALS)
	]
};

export const pieces = {
	unlimited: {
		queen: Object.values(DELTAS),
		rook: Object.values(VERTICALS).concat(Object.values(HORIZONTALS)),
		bishop: Object.values(PERPENDICULAR_DIAGONALS)
	},
	limited: {
		king: Object.values(DELTAS),
		knight: KNIGHT_MOVES,
		pawn: (side: Side) => {
			return side === 'white' ? whitePawnMoves : blackPawnMoves;
		}
	}
};
