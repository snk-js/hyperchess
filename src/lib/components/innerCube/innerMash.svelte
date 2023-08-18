<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry } from 'three';
	import CubeStatus from '../cubeStatus/CubeStatus.svelte';
	import InnerCube from '../innerCube/innerCube.svelte';
	import { interactivity } from '@threlte/extras';

	interactivity();

	export let i: number;
	export let j: number;
	export let k: number;
	export let cubeSize: number;
	export let innerCubeSize: number;
	export let multiplier: number = 25;
</script>

<T.Mesh key={i + ',' + j + ',' + k} position={[i * cubeSize, j * cubeSize, k * cubeSize]}>
	<T.LineSegments>
		<T.EdgesGeometry args={[new BoxGeometry(cubeSize, cubeSize, cubeSize)]} />
		<CubeStatus {innerCubeSize} pos={[i, j, k]} />
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
