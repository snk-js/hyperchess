import type { Cell } from '$lib/store';
import type { MeshBasicMaterialParameters } from 'three';

type MeshStates = 'activated' | 'selected' | 'highlighted' | 'default';

const defaultBox = { color: 0xffffff, opacity: 0.03, transparent: true };

const states = {
	mesh: {
		activated: { color: 0xff177f },
		selected: { color: 0x1afa92 },
		highlighted: { color: 0x88ff09 },
		default: defaultBox
	},
	inner: {
		activated: { color: 0xff177f, opacity: 0.2, transparent: true },
		selected: { color: 0x1afa92, opacity: 0.2, transparent: true },
		highlighted: { color: 0x88ff09, opacity: 0.3, transparent: true },
		default: defaultBox
	}
};

const meshStates: Record<MeshStates, MeshBasicMaterialParameters> = {
	activated: states.mesh.activated,
	selected: states.mesh.selected,
	default: states.mesh.default,
	highlighted: states.mesh.highlighted
};

const innerStates: Record<MeshStates, MeshBasicMaterialParameters> = {
	activated: states.inner.activated,
	selected: states.inner.selected,
	default: states.inner.default,
	highlighted: states.inner.highlighted
};

const createMesh = (meshState: MeshStates = 'default') => {
	return {
		mesh: meshStates[meshState],
		inner: innerStates[meshState]
	};
};

export const defaultMesh = createMesh();
export const activated = createMesh('activated');
export const selected = createMesh('selected');

export function updateBox(cell: Cell) {
	switch (true) {
		case cell.selected:
			return selected;
		case cell.activated:
			return activated;
		default:
			return defaultMesh;
	}
}
