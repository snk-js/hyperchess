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

<T.Mesh geometry={gltf.nodes.Object_12.geometry} material={gltf.materials['Material.003']} />
<T.Mesh geometry={gltf.nodes.Object_13.geometry} material={gltf.materials.material_0} />
