import { pushNotification } from '$lib/store/toast';
import userStore, { type User } from '$lib/store/user';

import type { TOPICS } from '$lib/async/websockets/types';

export const registerClient = async (
	topic: TOPICS,
	wsEventHanlder: (msg: MessageEvent) => void,
	currentUser: User
): Promise<WebSocket | void> => {
	console.log('registering, user:');
	if (currentUser.id) {
		const user_id = currentUser.id;

		try {
			const ws = await connectAndAddWsMsgListener(user_id, topic, wsEventHanlder);
			return ws;
		} catch (e) {
			console.error(e);
			pushNotification({ message: 'unexpected error connecting to websocket URL', type: 'error' });
			throw new Error('unexpected error connecting to websocket URL');
		}
	} else {
		pushNotification({ message: 'user not found', type: 'error' });
		return;
	}
};

export const getWsUrl = async (user_id: string, topic: TOPICS) => {
	const response = await fetch('api/ws', {
		method: 'POST',
		body: JSON.stringify({ user_id, topic })
	});
	const { result } = await response.json();
	if (!result?.client_id) return;
	// remember the client id: topic subscriptions (e.g. MATCH:<gameId>) need it
	userStore.update((u) => ({ ...u, clientId: result.client_id }));
	// build from our own origin: the server can't reliably know the
	// browser-facing protocol/host (proxies, containers)
	const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	return `${proto}//${window.location.host}/ws/${result.client_id}`;
};

export const connectWs = (url: string) => {
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
	};
	ws.onerror = (err) => {
		console.error(err);
		pushNotification({ message: 'unexpected error connecting to websocket URL', type: 'error' });
	};
	return ws;
};

const connectAndAddWsMsgListener = async (
	user_id: string,
	topic: string,
	handler: (msg: MessageEvent) => void
) => {
	const url = await getWsUrl(user_id, topic);

	if (url) {
		const ws: WebSocket = connectWs(url);
		if (ws) {
			configWsMessage(ws, handler);
			return ws;
		} else {
			pushNotification({ message: 'unexpected error getting websocket connection', type: 'error' });
			throw new Error('unexpected error getting websocket URL');
		}
	} else {
		pushNotification({ message: 'unexpected error getting websocket URL', type: 'error' });
		throw new Error('unexpected error getting websocket URL');
	}
};

const addWsEventListener = (ws: WebSocket, handler: (event: MessageEvent) => void) => {
	ws.addEventListener('message', handler);
};

const configWsMessage = (ws: WebSocket, handler: (event: MessageEvent) => void) => {
	try {
		addWsEventListener(ws, handler);
	} catch (e) {
		pushNotification({ message: 'unexpected error adding event listener', type: 'error' });
		console.error(e);
	}
};
