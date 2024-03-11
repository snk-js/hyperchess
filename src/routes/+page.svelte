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
	onMount(() => {
		console.log('on mount');
		const currentUser = get(userStore);
		let ws: WebSocket | null = null;
		// Ensure that this code runs only on the client side and currentUser has required properties
		if (currentUser && currentUser.id) {
			registerClient('ROOMS', roomsEventHandler, currentUser)
				.then((client) => {
					if (client && client.readyState === 1) {
						userStore.set({
							...currentUser,
							ws
						});
						console.log('WebSocket connected');
						pushNotification({
							message: 'Rooms WebSocket connected',
							type: 'success'
						});
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
