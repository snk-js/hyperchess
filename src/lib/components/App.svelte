<script lang="ts">
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store/camera';
	import userStore from '$lib/store/user';
	import Table from './Table/Table.svelte';
	import BorderWrapper from './borderWrapper/BorderWrapper.svelte';
	import CreateRoom from './createRoom/CreateRoom.svelte';

	/** @param {KeyboardEvent} event */
	function handleKeydown(event: KeyboardEvent) {
		if (playing) {
			switch (event.key) {
				case 'Escape':
					userStore.update((user) => {
						return {
							...user,
							playing: false
						};
					});
					break;

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
		<BorderWrapper title="Rooms">
			<Table />
		</BorderWrapper>

		<BorderWrapper title="Create a Room">
			<CreateRoom />
		</BorderWrapper>

		<BorderWrapper title="My Rooms">
			<CreateRoom />
		</BorderWrapper>
	</div>
{/if}

<svelte:window on:keydown={handleKeydown} />
