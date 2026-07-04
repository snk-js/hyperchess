// In-process pub/sub registry replacing the external warp-websockets relay.
// Plain JS (not TS) because it is imported both by bundled SvelteKit routes and
// by the unbundled server.js/vite.config — state lives on globalThis so the two
// module instances (and HMR reloads) share one registry.
import { randomUUID } from 'node:crypto';

const KEY = '__hyperchess_ws_registry__';

// clients not connected within this window are evicted by the sweeper
const CONNECT_TTL_MS = 60_000;

/** @typedef {{ userId: string, topics: string[], socket: import('ws').WebSocket | null, createdAt: number }} Client */

/** @returns {{ clients: Map<string, Client> }} */
function state() {
	if (!globalThis[KEY]) {
		globalThis[KEY] = { clients: new Map() };
		setInterval(() => {
			const now = Date.now();
			for (const [id, client] of globalThis[KEY].clients) {
				if (!client.socket && now - client.createdAt > CONNECT_TTL_MS) {
					globalThis[KEY].clients.delete(id);
				}
			}
		}, CONNECT_TTL_MS).unref?.();
	}
	return globalThis[KEY];
}

/** @param {string} userId @param {string} topic @returns {string} clientId */
export function register(userId, topic) {
	const clientId = randomUUID();
	state().clients.set(clientId, {
		userId: String(userId),
		topics: [topic],
		socket: null,
		createdAt: Date.now()
	});
	return clientId;
}

/** @param {string} clientId */
export function unregister(clientId) {
	state().clients.delete(clientId);
}

/** @param {string} clientId @param {import('ws').WebSocket} socket @returns {boolean} */
export function attachSocket(clientId, socket) {
	const client = state().clients.get(clientId);
	if (!client) return false;
	client.socket = socket;
	return true;
}

/** @param {string} clientId @param {string} topic @returns {boolean} */
export function addTopic(clientId, topic) {
	const client = state().clients.get(clientId);
	if (!client) return false;
	if (!client.topics.includes(topic)) client.topics.push(topic);
	return true;
}

/** @param {string} clientId @param {string} topic @returns {boolean} */
export function removeTopic(clientId, topic) {
	const client = state().clients.get(clientId);
	if (!client) return false;
	client.topics = client.topics.filter((t) => t !== topic);
	return true;
}

/** @param {string} clientId @param {string[]} topics */
export function replaceTopics(clientId, topics) {
	const client = state().clients.get(clientId);
	if (client) client.topics = topics;
}

/**
 * Fan a message out to every connected client subscribed to `topic`.
 * @param {string} topic
 * @param {string} message
 * @param {string} [userId] optional filter, kept for parity with the old relay
 * @returns {number} receiver count
 */
export function publish(topic, message, userId) {
	let sent = 0;
	for (const client of state().clients.values()) {
		if (userId !== undefined && client.userId !== String(userId)) continue;
		if (!client.topics.includes(topic)) continue;
		if (client.socket && client.socket.readyState === 1) {
			client.socket.send(message);
			sent++;
		}
	}
	return sent;
}

/** @param {string} userId @returns {string[]} */
export function topicsForUser(userId) {
	const topics = new Set();
	for (const client of state().clients.values()) {
		if (client.userId === String(userId)) client.topics.forEach((t) => topics.add(t));
	}
	return [...topics];
}
