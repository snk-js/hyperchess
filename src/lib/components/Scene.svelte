<script lang="ts">
	import { T } from '@threlte/core';
	import { ContactShadows, OrbitControls } from '@threlte/extras';
	import Cube from './cube/Cube.svelte';
</script>

<T.PerspectiveCamera makeDefault position={[-10, 10, 10]} fov={15}>
	<OrbitControls autoRotate enableZoom={true} enableDamping autoRotateSpeed={0.5} target.y={1.5} />
</T.PerspectiveCamera>

<T.DirectionalLight intensity={0.8} position.x={5} position.y={10} />
<T.AmbientLight intensity={0.2} />

<!-- <Grid
	position.y={-0.001}
	cellColor="#ffffff"
	sectionColor="#ffffff"
	sectionThickness={3}
	fadeDistance={25}
	cellSize={1}
	/> -->

<Cube />

<ContactShadows scale={10} blur={2} far={2.5} opacity={0.5} />
