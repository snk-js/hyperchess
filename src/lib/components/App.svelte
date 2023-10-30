<script lang="ts">
	import { enhance } from '$app/forms';
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store/camera';
	import { createMain, createRooms, type Room } from '$lib/store/main';
	import {
		Autocomplete,
		popup,
		type AutocompleteOption,
		type PopupSettings,
		Table,
		tableMapperValues,
		type TableSource
	} from '@skeletonlabs/skeleton';
	import type { ActionData } from '../../routes/$types';

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

	let timeSelect = '';

	const timeStrategies: AutocompleteOption<string>[] = [
		{ label: '5 min + 10s', value: '5+10', keywords: '5, 10' },
		{ label: 'unlimited', value: 'unlimited', keywords: '0' }
	];
	function onFlavorSelection(event: CustomEvent<AutocompleteOption<string>>): void {
		timeSelect = event.detail.label;
	}

	let playing = false;
	let rooms: Room[] = [];

	createRooms().subscribe((value) => {
		rooms = value;
	});

	const { play, subscribe } = createMain();

	subscribe((value) => {
		playing = value.playMode;
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

	const onSelected = () => {
		console.log('selected');
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

<div class="flex gap-10">
	<div class="glass h-96 w-80 m-auto p-4 text-green-200 font-bold">
		<div class="asdasd">
			<h1 class="h1 text-[2rem] gradient font-bold">Create a room</h1>
			<form
				method="post"
				use:enhance={() => {
					return async ({ result }) => {
						console.log({ result });
					};
				}}
			>
				<div class="my-3">
					<label class="label" for="name">
						<span> match name </span>
						<input
							placeholder="'Me and Gustavo match'"
							class="input variant-soft-primary text-white"
							name="name"
							id="name"
						/><br />
					</label>
				</div>
				<div class="my-3">
					<label class="label" for="time">
						<span> time strategy </span>
						<input
							type="search"
							bind:value={timeSelect}
							placeholder="Search..."
							class="input autocomplete variant-soft-primary text-white"
							name="time"
							id="time"
						/>
						<div class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto glass">
							<Autocomplete
								class="variant-ghost-primary"
								bind:input={timeSelect}
								options={timeStrategies}
								on:selection={onFlavorSelection}
							/>
						</div>
						<br />
					</label>
					<button type="submit" class="btn variant-filled-secondary">play</button>
				</div>
			</form>
		</div>
	</div>
	<div class="glass inline-flex">
		<Table
			source={tableSimple}
			on:selected={onSelected}
			element="table table-custom table-cell-fit"
			regionHead="bg-red-200"
			interactive={true}
			text="placeholder-yellow-100"
		/>
	</div>
</div>

<svelte:window on:keydown={handleKeydown} />
