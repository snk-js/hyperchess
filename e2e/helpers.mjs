import WebSocket from 'ws';

export const BASE = process.env.BASE || 'http://localhost:5173';

let failures = 0;
export const assert = (cond, msg) => {
	console.log(`${cond ? 'ok  -' : 'FAIL:'} ${msg}`);
	if (!cond) failures++;
};
export const finish = (name) => {
	console.log(`\n${failures === 0 ? `${name} OK` : `${name} FAILED (${failures})`}`);
	process.exit(failures === 0 ? 0 : 1);
};

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const getCookie = (res, name = 'hyperchess_session') =>
	(res.headers.getSetCookie?.() ?? [])
		.map((c) => c.split(';')[0])
		.filter((c) => c.startsWith(`${name}=`))
		.pop();

/** Login and return an authenticated fetch (cookie + Origin, like a browser). */
export async function login(username, password = 'secret123') {
	const res = await fetch(`${BASE}/login`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE },
		body: new URLSearchParams({ username, password }),
		redirect: 'manual'
	});
	const cookie = getCookie(res);
	if (!cookie) throw new Error(`login failed for ${username} (${res.status})`);
	return (path, opts = {}) =>
		fetch(`${BASE}${path}`, { ...opts, headers: { ...(opts.headers || {}), cookie, origin: BASE } });
}

/** Register a ws client on a topic and connect; returns { clientId, ws, msgs }. */
export async function connectWsClient(userId, topic = 'ROOMS') {
	const reg = await (
		await fetch(`${BASE}/api/ws`, {
			method: 'POST',
			headers: { origin: BASE },
			body: JSON.stringify({ user_id: userId, topic })
		})
	).json();
	const clientId = reg.result.client_id;
	const ws = new WebSocket(`${BASE.replace('http', 'ws')}/ws/${clientId}`);
	const msgs = [];
	ws.on('message', (d) => msgs.push(JSON.parse(d.toString())));
	await new Promise((ok, bad) => {
		ws.once('open', ok);
		ws.once('error', bad);
	});
	return { clientId, ws, msgs };
}

export const addTopic = (clientId, topic) =>
	fetch(`${BASE}/api/add`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', origin: BASE },
		body: JSON.stringify({ client_id: clientId, topic })
	});
