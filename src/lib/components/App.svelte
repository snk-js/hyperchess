<script lang="ts">
	import { get } from 'svelte/store';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store/camera';
	import userStore from '$lib/store/user';
	import { gameStore, clearGame } from '$lib/store/game';
	import { resignGame } from '$lib/async/websockets/match/handler';
	import Table from './Table/Table.svelte';
	import BorderWrapper from './borderWrapper/BorderWrapper.svelte';
	import CreateRoom from './createRoom/CreateRoom.svelte';
	import MyRooms from './myRooms/MyRooms.svelte';

	const modalStore = getModalStore();

	const leaveBoard = () => {
		clearGame();
		userStore.update((user) => ({ ...user, playing: false }));
	};

	const onEscape = () => {
		const game = get(gameStore);

		// no match, or the match is over: just leave the board view
		if (!game || game.status !== 'active') {
			leaveBoard();
			return;
		}

		const modal: ModalSettings = {
			type: 'confirm',
			title: 'Resign?',
			backdropClasses: 'glass black-glass',
			modalClasses: 'bg-white',
			body: 'Leaving the board resigns the match. Resign and return to the lobby?',
			response: (confirmed: boolean) => {
				if (!confirmed) return;
				void resignGame().then((ok) => {
					if (ok) leaveBoard();
				});
			}
		};
		modalStore.trigger(modal);
	};

	/** @param {KeyboardEvent} event */
	function handleKeydown(event: KeyboardEvent) {
		if (playing) {
			switch (event.key) {
				case 'Escape':
					onEscape();
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
			<MyRooms />
		</BorderWrapper>
	</div>
{/if}

<svelte:window on:keydown={handleKeydown} />
