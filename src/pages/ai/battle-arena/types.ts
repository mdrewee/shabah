// src/pages/ai/battle-arena/types.ts

export type BattlePhase =
  | 'LOBBY'
  | 'LOADOUT_INPUT'       // Players write weapon, defense, superpower (50s)
  | 'MATCHMAKING_TREE'    // TV shows the 1v1 duel bracket / upcoming fight
  | 'DUEL_CLASH'          // TV shows 1v1 faceoff; AI deliberates & simulates clash
  | 'DUEL_RESULT'         // Clash narrative revealed; winner declared (+5 pt)
  | 'TOURNAMENT_PODIUM';  // Final tournament rankings

export interface PlayerLoadout {
  playerId: string;
  playerName: string;
  weapon: string;         // e.g. "ساطور مشحوذ", "مكنسة كهربائية"
  defense: string;        // e.g. "صينية ميرندا استيل", "بطانية شتوية دبل"
  superpower: string;     // e.g. "إذا عصب يطير رمل", "يكب زيت سيارات على الأرض"
}

export interface DuelClashResult {
  fighterA: PlayerLoadout;
  fighterB: PlayerLoadout;
  winnerPlayerId: string;
  winnerName: string;
  clashStory: string;     // 3-4 sentence detailed narrative of the fight sequence
  decidingFactor: string; // The exact reason/interaction that caused the win
}

export interface BattleScore {
  playerId: string;
  playerName: string;
  wins: number;
  totalScore: number;
}
