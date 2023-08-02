<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry } from 'three';
	import Piece from '../piece/Piece.svelte';
	import InnerCube from '../innerCube/innerCube.svelte';
	const cubesPerDimension = 8;
	const totalSize = 3;
	const cubeSize = totalSize / cubesPerDimension;
	const centralizedSize = 1 + (1 - cubeSize) / 2;
	const innerCubeSize = cubeSize / 4;
	const multiplier = 25;
	let time = 0; // Initialize time.
	// Increment the time variable in the animation frame for the heartbeat effect.
	function animate() {
		time += 0.01;
		requestAnimationFrame(animate);
	}
	animate();
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
						<T.MeshBasicMaterial
							args={[
								{
									color: 0xffffff,
									opacity: 0.1,
									transparent: true
								}
							]}
						/>
					</T.LineSegments>
					<InnerCube
						{time}
						position={[
							(i * cubeSize) / multiplier,
							(j * cubeSize) / multiplier,
							(k * cubeSize) / multiplier
						]}
						{innerCubeSize}
						pieceName={i === 0 && j === 0 && k === 0 ? 'Queen' : ''}
					/>
				</T.Mesh>
			{/each}
		{/each}
	{/each}
</T.Mesh>
