<script lang="ts">
	import { createRooms, unsubscribeRedis, type Room } from '$lib/store/rooms';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';
	import { onDestroy } from 'svelte';

	let rooms: Room[] = [];

	createRooms().subscribe(($rooms) => {
		rooms = $rooms;
	});

	onDestroy(() => {
		unsubscribeRedis('rooms');
	});

	const sourceData = rooms.map((room) => {
		return {
			id: room.id,
			owner: room.owner.username,
			name: room.name,
			time: room.time,
			side: 'random',
			rating: '??'
		};
	});

	const tableSimple: TableSource = {
		// A list of heading labels.
		head: ['name', 'time frame', 'rating'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(sourceData, ['owner', 'name', 'time', 'side', 'rating']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(sourceData, ['id', 'owner', 'name', 'time', 'side', 'rating']),
		// Optional: A list of footer labels.
		foot: ['Total', '', '<code class="code">5</code>']
	};

	const onSelected = () => {
		console.log('selected');
	};
</script>

<Table
	source={tableSimple}
	on:selected={onSelected}
	element="table table-custom table-cell-fit"
	regionHead="bg-green-200"
	interactive={true}
	text="placeholder-yellow-100"
/>
