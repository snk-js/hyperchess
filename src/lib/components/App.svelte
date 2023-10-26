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


<svelte:window on:keydown={handleKeydown} />
