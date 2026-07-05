import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// rooms.ts imports tableMapperValues from skeleton, whose package entry drags
// in .svelte files that node can't load — stub it with equivalent semantics
vi.mock('@skeletonlabs/skeleton', () => ({
	tableMapperValues: (source: Record<string, unknown>[], keys: string[]) =>
		source.map((row) => keys.map((k) => row[k]))
}));
import { roomsStore, myRoomsStore, addRoom, removeRoom, setRooms, type Room } from './rooms';
import userStore, { userPlaceholder } from './user';

const room = (id: number, ownerId: string, overrides: Partial<Room> = {}): Room => ({
	id,
	owner: { id: ownerId, username: `user-${ownerId}`, rating: 1200 },
	time: '5+5',
	type: 'public',
	style: 'match',
	side: 'white',
	rating: 0,
	privacy: 'public',
	...overrides
});

beforeEach(() => {
	roomsStore.set([]);
	userStore.set(userPlaceholder);
});

describe('rooms store', () => {
	it('addRoom / removeRoom update the list', () => {
		addRoom(room(1, 'a'));
		addRoom(room(2, 'b'));
		expect(get(roomsStore)).toHaveLength(2);

		removeRoom(1);
		expect(get(roomsStore).map((r) => r.id)).toEqual([2]);
	});

	it('myRoomsStore only contains rooms owned by the logged-in user', () => {
		addRoom(room(1, 'me'));
		addRoom(room(2, 'someone-else'));

		// logged out → nothing is "mine"
		expect(get(myRoomsStore)).toEqual([]);

		userStore.update((u) => ({ ...u, id: 'me' }));
		expect(get(myRoomsStore).map((r) => r.id)).toEqual([1]);
	});

	it('setRooms maps rooms to table rows with defaults applied', () => {
		const rows = setRooms([
			room(7, 'z', { side: '', privacy: 'weird-value', time: 'unlimited' })
		]);

		expect(rows).toEqual([
			{
				id: 7,
				owner: 'user-z',
				time: 'unlimited',
				style: 'match',
				side: 'random', // '' falls back to random
				rating: 1200,
				ownerId: 'z',
				privacy: 'public' // anything not 'private' is public
			}
		]);
	});
});
