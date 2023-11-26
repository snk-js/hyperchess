<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import Cube from './cube/Cube.svelte';

	export let autoRotate = true;
	export let enableZoom = true;
</script>

<T.PerspectiveCamera makeDefault position={[-10, -19, -5]} fov={5}>
	<OrbitControls
		{autoRotate}
		{enableZoom}
		maxZoom={0.2}
		maxDistance={40}
		autoRotateSpeed={0.5}
		target.y={1.5}
	/>
</T.PerspectiveCamera>

<T.DirectionalLight intensity={2} position.x={5} position.y={1} />
<T.AmbientLight intensity={1} />
<Cube />
