import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';
import { attachWebSockets } from './src/lib/server/ws/attach.js';

// serves /ws/<clientId> on the same origin as the app (dev + preview);
// production gets the same via server.js
const hyperchessWs: PluginOption = {
	name: 'hyperchess-ws',
	configureServer(server) {
		if (server.httpServer) attachWebSockets(server.httpServer);
	},
	configurePreviewServer(server) {
		if (server.httpServer) attachWebSockets(server.httpServer);
	}
};

export default defineConfig({
	plugins: [sveltekit(), hyperchessWs],
	ssr: {
		noExternal: ['three', 'postprocessing']
	}
});
