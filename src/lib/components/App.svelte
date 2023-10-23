<script lang="ts">
	import { decreaseOffsetY, increaseOffsetY } from '$lib/store/camera';

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
</script>

<div class="min-h-80 w-full bg-red-200">asdasdsa</div>

<svelte:window on:keydown={handleKeydown} />
