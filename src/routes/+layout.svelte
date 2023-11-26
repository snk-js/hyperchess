<script lang="ts">
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Canvas } from '@threlte/core';
	import Scene from '$lib/components/Scene.svelte';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import userStore from '$lib/store/user';
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	let playing = false;

	userStore.subscribe((user) => {
		playing = user.playing;
	});
</script>

<div class="absolute w-full h-full z-0 bg-blue-gray-600">
	{#if !playing}
		<div class="absolute w-full h-full z-0" />
	{/if}

	<Canvas>
		<Scene />
	</Canvas>
</div>

<AppShell class="z-50">
	<Header slot="header" />

	<div class="">
		<slot />
	</div>
	<Footer slot="footer" />
</AppShell>

<style>
	:global(body) {
		margin: 0;
		background: radial-gradient(circle, rgba(13, 19, 32, 1) 0%, rgb(16, 24, 43) 100%);
		max-width: calc(100vw - 1rem);
	}
</style>
