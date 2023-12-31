import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { isWithinBounds } from '$lib/utils/moves';

export type Piece = 'queen' | 'king' | 'bishop' | 'knight' | 'rook' | 'pawn' | '';

export const BOARDSIZE = 8;
export type Side = 'white' | 'black' | '';
// ----------------------->  x,      y,       z
export type PieceCoords = number[];

export type CellStates = 'selected' | 'activated';

export type CellStatesMapping = Partial<{
	[key in CellStates]: boolean;
}> &
	HighlightedState;

export type HighlightedState = {
	highlighted: Partial<{
		[key in CellStates]: boolean;
	}>;
};

export type PieceProps = {
	piece: Piece;
	side: Side;
	coords: PieceCoords;
};

export type Cell = PieceProps & CellStatesMapping;
export type CellStore = Writable<Cell>;

export const dummyCell: Cell = {
	piece: '' as Piece,
	selected: false,
	activated: false,
	coords: [0, 0, 0],
	highlighted: {
		activated: false,
		selected: false
	},
	side: ''
};

export type Board = CellStore[][][];

function createBoard(): Board {
	const board: Board = new Array(BOARDSIZE);
	for (let i = 0; i < BOARDSIZE; i++) {
		board[i] = new Array(BOARDSIZE);
		for (let j = 0; j < BOARDSIZE; j++) {
			board[i][j] = new Array(BOARDSIZE);
			for (let k = 0; k < BOARDSIZE; k++) {
				board[i][j][k] = writable({
					piece: '',
					selected: false,
					activated: false,
					coords: [i, j, k],
					highlighted: {
						activated: false,
						selected: false
					},
					side: ''
				});
			}
		}
	}
	return board;
}

type PieceConfig = {
	side: Side;
	piece: Piece;
	coords: PieceCoords;
};

const putPieces: PieceConfig[] = [
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

export const board: Board = createBoard();

export const boardUpdates = writable<Cell[][]>([]);

putPieces.forEach((pieceInfo) => {
	const [x, y, z] = pieceInfo.coords;
	board[x][y][z].update((oldCell) => ({
		...oldCell,
		side: pieceInfo.side,
		piece: pieceInfo.piece
	}));
});

export const updateCell = (coord: PieceCoords, cell: Partial<Cell>) => {
	const [x, y, z] = coord;
	// Update only the specific cell store
	board[x][y][z].update((oldCell) => ({
		...oldCell,
		...cell,
		coords: oldCell.coords,
		highlighted: {
			...oldCell.highlighted,
			...cell.highlighted
		}
	}));
};

export const updateCells = (cell: Partial<Cell>, coords: PieceCoords[]) => {
	coords.forEach((coord) => {
		if (isWithinBounds(coord[0], coord[1], coord[2])) {
			const [x, y, z] = coord;
			board[x][y][z].update((oldCell) => ({
				...oldCell,
				...cell,
				coords: oldCell.coords,
				highlighted: {
					...oldCell.highlighted,
					...cell.highlighted
				},
				selected: cell.selected ?? oldCell.selected
			}));
		}
	});
};

const exchangePiece = (coord: PieceCoords, cell: Cell) => {
	const [x, y, z] = coord;
	// Update only the specific cell store
	board[x][y][z].update((oldCell) => ({
		piece: cell.piece,
		side: cell.side,
		coords: oldCell.coords,
		highlighted: {
			activated: false,
			selected: false
		},
		activated: false,
		selected: false
	}));
};

export const movePiece = (from: PieceCoords, to: PieceCoords) => {
	const [x1, y1, z1] = from;
	const [x2, y2, z2] = to;
	const sourcePiece = get(board[x1][y1][z1]);
	const target = get(board[x2][y2][z2]);

	if (target.piece) {
		// TODO: capture piece
	}

	exchangePiece(to, sourcePiece);
	exchangePiece(from, target);

	boardUpdates.update((cells) => [...cells, [sourcePiece, target]]);
};
