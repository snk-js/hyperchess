type PostPayload = { client_id: string; topic: string };

export const POST = async ({ request }) => {
	const body: PostPayload = await request.json();

	const { client_id, topic } = body;

	const publish = await fetch('http://localhost:8000/add_topic', {
		method: 'POST',
		body: JSON.stringify({ client_id, topic }),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const result = await publish;

	if (result.status === 200) {
		return new Response(JSON.stringify({ message: 'sucess' }), {
			status: 201
		});
	} else {
		return new Response(JSON.stringify({ message: 'fail' }), {
			status: 500
		});
	}
};
