type PostPayload = { user_id: number; topic: string; message: string };

export const POST = async ({ request }) => {
	const body: PostPayload = await request.json();

	const { user_id, topic, message } = body;

	const publish = await fetch('http://localhost:8000/publish', {
		method: 'POST',
		body: JSON.stringify({ user_id, topic, message }),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const result = await publish;

	if (result.status === 200) {
		return new Response(JSON.stringify({ message: 'success' }), {
			status: 201
		});
	} else {
		console.log(result.status);

		return new Response(JSON.stringify({ message: 'fail' }), {
			status: 500
		});
	}
};
