<script lang="ts">
	import { Group } from 'three';
	import { T, forwardEventHandlers } from '@threlte/core';
	import { useGltf } from '@threlte/extras';
	import { interactivity } from '@threlte/extras';
	import type { Cell, PieceCoords } from '$lib/store';
	import { board } from '$lib/store';
	import { get } from 'svelte/store';
	import Pieces from './Pieces.svelte';
	export const ref = new Group();
	export let idx: PieceCoords = [0, 0, 0];
	let cell: Cell;

	$: {
		const newcell = get(board)[idx[0]][idx[1]][idx[2]];
		cell = newcell;
	}
	const updateCell = (activated: boolean) => {
		board.update((value) => {
			const [x, y, z] = cell.coords;
			if (value[x][y][z]) {
				value[x][y][z].activated = activated;
			}
			return value;
		});
	};

	const selectCell = (status?: boolean) => {
		board.update((value) => {
			const [x, y, z] = cell.coords;
			if (value[x][y][z]) {
				value[x][y][z].selected = status || !value[x][y][z].selected;
			}
			return value;
		});
	};

	const handlePointerOver = () => {
		updateCell(true);
	};

	const handleMouseLeave = (status: string) => {
		if (status === 'deselect') {
			if (!cell.selected) return;
			selectCell(false);
		}
		updateCell(false);
	};

	const handleClick = () => {
		selectCell();
	};

	interactivity();
	const gltf = useGltf('/src/lib/components/piece/scene-transformed.glb', {
		useDraco: true,
		useMeshopt: true
	});

	const component = forwardEventHandlers();
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<T.Group position={[-0.75, 0, 0]}>
			<T.Group position={[0, 0, 0]}>
				<T.Group
					position={[0, 1.8, 0]}
					scale={0.5}
					on:pointerover={handlePointerOver}
					on:pointerout={handleMouseLeave}
					on:pointermissed={() => handleMouseLeave('deselect')}
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
