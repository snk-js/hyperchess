<script lang="ts">
	import { T } from '@threlte/core';
	import Piece from '../piece/Piece.svelte';
	export let position: [number, number, number] = [0, 0, 0];
	export let innerCubeSize = 1;
	export let pieceName: string = '';
	let time = 0; // Initialize time.
	// Increment the time variable in the animation frame for the heartbeat effect.
	function animate() {
		if (pieceName) return;
		time += 0.01;
		requestAnimationFrame(animate);
	}
	animate();
</script>

<T.Mesh
	{position}
	scale={pieceName
		? [0.1, 0.1, 0.1]
		: [
				Math.sin(time) * innerCubeSize,
				Math.sin(time) * innerCubeSize,
				Math.sin(time) * innerCubeSize
		  ]}
>
	<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
	<T.MeshBasicMaterial color="#ff0000" />

	<!-- Piece placement -->
	{#if pieceName}
		<Piece name={pieceName} />
	{/if}
</T.Mesh>
