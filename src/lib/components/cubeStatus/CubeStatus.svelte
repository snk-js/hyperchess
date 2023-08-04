<script lang="ts">
	import { T } from '@threlte/core';
	import { BoxGeometry } from 'three';
	export let activated: boolean;
	export let innerCubeSize: number;
</script>

{#if activated}
	<T.Mesh scale={4}>
		<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
		<T.MeshBasicMaterial color="#ff0000" opacity={0.3} transparent={true} />
	</T.Mesh>
	<T.MeshBasicMaterial
		args={[
			{
				color: 0xff0000,
				transparent: true
			}
		]}
	/>
{:else}
	<T.MeshBasicMaterial
		args={[
			{
				color: 0xffffff,
				opacity: 0.03,
				transparent: true
			}
		]}
	/>
{/if}
