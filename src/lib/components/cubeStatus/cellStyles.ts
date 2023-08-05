import type { Cell } from '$lib/store';
import type { MeshBasicMaterialParameters } from 'three';

type MeshStates = 'activated' | 'selected' | 'highlighted' | 'default';

const defaultBox = { color: 0xffffff, opacity: 0.03, transparent: true };

const mesh: MeshBasicMaterialParameters[] = [
	{ color: 0x88ff09 },
	{ color: 0x1afa92 },
	{ color: 0x88ff09 },
	defaultBox
];

const inner: MeshBasicMaterialParameters[] = [
	{ color: 0xff177f, opacity: 0.2, transparent: true },
	{ color: 0x1afa92, opacity: 0.2, transparent: true },
	{ color: 0x88ff09, opacity: 0.05, transparent: true },
	defaultBox
];

const states = ['activated', 'selected', 'highlighted', 'default'];

const createMesh = (meshState: MeshStates = 'default') => {
	const index = states.indexOf(meshState);
	return { mesh: mesh[index], inner: inner[index] };
};

export const defaultMesh = createMesh();
export const activated = createMesh('activated');
export const selected = createMesh('selected');
export const highlighted = createMesh('highlighted');

export function updateBox(cell: Cell) {
	switch (true) {
		case cell.highlighted:
			return highlighted;
		case cell.selected:
			return selected;
		case cell.activated:
			return activated;
		default:
			return defaultMesh;
	}
}
