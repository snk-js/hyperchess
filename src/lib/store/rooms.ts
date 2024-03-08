import { tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';
import { writable } from 'svelte/store';
// src/lib/store/index.ts

export const roomsStore = writable<Room[]>([]);

type RoomUser = {
	id: string;
	username: string;
	rating: number;
};

export const updateTableData = (sourceData: TableRowData[]) => {
	return {
		// A list of heading labels.
		head: ['owner', 'time', 'side', 'rating', 'style'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(sourceData, ['owner', 'time', 'side', 'rating', 'style']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(sourceData, [
			'id',
			'owner',
			'time',
			'side',
			'rating',
			'style',
			'ownerId',
			'privacy'
		]),
		// Optional: A list of footer labels.
		foot: ['Total', '', '<code class="code">5</code>']
	};
};

type TableRowData = {
	id: number;
	owner: string;
	time: Time;
	style: Style;
	side: string;
	rating: number;
	ownerId: string;
	privacy: string;
};

export const setRooms = (rooms: Room[]): TableRowData[] => {
	return rooms.map((room) => {
		return {
			id: room.id,
			owner: room.owner.username,
			time: room.time,
			style: room.style,
			side: room.side || 'random',
			rating: room.owner.rating,
			ownerId: room.owner.id,
			privacy: room.privacy === 'private' ? 'private' : 'public'
		};
	});
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
	rating: number;
	privacy: string;
};

export const addRoom = (room: Room) => {
	roomsStore.update((n) => [...n, room]);
};

export const removeRoom = (id: number) => {
	roomsStore.update((n) => n.filter((room) => room.id !== id));
};
