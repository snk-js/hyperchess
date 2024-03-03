<script lang="ts">
	import App from '$lib/components/App.svelte';
	import userStore, { userPlaceholder } from '$lib/store/user';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { get } from 'svelte/store';
	import { getDigitsFromString } from '$lib/utils';
	import { connectWs, registerClient } from '$lib/utils/ws';
	import { errorStore } from '$lib/store/toast';
	import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	import { isLoading } from '$lib/store/loading';
	import Spinner from '$lib/components/loading/Spinner.svelte';

	let loading = false;

	isLoading.subscribe((value) => {
		loading = value;
	});

	export let data: PageData;
	let disconnected = false;

	const disconect = () => {
		disconnected = true;
	};

	const toastStore = getToastStore();
	errorStore.subscribe((logs) => {
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
		console.log('reconnecting');
		if (disconnected) {
			const currentUser = get(userStore);
			// try reconnect
			registerClient(
				getDigitsFromString(currentUser.id as string),
				currentUser,
				disconect,
				data?.url || ''
			);
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

{#if loading}
	<div class="absolute left-0 w-full h-full z-50">
		<div class="flex glass justify-center w-full h-full items-stretch">
			<Spinner />
		</div>
	</div>
{/if}

<App />
