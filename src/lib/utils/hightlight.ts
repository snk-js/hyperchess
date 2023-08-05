import type { Board, PieceCoords } from '$lib/store';
import { board } from '$lib/store';
import { isWithinBounds } from './moves';

const setHighlightCell = (coords: PieceCoords[], value: boolean, clear = false) => {
	if (clear) {
		board.update((currentBoard: Board) => {
			currentBoard.forEach((x) => {
				x.forEach((y) => {
					y.forEach((z) => {
						z.highlighted = false;
					});
				});
			});
			return currentBoard;
		});
		return;
	}

	board.update((currentBoard: Board) => {
		coords.forEach((coord) => {
			const [x, y, z] = coord;
			if (isWithinBounds(...coord)) {
				currentBoard[x][y][z].highlighted = value;
			}
		});
		return currentBoard;
	});
};

export const hightLightCells = (coords?: PieceCoords[]) => {
	(coords && setHighlightCell(coords, true)) || setHighlightCell([[0, 0, 0]], false, true);
};
