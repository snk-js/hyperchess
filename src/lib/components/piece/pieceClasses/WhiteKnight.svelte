<script lang="ts">
	import { T } from '@threlte/core';
	import type { ThrelteGltf } from '@threlte/extras';

	export let gltf: ThrelteGltf<{
		nodes: Record<string, any>;
		materials: Record<string, any>;
	}>;

	$: {
		gltf = gltf;
	}
</script>

<T.Mesh
	scale={1.5}
	geometry={gltf.nodes.Object_4.geometry}
	material={gltf.materials['Material.003']}
/>
