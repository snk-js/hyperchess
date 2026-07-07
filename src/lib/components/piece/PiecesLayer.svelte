<script lang="ts">
	import { T } from '@threlte/core';
	import Piece from './Piece.svelte';
	import { occupiedCells } from '$lib/store/';

	// Must match Cube.svelte: totalSize / cubesPerDimension = 3 / 8
	const cubeSize = 3 / 8;
</script>

{#each $occupiedCells as c (c.coords.join(','))}
	<T.Group
		position={[c.coords[0] * cubeSize, c.coords[1] * cubeSize, c.coords[2] * cubeSize]}
		scale={[0.1, 0.1, 0.1]}
	>
		<Piece idx={c.coords} />
	</T.Group>
{/each}
