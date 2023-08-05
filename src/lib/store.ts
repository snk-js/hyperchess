import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export type Piece = 'queen' | 'king' | 'bishop' | 'knight' | 'rook' | 'pawn' | '';

export const BOARDSIZE = 8;

// ----------------------->  x,      y,       z
export type PieceCoords = [number, number, number];

export interface Cell {
	piece?: Piece;
	selected: boolean;
	activated: boolean;
	coords: PieceCoords;
	highlighted: boolean;
}

export const dummyCell: Cell = {
	piece: '' as Piece,
	selected: false,
	activated: false,
	coords: [0, 0, 0],
	highlighted: false
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
					highlighted: false
				};
			}
		}
	}
	return board;
}

const initialBoard: Board = createEmptyBoard(BOARDSIZE);
initialBoard[3][3][3] = {
	...initialBoard[3][3][3],
	piece: 'queen',
	selected: false,
	activated: false,
	highlighted: false
};

export const board: Writable<Board> = writable(initialBoard);
