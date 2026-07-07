import { BASE, assert, finish, login, connectWsClient, addTopic, wait } from './helpers.mjs';

const p1 = await login('testplayer'); // owner, will pick white
const p2 = await login('prodplayer'); // joiner

const c1 = await connectWsClient('testplayer');
const c2 = await connectWsClient('prodplayer');

// clean slate
for (const r of (await (await p1('/api/rooms')).json()).rooms.filter((r) => r.owner.username === 'testplayer')) {
	await p1(`/api/rooms/${r.id}`, { method: 'DELETE' });
}

// clean slate: resign any active games left over from earlier runs
for (const p of [p1, p2]) {
	for (let i = 0; i < 10; i++) {
		const { game } = await (await p('/api/games/current')).json();
		if (!game) break;
		await p(`/api/games/${game.id}/resign`, { method: 'POST' });
	}
}
const pre = await (await p1('/api/games/current')).json();
assert(pre.game === null, 'no active game before the match (leftovers resigned)');

// create + join
const createRes = await p1('/api/rooms', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ time: 'unlimited', style: 'match', side: 'white', privacy: 'public' })
});
const { room } = await createRes.json();
assert(createRes.status === 201, 'p1 created a room (white)');
await wait(200);
assert(c2.msgs.some((m) => m.kind === 'room_added' && m.room.id === room.id), 'p2 saw room_added');

const joinRes = await p2(`/api/rooms/${room.id}/join`, { method: 'POST' });
assert(joinRes.status === 201, `p2 joined (201, got ${joinRes.status})`);
const { game } = await joinRes.json();
assert(game.whitePlayerId !== game.blackPlayerId, 'game has two distinct players');

await wait(200);
assert(c1.msgs.some((m) => m.kind === 'game_started' && m.game.id === game.id), 'p1 (owner) received game_started');
assert(c2.msgs.some((m) => m.kind === 'game_started' && m.game.id === game.id), 'p2 (joiner) received game_started');
assert(c1.msgs.some((m) => m.kind === 'room_removed' && m.id === room.id), 'lobby got room_removed');

// reconnect endpoint: both players' current game is this one
const cur1 = await (await p1('/api/games/current')).json();
const cur2 = await (await p2('/api/games/current')).json();
assert(cur1.game?.id === game.id, 'GET /api/games/current returns the game for p1 (reconnect)');
assert(cur2.game?.id === game.id, 'GET /api/games/current returns the game for p2 (reconnect)');
const curNoAuth = await fetch(`${BASE}/api/games/current`);
assert(curNoAuth.status === 401, 'unauthenticated /api/games/current rejected');

// subscribe both to the MATCH topic
const topic = `MATCH:${game.id}`;
await addTopic(c1.clientId, topic);
await addTopic(c2.clientId, topic);

// white (p1) moves
const m1 = await p1(`/api/games/${game.id}/move`, {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ from: [2, 1, 2], to: [2, 2, 2] })
});
assert(m1.status === 200, `white move accepted (200, got ${m1.status})`);
await wait(200);
assert(
	c1.msgs.some((m) => m.kind === 'move_applied') && c2.msgs.some((m) => m.kind === 'move_applied'),
	'both players received move_applied'
);
assert(
	[...c1.msgs, ...c2.msgs].filter((m) => m.kind === 'move_applied').every((m) => m.turn === 'black'),
	'turn advanced to black'
);

// violations
const outOfTurn = await p1(`/api/games/${game.id}/move`, {
	method: 'POST', headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ from: [3, 1, 3], to: [3, 2, 3] })
});
assert(outOfTurn.status === 409, `out-of-turn move rejected (409, got ${outOfTurn.status})`);

const blackMove = await p2(`/api/games/${game.id}/move`, {
	method: 'POST', headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ from: [2, 6, 2], to: [2, 5, 2] })
});
assert(blackMove.status === 200, `black move accepted (200, got ${blackMove.status})`);

const foreign = await p1(`/api/games/${game.id}/move`, {
	method: 'POST', headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ from: [3, 6, 3], to: [3, 5, 3] })
});
assert(foreign.status === 409, `moving opponent's piece rejected (409, got ${foreign.status})`);

const illegal = await p1(`/api/games/${game.id}/move`, {
	method: 'POST', headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ from: [3, 1, 3], to: [7, 7, 7] })
});
assert(illegal.status === 409, `illegal move rejected (409, got ${illegal.status})`);

// state access
const stateRes = await p1(`/api/games/${game.id}`);
assert(stateRes.status === 200, 'participant can GET game state');
const unauth = await fetch(`${BASE}/api/games/${game.id}`);
assert(unauth.status === 401, 'unauthenticated GET rejected');

// resign: black (p2) resigns -> white (p1) wins, both get game_over
const resignRes = await p2(`/api/games/${game.id}/resign`, { method: 'POST' });
assert(resignRes.status === 200, `resign accepted (200, got ${resignRes.status})`);
const resigned = (await resignRes.json()).game;
assert(resigned.status === 'finished' && resigned.winnerId === game.whitePlayerId, 'resigning as black makes white the winner');

await wait(200);
const over1 = c1.msgs.find((m) => m.kind === 'game_over');
assert(over1 && over1.winnerId === game.whitePlayerId && over1.reason === 'resign', 'p1 received game_over(resign) with the right winner');
assert(c2.msgs.some((m) => m.kind === 'game_over'), 'p2 received game_over too');

// game is over: further moves and repeat resigns are rejected
const postMove = await p2(`/api/games/${game.id}/move`, {
	method: 'POST', headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ from: [2, 5, 2], to: [2, 4, 2] })
});
assert(postMove.status === 409, `move after game over rejected (409, got ${postMove.status})`);
const resignAgain = await p2(`/api/games/${game.id}/resign`, { method: 'POST' });
assert(resignAgain.status === 409, `second resign rejected (409, got ${resignAgain.status})`);

// no active game remains for either player (reconnect returns null)
const post1 = await (await p1('/api/games/current')).json();
const post2 = await (await p2('/api/games/current')).json();
assert(post1.game === null && post2.game === null, 'no active game after resign (e2e leaves no leftovers)');

c1.ws.close();
c2.ws.close();
finish('MATCH E2E');
