// src/pages/ai/ai-room/types.ts

export type AiRoomPhase =
  | 'LOBBY'
  | 'QUESTIONS'
  | 'ANSWERS'
  | 'GENERATING_AI_ANSWERS'
  | 'INVESTIGATION'
  | 'VOTING'
  | 'REVEAL'
  | 'GAME_OVER'
  | 'SUMMARY';

export interface Suspect {
  avatarId: string;
  avatarName: string;
  iconName: string;
  bgTone: string;
  isAi: boolean; // Kept private to the room engine, NEVER sent in chat broadcasts!
  realPlayerId?: string;
  realPlayerName?: string;
}

export interface QuestionSubmission {
  playerId: string;
  avatarId: string;
  question: string;
}

export interface AnswerSubmission {
  avatarId: string;
  questionIndex: number; // 0 or 1
  answer: string;
}

export interface ChatMessage {
  id: string;
  avatarId: string;
  avatarName: string;
  text: string;
  timestamp: number;
}

export interface VoteSubmission {
  voterPlayerId?: string;
  voterAvatarId: string;
  targetAvatarId: string;
  round?: number;
}

export interface AiRoomScores {
  [playerId: string]: number;
}

export interface RoundScoreResult {
  aiRevealed: boolean;
  aiSurvived: boolean;
  aiVotesCount: number;
  aiAvatarId: string;
  aiEarnedPoints: number;
  masterBlufferPlayerId?: string;
  masterBlufferAvatarId?: string;
  correctVoterPlayerIds?: string[];
  correctVoterNames?: string[];
  playerPoints: Record<string, number>; // Cumulative
  roundPointsEarned: Record<string, number>; // This round only
  caughtAi: Record<string, boolean>; // Per player: did they vote AI
  isMasterBluffer: Record<string, boolean>; // Per player: was Master Bluff
  playerBreakdown: Record<string, string[]>;
}
