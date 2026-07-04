import { register } from '$lib/server/ws/registry.js';

type PostPayload = { user_id: string | number; topic: string };

export const POST = async ({ request, url }) => {
	const body: PostPayload = await request.json();

	const { user_id, topic } = body;

	const clientId = register(String(user_id), topic);
	const proto = url.protocol === 'https:' ? 'wss:' : 'ws:';

	return new Response(
		JSON.stringify({
			message: 'success',
			result: { url: `${proto}//${url.host}/ws/${clientId}`, client_id: clientId }
		}),
		{ status: 201 }
	);
};
