<script lang="ts">
	import { T } from '@threlte/core';
	import { Align } from '@threlte/extras';
	import type { Cell, PieceCoords } from '$lib/store/';
	import { board, dummyCell } from '$lib/store/';
	import { updateCellStatus } from '$lib/store/cellStates';
	import { gameStore, isMyTurn } from '$lib/store/game';
	import { pushNotification } from '$lib/store/toast';
	import { get } from 'svelte/store';
	import { getContext } from 'svelte';
	import Pieces from './Pieces.svelte';
	import { selectedPiece, addToMovePiece } from '../cubeStatus/CubeStatus.svelte';
	import type { ThrelteGltf } from '@threlte/extras';

	export let idx: PieceCoords = [0, 0, 0];

	let cell: Cell = dummyCell;

	$: {
		const cellStore = board[idx[0]][idx[1]][idx[2]];
		cell = get(cellStore);
	}

	const gltf = getContext('gltf') as Promise<
		ThrelteGltf<{ nodes: Record<string, any>; materials: Record<string, any> }>
	>;

	const handlePointerOver = (e: Event) => {
		e.stopPropagation();
		updateCellStatus([cell.coords], 'activated', true);
	};

	const handleMouseLeave = (e: Event) => {
		e.stopPropagation();
		updateCellStatus([cell.coords], 'activated', false);
	};

	const handleClick = (e: Event) => {
		e.stopPropagation();
		const game = get(gameStore);

		if (game) {
			// enemy piece: if it's a highlighted capture target, take it
			if (cell.side !== game.myColor) {
				const fresh = get(board[cell.coords[0]][cell.coords[1]][cell.coords[2]]);
				if (fresh.highlighted.activated && get(selectedPiece).length) {
					addToMovePiece(cell.coords);
				}
				return;
			}
			if (!isMyTurn()) {
				pushNotification({ message: 'Not your turn', type: 'error' });
				return;
			}
		}

		updateCellStatus([cell.coords], 'selected', true);
		selectedPiece.set(cell.coords);
	};
</script>

{#await gltf then gltf}
	<Align auto>
		<T.Group
			rotation={(cell.side === 'black' && [0, 0, 3.15]) || [0, 0, 0]}
			position={cell.side === 'black' ? [0, 5.5, 0] : [0, 1.8, 0]}
			scale={0.5}
			on:pointerover={handlePointerOver}
			on:pointerout={handleMouseLeave}
			on:click={handleClick}
		>
			{#if cell.piece}
				<Pieces {gltf} side={cell.side} piece={cell.piece} />
			{/if}
		</T.Group>
	</Align>
{/await}
