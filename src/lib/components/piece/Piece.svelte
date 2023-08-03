<script lang="ts">
	import { Group } from 'three';
	import { T, forwardEventHandlers } from '@threlte/core';
	import { useGltf } from '@threlte/extras';
	import { interactivity } from '@threlte/extras';
	import type { PieceCoords } from '$lib/store';
	import { board } from '$lib/store';
	import { get } from 'svelte/store';

	export const ref = new Group();
	export let idx: PieceCoords = [0, 0, 0];
	let coords;

	$: {
		const cell = get(board)[idx[0]][idx[1]][idx[2]];
		coords = cell.coords;
	}
	const updateCell = (activated: boolean) => {
		board.update((value) => {
			const [x, y, z] = coords;
			if (value[x][y][z]) {
				value[x][y][z].activated = activated;
			}
			return value;
		});
	};

	const handlePointerOver = () => {
		updateCell(true);
	};

	const handleMouseLeave = () => {
		updateCell(false);
	};

	interactivity();
	const gltf = useGltf('/src/lib/components/piece/scene-transformed.glb', { useDraco: true });
	const component = forwardEventHandlers();
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<T.Group position={[-0.75, 0, 0]} rotation={[-Math.PI / 2, 0, -Math.PI]}>
			<T.Group position={[0, 0, 2]}>
				<T.Mesh
					on:pointerover={handlePointerOver}
					on:pointerout={handleMouseLeave}
					geometry={gltf.nodes.WhiteQueen_0.geometry}
					material={gltf.materials.Root}
					position={[0, 0, 0]}
					scale={0.1}
				/>
			</T.Group>
		</T.Group>
	{:catch error}
		<slot name="error" {error} />
	{/await}
	<slot {ref} />
</T>
