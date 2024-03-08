<script lang="ts">
	import App from '$lib/components/App.svelte';
	import userStore, { userPlaceholder } from '$lib/store/user';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { get } from 'svelte/store';
	import { getDigitsFromString } from '$lib/utils';
	import { connectWs, registerClient } from '$lib/utils/ws';
	import { pushNotification, notificationStore } from '$lib/store/toast';
	import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	import { isLoading } from '$lib/store/loading';
	import Spinner from '$lib/components/loading/Spinner.svelte';
	import { roomsStore, type Room } from '$lib/store/rooms';
	import { redirect } from '@sveltejs/kit';

	let loading = false;

	isLoading.subscribe((value) => {
		loading = value;
	});

	// listen to the user id and if the user id doesnt exist, send it to login
	$: {
		const currentUser = get(userStore);
		console.log({ currentUser });
		// if (!currentUser.id) {
		// 	userStore.update((_) => {
		// 		return userPlaceholder;
		// 	});
		// 	throw redirect(302, '/login');
		// }
	}

	// listen to the page data

	export let data: PageData;
	let disconnected = true;

	const disconect = () => {
		disconnected = true;
	};

	// if the user

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

	// $: {
	// 	console.log('reconnecting');
	// 	console.log({ disconnected });
	// 	if (disconnected) {
	// 		const currentUser = get(userStore);
	// 		// try reconnect
	// 		registerClient(
	// 			getDigitsFromString(currentUser.id as string),
	// 			currentUser,
	// 			disconect,
	// 			data?.url || ''
	// 		);
	// 		disconnected = false;
	// 	}
	// }

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
		if (currentUser && currentUser.id && currentUser.wsUrl) {
			registerClient(
				getDigitsFromString(currentUser.id.toString()),
				currentUser,
				disconect,
				data?.url || ''
			)
				.then((client) => {
					console.log({ client });
					ws = client;
					console.log('WebSocket connected');
					pushNotification({
						message: 'WebSocket connected',
						type: 'success'
					});
				})
				.catch((e) => {
					console.error('Failed to register client:', e);
					// Optionally handle the error, e.g., show a notification
					pushNotification({
						message: 'Failed to register client to websockets server',
						type: 'error'
					});
				});

			userStore.set({
				...currentUser,
				connected: true,
				ws
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
	<div class="absolute left-0 w-full h-full z-50">
		<div class="flex glass justify-center w-full h-full items-center">
			<Spinner />
		</div>
	</div>
{/if}

<App />
