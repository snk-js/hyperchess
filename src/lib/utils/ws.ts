import { addRoom, roomsStore, type Room } from '$lib/store/rooms';
import { pushNotification } from '$lib/store/toast';
import userStore from '$lib/store/user';
import type { User } from 'lucia';
import { get } from 'svelte/store';

import type { TOPICS } from '$lib/async/websockets/types';

export const registerClient = async (
	userId: number,
	currentUser: User,
	disconect: () => void,
	topic: TOPICS
) => {
	const response = await fetch('api/ws', {
		method: 'POST',
		body: JSON.stringify({ user_id: userId, topic })
	});

	const { result } = await response.json();

	console.log({ result });
	let _ws = null;

	if (result?.url) {
		const ws = connectWs(result.url, disconect);

		_ws = ws;

		ws.onmessage = (event) => {
			console.log('message received');
			const message = JSON.parse(event.data);
			if (message.topic === 'ROOMS') {
				console.log({ message }, get(userStore));

				// check if there is existing room, not add if exists

				const rooms = get(roomsStore);

				if (!rooms.find((room) => room.id === message.payload.id)) {
					addRoom(message.payload);
				}

				if (message?.sender === get(userStore).id) {
					userStore.update((user) => {
						return {
							...user,
							playing: true
						};
					});
				}
			}
		};
		userStore.set({
			...currentUser,
			connected: true,
			ws
		});
	}
	return _ws;
};

export const connectWs = (url: string, disconect: () => void) => {
	const con = () => new WebSocket(url);
	const ws = con();
	ws.onopen = () => {
		sessionStorage.setItem('wsConnected', 'true');
		console.log('connected');
		pushNotification({ message: 'listening broadcast updates', type: 'success' });
	};
	ws.onclose = () => {
		sessionStorage.removeItem('wsConnected');
		console.log('disconnected');
		pushNotification({ message: 'disconnected from websockets server', type: 'error' });
		disconect();
	};
	ws.onerror = (err) => {
		console.error(err);
		pushNotification({ message: 'unexpected error connecting to websocket URL', type: 'error' });
	};
	return ws;
};
