<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import Cube from './cube/Cube.svelte';
	import userStore from '$lib/store/user';
	import { tweened } from 'svelte/motion';
	import { cubicOut, sineIn } from 'svelte/easing';

	const xPositionMultiplier = tweened(-10, {
		duration: 2000,
		easing: sineIn
	});
	const yPositionMultiplier = tweened(-19, {
		duration: 2000,
		easing: sineIn
	});

	const zPositionMultiplier = tweened(-5, {
		duration: 2000,
		easing: sineIn
	});

	const fovMultiplier = tweened(5, {
		duration: 4000,
		easing: sineIn
	});

	export let autoRotate = true;
	export let enableZoom = true;

	let playing = false;
	userStore.subscribe((user) => {
		console.log('isplaying', user.playing);
		playing = user.playing;
	});

	$: {
		if (playing) {
			xPositionMultiplier.set(20);
			yPositionMultiplier.set(10);
			zPositionMultiplier.set(10);
			fovMultiplier.set(10);
			// fov = 8;
			// zpos = 15;
		}
	}
</script>

<T.PerspectiveCamera
	makeDefault
	position.x={$xPositionMultiplier}
	position.y={$yPositionMultiplier}
	position.z={$zPositionMultiplier}
	fov={$fovMultiplier}
>
	<OrbitControls
		{autoRotate}
		{enableZoom}
		maxZoom={0.2}
		maxDistance={50}
		autoRotateSpeed={0.5}
		target.y={1.5}
	/>
</T.PerspectiveCamera>

<T.DirectionalLight intensity={2} position.x={5} position.y={1} />
<T.AmbientLight intensity={1} />

<Cube />
