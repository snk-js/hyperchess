<script lang="ts">
	import type { Room } from '$lib/store/rooms';
	import {
		Table,
		tableMapperValues,
		type ModalSettings,
		type TableSource
	} from '@skeletonlabs/skeleton';
	import { roomsStore, setRooms, updateTableData } from '$lib/store/rooms';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { get } from 'svelte/store';
	import userStore from '$lib/store/user';

	const modalStore = getModalStore();
	let tableData: TableSource = {
		head: [],
		body: []
	};

	roomsStore.subscribe((data) => {
		tableData = updateTableData(setRooms(data));
	});

	const onSelected = (data: CustomEvent) => {
		if (data.detail.length) {
			const ownerId = data.detail.find((c: string | number | undefined) => c === get(userStore).id);

			// if ownerId is equal to the currentUser id, then do nothing
			// otherwise open the modal

			if (ownerId) {
				// set playing to true
				userStore.update((user) => {
					return {
						...user,
						playing: true
					};
				});
				return;
			}

			const modal: ModalSettings = {
				type: 'confirm',
				// Data
				title: '',
				body: 'Are you sure you wish to proceed?',
				// TRUE if confirm pressed, FALSE if cancel pressed
				response: (r: boolean) => {
					if (r) {
						// set playing to true
						userStore.update((user) => {
							return {
								...user,
								playing: true
							};
						});
					}
				}
			};
			modalStore.trigger(modal);
		}
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
