import { BASE, assert, finish, getCookie } from './helpers.mjs';

const COOKIE = 'hyperchess_session';
const cookieAttrs = (res) =>
	(res.headers.getSetCookie?.() ?? []).find((c) => c.startsWith(`${COOKIE}=`)) ?? '';

const uname = `e2e_${Date.now().toString().slice(-7)}`;

// 1. signup sets a session cookie with the right attributes
const signup = await fetch(`${BASE}/signup`, {
	method: 'POST',
	headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE },
	body: new URLSearchParams({ name: 'E2E User', username: uname, password: 'secret123', email: `${uname}@x.com` }),
	redirect: 'manual'
});
let cookie = getCookie(signup);
assert(!!cookie, `signup set ${COOKIE} cookie (status ${signup.status})`);
const attrs = cookieAttrs(signup);
assert(/HttpOnly/i.test(attrs), 'cookie is HttpOnly');
assert(/SameSite=Lax/i.test(attrs), 'cookie is SameSite=Lax');
// dev server omits Secure (http localhost); the production build sets it.
// Scripts replay the cookie header directly, so both modes work — set
// E2E_SECURE=1 when targeting a production server.
const expectSecure = process.env.E2E_SECURE === '1';
assert(/;\s*Secure/i.test(attrs) === expectSecure, `cookie Secure attribute matches mode (expect ${expectSecure})`);

const authed = (c) => (path, opts = {}) =>
	fetch(`${BASE}${path}`, { ...opts, headers: { ...(opts.headers || {}), cookie: c, origin: BASE } });

// 2. authenticated → lobby loads
let r = await authed(cookie)('/', { redirect: 'manual' });
assert(r.status === 200, `authed GET / is 200 (got ${r.status})`);

// 3. a JSON POST works WITHOUT an Origin header
r = await fetch(`${BASE}/api/rooms`, {
	method: 'POST',
	headers: { 'content-type': 'application/json', cookie },
	body: JSON.stringify({ time: '5+5', style: 'match', side: 'white', privacy: 'public' })
});
assert(r.status === 201 || r.status === 200, `authed JSON POST works with no Origin header (got ${r.status})`);
// clean up the room we just made
const { room } = await r.clone().json().catch(() => ({ room: null }));
if (room) await authed(cookie)(`/api/rooms/${room.id}`, { method: 'DELETE' });

// 4. logout invalidates the session
r = await authed(cookie)('/api/logout', { method: 'POST' });
assert(r.status === 200, `logout 200 (got ${r.status})`);
r = await authed(cookie)('/', { redirect: 'manual' });
assert(r.status === 302, `after logout GET / redirects to login (got ${r.status})`);

// 5. login again
const loginRes = await fetch(`${BASE}/login`, {
	method: 'POST',
	headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE },
	body: new URLSearchParams({ username: uname, password: 'secret123' }),
	redirect: 'manual'
});
cookie = getCookie(loginRes);
assert(!!cookie, `login set a fresh cookie (status ${loginRes.status})`);
r = await authed(cookie)('/', { redirect: 'manual' });
assert(r.status === 200, `re-login authenticates (got ${r.status})`);

// 6. wrong password rejected
const bad = await fetch(`${BASE}/login`, {
	method: 'POST',
	headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE },
	body: new URLSearchParams({ username: uname, password: 'WRONGPASS' }),
	redirect: 'manual'
});
assert(!getCookie(bad), 'wrong password sets no session cookie');

// 7. cross-origin form POST blocked by CSRF
const csrf = await fetch(`${BASE}/login`, {
	method: 'POST',
	headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'http://evil.example' },
	body: new URLSearchParams({ username: uname, password: 'secret123' })
});
assert(csrf.status === 403, `cross-origin form POST blocked by CSRF (got ${csrf.status})`);

finish('AUTH E2E');
