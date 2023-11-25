<script lang="ts">
	import App from '$lib/components/App.svelte';
	import userStore, { userPlaceholder, type User } from '$lib/store/user';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { get } from 'svelte/store';
	import { getDigitsFromString } from '$lib/utils';
	import { connectWs, registerClient } from '$lib/utils/ws';

	export let data: PageData;
	let disconnected = false;

	const disconect = () => {
		disconnected = true;
	};

	$: {
		console.log('reconnecting');
		if (disconnected) {
			const currentUser = get(userStore);
			// try reconnect
			registerClient(getDigitsFromString(currentUser.id as string), currentUser, disconect);
			disconnected = false;
		}
	}

	$: {
		data?.user &&
			userStore.update((user) => {
				return {
					...user,
					...data.user,
					email: data.user.email || ''
				};
			});
	}

	onMount(() => {
		const currentUser = get(userStore);
		const wsUrl = currentUser.wsUrl;
		if (wsUrl) {
			const ws = connectWs(wsUrl, disconect);
			ws.onmessage = (event) => {
				// const message = JSON.parse(event.data);
				console.log('message received', { e: event.data });
			};

			userStore.set({
				...currentUser,
				connected: true,
				ws
			});
		}
		return () => {
			currentUser.ws?.close();
			userStore.set(userPlaceholder);
		};
	});
</script>

<App />
