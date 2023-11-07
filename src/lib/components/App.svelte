<script lang="ts">
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store/camera';
	import { createMain } from '$lib/store/main';
	import type { ActionData } from '../../routes/$types';
	import Table from './Table/Table.svelte';
	import CreateRoom from './createRoom/CreateRoom.svelte';

	export let form: ActionData;

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

	const { play, subscribe } = createMain();

	subscribe((value) => {
		playing = value.playMode;
	});
</script>

<div class="flex gap-10">
	<CreateRoom />
	<div class="glass inline-flex">
		<Table />
	</div>
</div>

<svelte:window on:keydown={handleKeydown} />
