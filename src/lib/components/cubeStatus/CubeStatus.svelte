<!-- CubeStatus.svelte -->
<script lang="ts">
	import { T } from '@threlte/core';
	import type { MeshBasicMaterialParameters } from 'three';
	import { dummyCell } from '$lib/store';

	export let cell = dummyCell;
	export let innerCubeSize: number;

	let materialArgs: MeshBasicMaterialParameters;
	$: {
		materialArgs = cell.activated
			? { color: 0xff0000, transparent: true }
			: { color: 0xffffff, opacity: 0.03, transparent: true };
	}
</script>

{#if cell.activated}
	<T.Mesh scale={4}>
		<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
		<T.MeshBasicMaterial color="#ff0000" opacity={0.3} transparent={true} />
	</T.Mesh>
{/if}
<T.MeshBasicMaterial args={[materialArgs]} />
