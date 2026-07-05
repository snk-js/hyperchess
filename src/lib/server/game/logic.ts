// Pure game-decision logic: no DB, no stores. The service layer loads/saves and
// broadcasts; everything that decides *whether a move is allowed and what the
// board becomes* lives here so it can be unit-tested in isolation.
import {
	objectToBoard,
	boardToObject,
	pieceAt,
	isLegalMove,
	applyMove,
	type Coord,
	type Side,
	type PieceState
} from '$lib/game/rules';

export type RoomSide = 'white' | 'black' | 'random' | '';

/** Decide colours when a second player joins. Owner gets their chosen side. */
export function assignColors(
	ownerSide: RoomSide,
	ownerId: string,
	joinerId: string,
	rand: () => number = Math.random
): { whitePlayerId: string; blackPlayerId: string } {
	let ownerIsWhite: boolean;
	if (ownerSide === 'white') ownerIsWhite = true;
	else if (ownerSide === 'black') ownerIsWhite = false;
	else ownerIsWhite = rand() < 0.5;

	return ownerIsWhite
		? { whitePlayerId: ownerId, blackPlayerId: joinerId }
		: { whitePlayerId: joinerId, blackPlayerId: ownerId };
}

export type MoveDecision =
	| { ok: false; error: string }
	| {
			ok: true;
			board: Record<string, PieceState>;
			turn: Side;
			captured: PieceState | null;
			winnerSide: Side | null;
	  };

/**
 * Validate and resolve a move against a serialized board. Enforces turn order,
 * piece ownership, and legality (via the rules module), and detects a
 * king capture as an immediate win.
 */
export function decideMove(
	boardObj: Record<string, PieceState>,
	turn: Side,
	playerSide: Side,
	from: Coord,
	to: Coord
): MoveDecision {
	if (playerSide !== turn) return { ok: false, error: 'Not your turn' };

	const board = objectToBoard(boardObj);
	const moving = pieceAt(board, from);
	if (!moving) return { ok: false, error: 'No piece on the source square' };
	if (moving.side !== playerSide) return { ok: false, error: 'That piece is not yours' };
	if (!isLegalMove(board, from, to)) return { ok: false, error: 'Illegal move' };

	const captured = pieceAt(board, to);
	const next = applyMove(board, from, to);
	const winnerSide = captured?.piece === 'king' ? playerSide : null;

	return {
		ok: true,
		board: boardToObject(next),
		turn: playerSide === 'white' ? 'black' : 'white',
		captured,
		winnerSide
	};
}
