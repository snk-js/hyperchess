import { BASE, assert, finish, login, connectWsClient, wait } from './helpers.mjs';

const authFetch = await login('testplayer');

// a peer already connected to the ROOMS topic
const peer = await connectWsClient('peer-watcher');

// clean slate: remove any open rooms owned by testplayer
const before = (await (await authFetch('/api/rooms')).json()).rooms;
assert(Array.isArray(before), 'GET /api/rooms returns a snapshot array');
for (const r of before.filter((r) => r.owner.username === 'testplayer')) {
	await authFetch(`/api/rooms/${r.id}`, { method: 'DELETE' });
}

// create a room
const createRes = await authFetch('/api/rooms', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ time: '5+5', style: 'match', side: 'white', privacy: 'public' })
});
assert(createRes.status === 201, `POST /api/rooms created (201, got ${createRes.status})`);
const { room, created } = await createRes.json();
assert(created === true && typeof room.id === 'number', 'created:true with numeric room id');

await wait(300);
assert(peer.msgs.some((d) => d.kind === 'room_added' && d.room.id === room.id), 'peer received room_added delta');

// fresh snapshot includes it (late-joiner fix)
const afterCreate = (await (await authFetch('/api/rooms')).json()).rooms;
assert(afterCreate.some((r) => r.id === room.id), 'fresh snapshot includes the new room');

// one open room per owner
const dup = await authFetch('/api/rooms', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ time: '30+10', style: 'sandbox', side: 'black', privacy: 'private' })
});
const dupBody = await dup.json();
assert(dup.status === 200 && dupBody.created === false && dupBody.room.id === room.id, 'second create returns the existing room');

// invalid payload rejected
const bad = await authFetch('/api/rooms', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ time: '5+5', style: 'blitz', side: 'white', privacy: 'public' })
});
assert(bad.status === 400, `invalid style rejected (400, got ${bad.status})`);

// unauthenticated rejected
const noauth = await fetch(`${BASE}/api/rooms`, {
	method: 'POST',
	headers: { 'content-type': 'application/json', origin: BASE },
	body: JSON.stringify({ time: '5+5', style: 'match', side: 'white', privacy: 'public' })
});
assert(noauth.status === 401, `unauthenticated create rejected (401, got ${noauth.status})`);

// cancel: delta + snapshot removal
const del = await authFetch(`/api/rooms/${room.id}`, { method: 'DELETE' });
assert(del.status === 200, `DELETE /api/rooms/${room.id} ok`);
await wait(300);
assert(peer.msgs.some((d) => d.kind === 'room_removed' && d.id === room.id), 'peer received room_removed delta');
const afterDelete = (await (await authFetch('/api/rooms')).json()).rooms;
assert(!afterDelete.some((r) => r.id === room.id), 'snapshot no longer includes the cancelled room');

peer.ws.close();
finish('ROOMS E2E');
