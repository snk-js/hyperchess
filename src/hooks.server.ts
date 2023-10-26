import type { Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';

export const handle: Handle = async ({ resolve, event }) => {
	event.locals.auth = auth.handleRequest(event);

	const response = await resolve(event);

	if (event.url.pathname.startsWith('/api')) {
		// Required for CORS to work
		if (event.request.method === 'OPTIONS') {
			response.headers.append(
				'Access-Control-Allow-Methods',
				'GET, POST, PUT, DELETE, PATCH, OPTIONS'
			);
			response.headers.append('Access-Control-Allow-Origin', '*');
			response.headers.append('Access-Control-Allow-Headers', '*');
		}
	}

	if (event.url.pathname.startsWith('/api')) {
		response.headers.append('Access-Control-Allow-Origin', `*`);
	}

	return response;
};
