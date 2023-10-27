<script lang="ts">
	import { enhance } from '$app/forms';
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store/camera';
	import { createMain } from '$lib/store/main';
	import {
		Autocomplete,
		popup,
		type AutocompleteOption,
		type PopupSettings
	} from '@skeletonlabs/skeleton';
	import type { ActionData } from '../../routes/$types';

	export let form: ActionData;

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

	let timeSelect = '5+10';

	const timeStrategies: AutocompleteOption<string>[] = [
		{ label: '5 min + 10s', value: '5+10', keywords: '5, 10' },
		{ label: 'unlimited', value: 'unlimited', keywords: '0' }
	];
	function onFlavorSelection(event: CustomEvent<AutocompleteOption<string>>): void {
		timeSelect = event.detail.label;
	}

	let popupSettings: PopupSettings = {
		event: 'focus-click',
		target: 'popupAutocomplete',
		placement: 'bottom'
	};

	const { play } = createMain();
</script>

<div class="glass h-96 w-80 m-auto p-4 text-green-200 font-bold">
	<div class="">
		<h1 class="h1 gradient font-bold">Create a room</h1>
		<form method="post" use:enhance>
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
						use:popup={popupSettings}
					/>
					<div
						data-popup="popupAutocomplete"
						class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto glass"
					>
						<Autocomplete
							class="variant-ghost-primary"
							bind:input={timeSelect}
							options={timeStrategies}
							on:selection={onFlavorSelection}
						/>
					</div>
					<br />
				</label>
			</div>
		</form>
	</div>
</div>

<svelte:window on:keydown={handleKeydown} />
