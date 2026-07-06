// Ensure the two e2e players exist (idempotent: signup failures are fine if
// the user already exists — login is what the suites rely on).
const BASE = process.env.BASE || 'http://localhost:5173';

for (const username of ['testplayer', 'prodplayer']) {
	const res = await fetch(`${BASE}/signup`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE },
		body: new URLSearchParams({
			name: `${username} Player`,
			username,
			password: 'secret123',
			email: `${username}@example.com`
		}),
		redirect: 'manual'
	});
	console.log(`seed ${username}: ${res.status}`);
}
