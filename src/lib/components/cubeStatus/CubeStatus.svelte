<script lang="ts">
	import { T } from '@threlte/core';
	import { updateCell } from '$lib/store/';
	import type { CellStore, PieceCoords } from '$lib/store/';
	import { tweened } from 'svelte/motion';
	import { backInOut } from 'svelte/easing';
	import { updateBox } from './cellStyles';
	import { get } from 'svelte/store';
	import { board } from '$lib/store/';
	import type { MeshBasicMaterialParameters } from 'three';

	export let innerCubeSize: number;
	export let pos: PieceCoords = [0, 0, 0];
	export let cell: CellStore = board[pos[0]][pos[1]][pos[2]];

	const c = get(cell);
	const idx = pos[0] * pos[1] * pos[2];

	let defaultEdges: MeshBasicMaterialParameters;
	let defaultInnerColor: MeshBasicMaterialParameters;
	let defaultSquare: MeshBasicMaterialParameters;

	const scale = tweened(0, {
		duration: 400,
		easing: backInOut
	});

	const handleSelectHighlighted = (select: boolean) => {
		const cellValue = get(cell);
		if (cellValue.highlighted.activated) {
			updateCell(cellValue.coords, {
				highlighted: {
					selected: select
				}
			});
		}
	};

	cell?.subscribe((cellValue) => {
		const { inner, mesh } = updateBox(cellValue);
		defaultEdges = mesh;
		defaultInnerColor = inner;

		if (cellValue.activated || cellValue.selected || cellValue.highlighted.activated) {
			if (cellValue.highlighted.selected && !cellValue.selected) {
				const { inner, mesh } = updateBox(cellValue, true);
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
	const evenColor = { color: 0x000000, opacity: 0.03, transparent: true }; // black
	const oddColor = { color: 0xffffff, opacity: 0.03, transparent: true }; // white
	$: {
		defaultEdges = idx % 2 === 0 ? evenColor : oddColor;
	}
</script>

<T.Mesh
	on:pointerover={() => handleSelectHighlighted(true)}
	on:pointerleave={() => handleSelectHighlighted(false)}
	scale={$scale}
>
	<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
	<T.MeshBasicMaterial args={[defaultInnerColor]} />
</T.Mesh>
<T.Mesh>
	<T.BoxGeometry args={[innerCubeSize / 2, innerCubeSize / 2, innerCubeSize / 2]} />
	<T.MeshBasicMaterial args={[defaultEdges]} />
</T.Mesh>
<T.MeshBasicMaterial args={[defaultEdges]} />
