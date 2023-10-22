<script lang="ts">
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import { Canvas } from '@threlte/core';
	import Scene from '$lib/components/Scene.svelte';
</script>

<div class="absolute w-full h-full z-0 bg-blue-gray-600">
	<div class="absolute w-full h-full z-0" />
	<Canvas>
		<Scene />
	</Canvas>
</div>

<AppShell class="z-50">
	<Header slot="header" />
	<div class="z-50 h-full glass">
		<slot />
	</div>
	<Footer slot="footer" />
</AppShell>

<style>
	:global(body) {
		margin: 0;
		background: linear-gradient(180deg, rgba(13, 19, 32, 1) 0%, rgba(8, 12, 21, 1) 100%);
		max-width: calc(100vw - 1rem);
	}
</style>
