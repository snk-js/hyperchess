import { addRoom, roomsStore } from '$lib/store/rooms';
import userStore from '$lib/store/user';
import type { User } from 'lucia';
import { get } from 'svelte/store';

export const registerClient = async (userId: number, currentUser: User, disconect: () => void) => {
	const response = await fetch('api/ws', {
		method: 'POST',
		body: JSON.stringify({ user_id: userId, topic: 'rooms' })
	});

	const { result } = await response.json();

	if (result?.url) {
		const ws = connectWs(result.url, disconect);

		ws.onmessage = (event) => {
			const message = JSON.parse(event.data);
			if (message.topic === 'rooms') {
				addRoom(message.payload);
				userStore.update((user) => {
					return {
						...user,
						playing: true
					};
				});
			}
		};
		userStore.set({
			...currentUser,
			connected: true,
			ws
		});

		userStore.update((user) => {
			return {
				...user,
				connected: true,
				ws
			};
		});
	}
};

export const connectWs = (url: string, disconect: () => void) => {
	const con = () => new WebSocket(url);
	const ws = con();
	ws.onopen = () => {
		sessionStorage.setItem('wsConnected', 'true');
		console.log('connected');
	};
	ws.onclose = () => {
		sessionStorage.removeItem('wsConnected');
		console.log('disconnected');
		disconect();
	};
	ws.onerror = (err) => {
		console.error(err);
	};
	return ws;
};
