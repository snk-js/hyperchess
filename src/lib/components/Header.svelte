<script>
	import { goto } from '$app/navigation';
	import { Avatar } from '@skeletonlabs/skeleton';

	const handleClick = () => {
		goto('/login');
	};
</script>

<header class="glass">
	<div />

	<div class="flex justify-end">
		<button on:click={handleClick} type="button" class="z-50 btn variant-soft-primary">Login</button
		>
	</div>
	<div class="z-10 absolute left-0 top-0 w-full h-full flex justify-center">
		<Avatar src="/assets/knight_logo_large.png" width="w-20" rounded="rounded-full" />
	</div>
</header>
