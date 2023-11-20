type PostPayload = { user_id: number; topic: string };

export const POST = async ({ request }) => {
	const body: PostPayload = await request.json();

	const { user_id, topic } = body;

	const registerClient = await fetch('http://localhost:8000/register', {
		method: 'POST',
		body: JSON.stringify({ user_id, topic }),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const result = await registerClient.json();

	return new Response(JSON.stringify({ message: 'sucess', result: { ...result } }), {
		status: 201
	});
};
