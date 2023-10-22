<script>
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import { Canvas } from '@threlte/core';
	import Scene from '$lib/components/Scene.svelte';
</script>

<div class="absolute w-full h-full bg-blue-gray-600">
	<div class="absolute w-full h-full" />
	<Canvas>
		<Scene />
	</Canvas>
</div>

<AppShell>
	<Header slot="header" />

	<!-- Router Slot -->
	<slot />
	<!-- ---- / ---- -->

	<Footer slot="footer" />
</AppShell>

<style>
	:global(body) {
		margin: 0;
		background: linear-gradient(180deg, rgba(13, 19, 32, 1) 0%, rgba(8, 12, 21, 1) 100%);
	}
</style>
