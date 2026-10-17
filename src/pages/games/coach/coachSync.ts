import {
  CoachRoomState,
  CoachGameMode,
  CoachSquad,
  CoachSlotKey,
  CoachPlayerPick,
  ClaimedPlayerInfo,
  BingoCard,
  BingoCell,
  BingoRoulettePlayer,
} from './types';
import { roomBus } from '../../../lib/roomBus';
import { normalizeFootballSearch } from './footballDataService';
import { FOOTBALL_PLAYERS_MASTER } from '../../../data/footballMasterData';
import { DRAFT_CONDITIONS_BANK } from '../../../data/draftConditions';

const STORAGE_PREFIX = 'shabah_coach_';

export function getPersistedCoachState(roomCode: string): CoachRoomState | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${roomCode}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function savePersistedCoachState(roomCode: string, state: CoachRoomState): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${roomCode}`, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save coach state to sessionStorage:', err);
  }
}

export function createInitialCoachState(roomCode: string, mode: CoachGameMode = 'draft'): CoachRoomState {
  const existing = getPersistedCoachState(roomCode);
  if (existing) {
    return existing;
  }

  const initial: CoachRoomState = {
    roomCode,
    mode,
    phase: 'LOBBY',
    roundNumber: 1,
    claimedPlayers: {},
    squads: {},
    bingoCards: {},
    rouletteHistory: [],
    currentRoulettePlayer: null,
  };

  savePersistedCoachState(roomCode, initial);
  return initial;
}

// -------------------------------------------------------------
// Bingo Card Generator (16 randomized cells per contestant)
// -------------------------------------------------------------
const BINGO_CELL_POOL: Array<Omit<BingoCell, 'id' | 'isMarked'>> = [
  { title: 'ريال مدريد', description: 'لعب لنادي ريال مدريد', type: 'club', targetValue: 'ريال مدريد' },
  { title: 'برشلونة', description: 'لعب لنادي برشلونة', type: 'club', targetValue: 'برشلونة' },
  { title: 'الهلال', description: 'لعب لنادي الهلال السعودي', type: 'club', targetValue: 'الهلال' },
  { title: 'النصر', description: 'لعب لنادي النصر السعودي', type: 'club', targetValue: 'النصر' },
  { title: 'الاتحاد', description: 'لعب لنادي الاتحاد السعودي', type: 'club', targetValue: 'الاتحاد' },
  { title: 'الأهلي', description: 'لعب لنادي الأهلي السعودي', type: 'club', targetValue: 'الأهلي' },
  { title: 'مانشستر سيتي', description: 'لعب لمانشستر سيتي', type: 'club', targetValue: 'مانشستر سيتي' },
  { title: 'ليفربول', description: 'لعب لنادي ليفربول', type: 'club', targetValue: 'ليفربول' },
  { title: 'بايرن ميونخ', description: 'لعب لبايرن ميونخ', type: 'club', targetValue: 'بايرن ميونخ' },
  { title: 'باريس سان جيرمان', description: 'لعب لباريس سان جيرمان', type: 'club', targetValue: 'باريس سان جيرمان' },
  { title: 'كأس العالم', description: 'حقق بطولة كأس العالم', type: 'trophy', targetValue: 'كأس العالم' },
  { title: 'دوري أبطال أوروبا', description: 'حقق دوري أبطال أوروبا', type: 'trophy', targetValue: 'دوري أبطال أوروبا' },
  { title: 'الكرة الذهبية', description: 'توج بالكرة الذهبية', type: 'trophy', targetValue: 'الكرة الذهبية' },
  { title: 'البرازيل', description: 'جنسيته برازيلي', type: 'country', targetValue: 'البرازيل' },
  { title: 'الأرجنتين', description: 'جنسيته أرجنتيني', type: 'country', targetValue: 'الأرجنتين' },
  { title: 'فرنسا', description: 'جنسيته فرنسي', type: 'country', targetValue: 'فرنسا' },
  { title: 'السعودية', description: 'جنسيته سعودي', type: 'country', targetValue: 'السعودية' },
  { title: 'إسبانيا', description: 'جنسيته إسباني', type: 'country', targetValue: 'إسبانيا' },
  { title: 'البرتغال', description: 'جنسيته برتغالي', type: 'country', targetValue: 'البرتغال' },
  { title: 'أشول (يساري)', description: 'يلعب بقدمه اليسرى', type: 'trait', targetValue: 'أشول' },
  { title: 'كابتن فريقه', description: 'حمل شارة القيادة', type: 'trait', targetValue: 'كابتن' },
  { title: 'قميص رقم 10', description: 'ارتدى الرقم 10', type: 'trait', targetValue: '10' },
  { title: 'لاعب أسمر', description: 'من أصحاب البشرة السمراء', type: 'trait', targetValue: 'أسمر' },
  { title: 'لاعب أصلع', description: 'حليق الرأس أو أصلع', type: 'trait', targetValue: 'أصلع' },
];

export function generateBingoCard(playerId: string): BingoCard {
  const shuffled = [...BINGO_CELL_POOL].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 16);

  const cells: BingoCell[] = selected.map((item, index) => ({
    id: `cell_${index}_${Math.random().toString(36).slice(2, 6)}`,
    ...item,
    isMarked: false,
  }));

  return {
    playerId,
    cells,
    isBingo: false,
  };
}

// -------------------------------------------------------------
// The 4 Win Vectors for 4x4 Bingo
// -------------------------------------------------------------
export const BINGO_WIN_VECTORS: number[][] = [
  // Rows
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // Columns
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // Diagonals
  [0, 5, 10, 15],
  [3, 6, 9, 12],
  // 4 Corners
  [0, 3, 12, 15],
];

export function checkBingoWin(cells: BingoCell[]): { isBingo: boolean; matchedVector?: number[] } {
  if (!cells || cells.length !== 16) return { isBingo: false };

  for (const vector of BINGO_WIN_VECTORS) {
    const allMarked = vector.every((index) => cells[index]?.isMarked);
    if (allMarked) {
      return { isBingo: true, matchedVector: vector };
    }
  }

  return { isBingo: false };
}

// -------------------------------------------------------------
// Photo Roulette Players Pool for Bingo Mode
// -------------------------------------------------------------
export function getRandomRoulettePlayer(excludeIds: string[] = []): BingoRoulettePlayer {
  const available = FOOTBALL_PLAYERS_MASTER.filter((p) => !excludeIds.includes(p.id));
  const pool = available.length > 0 ? available : FOOTBALL_PLAYERS_MASTER;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    id: picked.id,
    name: picked.name,
    photoUrl: picked.photo || '',
    currentClub: picked.currentClub,
    clubs: picked.clubs,
    nationality: picked.nationality,
    trophies: picked.trophies || [],
    traits: picked.traits || [],
  };
}

/**
 * Validate whether a roulette player matches a specific bingo cell condition
 */
export function doesPlayerMatchBingoCell(
  player: BingoRoulettePlayer | null | undefined,
  cell: BingoCell
): boolean {
  if (!player || !cell) return false;
  const target = cell.targetValue.toLowerCase().trim();

  // 1. Club check
  if (cell.type === 'club') {
    if (player.currentClub && (player.currentClub.toLowerCase().includes(target) || target.includes(player.currentClub.toLowerCase()))) {
      return true;
    }
    if (player.clubs && player.clubs.some((c) => c.toLowerCase().includes(target) || target.includes(c.toLowerCase()))) {
      return true;
    }
  }

  // 2. Nationality check
  if (cell.type === 'country') {
    if (player.nationality && (player.nationality.toLowerCase().includes(target) || target.includes(player.nationality.toLowerCase()))) {
      return true;
    }
  }

  // 3. Trophy check
  if (cell.type === 'trophy') {
    if (player.trophies && player.trophies.some((t) => t.toLowerCase().includes(target) || target.includes(t.toLowerCase()))) {
      return true;
    }
  }

  // 4. Trait check (e.g. أصلع, كابتن, أشول, رقم 10, أسمر)
  if (cell.type === 'trait') {
    if (player.traits && player.traits.some((t) => t.toLowerCase().includes(target) || target.includes(t.toLowerCase()))) {
      return true;
    }
  }

  return false;
}

