<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import Cube from './cube/Cube.svelte';
</script>

<T.PerspectiveCamera
	camera={{ background: 'bgTexture' }}
	makeDefault
	position={[-10, 10, 10]}
	fov={15}
>
	<OrbitControls autoRotate enableZoom={true} enableDamping autoRotateSpeed={0.5} target.y={1.5} />
</T.PerspectiveCamera>

<T.DirectionalLight intensity={2} position.x={5} position.y={1} />
<T.AmbientLight intensity={3} />
<!-- <Grid
	position.y={-0.001}
	cellColor="#ffffff"
	sectionColor="#ffffff"
	sectionThickness={3}
	fadeDistance={25}
	cellSize={1}
	/> -->

<Cube />
