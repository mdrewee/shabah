import { JudgeCase, Predicament } from '../../../data/judgePredicaments';

export type JudgePhase =
  | 'READING'
  | 'VOTING'
  | 'LOBBY'
  | 'PREDICAMENT_REVEAL'
  | 'case_briefing'
  | 'defending'
  | 'EXCUSE_INPUT'
  | 'JUDGING'
  | 'COURTROOM_VERDICT'
  | 'PODIUM';

export type JudgeVerdictType = 'innocent' | 'bail' | 'guilty';

export type PlayerVerdictType = 'بريء' | 'مذنب' | 'مع وقف التنفيذ';

export interface PlayerVerdict {
  aiUnavailable?: boolean;
  playerId: string;
  playerName: string;
  excuse: string;
  verdict: 'بريء' | 'مذنب' | 'مع وقف التنفيذ';
  roast: string; // تحليل منطقي حاد وقصف جبهة بدون أي عقوبات
  score: number; // بريء = 10، مع وقف التنفيذ = 5، مذنب = 0
  fineOrPenalty?: string; // Optional legacy compatibility
  // Compatibility fields with legacy JudgeVerdictResult
  verdictLabel?: string;
  judgeRoast?: string;
  pointsAwarded?: number;
}

export interface JudgeVerdictResult {
  playerId: string;
  playerName: string;
  excuse: string;
  verdict: JudgeVerdictType;
  verdictLabel: string; // 'براءة مع مرتبة الشرف' | 'إفراج بكفالة' | 'سجن مؤبد مع الأشغال الشاقة' or 'بريء' | 'مع وقف التنفيذ' | 'مذنب'
  judgeRoast: string;
  pointsAwarded: number; // 10 | 5 | 0
  fineOrPenalty?: string;
  score?: number;
}

export interface ContestantExcuse {
  cardId?: string;
  playerId: string;
  playerName: string;
  excuse: string;
  submittedAt: number;
}

export interface WorstExcuseRecord {
  playerId: string;
  playerName: string;
  excuse: string;
  predicamentTitle: string;
  judgeRoast: string;
}

export interface JudgeRoomState {
  gameVersion?: number;
  defenseEndsAt?: number;
  submittedPlayerIds?: string[];
  party?: {
    participants: Array<{ id: string; name: string }>;
    cards: Array<{ id: string; text: string }>;
    authors?: Record<string, string>;
    votes?: Record<string, string>;
    votedPlayerIds?: string[];
    eligibleVoterIds: string[];
    mode: 'jury' | 'duel';
    readIndex: number;
    phaseEndsAt: number;
    aiVerdicts?: PlayerVerdict[];
    aiReady?: boolean;
    aiFailed?: boolean;
    cancelled?: boolean;
    tallies?: Record<string, { votes: number; bonus: number }>;
  };
  briefingEndsAt?: number;
  roomCode: string;
  phase: JudgePhase;
  roundNumber: number;
  totalRounds: number;
  currentPredicament: Predicament;
  usedPredicamentIds: string[];
  timerSeconds: number;
  excuses: Record<string, ContestantExcuse>;
  verdicts: Record<string, PlayerVerdict | JudgeVerdictResult>;
  verdictList?: PlayerVerdict[];
  revealState: 'anonymous' | 'revealed';
  cumulativeScores: Record<string, number>;
  worstExcuses: Record<string, WorstExcuseRecord>;
  readyPlayersNextRound: string[];
}
