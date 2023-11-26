<script lang="ts">
	import type { Room } from '$lib/store/rooms';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';
	import { roomsStore, setRooms, updateTableData } from '$lib/store/rooms';

	let tableData: TableSource = {
		head: [],
		body: []
	};

	roomsStore.subscribe((data) => {
		tableData = updateTableData(setRooms(data));
	});

	const onSelected = () => {
		console.log('selected');
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
