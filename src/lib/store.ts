import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

type Piece = 'queen' | 'king' | 'bishop' | 'knight' | 'rook' | 'pawn' | '';

interface Cell {
	piece: Piece;
	selected: boolean;
}

export type Board = Cell[][][];

function createEmptyBoard(size: 8): Board {
	const board: Board = new Array(size);
	for (let i = 0; i < size; i++) {
		board[i] = new Array(size);
		for (let j = 0; j < size; j++) {
			board[i][j] = new Array(size).fill({ piece: '', selected: false });
		}
	}
	return board;
}

const initialBoard: Board = createEmptyBoard(8);
initialBoard[3][3][3] = { piece: 'queen', selected: false };

export const board: Writable<Board> = writable(initialBoard);
