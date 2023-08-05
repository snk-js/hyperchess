<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry, MeshBasicMaterial, SphereGeometry } from 'three';
	import InnerCube from '../innerCube/innerCube.svelte';
	import { board } from '$lib/store';
	import type { Board } from '$lib/store';
	import CubeStatus from '../cubeStatus/CubeStatus.svelte';
	import GridDivider from '../gridDivider/GridDivider.svelte';

	const cubesPerDimension = 8;
	const totalSize = 3;
	const cubeSize = totalSize / cubesPerDimension;
	const centralizedSize = 1 + (1 - cubeSize) / 2;
	const innerCubeSize = cubeSize / 4;
	const multiplier = 25;

	let boardState: Board;

	$: board.subscribe((value: Board) => {
		boardState = value;
	});

	const sphereGeometry = new SphereGeometry(innerCubeSize, 32, 32);
	const material = new MeshBasicMaterial({ color: '#FF0000', transparent: true, opacity: 0.5 });
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
					<!-- Create a red shining floating ball at the specified coordinates -->
					{#if i === 3 && j === 2 && k === 3}
						<T.Mesh
							geometry={sphereGeometry}
							{material}
							position={[i * innerCubeSize - 0.3, j * innerCubeSize - 0.3, k * innerCubeSize - 0.3]}
						/>
					{/if}

					<T.LineSegments>
						<T.EdgesGeometry args={[new BoxGeometry(cubeSize, cubeSize, cubeSize)]} />
						<CubeStatus cell={boardState[i][j][k]} {innerCubeSize} />
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
	<GridDivider position={[1.31, 1.31, 1.31]} />
	<T.LineSegments position={[1.31, 1.31, 1.31]}>
		<T.EdgesGeometry args={[new BoxGeometry(3, 3, 3)]} />
		<T.LineBasicMaterial args={[{ color: 0xffffff, opacity: 0.3, transparent: true }]} />
	</T.LineSegments>
</T.Mesh>
