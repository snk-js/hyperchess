<script lang="ts">
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store/camera';
	import userStore from '$lib/store/user';
	import Table from './Table/Table.svelte';
	import CreateRoom from './createRoom/CreateRoom.svelte';

	/** @param {KeyboardEvent} event */
	function handleKeydown(event: KeyboardEvent) {
		if (playing) {
			switch (event.key) {
				case 'w':
					decreaseOffsetY();
					break;
				case 's':
					increaseOffsetY();
					break;
			}
		}
	}

	let playing = false;
	userStore.subscribe((user) => {
		playing = user.playing;
	});
</script>

{#if !playing}
	<div class="black-glass flex gap-10 p-10">
		<div class="bg-pink p-3 border-4 border-cyan-400">
			<h1 class="h1 text-[2rem] gradient font-bold my-3">Rooms</h1>
			<Table />
		</div>
		<div class="bg-pink p-3 border-4 border-cyan-400">
			<h1 class="h1 text-[2rem] gradient font-bold my-3">Create a room</h1>
			<CreateRoom />
		</div>
	</div>
{/if}

<svelte:window on:keydown={handleKeydown} />
