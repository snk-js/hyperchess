<!-- CubeStatus.svelte -->
<script lang="ts">
	import { T } from '@threlte/core';
	import { dummyCell } from '$lib/store/';
	import type { Cell, PieceCoords } from '$lib/store/';
	import { tweened } from 'svelte/motion';
	import { backInOut } from 'svelte/easing';
	// import { highlightMoves } from './highlightMoves';
	import { updateBox } from './cellStyles';

	export let cell: Cell = dummyCell;
	export let innerCubeSize: number;

	const scale = tweened(0, {
		duration: 400,
		easing: backInOut
	});

	$: {
		if (cell.activated || cell.selected || cell.highlighted) {
			scale.set(4);
		} else {
			scale.set(0);
		}
	}

	let defaultEdges = updateBox(cell).mesh;
	let defaultInnerColor = updateBox(cell).inner;

	const updateStyle = (cell: Cell, isAvailableMove?: boolean) => {
		const { inner, mesh } = updateBox(cell, isAvailableMove);
		defaultEdges = mesh;
		defaultInnerColor = inner;
	};

	const handleOnAvailableMove = () => {
		if (cell.highlighted) {
			updateStyle(cell, true);
			scale.set(6);
		}
	};

	const handleOutAvailableMove = () => {
		if (cell.highlighted) {
			updateStyle(cell);
			scale.set(4);
		}
	};

	$: {
		updateStyle(cell);
	}
</script>

<T.Mesh
	on:pointerover={handleOnAvailableMove}
	on:pointerleave={handleOutAvailableMove}
	scale={$scale}
>
	<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
	<T.MeshBasicMaterial args={[defaultInnerColor]} />
</T.Mesh>

<T.MeshBasicMaterial args={[defaultEdges]} />
