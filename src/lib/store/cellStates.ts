import { genMoves } from '$lib/utils/moves';
import { updateCells, type PieceCoords, type CellStates, board } from '.';
import { get, writable } from 'svelte/store';
import type { CellStatesMapping } from '.';

export type UpdatedCell = {
	coord: PieceCoords;
} & Partial<CellStatesMapping>;

export const updatedCells = writable<UpdatedCell[]>([]);

export const updateCellStatus = (coords: PieceCoords[], cellState: CellStates, state: boolean) => {
	updateCells({ [cellState]: state }, coords);
	let highlightedCells: PieceCoords[] = [];
	if (cellState === 'activated') return;

	if (cellState === 'selected' && state) {
		const cell = get(board[coords[0][0]][coords[0][1]][coords[0][2]]);
		if (cell.piece === 'pawn') {
			highlightedCells = genMoves['pawn'](cell.side).moves(cell.coords);
		} else if (cell.piece) {
			highlightedCells = genMoves[cell.piece](cell.coords);
		}

		updatedCells.update((cells) => {
			const selecteds = cells.filter((cell) => cell.selected);
			const highlighted = cells.filter((cell) => cell.highlighted?.activated);

			selecteds.forEach((cell) => updateCells({ selected: false }, [cell.coord]));
			highlighted.forEach((cell) =>
				updateCells(
					{
						highlighted: {
							activated: false
						}
					},
					[cell.coord]
				)
			);

			const result = [
				...highlightedCells.map((coord) => ({
					coord,
					highlighted: {
						activated: true
					}
				})),
				{ coord: cell.coords, selected: true }
			];

			return result;
		});

		updateCells(
			{
				highlighted: {
					activated: true
				}
			},
			highlightedCells
		);
		updateCells({ selected: true }, [cell.coords]);
	}

	if (state) {
		updatedCells.update((cells) => {
			return [...cells, ...coords.map((coord) => ({ coord, [cellState]: state }))];
		});
	}
};
