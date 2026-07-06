<script lang="ts">
	import { Table, type ModalSettings, type TableSource } from '@skeletonlabs/skeleton';
	import { roomsStore, setRooms, updateTableData } from '$lib/store/rooms';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { get } from 'svelte/store';
	import userStore from '$lib/store/user';
	import { isLoading } from '$lib/store/loading';
	import { pushNotification } from '$lib/store/toast';
	import { enterMatch } from '$lib/async/websockets/match/handler';

	const modalStore = getModalStore();
	let tableData: TableSource = {
		head: [],
		body: []
	};

	roomsStore.subscribe((data) => {
		tableData = updateTableData(setRooms(data));
	});

	const joinRoom = async (roomId: number) => {
		isLoading.set(true);
		try {
			const res = await fetch(`/api/rooms/${roomId}/join`, { method: 'POST' });
			if (!res.ok) {
				const { message } = await res.json().catch(() => ({ message: 'Could not join room' }));
				pushNotification({ message: message ?? 'Could not join room', type: 'error' });
				return;
			}
			const { game } = await res.json();
			await enterMatch(game);
		} catch (e) {
			console.error(e);
			pushNotification({ message: 'Could not join room', type: 'error' });
		} finally {
			isLoading.set(false);
		}
	};

	const onSelected = (data: CustomEvent) => {
		if (!data.detail.length) return;
		// meta row shape: [id, owner, time, side, rating, style, ownerId, privacy]
		const roomId = Number(data.detail[0]);
		const ownerId = data.detail[6];

		if (ownerId === get(userStore).id) {
			// own room: go wait at the board
			userStore.update((user) => ({ ...user, playing: true }));
			return;
		}

		const modal: ModalSettings = {
			type: 'confirm',
			title: 'Join this match?',
			backdropClasses: 'glass black-glass',
			modalClasses: 'bg-white',
			body: `Play against ${data.detail[1]}?`,
			response: (confirmed: boolean) => {
				if (confirmed) void joinRoom(roomId);
			}
		};
		modalStore.trigger(modal);
	};
</script>

<Table
	source={tableData}
	on:selected={onSelected}
	element="table table-custom table-cell-fit"
	regionHead="bg-green-200"
	interactive={true}
	text="placeholder-yellow-100"
/>
