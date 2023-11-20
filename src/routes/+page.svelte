<script lang="ts">
	import App from '$lib/components/App.svelte';
	import userStore, { userPlaceholder, type User } from '$lib/store/user';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { get } from 'svelte/store';

	export let data: PageData;

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

	const connectWs = (url: string, currentUser: User) => {
		const con = () => new WebSocket(url);
		const ws = con();
		ws.onopen = () => {
			sessionStorage.setItem('wsConnected', 'true');
			console.log('connected');
		};
		ws.onclose = () => {
			sessionStorage.removeItem('wsConnected');
			console.log('disconnected');
		};
		ws.onerror = (err) => {
			console.error(err);
		};
		return ws;
	};

	onMount(() => {
		const currentUser = get(userStore);
		const isConnected = sessionStorage.getItem('wsConnected');

		if (isConnected) {
			return;
		}

		const wsUrl = currentUser.wsUrl;
		if (wsUrl) {
			const ws = connectWs(wsUrl, currentUser);
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
		const currentUser2 = get(userStore);

		console.log({ currentUser2 });

		return () => {
			currentUser.ws?.close();
			userStore.set(userPlaceholder);
		};
	});
</script>

<App />
