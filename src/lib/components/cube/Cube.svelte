<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry } from 'three';
	import { offsetY } from '$lib/store/camera';
	import GridDivider from '../gridDivider/GridDivider.svelte';
	import { tweened } from 'svelte/motion';
	import { backInOut } from 'svelte/easing';
	import InnerMash from '../innerCube/innerMash.svelte';
	import { board, boardUpdates } from '$lib/store';
	import { updatedCells } from '$lib/store/cellStates';
	import { get } from 'svelte/store';

	const cubesPerDimension = 8;
	const totalSize = 3;
	const cubeSize = totalSize / cubesPerDimension;
	const centralizedSize = 1 + (1 - cubeSize) / 2;
	const innerCubeSize = cubeSize / 4;

	const offsetYState = tweened(0, {
		duration: 200,
		easing: backInOut
	});

	$: {
		offsetYState.set($offsetY);
	}

	boardUpdates.subscribe(async (updatedMoves) => {
		get(updatedCells).forEach((move) => {
			const [i, j, k] = move.coord;
			board[i][j][k].update((cell) => {
				return {
					...cell,
					highlighted: {
						activated: false,
						selected: false
					}
				};
			});
		});
	});
</script>

<T.Mesh
	position.y={(cubeSize - cubeSize * 0.2) * $offsetYState}
	position.z={-centralizedSize}
	position.x={-centralizedSize}
>
	{#each Array(cubesPerDimension) as _, i}
		{#each Array(cubesPerDimension) as _, j}
			{#each Array(cubesPerDimension) as _, k}
				<InnerMash {i} {j} {k} {cubeSize} {innerCubeSize} />
			{/each}
		{/each}
	{/each}

	<GridDivider position={[1.31, 1.31, 1.31]} />
	<T.LineSegments position={[1.31, 1.31, 1.31]}>
		<T.EdgesGeometry args={[new BoxGeometry(3, 3, 3)]} />
		<T.LineBasicMaterial args={[{ color: 0xffffff, opacity: 0.3, transparent: true }]} />
	</T.LineSegments>
</T.Mesh>
