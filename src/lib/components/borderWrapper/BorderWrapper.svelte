<script lang="ts">
	export let title = 'Default Title';
	export let center = false;
	export let shrink = false;
	export let type = 'div';
	export let accent = 'cyan';

	const h1 = 'h1 p-2 text-[2rem] gradient font-bold my-3 z-50';
</script>

<div
	class={`bg-pink p-3 border-4 m-3 ${
		shrink ? 'w-fit ml-auto' : ''
	} divide-x-4 divide-green-300 rounded-lg border-cyan-400 ${
		accent === 'red-rose' ? 'border-rose-600' : ''
	}
	${type === 'button' ? 'hover:bg-slate-950 hover:cursor-pointer bg-opacity-25' : ''}
	`}
>
	{#if center}
		<div class="flex justify-center items-center">
			<slot />
			<h1 class={h1}>{title}</h1>
		</div>
	{:else}
		<slot />
		<h1 class={h1}>{title}</h1>
	{/if}
</div>
