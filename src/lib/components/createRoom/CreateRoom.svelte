<script lang="ts">
	import { enhance } from '$app/forms';
	import { createRoomSubmit } from '$lib/async/websockets/publish/actions';
	import { isLoading } from '$lib/store/loading';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import { get } from 'svelte/store';
	import userStore from '$lib/store/user';
	import { roomsStore } from '$lib/store/rooms';
	import { pushNotification } from '$lib/store/toast';
	import { errors } from '$lib/errorMessages';

	let timeSelect = 'unlimited';
	let privacy = 'public';
	let gameStyle = 'match';
	let side = 'random';

	const createRoomAction = async ({ formData }: { formData: FormData }) => {
		const { id, username, rating } = get(userStore);
		const userPayload = { id: id || '', username: username || '', rating: rating || 0 };
		const userId = get(userStore).id;
		const rooms = get(roomsStore);

		if (rooms.find((room) => room.owner.id === userId)) {
			pushNotification({ message: errors.rooms.publish.alreadyCreated, type: 'error' });
			return;
		}

		isLoading.set(true);
		const result = await new Promise((resolve) => {
			createRoomSubmit(
				formData,
				{
					timeSelect,
					privacy,
					gameStyle,
					side
				},
				userPayload
			).then((result) => {
				setTimeout(() => {
					isLoading.set(false);
					resolve(result);
				}, 1700);
			});
		});

		isLoading.set(false);

		return result;
	};
</script>

<div class="glass p-4 text-green-200 font-bold">
	<div class="asdasd">
		<form method="post" use:enhance={createRoomAction}>
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
				<div class="my-3">
					<span> time strategy </span>
					<RadioGroup
						background="bg-transparent"
						active="variant-filled-primary"
						hover="hover:variant-soft-primary"
						class="w-full variant-outline-primary"
						id="time"
						name="time"
					>
						<RadioItem
							bind:group={timeSelect}
							class="text-sm h-full"
							name="justify"
							value={'unlimited'}>Unlimited</RadioItem
						>
						<RadioItem bind:group={timeSelect} class="text-sm h-full" name="justify" value={'30+10'}
							>30 min + 10</RadioItem
						>
						<RadioItem bind:group={timeSelect} class="text-sm h-full" name="justify" value={'5+5'}
							>5 min + 5</RadioItem
						>
					</RadioGroup>
				</div>
				<div class="my-3">
					<span>privacy</span>
					<RadioGroup
						background="bg-transparent"
						active="variant-filled-primary"
						hover="hover:variant-soft-primary"
						class="w-full variant-outline-primary"
						id="privacy"
						name="privacy"
					>
						<RadioItem bind:group={privacy} class="text-sm h-full" name="justify" value={'public'}
							>public</RadioItem
						>
						<RadioItem bind:group={privacy} class="text-sm h-full" name="justify" value={'private'}
							>private</RadioItem
						>
					</RadioGroup>
				</div>
				<div class="my-3">
					<span>game style</span>
					<RadioGroup
						background="bg-transparent"
						active="variant-filled-primary"
						hover="hover:variant-soft-primary"
						class="w-full variant-outline-primary"
						id="gameStyle"
						name="gameStyle"
					>
						<RadioItem bind:group={gameStyle} class="text-sm h-full" name="justify" value={'match'}
							>match</RadioItem
						>
						<RadioItem
							bind:group={gameStyle}
							class="text-sm h-full"
							name="justify"
							value={'sandbox'}>sandbox</RadioItem
						>
					</RadioGroup>
				</div>
				<div class="my-3">
					<span>your side</span>
					<RadioGroup
						background="bg-transparent"
						active="variant-filled-primary"
						hover="hover:variant-soft-primary"
						class="w-full variant-outline-primary"
						id="side"
						name="side"
					>
						<RadioItem bind:group={side} class="text-sm h-full" name="justify" value={'random'}
							>random</RadioItem
						>
						<RadioItem bind:group={side} class="text-sm h-full" name="justify" value={'white'}
							>white</RadioItem
						>
						<RadioItem bind:group={side} class="text-sm h-full" name="justify" value={'black'}
							>black</RadioItem
						>
					</RadioGroup>
				</div>
				<!-- 
				type RoomUser = {
					id: string;
					username: string;
				};
				
				type Time =
					| '30+10'
					| '30+0'
					| '15+15'
					| '15+0'
					| '10+0'
					| '5+5'
					| '5+0'
					| '3+0'
					| '1+0'
					| 'unlimited'
					| '';
				type RoomType = 'public' | 'private' | '';
				type Style = 'match' | 'sandbox' | '';
				type Side = 'black' | 'white' | 'random' | '';
				export type Room = {
					id: number;
					owner: RoomUser;
					time: Time;
					type: RoomType;
					style: Style;
					side: Side;
				}; -->

				<!-- <label class="label" for="time">
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
			</div> -->
				<button type="submit" class="my-3 btn variant-filled-secondary w-full">create room</button>
			</div>
		</form>
	</div>
</div>
