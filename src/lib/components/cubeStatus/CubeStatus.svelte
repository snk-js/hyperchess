<!-- CubeStatus.svelte -->
<script lang="ts">
	import { T } from '@threlte/core';
	import { dummyCell } from '$lib/store';
	import type { Cell } from '$lib/store';

	import { tweened } from 'svelte/motion';
	import { backInOut } from 'svelte/easing';

	import { updateBox } from './boxState';

	export let cell: Cell = dummyCell;
	export let innerCubeSize: number;

	const scale = tweened(0, {
		duration: 200,
		easing: backInOut
	});

	$: {
		if (cell.activated) {
			scale.set(4);
		} else {
			scale.set(0);
		}
	}

	let defaultEdges = updateBox(cell).mesh;
	let defaultInnerColor = updateBox(cell).inner;

	$: {
		const { inner, mesh } = updateBox(cell);
		defaultEdges = mesh;
		defaultInnerColor = inner;
	}
</script>

<T.Mesh scale={$scale}>
	<T.BoxGeometry args={[innerCubeSize, innerCubeSize, innerCubeSize]} />
	<T.MeshBasicMaterial args={[defaultInnerColor]} />
</T.Mesh>

<T.MeshBasicMaterial args={[defaultEdges]} />
