<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store';

	/** @param {KeyboardEvent} event */
	function handleKeydown(event: KeyboardEvent) {
		console.log(event.key);
		switch (event.key) {
			case 'w':
				decreaseOffsetY();
				break;
			case 's':
				increaseOffsetY();
				break;
		}
	}
</script>

<!-- <div class="n">hello</div> -->
<Canvas>
	<Scene />
</Canvas>
<svelte:window on:keydown={handleKeydown} />

<style>
	.n {
		position: absolute;
		top: 0;
		left: 0;
		width: 200px;
		height: 100px;
		background: pink;
	}
</style>
