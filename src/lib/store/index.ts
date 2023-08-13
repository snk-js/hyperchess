import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { updatedCells, type UpdatedCell } from './cellStates';
import { isWithinBounds } from '$lib/utils/moves';

export type Piece = 'queen' | 'king' | 'bishop' | 'knight' | 'rook' | 'pawn' | '';

export const BOARDSIZE = 8;
export type Side = 'white' | 'black' | '';
// ----------------------->  x,      y,       z
export type PieceCoords = [number, number, number];

export type CellStates = 'selected' | 'activated' | 'highlighted';

export type CellStatesMapping = {
	[key in CellStates]: boolean;
};

export type PieceProps = {
	piece: Piece;
	side: Side;
	coords: PieceCoords;
};

export type Cell = PieceProps & CellStatesMapping;

export const dummyCell: Cell = {
	piece: '' as Piece,
	selected: false,
	activated: false,
	coords: [0, 0, 0],
	highlighted: false,
	side: ''
};

export type Board = Cell[][][];

function createEmptyBoard(size = BOARDSIZE): Board {
	const board: Board = new Array(size);
	for (let i = 0; i < size; i++) {
		board[i] = new Array(size);
		for (let j = 0; j < size; j++) {
			board[i][j] = new Array(size);
			for (let k = 0; k < size; k++) {
				board[i][j][k] = {
					piece: '',
					selected: false,
					activated: false,
					coords: [i, j, k],
					highlighted: false,
					side: ''
				};
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

const initialBoard: Board = createEmptyBoard(BOARDSIZE);

putPieces.forEach((pieceInfo) => {
	const [x, y, z] = pieceInfo.coords;
	initialBoard[x][y][z] = {
		...initialBoard[x][y][z],
		side: pieceInfo.side,
		piece: pieceInfo.piece
	};
});

export const clear = () => {
	try {
		const cellsUpdated = get(updatedCells);

		cellsUpdated.map((cell: UpdatedCell) => {
			if (cell.coord)
				updateCell(cell.coord, {
					...cell,
					selected: false,
					activated: false,
					highlighted: false
				});
		});
		return 'ok';
	} catch (e) {
		return 'error';
	}
};

export const updateCell = (coord: PieceCoords, cell: Partial<Cell>) => {
	board.update((board) => {
		const [x, y, z] = coord;
		const oldCell = board[x][y][z];
		board[x][y][z] = {
			...oldCell,
			...cell
		};

		return board;
	});
};

export const updateCells = (cell: Partial<Cell>, coords: PieceCoords[]) => {
	const newState = get(board);
	coords.forEach((coord) => {
		if (isWithinBounds(coord[0], coord[1], coord[2])) {
			const [x, y, z] = coord;
			newState[x][y][z] = {
				...newState[x][y][z],
				...cell
			};
		}
	});

	board.set(newState);
};

export const movePiece = (from: PieceCoords, to: PieceCoords) => {
	const newState = get(board);
	const [x1, y1, z1] = from;
	const [x2, y2, z2] = to;
	newState[x2][y2][z2] = newState[x1][y1][z1];
	newState[x1][y1][z1] = {
		...newState[x1][y1][z1],
		piece: ''
	};
	board.set(newState);
};

export const board: Writable<Board> = writable(initialBoard);
