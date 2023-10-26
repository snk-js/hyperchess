<script lang="ts">
	import App from '$lib/components/App.svelte';
	import userStore from '$lib/store/user';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: {
		data.user &&
			userStore.set({
				id: data.user.id,
				name: data.user.name,
				username: data.user.username,
				email: data.user.email || ''
			});
	}

	onMount(() => {
		return () => {
			userStore.set({});
		};
	});
</script>

<App />
