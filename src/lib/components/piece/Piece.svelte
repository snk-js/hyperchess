<script lang="ts">
	import { Group, BoxGeometry } from 'three';
	import { T, forwardEventHandlers } from '@threlte/core';
	import { useGltf } from '@threlte/extras';
	import { interactivity } from '@threlte/extras';
	import type { Cell, PieceCoords } from '$lib/store/';
	import { board, clear, dummyCell } from '$lib/store/';
	import { updateCellStatus } from '$lib/store/cellStates';
	import { get } from 'svelte/store';
	import Pieces from './Pieces.svelte';

	export const ref = new Group();
	export let idx: PieceCoords = [0, 0, 0];
	let cell: Cell = dummyCell;

	$: {
		const newcell = get(board)[idx[0]][idx[1]][idx[2]];
		cell = newcell;
	}

	interactivity();
	const gltf = useGltf('/src/lib/components/piece/scene-transformed.glb', {
		useDraco: true,
		useMeshopt: true
	});

	const component = forwardEventHandlers();

	const handlePointerOver = () => {
		updateCellStatus([cell.coords], 'activated', true);
	};

	const handleMouseLeave = () => {
		updateCellStatus([cell.coords], 'activated', false);
	};

	const handleClick = () => {
		updateCellStatus([cell.coords], 'selected', true);
	};
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<T.Group position={[-0.75, 0, 0]}>
			<T.Group position={[0, 0, 0]}>
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
			</T.Group>
		</T.Group>
	{:catch error}
		<slot name="error" {error} />
	{/await}
	<slot {ref} />
</T>
