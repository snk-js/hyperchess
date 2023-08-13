<script lang="ts">
	import type { ThrelteGltf } from '@threlte/extras';
	import WhiteQueen from './pieceClasses/WhiteQueen.svelte';
	import WhiteKing from './pieceClasses/WhiteKing.svelte';
	import WhiteKnight from './pieceClasses/WhiteKnight.svelte';
	import WhitePawn from './pieceClasses/WhitePawn.svelte';
	import WhiteRook from './pieceClasses/WhiteRook.svelte';
	import WhiteBishop from './pieceClasses/WhiteBishop.svelte';
	import BlackQueen from './pieceClasses/BlackQueen.svelte';
	import BlackKing from './pieceClasses/BlackKing.svelte';
	import BlackKnight from './pieceClasses/BlackKnight.svelte';
	import BlackPawn from './pieceClasses/BlackPawn.svelte';
	import BlackRook from './pieceClasses/BlackRook.svelte';
	import BlackBishop from './pieceClasses/BlackBishop.svelte';
	import type { Piece, Side } from '$lib/store/index';

	export let gltf: ThrelteGltf<{
		nodes: Record<string, any>;
		materials: Record<string, any>;
	}>;

	export let piece: Piece = '';
	export let side: Side = '';

	$: {
		gltf = gltf;
		piece = piece;
		side = side;
	}

	const pieces = {
		white: {
			queen: WhiteQueen,
			king: WhiteKing,
			knight: WhiteKnight,
			pawn: WhitePawn,
			rook: WhiteRook,
			bishop: WhiteBishop
		},

		black: {
			queen: BlackQueen,
			king: BlackKing,
			knight: BlackKnight,
			pawn: BlackPawn,
			rook: BlackRook,
			bishop: BlackBishop
		}
	};

	const Piece = pieces[side][piece];
</script>

{#if piece}
	<Piece {gltf} />
{/if}
