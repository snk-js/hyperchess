<script lang="ts">
	import type { PieceCoords } from '$lib/store/';
	import { T } from '@threlte/core';
	import Piece from '../piece/Piece.svelte';
	import { board } from '$lib/store/';
	import { get } from 'svelte/store';

	export let position: [number, number, number] = [0, 0, 0];
	export let idx: PieceCoords = [0, 0, 0];
	let piece: string;
	let coords: PieceCoords = [0, 0, 0];

	$: {
		const cellStore = board[idx[0]][idx[1]][idx[2]];
		const cell = get(cellStore);
		coords = cell.coords;
		piece = cell.piece || '';
	}
</script>

<T.Mesh position={piece ? [0.08, -0.37, 0] : position} scale={[0.1, 0.1, 0.1]}>
	{#if piece}
		<Piece name={piece} {coords} {idx} />
	{:else}
		<T.BoxGeometry args={[0, 0, 0]} />
		<T.MeshBasicMaterial color="#ff0000" />
	{/if}
</T.Mesh>
