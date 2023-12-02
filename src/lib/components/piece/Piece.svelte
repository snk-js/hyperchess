<script lang="ts">
	import { Group } from 'three';
	import { T, forwardEventHandlers } from '@threlte/core';
	import { Align, useGltf } from '@threlte/extras';
	import { interactivity } from '@threlte/extras';
	import type { Cell, PieceCoords } from '$lib/store/';
	import { board, dummyCell } from '$lib/store/';
	import { updateCellStatus } from '$lib/store/cellStates';
	import { get } from 'svelte/store';
	import Pieces from './Pieces.svelte';
	import { selectedPiece } from '../cubeStatus/CubeStatus.svelte';

	export const ref = new Group();
	export let idx: PieceCoords = [0, 0, 0];

	let cell: Cell = dummyCell;

	$: {
		const cellStore = board[idx[0]][idx[1]][idx[2]];
		cell = get(cellStore);
	}

	interactivity();
	const gltf = useGltf('scene-transformed.glb', {
		useDraco: true,
		useMeshopt: true
	});

	const component = forwardEventHandlers();

	const handlePointerOver = (e: Event) => {
		e.stopPropagation();
		updateCellStatus([cell.coords], 'activated', true);
	};

	const handleMouseLeave = (e: Event) => {
		e.stopPropagation();
		updateCellStatus([cell.coords], 'activated', false);
	};

	const handleClick = (e: Event) => {
		e.stopPropagation();
		updateCellStatus([cell.coords], 'selected', true);
		selectedPiece.set(cell.coords);
	};
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<Align autoCenter={true}>
			<T.Group
				rotation={(cell.side === 'black' && [0, 0, 3.15]) || [0, 0, 0]}
				position={cell.side === 'black' ? [0, 5.5, 0] : [0, 1.8, 0]}
				scale={0.5}
				on:pointerover={handlePointerOver}
				on:pointerout={handleMouseLeave}
				on:click={handleClick}
			>
				{#if cell.piece}
					<Pieces {gltf} side={cell.side} piece={cell.piece} />
				{/if}
			</T.Group>
		</Align>
	{:catch error}
		<slot name="error" {error} />
	{/await}
	<slot {ref} />
</T>
