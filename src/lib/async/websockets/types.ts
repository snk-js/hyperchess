import type { Room } from '$lib/store/rooms';
import type { Coord, PieceState, Side } from '$lib/game/rules';

export type TOPICS = 'ROOMS' | 'MATCH' | string;

/** Announced to both participants so a game can be joined by its id. */
export type GameSummary = {
	id: string;
	roomId: number | null;
	whitePlayerId: string;
	blackPlayerId: string;
};

// Deltas broadcast on the ROOMS topic. The full room list is fetched once as a
// snapshot on load; these keep every connected lobby in sync afterwards.
export type RoomDelta =
	| { kind: 'room_added'; room: Room }
	| { kind: 'room_removed'; id: number }
	| { kind: 'game_started'; game: GameSummary };

// Deltas broadcast on the per-game MATCH:<gameId> topic.
export type MatchDelta = {
	kind: 'move_applied';
	from: Coord;
	to: Coord;
	turn: Side;
	board: Record<string, PieceState>;
	status: 'active' | 'finished';
	winnerId: string | null;
	captured: PieceState | null;
};
