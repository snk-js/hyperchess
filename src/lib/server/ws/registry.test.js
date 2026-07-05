import { describe, it, expect } from 'vitest';
import {
	register,
	unregister,
	attachSocket,
	addTopic,
	removeTopic,
	publish,
	topicsForUser
} from './registry.js';

/** Minimal stand-in for a `ws` socket that records what it received. */
function fakeSocket() {
	return { readyState: 1, received: [], send(msg) { this.received.push(msg); } };
}

describe('ws registry', () => {
	it('fans a message out to every connected subscriber of a topic', () => {
		const a = fakeSocket();
		const b = fakeSocket();
		const idA = register('user-a', 'topic-fanout');
		const idB = register('user-b', 'topic-fanout');
		attachSocket(idA, a);
		attachSocket(idB, b);

		const receivers = publish('topic-fanout', 'hello');

		expect(receivers).toBe(2);
		expect(a.received).toEqual(['hello']);
		expect(b.received).toEqual(['hello']);
	});

	it('does not deliver to clients subscribed to other topics', () => {
		const sub = fakeSocket();
		const other = fakeSocket();
		attachSocket(register('u1', 'topic-x'), sub);
		attachSocket(register('u2', 'topic-y'), other);

		publish('topic-x', 'only-x');

		expect(sub.received).toEqual(['only-x']);
		expect(other.received).toEqual([]);
	});

	it('respects the optional user_id filter', () => {
		const mine = fakeSocket();
		const theirs = fakeSocket();
		attachSocket(register('same-topic-me', 'topic-u'), mine);
		attachSocket(register('same-topic-you', 'topic-u'), theirs);

		const receivers = publish('topic-u', 'targeted', 'same-topic-me');

		expect(receivers).toBe(1);
		expect(mine.received).toEqual(['targeted']);
		expect(theirs.received).toEqual([]);
	});

	it('never delivers to a registered-but-not-connected client', () => {
		register('ghost', 'topic-ghost'); // no attachSocket
		const receivers = publish('topic-ghost', 'noone-home');
		expect(receivers).toBe(0);
	});

	it('add/removeTopic change what a client receives', () => {
		const s = fakeSocket();
		const id = register('u-topics', 'topic-a');
		attachSocket(id, s);

		expect(addTopic(id, 'topic-b')).toBe(true);
		expect(publish('topic-b', 'b-msg')).toBe(1);

		expect(removeTopic(id, 'topic-b')).toBe(true);
		expect(publish('topic-b', 'b-again')).toBe(0);
		expect(s.received).toEqual(['b-msg']);
	});

	it('reports failure for topic ops on an unknown client', () => {
		expect(addTopic('does-not-exist', 't')).toBe(false);
		expect(removeTopic('does-not-exist', 't')).toBe(false);
		expect(attachSocket('does-not-exist', fakeSocket())).toBe(false);
	});

	it('topicsForUser aggregates topics across a user\'s clients', () => {
		const uid = 'multi-client-user';
		addTopic(register(uid, 'ROOMS'), 'MATCH:1');
		register(uid, 'LOBBY');

		const topics = topicsForUser(uid).sort();
		expect(topics).toEqual(['LOBBY', 'MATCH:1', 'ROOMS']);
	});

	it('unregister removes the client from future fan-out', () => {
		const s = fakeSocket();
		const id = register('u-unreg', 'topic-unreg');
		attachSocket(id, s);
		unregister(id);
		expect(publish('topic-unreg', 'gone')).toBe(0);
	});
});
