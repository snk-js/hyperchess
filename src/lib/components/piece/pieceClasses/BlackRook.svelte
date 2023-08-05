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

<T.Mesh geometry={gltf.nodes.Object_24.geometry} material={gltf.materials['Material.002']} />
<T.Mesh geometry={gltf.nodes.Object_25.geometry} material={gltf.materials['Material.002']} />
