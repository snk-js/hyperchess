<script lang="ts">
	import '../app.postcss';
	import { AppShell, Toast } from '@skeletonlabs/skeleton';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Canvas } from '@threlte/core';
	import Scene from '$lib/components/Scene.svelte';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import userStore from '$lib/store/user';
	import { SpinLine } from 'svelte-loading-spinners';
	// skeleton initializations
	import { initializeStores } from '@skeletonlabs/skeleton';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { isLoading } from '$lib/store/loading';
	import Spinner from '$lib/components/loading/Spinner.svelte';
	import BorderWrapper from '$lib/components/borderWrapper/BorderWrapper.svelte';
	initializeStores();
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	let playing = false;
	let loading = false;

	isLoading.subscribe((value) => {
		console.log(value);
		loading = value;
	});

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

{#if loading}
	<div class="absolute left-0 w-full h-full z-50">
		<div class="flex glass justify-center w-full h-full items-center">
			<Spinner />
		</div>
	</div>
{/if}

<Toast position="t" />

<AppShell class="z-50">
	<Header slot="header" />

	{#if playing}
		<div class="p-5">
			<BorderWrapper title="waiting player" center>
				<SpinLine size="70" color="#ff0fb3" unit="px" duration="10s" />
			</BorderWrapper>
		</div>
	{/if}

	<div>
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
