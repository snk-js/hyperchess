<script lang="ts">
	import type { RoomPayload } from '$lib/store/rooms';
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
	import { publish } from '$lib/async/websockets/publish/post';
	import { isLoading } from '$lib/store/loading';

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

			// setup a timer for this promise

			new Promise<boolean>((resolve) => {
				const modal: ModalSettings = {
					type: 'confirm',
					title: 'Please Confirm',
					backdropClasses: 'glass black-glass',
					modalClasses: 'bg-white',
					body: 'Are you sure you wish to proceed?',
					response: (r: boolean) => {
						// set loading to  true
						isLoading.set(true);
						setTimeout(() => {
							resolve(r);
							// set loading to false
							isLoading.set(false);
						}, 2000);
					}
				};
				modalStore.trigger(modal);
			}).then((r: any) => {
				console.log('resolved response:', r);
			});
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
