import { addTopic } from '$lib/server/ws/registry.js';

type PostPayload = { client_id: string; topic: string };

export const POST = async ({ request }) => {
	const body: PostPayload = await request.json();

	const { client_id, topic } = body;

	if (addTopic(client_id, topic)) {
		return new Response(JSON.stringify({ message: 'success' }), { status: 201 });
	}
	return new Response(JSON.stringify({ message: 'fail' }), { status: 404 });
};
