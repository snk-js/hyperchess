<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry } from 'three';
	import InnerCube from '../innerCube/innerCube.svelte';
	const cubesPerDimension = 8;
	const totalSize = 3;
	const cubeSize = totalSize / cubesPerDimension;
	const centralizedSize = 1 + (1 - cubeSize) / 2;
	const innerCubeSize = cubeSize / 4;
	const multiplier = 25;
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
				<T.Mesh position={[i * cubeSize, j * cubeSize, k * cubeSize]}>
					<T.LineSegments>
						<T.EdgesGeometry args={[new BoxGeometry(cubeSize, cubeSize, cubeSize)]} />
						{#if i === 3 && j === 3 && k === 3}
							<T.Mesh scale={4}>
								<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
								<T.MeshBasicMaterial color="#ff0000" opacity={0.3} transparent={true} />
							</T.Mesh>
						{/if}
						<T.MeshBasicMaterial
							args={[
								{
									color: 0xffffff,
									opacity: 0.03,
									transparent: true
								}
							]}
						/>
					</T.LineSegments>
					<InnerCube
						position={[
							(i * cubeSize) / multiplier,
							(j * cubeSize) / multiplier,
							(k * cubeSize) / multiplier
						]}
						pieceName={i === 3 && j === 3 && k === 3 ? 'Queen' : ''}
					/>
				</T.Mesh>
			{/each}
		{/each}
	{/each}
</T.Mesh>
