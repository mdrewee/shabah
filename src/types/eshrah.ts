export type EshrahTeamId = 'team_1' | 'team_2';

export interface EshrahPlayer {
  id: string;
  name: string;
  teamId?: EshrahTeamId | null;
  isHost?: boolean;
}

export type EshrahCategory =
  | 'football'      // كرة قدم
  | 'tv_series'     // مسلسلات
  | 'movies'        // أفلام
  | 'proverbs'      // حكمة ومثل
  | 'theater'       // مسرحية
  | 'tools'         // أدوات
  | 'food'          // أكلات
  | 'countries';    // دول

export interface EshrahPromptItem {
  id: string;
  category: EshrahCategory;
  text: string;
  forbiddenWords: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface EshrahTeamState {
  id: EshrahTeamId;
  name: string;
  color: string;                 // Hex or Tailwind class
  score: number;                 // Strictly in pt
  players: EshrahPlayer[];
}

export type EshrahGamePhase =
  | 'TEAMS'          // Team selection screen (Lobby)
  | 'CATEGORIES'     // Host multi-select categories (optional)
  | 'PREP_WORD'      // Pre-turn word preview where explainer sees word and taps [جاهز]
  | 'ROUND_READY'    // Ready screen before round starts
  | 'PLAYING'        // Active timer / gameplay
  | 'STEAL_WINDOW'   // Steal chance window for opponent team
  | 'ROUND_RESULT'   // Turn summary
  | 'PODIUM';        // Final match podium
