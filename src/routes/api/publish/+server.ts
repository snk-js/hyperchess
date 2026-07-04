import { publish } from '$lib/server/ws/registry.js';

type PostPayload = { user_id?: string | number; topic: string; message: string };

export const POST = async ({ request }) => {
	const body: PostPayload = await request.json();

	const { user_id, topic, message } = body;

	const receivers = publish(topic, message, user_id === undefined ? undefined : String(user_id));

	return new Response(JSON.stringify({ message: 'success', receivers }), {
		status: 201
	});
};
