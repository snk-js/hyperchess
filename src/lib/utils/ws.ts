import userStore from '$lib/store/user';
import type { User } from 'lucia';

export const registerClient = async (userId: number, currentUser: User, disconect: () => void) => {
	const response = await fetch('api/ws', {
		method: 'POST',
		body: JSON.stringify({ user_id: userId, topic: 'rooms' })
	});

	const { result } = await response.json();

	if (result?.url) {
		const ws = connectWs(result.url, disconect);

		ws.onmessage = (event) => {
			// const message = JSON.parse(event.data);
			console.log('message received', { e: event.data });
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
