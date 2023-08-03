<script lang="ts">
	import { T } from '@threlte/core';
	import Piece from '../piece/Piece.svelte';
	export let position: [number, number, number] = [0, 0, 0];
	export let pieceName: string = '';
</script>

<T.Mesh position={pieceName ? [0.08, -0.37, 0] : position} scale={[0.1, 0.1, 0.1]}>
	{#if pieceName}
		<Piece name={pieceName} />
	{:else}
		<T.BoxGeometry args={[0, 0, 0]} />
		<T.MeshBasicMaterial color="#ff0000" />
	{/if}
</T.Mesh>
