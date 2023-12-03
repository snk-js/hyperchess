<script>
	import userStore, { userPlaceholder } from '$lib/store/user';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';

	let username = '';

	userStore.subscribe((user) => {
		username = user.username || '';
	});

	const logout = async () => {
		const logoutResponse = await fetch('/api/logout', {
			method: 'POST'
		});

		logoutResponse.json().then((data) => {
			if (data.message === 'success') {
				userStore.set(userPlaceholder);
				console.log('going login');
				goto('/login');
			}
		});
	};
</script>

<header class="glass m-4 h-[3rem] p-1 flex items-center flex-row-reverse">
	<div class="flex justify-end h-[95%]">
		<button type="button" class="btn variant-ghost-tertiary font-bold text-white">
			{username}
		</button>
		{#if username}
			<button
				type="button"
				class="z-50 mx-3 btn variant-filled-tertiary font-bold"
				on:click={logout}
			>
				logout
			</button>
		{/if}
	</div>

	<div class="absolute left-0 top-0 w-full h-full flex justify-center">
		<Avatar src="/assets/knight_logo_large.png" width="w-20" rounded="rounded-full" />
	</div>
</header>
