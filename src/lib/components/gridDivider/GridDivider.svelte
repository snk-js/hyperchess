<script lang="ts">
	import type { PieceCoords } from '$lib/store';
	import { T } from '@threlte/core';
	import { BufferAttribute, BufferGeometry, LineBasicMaterial } from 'three';

	export let position: PieceCoords = [0, 0, 0];

	const lineMaterial = new LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });

	const lineGeometryLeftRight = new BufferGeometry();
	const lineGeometryUpDown = new BufferGeometry();
	const lineGeometryFrontBack = new BufferGeometry();
	const verticesLeftRight = new Float32Array([
		-1.5, 0, 0, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
	]);
	const verticesUpDown = new Float32Array([
		0, 0, 0, 0, 0, 0, 0, -1.5, 0, 0, 1.5, 0, 0, 0, 0, 0, 0, 0
	]);
	const verticesFrontBack = new Float32Array([
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1.5, 0, 0, 1.5
	]);
	lineGeometryLeftRight.setAttribute('position', new BufferAttribute(verticesLeftRight, 3));
	lineGeometryUpDown.setAttribute('position', new BufferAttribute(verticesUpDown, 3));
	lineGeometryFrontBack.setAttribute('position', new BufferAttribute(verticesFrontBack, 3));
</script>

<T.Line geometry={lineGeometryLeftRight} material={lineMaterial} {position} />
<T.Line geometry={lineGeometryUpDown} material={lineMaterial} {position} />
<T.Line geometry={lineGeometryFrontBack} material={lineMaterial} {position} />
