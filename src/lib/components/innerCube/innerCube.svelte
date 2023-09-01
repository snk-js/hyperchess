<script lang="ts">
	import type { PieceCoords } from '$lib/store/';
	import { T } from '@threlte/core';
	import Piece from '../piece/Piece.svelte';
	import { board, boardUpdates } from '$lib/store/';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	export let idx: PieceCoords = [0, 0, 0];
	let piece: string;
	let coords: PieceCoords = [0, 0, 0];

	$: {
		const cellStore = board[idx[0]][idx[1]][idx[2]];
		const cell = get(cellStore);
		coords = cell.coords;
		piece = cell.piece || '';
	}

	boardUpdates.subscribe(async (updatedMoves) => {
		idx = [idx[0], idx[1], idx[2]];
	});
</script>

<T.Mesh scale={[0.1, 0.1, 0.1]}>
	<Piece name={piece} {coords} {idx} />
</T.Mesh>
