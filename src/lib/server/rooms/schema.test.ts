import { describe, it, expect } from 'vitest';
import { createRoomSchema, toClientRoom, type RoomRow } from './schema';

const row: RoomRow = {
	id: 1751731200000n,
	ownerId: 'user-123',
	username: 'gustavo',
	rating: 1300,
	time: '5+5',
	style: 'match',
	side: 'white',
	type: 'public',
	privacy: 'public'
};

describe('createRoomSchema', () => {
	it('accepts a valid lobby payload', () => {
		const r = createRoomSchema.safeParse({
			time: 'unlimited',
			style: 'match',
			side: 'random',
			privacy: 'public'
		});
		expect(r.success).toBe(true);
	});

	it('rejects unknown enum values', () => {
		expect(createRoomSchema.safeParse({ time: '5+5', style: 'blitz', side: 'white', privacy: 'public' }).success).toBe(false);
		expect(createRoomSchema.safeParse({ time: '5+5', style: 'match', side: 'up', privacy: 'public' }).success).toBe(false);
		expect(createRoomSchema.safeParse({ time: '5+5', style: 'match', side: 'white', privacy: 'secret' }).success).toBe(false);
	});

	it('rejects an over-long / empty time', () => {
		expect(createRoomSchema.safeParse({ time: '', style: 'match', side: 'white', privacy: 'public' }).success).toBe(false);
		expect(createRoomSchema.safeParse({ time: 'x'.repeat(17), style: 'match', side: 'white', privacy: 'public' }).success).toBe(false);
	});

	it('ignores an owner supplied in the body (identity comes from the session)', () => {
		const r = createRoomSchema.safeParse({
			time: '5+5',
			style: 'match',
			side: 'white',
			privacy: 'public',
			ownerId: 'attacker-controlled'
		});
		expect(r.success).toBe(true);
		expect(r.success && 'ownerId' in r.data).toBe(false);
	});
});

describe('toClientRoom', () => {
	it('maps a persisted row to the client room shape', () => {
		expect(toClientRoom(row)).toEqual({
			id: 1751731200000,
			owner: { id: 'user-123', username: 'gustavo', rating: 1300 },
			time: '5+5',
			type: 'public',
			style: 'match',
			side: 'white',
			rating: 0,
			privacy: 'public'
		});
	});

	it('converts the BigInt id to a JS number', () => {
		expect(typeof toClientRoom(row).id).toBe('number');
	});
});
