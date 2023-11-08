<script lang="ts">
	import { enhance } from '$app/forms';
	import redis from '$lib/server/redis';
	import type { Room } from '$lib/store/rooms';
	import {
		Autocomplete,
		popup,
		type AutocompleteOption,
		type PopupSettings
	} from '@skeletonlabs/skeleton';

	let timeSelect = '';

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
		placement: 'bottom',
		state: (state) => {
			return {
				...state,
				visible: true
			};
		}
	};
</script>

<div class="glass w-80 m-auto p-4 text-green-200 font-bold">
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
						type="select one..."
						bind:value={timeSelect}
						placeholder="Search..."
						class="input autocomplete p-2 variant-soft-primary text-white"
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
			<button type="submit" class="btn variant-filled-secondary w-full">create room</button>
		</form>
	</div>
</div>
