type PostPayload = { user_id: number };

export const POST = async ({ request }) => {
	const body: PostPayload = await request.json();

	const { user_id } = body;

	const registerClient = await fetch('http://localhost:8000/register', {
		method: 'POST',
		body: JSON.stringify({ user_id }),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const result = await registerClient.json();

	return new Response(JSON.stringify({ message: 'sucess', result: { ...result } }), {
		status: 201
	});
};
