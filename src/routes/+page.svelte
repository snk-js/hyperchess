<script lang="ts">
	import App from '$lib/components/App.svelte';
	import userStore, { userPlaceholder } from '$lib/store/user';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { get } from 'svelte/store';
	import { registerClient } from '$lib/utils/ws';
	import { pushNotification, notificationStore } from '$lib/store/toast';
	import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	import { isLoading } from '$lib/store/loading';
	import Spinner from '$lib/components/loading/Spinner.svelte';
	import { roomsEventHandler } from '$lib/async/websockets/rooms/handler';
	import { enterMatch } from '$lib/async/websockets/match/handler';
	import { roomsStore } from '$lib/store/rooms';

	let loading = false;

	isLoading.subscribe((value) => {
		loading = value;
	});

	$: {
		const currentUser = get(userStore);
		console.log({ currentUser });
	}

	export let data: PageData;
	let disconnected = true;

	const disconect = () => {
		disconnected = true;
	};

	const toastStore = getToastStore();
	notificationStore.subscribe((logs) => {
		const lastToast = logs.pop();
		if (lastToast && lastToast.type === 'error') {
			const t: ToastSettings = {
				message: lastToast.message,
				timeout: 5000,
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
		}
		if (lastToast && lastToast.type === 'success') {
			const t: ToastSettings = {
				message: lastToast.message,
				timeout: 5000,
				background: 'variant-filled-success'
			};
			toastStore.trigger(t);
		}
		return 'error';
	});

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
	const rejoinActiveGame = async () => {
		// reconnect after a reload: if the server has an active game for us,
		// re-enter it (hydrates the board and re-subscribes the MATCH topic)
		try {
			const res = await fetch('/api/games/current');
			if (!res.ok) return;
			const { game } = await res.json();
			if (game) await enterMatch(game);
		} catch (e) {
			console.error('Failed to check for an active game:', e);
		}
	};

	onMount(() => {
		console.log('on mount');
		// seed the lobby from the server snapshot before deltas start arriving
		roomsStore.set(data.rooms ?? []);
		const currentUser = get(userStore);
		// Ensure that this code runs only on the client side and currentUser has required properties
		if (currentUser && currentUser.id) {
			registerClient('ROOMS', roomsEventHandler, currentUser)
				.then((client) => {
					if (client && client.readyState === 1) {
						// update, not set: registration just stored clientId in the store
						userStore.update((u) => ({ ...u, ws: client }));
						console.log('WebSocket connected');
						pushNotification({
							message: 'Rooms WebSocket connected',
							type: 'success'
						});
						void rejoinActiveGame();
					}
				})
				.catch((e) => {
					console.error('Failed to register client:', e);
					// Optionally handle the error, e.g., show a notification
					pushNotification({
						message: 'Failed to register client to websockets server',
						type: 'error'
					});
				});
		}

		return () => {
			// Cleanup logic remains the same
			if (currentUser && currentUser.ws) {
				currentUser.ws.close();
				console.log('WebSocket disconnected');
			}
			userStore.set(userPlaceholder);
		};
	});
</script>

{#if loading}
	<div class="absolute left-0 w-full h-full z-[1900]">
		<div class="flex glass justify-center w-full h-full items-center">
			<Spinner />
		</div>
	</div>
{/if}

<App />
