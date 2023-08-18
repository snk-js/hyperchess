import type { Cell } from '$lib/store';
import type { MeshBasicMaterialParameters } from 'three';

type MeshStates = 'activated' | 'selected' | 'highlighted' | 'default';

const defaultBox = { color: 0xffffff, opacity: 0.03, transparent: true };

const mesh: MeshBasicMaterialParameters[] = [
	{ color: 0x67d4ff },
	{ color: 0x1afa92 },
	{ color: 0x88ff09 },
	defaultBox,
	{ color: 0xffe342 }
];

const inner: MeshBasicMaterialParameters[] = [
	{ color: 0x67d4ff, opacity: 0.2, transparent: true },
	{ color: 0x1afa92, opacity: 0.2, transparent: true },
	{ color: 0x88ff09, opacity: 0.05, transparent: true },
	defaultBox,
	{ color: 0xffe342, opacity: 0.2, transparent: true }
];

const states = ['activated', 'selected', 'highlighted', 'default', 'onAvailableMove'];

const createMesh = (meshState: MeshStates = 'default', onAvailableMove?: boolean) => {
	let index = states.indexOf(meshState);
	onAvailableMove && (index = 4);
	return { mesh: mesh[index], inner: inner[index] };
};

export const defaultMesh = createMesh();
export const activated = createMesh('activated');
export const selected = createMesh('selected');
export const highlighted = (onAvailableMove?: boolean) =>
	createMesh('highlighted', onAvailableMove);

export function updateBox(cell: Cell, onAvailabldeMove?: boolean) {
	switch (true) {
		case cell.highlighted.activated:
			return highlighted(onAvailabldeMove);
		case cell.selected:
			return selected;
		case cell.activated:
			return activated;
		default:
			return defaultMesh;
	}
}
