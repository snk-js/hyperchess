import { auth } from '$lib/server/lucia.js';

export const POST = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) {
		return new Response(JSON.stringify({ message: 'fail' }), {
			status: 401
		});
	}
	await auth.invalidateSession(session.sessionId); // invalidate session
	locals.auth.setSession(null); // remove cookie
	return new Response(JSON.stringify({ message: 'success' }), {
		status: 200
	});
};
