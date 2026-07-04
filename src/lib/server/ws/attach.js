// Attaches the /ws/<clientId> WebSocket endpoint to an existing HTTP server.
// Used by vite.config.ts (dev/preview server) and server.js (production).
import { WebSocketServer } from 'ws';
import { attachSocket, replaceTopics, unregister } from './registry.js';

const ATTACHED = Symbol.for('__hyperchess_ws_attached__');

/** @param {import('http').Server} httpServer */
export function attachWebSockets(httpServer) {
	if (httpServer[ATTACHED]) return;
	httpServer[ATTACHED] = true;

	const wss = new WebSocketServer({ noServer: true });

	httpServer.on('upgrade', (req, socket, head) => {
		const { pathname } = new URL(req.url ?? '/', 'http://internal');
		const match = pathname.match(/^\/ws\/([0-9a-f-]{16,})$/i);
		// not ours (e.g. vite HMR) — leave the upgrade to other listeners
		if (!match) return;

		const clientId = match[1];
		wss.handleUpgrade(req, socket, head, (ws) => {
			if (!attachSocket(clientId, ws)) {
				ws.close(4004, 'unknown client id — register first');
				return;
			}
			console.log(`[ws] ${clientId} connected`);

			ws.on('message', (data) => {
				const text = data.toString();
				if (text === 'ping' || text === 'ping\n') {
					ws.send('pong');
					return;
				}
				// parity with the old relay: a raw {topics: [...]} message
				// replaces the client's subscription list
				try {
					const parsed = JSON.parse(text);
					if (Array.isArray(parsed?.topics)) replaceTopics(clientId, parsed.topics);
				} catch {
					// non-JSON chatter is ignored
				}
			});

			ws.on('close', () => {
				unregister(clientId);
				console.log(`[ws] ${clientId} disconnected`);
			});
		});
	});
}
