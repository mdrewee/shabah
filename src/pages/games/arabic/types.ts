/**
 * Types & State Models for "الشبح العربي" (The Arabic Ghost)
 */

export type ArabicPhase =
  | 'LOBBY'
  | 'ROULETTE'
  | 'INPUT'
  | 'JUDGING'
  | 'RESULTS'
  | 'PODIUM';

export interface ContestantAnswer {
  categoryIndex: number;
  categoryName: string;
  rawAnswer: string;
  isValid: boolean;
  isUnique: boolean;
  points: number;
  comment: string;
  objected?: boolean;
  objectionOverturned?: boolean;
}

export interface ContestantRoundSubmission {
  contestantId: string;
  contestantName: string;
  answers: Record<number, string>; // categoryIndex (0..4) -> answer string
  finishedAt?: number; // timestamp in ms when clicked [خلصت!]
  submissionDurationMs?: number;
  speedBonusAwarded?: boolean;
}

export interface ContestantEvaluation {
  contestantId: string;
  contestantName: string;
  answers: ContestantAnswer[];
  roundPoints: number;
  speedBonus: number;
  totalRoundPoints: number;
}

export interface ObjectionState {
  id: string;
  contestantId: string;
  contestantName: string;
  categoryIndex: number;
  categoryName: string;
  answer: string;
  votesFor: string[]; // contestantIds voting valid
  votesAgainst: string[]; // contestantIds voting invalid
  endsAt: number; // Date.now() + 8000
  resolved: boolean;
}

export interface PlayerCategoryResult {
  category: string;
  answer: string;
  isCorrect: boolean;
  score: number; // 10 للصحيحة، 0 للخاطئة أو الفارغة
  reason: string; // تعليل مقتضب جداً (أقل من 6 كلمات)
}

export interface PlayerArabicEvaluation {
  playerId: string;
  playerName: string;
  totalScore: number;
  results: PlayerCategoryResult[];
}

export interface ArabicRoomState {
  roomCode: string;
  phase: ArabicPhase;
  roundNumber: number;
  totalRounds: number;
  currentLetter: string;
  usedLetters: string[];
  currentCategories: string[]; // exactly 5 categories
  usedCategories?: string[]; // all categories used so far in this match to prevent repetition
  timerSeconds: number;
  roundStartedAt: number;
  submissions: Record<string, ContestantRoundSubmission>;
  evaluations: Record<string, ContestantEvaluation>;
  playerEvaluations?: PlayerArabicEvaluation[];
  cumulativeScores: Record<string, number>; // contestantId -> total match points
  activeObjection: ObjectionState | null;
  readyPlayersNextRound: string[];
}
