<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry } from 'three';
	import { board } from '$lib/store';
	import { offsetY } from '$lib/store/camera';
	import type { Board } from '$lib/store';
	import GridDivider from '../gridDivider/GridDivider.svelte';
	import { tweened } from 'svelte/motion';
	import { backInOut } from 'svelte/easing';
	import InnerMash from '../innerCube/innerMash.svelte';

	const cubesPerDimension = 8;
	const totalSize = 3;
	const cubeSize = totalSize / cubesPerDimension;
	const centralizedSize = 1 + (1 - cubeSize) / 2;
	const innerCubeSize = cubeSize / 4;
	const multiplier = 25;

	const offsetYState = tweened(0, {
		duration: 200,
		easing: backInOut
	});

	$: {
		offsetYState.set($offsetY);
	}

	let boardState: Board;

	$: board.subscribe((value: Board) => {
		boardState = value;
	});
</script>

<T.Mesh
	position.y={(cubeSize - cubeSize * 0.2) * $offsetYState}
	position.z={-centralizedSize}
	position.x={-centralizedSize}
>
	<!-- Create a 3D grid of smaller cubes. -->
	{#each Array(cubesPerDimension) as _, i}
		{#each Array(cubesPerDimension) as _, j}
			{#each Array(cubesPerDimension) as _, k}
				<InnerMash {i} {j} {k} {cubeSize} {innerCubeSize} cell={boardState[i][j][k]} />
			{/each}
		{/each}
	{/each}
	<GridDivider position={[1.31, 1.31, 1.31]} />
	<T.LineSegments position={[1.31, 1.31, 1.31]}>
		<T.EdgesGeometry args={[new BoxGeometry(3, 3, 3)]} />
		<T.LineBasicMaterial args={[{ color: 0xffffff, opacity: 0.3, transparent: true }]} />
	</T.LineSegments>
</T.Mesh>
