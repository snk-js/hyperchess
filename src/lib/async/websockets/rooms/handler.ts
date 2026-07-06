import { get } from 'svelte/store';
import { addRoom, removeRoom, roomsStore } from '$lib/store/rooms';
import { gameStore } from '$lib/store/game';
import userStore from '$lib/store/user';
import { pushNotification } from '$lib/store/toast';
import { enterMatchById, matchDeltaHandler } from '../match/handler';
import type { MatchDelta, RoomDelta } from '../types';

// Single dispatcher for everything arriving on this client's socket: lobby
// deltas (ROOMS topic) and in-game deltas (MATCH:<gameId> topic).
export const roomsEventHandler = (event: MessageEvent) => {
	if (!event?.data) {
		pushNotification({ message: 'Event has no data', type: 'error' });
		return;
	}

	let delta: RoomDelta | MatchDelta;
	try {
		delta = JSON.parse(event.data);
	} catch {
		pushNotification({ message: 'Malformed update', type: 'error' });
		return;
	}

	switch (delta.kind) {
		case 'room_added': {
			const incoming = delta.room;
			const rooms = get(roomsStore);
			// dedup: the creator also receives the echo of their own room
			if (!rooms.find((room) => room.id === incoming.id)) {
				addRoom(incoming);
			}
			break;
		}
		case 'room_removed':
			removeRoom(delta.id);
			break;
		case 'game_started': {
			// the joiner enters via the join response; the owner enters here
			const me = get(userStore).id;
			const mine = me === delta.game.whitePlayerId || me === delta.game.blackPlayerId;
			const alreadyIn = get(gameStore)?.id === delta.game.id;
			if (mine && !alreadyIn) void enterMatchById(delta.game.id);
			break;
		}
		case 'move_applied':
			matchDeltaHandler(delta);
			break;
	}
};
