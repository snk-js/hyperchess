<script lang="ts">
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store/camera';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';
	import Sidebar from './Sidebar.svelte';
	import PlayButton from './PlayButton.svelte';
	import { redirect } from '@sveltejs/kit';

	/** @param {KeyboardEvent} event */
	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'w':
				decreaseOffsetY();
				break;
			case 's':
				increaseOffsetY();
				break;
		}
	}

	const sourceData = [
		{
			id: 1,
			name: 'Snakeziin',
			time: `3 + 2`,
			rating: '1200'
		}
	];

	const onSelected = (e) => {
		redirect(307, `/play/${e.detail[0]}`);
	};

	const tableSimple: TableSource = {
		// A list of heading labels.
		head: ['name', 'time frame', 'rating'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(sourceData, ['name', 'time', 'rating']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(sourceData, ['id', 'name', 'time', 'rating']),
		// Optional: A list of footer labels.
		foot: ['Total', '', '<code class="code">5</code>']
	};
</script>

<div class="w-full h-full z-50 glass flex">
	<Table
		source={tableSimple}
		on:selected={onSelected}
		element="table table-custom table-cell-fit"
		regionHead="bg-red-200"
		interactive={true}
		text="placeholder-yellow-100"
	/>
	<Sidebar />
</div>

<svelte:window on:keydown={handleKeydown} />
