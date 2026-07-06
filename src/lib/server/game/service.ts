import { prisma } from '$lib/server/prisma';
import { publish } from '$lib/server/ws/registry.js';
import { initialBoard, boardToObject, type Coord, type PieceState, type Side } from '$lib/game/rules';
import type { GameSummary, MatchDelta, RoomDelta } from '$lib/async/websockets/types';
import { assignColors, decideMove, type RoomSide } from './logic';

const ROOMS_TOPIC = 'ROOMS';
const matchTopic = (gameId: string) => `MATCH:${gameId}`;

export type GameState = GameSummary & {
	board: Record<string, PieceState>;
	turn: Side;
	status: 'active' | 'finished';
	winnerId: string | null;
	moves: unknown[];
};

// prisma returns board/moves as JsonValue; these rows are only ever written by
// this service, so the shapes are known.
type GameRow = {
	id: string;
	roomId: bigint | null;
	whitePlayerId: string;
	blackPlayerId: string;
	board: unknown;
	turn: string;
	status: string;
	winnerId: string | null;
	moves: unknown;
};

function toSummary(g: GameRow): GameSummary {
	return {
		id: g.id,
		roomId: g.roomId === null ? null : Number(g.roomId),
		whitePlayerId: g.whitePlayerId,
		blackPlayerId: g.blackPlayerId
	};
}

function toState(g: GameRow): GameState {
	return {
		...toSummary(g),
		board: g.board as Record<string, PieceState>,
		turn: g.turn as Side,
		status: g.status as 'active' | 'finished',
		winnerId: g.winnerId,
		moves: g.moves as unknown[]
	};
}

function broadcastRooms(delta: RoomDelta) {
	publish(ROOMS_TOPIC, JSON.stringify(delta));
}

/**
 * A second player joins an open room: create the game, close the room, and
 * announce the game on the ROOMS topic so both participants (already subscribed
 * there) can subscribe to MATCH:<gameId> and start playing.
 */
export async function joinRoom(roomId: number, joinerId: string): Promise<GameState> {
	const room = await prisma.room.findFirst({ where: { id: BigInt(roomId), status: 'open' } });
	if (!room) throw new Error('ROOM_NOT_OPEN');
	if (room.ownerId === joinerId) throw new Error('CANNOT_JOIN_OWN_ROOM');

	const { whitePlayerId, blackPlayerId } = assignColors(
		room.side as RoomSide,
		room.ownerId,
		joinerId
	);

	const game = await prisma.game.create({
		data: {
			roomId: BigInt(roomId),
			whitePlayerId,
			blackPlayerId,
			board: boardToObject(initialBoard()),
			turn: 'white',
			status: 'active',
			moves: []
		}
	});

	await prisma.room.update({ where: { id: BigInt(roomId) }, data: { status: 'playing' } });
	broadcastRooms({ kind: 'room_removed', id: roomId });
	broadcastRooms({ kind: 'game_started', game: toSummary(game) });

	return toState(game);
}

export async function getGame(gameId: string): Promise<GameState | null> {
	const game = await prisma.game.findUnique({ where: { id: gameId } });
	return game ? toState(game) : null;
}

/** The player's active game, if any — used to reconnect after a reload. */
export async function getCurrentGameFor(userId: string): Promise<GameState | null> {
	const game = await prisma.game.findFirst({
		where: { status: 'active', OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }] },
		orderBy: { createdAt: 'desc' }
	});
	return game ? toState(game) : null;
}

/**
 * Validate a move server-side and, if legal, persist the new board and broadcast
 * it to both players on the MATCH topic. Throws with a machine-readable message
 * the route maps to a 4xx.
 */
export async function applyPlayerMove(
	gameId: string,
	playerId: string,
	from: Coord,
	to: Coord
): Promise<GameState> {
	const game = await prisma.game.findUnique({ where: { id: gameId } });
	if (!game) throw new Error('GAME_NOT_FOUND');
	if (game.status !== 'active') throw new Error('GAME_OVER');

	const playerSide: Side | null =
		playerId === game.whitePlayerId ? 'white' : playerId === game.blackPlayerId ? 'black' : null;
	if (!playerSide) throw new Error('NOT_A_PARTICIPANT');

	const decision = decideMove(
		game.board as Record<string, PieceState>,
		game.turn as Side,
		playerSide,
		from,
		to
	);
	if (!decision.ok) throw new Error(decision.error);

	const status = decision.winnerSide ? 'finished' : 'active';
	const winnerId = decision.winnerSide ? playerId : null;
	const moves = [
		...(game.moves as unknown[]),
		{ from, to, side: playerSide, captured: decision.captured }
	];

	const updated = await prisma.game.update({
		where: { id: gameId },
		data: { board: decision.board, turn: decision.turn, status, winnerId, moves }
	});

	const delta: MatchDelta = {
		kind: 'move_applied',
		from,
		to,
		turn: decision.turn,
		board: decision.board,
		status,
		winnerId,
		captured: decision.captured
	};
	publish(matchTopic(gameId), JSON.stringify(delta));

	return toState(updated);
}
