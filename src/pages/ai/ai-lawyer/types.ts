// src/pages/ai/ai-lawyer/types.ts
import { COURT_CASES_BANK, getNextCase } from './data/scenarios';

export type CourtPhase =
  | 'LOBBY'
  | 'CASE_BRIEF'          // TV introduces case (15s)
  | 'DEFENSE_INPUT'        // Mobile writes excuses (45s)
  | 'JUDGE_DELIBERATION'   // Judge deliberates & generates verdict (AI spinner)
  | 'VERDICT_REVEAL'       // TV & Mobile stamp animation + roasts
  | 'MATCH_PODIUM';        // Final standings after 3 rounds completed

export interface CourtCase {
  id: string;
  title: string;
  charge: string;
  context: string;
}

export interface PlayerDefense {
  playerId: string;
  playerName: string;
  argumentText: string;
}

export interface DefenseAnalysis {
  playerId: string;
  playerName: string;
  argumentText: string;
  verdict: 'مقبول' | 'مرفوض';
  logicScore: number; // 1 to 10
  roastReason: string;
}

export interface CourtVerdict {
  winnerPlayerId: string;
  winnerReason: string;
  judgeSummary: string;
  evaluations: DefenseAnalysis[];
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  roundScore: number;
  totalScore: number;
  winsCount: number;
}

export { COURT_CASES_BANK, getNextCase };
