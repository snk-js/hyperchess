<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry } from 'three';

	const cubesPerDimension = 8;
	const totalSize = 3;
	const cubeSize = totalSize / cubesPerDimension;
	const centralizedSize = 1 + (1 - cubeSize) / 2;
	const innerCubeSize = cubeSize / 4;
	const multiplier = 25;
	let time = 0; // Initialize time.
	// Increment the time variable in the animation frame for the heartbeat effect.
	function animate() {
		time += 0.05;
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
					<!-- Add a smaller cube inside the box. -->
					<T.Mesh
						position={[
							(i * cubeSize) / multiplier,
							(j * cubeSize) / multiplier,
							(k * cubeSize) / multiplier
						]}
						scale={[
							Math.sin(time) * innerCubeSize,
							Math.sin(time) * innerCubeSize,
							Math.sin(time) * innerCubeSize
						]}
					>
						<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
						<T.MeshBasicMaterial color="#ff0000" />
						<!-- Make the inner cube red for visibility. -->
					</T.Mesh>
				</T.Mesh>
			{/each}
		{/each}
	{/each}
</T.Mesh>
