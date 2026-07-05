<script lang="ts">
	import { myRoomsStore, removeRoom } from '$lib/store/rooms';
	import userStore from '$lib/store/user';
	import { pushNotification } from '$lib/store/toast';

	const enterRoom = () => {
		userStore.update((user) => ({ ...user, playing: true }));
	};

	const cancelRoom = async (id: number) => {
		const response = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
		if (response.ok) {
			// remove locally for instant feedback; peers get the room_removed delta
			removeRoom(id);
			pushNotification({ message: 'Room cancelled', type: 'success' });
		} else {
			pushNotification({ message: 'Could not cancel room', type: 'error' });
		}
	};
</script>

<div class="glass p-4 text-green-200 font-bold min-w-[16rem]">
	{#if $myRoomsStore.length === 0}
		<p class="text-sm opacity-70">
			You have no open rooms. Create one to start waiting for an opponent.
		</p>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each $myRoomsStore as room (room.id)}
				<li class="variant-soft-primary rounded p-3">
					<div class="flex items-center justify-between gap-2">
						<span class="truncate">{room.owner.username}'s room</span>
						<span class="text-xs opacity-70">{room.privacy}</span>
					</div>
					<div class="mt-1 text-xs opacity-80">
						{room.time || 'unlimited'} · {room.style || 'match'} · {room.side || 'random'}
					</div>
					<div class="mt-2 flex gap-2">
						<button
							type="button"
							class="btn btn-sm variant-filled-secondary flex-1"
							on:click={enterRoom}
						>
							enter
						</button>
						<button
							type="button"
							class="btn btn-sm variant-soft-error flex-1"
							on:click={() => cancelRoom(room.id)}
						>
							cancel
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
