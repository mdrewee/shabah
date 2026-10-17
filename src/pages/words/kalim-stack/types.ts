export type KalimPhase =
  | 'LOBBY'
  | 'GAMEPLAY'
  | 'ROUND_WIN'
  | 'PODIUM';

export interface LetterCard {
  id: string;
  letter: string;   // Single Arabic letter (e.g. "ع", "ق", "ل")
  points: number;   // Visual aesthetic point tag (e.g. 1, 2, 3)
}

export interface BoardSlot {
  positionIndex: 0 | 1 | 2; // Right, Middle, Left slot
  topCard: LetterCard;
  stackHistory: LetterCard[]; // Track past cards stacked underneath for physical 3D layer illusion
}

export interface KalimPlayer {
  id: string;
  name: string;
  cardsCount: number;
  hand?: LetterCard[]; // Only populated locally for the mobile player
  isReady?: boolean;
}

export interface MoveValidationResult {
  isValid: boolean;
  resultingWord: string;
  errorMessage?: string;
}

export interface TurnNotification {
  playerId: string;
  playerName: string;
  prevLetter?: string;
  newLetter?: string;
  resultingWord?: string;
  type: 'MOVE' | 'DRAW' | 'TIMEOUT';
  timestamp: number;
}
