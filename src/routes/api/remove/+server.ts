type PostPayload = { client_id: string; topic: string };

export const POST = async ({ request }) => {
	const body: PostPayload = await request.json();

	const { client_id, topic } = body;

	const remove = await fetch('http://localhost:8000/remove_topic', {
		method: 'DELETE',
		body: JSON.stringify({ client_id, topic }),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const result = await remove;

	console.log(result);

	if (result.status === 200) {
		return new Response(JSON.stringify({ message: 'success' }), {
			status: 201
		});
	} else {
		return new Response(JSON.stringify({ message: 'fail' }), {
			status: 500
		});
	}
};
