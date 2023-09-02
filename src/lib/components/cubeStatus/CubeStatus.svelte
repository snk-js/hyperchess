<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	export const selectedPiece = writable<PieceCoords>([]);
	export function addToMovePiece(coords: PieceCoords) {
		movePiece(get(selectedPiece), coords);
	}
</script>

<script lang="ts">
	import { T } from '@threlte/core';
	import { updateCell, type PieceCoords, type CellStore, movePiece } from '$lib/store/';
	import { tweened } from 'svelte/motion';
	import { backInOut } from 'svelte/easing';
	import { updateBox } from './cellStyles';
	import { get } from 'svelte/store';
	import { board } from '$lib/store/';
	import type { MeshBasicMaterialParameters } from 'three';

	export let innerCubeSize: number;
	export let pos: PieceCoords = [0, 0, 0];
	export let cell: CellStore = board[pos[0]][pos[1]][pos[2]];

	let c = get(cell);

	const idx = pos[0] * pos[1] * pos[2];

	let defaultEdges: MeshBasicMaterialParameters;
	let defaultInnerColor: MeshBasicMaterialParameters;

	const scale = tweened(0, {
		duration: 400,
		easing: backInOut
	});

	const handleActivateHighlighted = (e: Event, select: boolean) => {
		e.stopPropagation();
		const cellValue = get(cell);
		if (cellValue.highlighted.activated) {
			updateCell(cellValue.coords, {
				highlighted: {
					selected: select
				}
			});
		}
	};

	cell?.subscribe((newCell) => {
		c = newCell;
		const { inner, mesh } = updateBox(newCell);
		defaultEdges = mesh;
		defaultInnerColor = inner;

		if (newCell.activated || newCell.selected || newCell.highlighted.activated) {
			if (newCell.highlighted.selected && !newCell.selected) {
				const { inner, mesh } = updateBox(newCell, true);
				defaultEdges = mesh;
				defaultInnerColor = inner;
				scale.set(2.5);
			} else {
				scale.set(4);
			}
		} else {
			scale.set(0);
		}
	});

	const evenColor = { color: 0x000000, opacity: 0.1, transparent: true }; // black
	const oddColor = { color: 0xffffff, opacity: 0.1, transparent: true }; // white

	$: {
		defaultEdges = idx % 2 === 0 ? evenColor : oddColor;
	}

	const onClickAvailableMove = (e: Event) => {
		e.stopPropagation();
		if (get(cell).highlighted.selected) {
			addToMovePiece(c.coords);
		}
	};
</script>

<T.Mesh
	on:pointerover={(e) => handleActivateHighlighted(e, true)}
	on:pointerleave={(e) => handleActivateHighlighted(e, false)}
	on:click={onClickAvailableMove}
	scale={$scale}
>
	<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
	<T.MeshBasicMaterial args={[defaultInnerColor]} />
</T.Mesh>
<T.Mesh>
	<T.MeshBasicMaterial args={[defaultEdges]} />
</T.Mesh>
<T.MeshBasicMaterial args={[defaultEdges]} />
