<script>
	export let title = 'Default Title';
	export let center = false;
</script>

<div class="bg-pink p-3 border-4 border-cyan-400 divide-x-4 divide-green-300 rounded-lg">
	{#if center}
		<div class="flex justify-center items-center">
			<h1 class="h1 text-[2rem] gradient font-bold m-3 z-50">{title}</h1>
			<slot />
		</div>
	{:else}
		<h1 class="h1 text-[2rem] gradient font-bold my-3 z-50">{title}</h1>
		<slot />
	{/if}
</div>
