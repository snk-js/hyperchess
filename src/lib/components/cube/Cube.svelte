<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry } from 'three';
	import InnerCube from '../innerCube/innerCube.svelte';
	import { board } from '$lib/store';
	import type { Board, PieceCoords } from '$lib/store';
	import CubeStatus from '../cubeStatus/CubeStatus.svelte';

	const cubesPerDimension = 8;
	const totalSize = 3;
	const cubeSize = totalSize / cubesPerDimension;
	const centralizedSize = 1 + (1 - cubeSize) / 2;
	const innerCubeSize = cubeSize / 4;
	const multiplier = 25;

	let boardState: Board;
	let highlighted: PieceCoords[] = [];

	board.subscribe((value) => {
		boardState = value;
	});
</script>

<T.Mesh
	position.y={cubeSize - cubeSize * 0.2}
	position.z={-centralizedSize}
	position.x={-centralizedSize}
>
	<!-- Create a 3D grid of smaller cubes. -->
	{#each Array(cubesPerDimension) as _, i}
		{#each Array(cubesPerDimension) as _, j}
			{#each Array(cubesPerDimension) as _, k}
				<T.Mesh key={i + ',' + j + ',' + k} position={[i * cubeSize, j * cubeSize, k * cubeSize]}>
					<T.LineSegments>
						<T.EdgesGeometry args={[new BoxGeometry(cubeSize, cubeSize, cubeSize)]} />
						<CubeStatus activated={boardState[i][j][k].activated} {innerCubeSize} />
					</T.LineSegments>
					<InnerCube
						position={[
							(i * cubeSize) / multiplier,
							(j * cubeSize) / multiplier,
							(k * cubeSize) / multiplier
						]}
						idx={[i, j, k]}
					/>
				</T.Mesh>
			{/each}
		{/each}
	{/each}
</T.Mesh>
