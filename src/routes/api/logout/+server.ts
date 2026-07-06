import { invalidateSession } from '$lib/server/auth/session';
import { deleteSessionCookie } from '$lib/server/auth/cookie';

export const POST = async ({ locals, cookies }) => {
	if (!locals.session) {
		return new Response(JSON.stringify({ message: 'fail' }), { status: 401 });
	}
	await invalidateSession(locals.session.id);
	deleteSessionCookie(cookies);
	return new Response(JSON.stringify({ message: 'success' }), { status: 200 });
};
