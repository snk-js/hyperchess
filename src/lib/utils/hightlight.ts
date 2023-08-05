import type { Board, PieceCoords } from '$lib/store';

const setHighlightCell = (board: Board, coords: PieceCoords, value: boolean) => {
	const [x, y, z] = coords;
	board[x][y][z].highlighted = value;
};

const hightLightCells = (board: Board, coords: PieceCoords[]) => {
	coords.forEach((coord) => setHighlightCell(board, coord, true));
};

const availableMoves = (board: Board, coords: PieceCoords) => {
	const [x, y, z] = coords;
	const moves: PieceCoords[] = [];
	const len = board.length;

	return '';
};
