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
import { DRAFT_CONDITIONS_BANK, generateMatchConditions } from '../../../data/draftConditions';
import { getRandomMatchCriteria } from '../../../data/coachCriteria';
import {
  STATIC_CLUBS,
  STATIC_TROPHIES,
  STATIC_BINGO_PLAYERS,
  preloadBingoBatch,
} from '../../../data/footballStaticAssets';

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

  const matchConditions = generateMatchConditions(25);
  const matchCriteria = getRandomMatchCriteria(5);

  const initial: CoachRoomState = {
    roomCode,
    mode,
    phase: 'LOBBY',
    roundNumber: 1,
    totalRounds: 5,
    slotIndex: 0,
    activeConditionId: matchCriteria[0]?.id || matchConditions[0]?.id,
    activeConditionTitle: matchCriteria[0]?.title || matchConditions[0]?.title,
    activeConditionDescription: matchCriteria[0]?.description,
    claimedPlayers: {},
    currentRoundSelections: {},
    usedPlayersAcrossMatch: [],
    readyPlayersNextRound: [],
    cumulativeScores: {},
    squads: {},
    matchConditions,
    matchCriteria,
    bingoCards: {},
    rouletteHistory: [],
    rouletteSkipVotes: [],
    currentRoulettePlayer: null,
  };

  savePersistedCoachState(roomCode, initial);
  return initial;
}

// -------------------------------------------------------------
// High-Resolution SVGs for Trophies and Traits
// -------------------------------------------------------------
export const TROPHY_WORLD_CUP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M35 85 h30 v6 H35 z M38 75 h24 v10 H38 z M42 50 h16 v25 H42 z M30 20 c0 15 8 26 20 26 s20 -11 20 -26 c0 -8 -4 -12 -20 -12 s-20 4 -20 12 z M30 28 c-6 0 -10 6 -10 12 c0 8 6 14 14 14 v-5 c-5 0 -9 -4 -9 -9 s4 -7 7 -7 z M70 28 c6 0 10 6 10 12 c0 8 -6 14 -14 14 v-5 c5 0 9 -4 9 -9 s-4 -7 -7 -7 z" fill="%23F59E0B"/><circle cx="50" cy="22" r="10" fill="%23FBBF24"/></svg>`;

export const TROPHY_UCL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M32 85 h36 v6 H32 z M44 65 h12 v20 H44 z M30 20 c0 25 10 45 20 45 s20 -20 20 -45 h-40 z M30 25 C18 25 15 38 18 50 C20 58 26 62 32 62 v-6 c-4 0 -8 -3 -9 -8 c-2 -8 0 -18 9 -18 z M70 25 C82 25 85 38 82 50 C80 58 74 62 68 62 v-6 c4 0 8 -3 9 -8 c2 -8 0 -18 -9 -18 z" fill="%23E2E8F0"/><circle cx="50" cy="38" r="6" fill="%2394A3B8"/></svg>`;

export const BALLON_DOR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="40" r="28" fill="%23F59E0B"/><path d="M50 12 a28 28 0 0 0 -20 47 l8 5 l12 -11 l12 11 l8 -5 a28 28 0 0 0 -20 -47 z" fill="%23FBBF24"/><rect x="35" y="75" width="30" height="15" rx="3" fill="%2378350F"/></svg>`;

export const LEFT_FOOT_TACTICAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M25 45 C30 30 42 20 55 25 L65 40 L50 65 L28 72 C22 74 18 68 20 62 z" fill="%2310B981"/><path d="M28 72 L18 80 C15 82 18 88 24 86 L50 78 C60 75 75 70 82 65 C85 62 82 55 76 56 L55 60 z" fill="%23059669"/><circle cx="82" cy="40" r="12" fill="%23FFFFFF" stroke="%2310B981" stroke-width="3"/></svg>`;

export const DARK_SKIN_SILHOUETTE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="36" r="22" fill="%23382218"/><path d="M15 90 C15 65 30 55 50 55 C70 55 85 65 85 90 Z" fill="%23382218"/><circle cx="50" cy="35" r="20" fill="%23523326"/></svg>`;

// -------------------------------------------------------------
// Bingo Card Generator (16 randomized cells per contestant with images)
// -------------------------------------------------------------
export const BINGO_CELL_POOL: Array<Omit<BingoCell, 'id' | 'isMarked'>> = [
  // الأندية الكبرى
  { title: 'ريال مدريد', description: 'لعب لنادي ريال مدريد', type: 'club', targetValue: 'ريال مدريد', imageUrl: STATIC_CLUBS.realmadrid.logoUrl },
  { title: 'برشلونة', description: 'لعب لنادي برشلونة', type: 'club', targetValue: 'برشلونة', imageUrl: STATIC_CLUBS.barcelona.logoUrl },
  { title: 'الهلال', description: 'لعب لنادي الهلال السعودي', type: 'club', targetValue: 'الهلال', imageUrl: STATIC_CLUBS.alhilal.logoUrl },
  { title: 'النصر', description: 'لعب لنادي النصر السعودي', type: 'club', targetValue: 'النصر', imageUrl: STATIC_CLUBS.alnassr.logoUrl },
  { title: 'الاتحاد', description: 'لعب لنادي الاتحاد السعودي', type: 'club', targetValue: 'الاتحاد', imageUrl: STATIC_CLUBS.ittihad.logoUrl },
  { title: 'الأهلي', description: 'لعب لنادي الأهلي السعودي', type: 'club', targetValue: 'الأهلي', imageUrl: STATIC_CLUBS.alahli.logoUrl },
  { title: 'مانشستر سيتي', description: 'لعب لمانشستر سيتي', type: 'club', targetValue: 'مانشستر سيتي', imageUrl: STATIC_CLUBS.mancity.logoUrl },
  { title: 'ليفربول', description: 'لعب لنادي ليفربول', type: 'club', targetValue: 'ليفربول', imageUrl: STATIC_CLUBS.liverpool.logoUrl },
  { title: 'بايرن ميونخ', description: 'لعب لبايرن ميونخ', type: 'club', targetValue: 'بايرن ميونخ', imageUrl: STATIC_CLUBS.bayern.logoUrl },
  { title: 'تشيلسي', description: 'لعب لنادي تشيلسي', type: 'club', targetValue: 'تشيلسي', imageUrl: STATIC_CLUBS.chelsea.logoUrl },
  { title: 'باريس سان جيرمان', description: 'لعب لباريس سان جيرمان', type: 'club', targetValue: 'باريس سان جيرمان', imageUrl: STATIC_CLUBS.psg.logoUrl },
  { title: 'أرسنال', description: 'لعب لنادي أرسنال', type: 'club', targetValue: 'أرسنال', imageUrl: STATIC_CLUBS.arsenal.logoUrl },
  { title: 'يوفنتوس', description: 'لعب لنادي يوفنتوس', type: 'club', targetValue: 'يوفنتوس', imageUrl: STATIC_CLUBS.juventus.logoUrl },
  { title: 'إنتر ميلان', description: 'لعب لإنتر ميلان', type: 'club', targetValue: 'إنتر', imageUrl: STATIC_CLUBS.inter.logoUrl },

  // البطولات والكؤوس
  { title: 'كأس العالم', description: 'حقق بطولة كأس العالم', type: 'trophy', targetValue: 'كأس العالم', imageUrl: STATIC_TROPHIES.world_cup.imageUrl },
  { title: 'دوري أبطال أوروبا', description: 'حقق دوري أبطال أوروبا', type: 'trophy', targetValue: 'دوري أبطال أوروبا', imageUrl: STATIC_TROPHIES.ucl.imageUrl },
  { title: 'الدوري الإنجليزي', description: 'حقق الدوري الإنجليزي', type: 'trophy', targetValue: 'الدوري الإنجليزي', imageUrl: STATIC_TROPHIES.premier_league.imageUrl },
  { title: 'دوري روشن', description: 'حقق دوري روشن السعودي', type: 'trophy', targetValue: 'دوري روشن', imageUrl: STATIC_TROPHIES.saudi_league.imageUrl },
  { title: 'الكرة الذهبية', description: 'توج بالكرة الذهبية', type: 'trophy', targetValue: 'الكرة الذهبية', imageUrl: BALLON_DOR_SVG },

  // المنتخبات والأعلام
  { title: 'البرازيل', description: 'جنسيته برازيلي', type: 'country', targetValue: 'البرازيل', imageUrl: 'https://flagcdn.com/w80/br.png' },
  { title: 'الأرجنتين', description: 'جنسيته أرجنتيني', type: 'country', targetValue: 'الأرجنتين', imageUrl: 'https://flagcdn.com/w80/ar.png' },
  { title: 'فرنسا', description: 'جنسيته فرنسي', type: 'country', targetValue: 'فرنسا', imageUrl: 'https://flagcdn.com/w80/fr.png' },
  { title: 'السعودية', description: 'جنسيته سعودي', type: 'country', targetValue: 'السعودية', imageUrl: 'https://flagcdn.com/w80/sa.png' },
  { title: 'إسبانيا', description: 'جنسيته إسباني', type: 'country', targetValue: 'إسبانيا', imageUrl: 'https://flagcdn.com/w80/es.png' },
  { title: 'البرتغال', description: 'جنسيته برتغالي', type: 'country', targetValue: 'البرتغال', imageUrl: 'https://flagcdn.com/w80/pt.png' },
  { title: 'ألمانيا', description: 'جنسيته ألماني', type: 'country', targetValue: 'ألمانيا', imageUrl: 'https://flagcdn.com/w80/de.png' },
  { title: 'إيطاليا', description: 'جنسيته إيطالي', type: 'country', targetValue: 'إيطاليا', imageUrl: 'https://flagcdn.com/w80/it.png' },
  { title: 'إنجلترا', description: 'جنسيته إنجليزي', type: 'country', targetValue: 'إنجلترا', imageUrl: 'https://flagcdn.com/w80/gb-eng.png' },
  { title: 'هولندا', description: 'جنسيته هولندي', type: 'country', targetValue: 'هولندا', imageUrl: 'https://flagcdn.com/w80/nl.png' },

  // المدربين (استخدام أيقونات موثوقة بدون روابط خارجية مكسورة)
  { title: 'درّبه غوارديولا', description: 'لعب تحت قيادة بيب غوارديولا', type: 'manager', targetValue: 'غوارديولا' },
  { title: 'درّبه أنشيلوتي', description: 'لعب تحت قيادة كارلو أنشيلوتي', type: 'manager', targetValue: 'أنشيلوتي' },
  { title: 'درّبه مورينيو', description: 'لعب تحت قيادة جوزيه مورينيو', type: 'manager', targetValue: 'مورينيو' },
  { title: 'درّبه زيدان', description: 'لعب تحت قيادة زين الدين زيدان', type: 'manager', targetValue: 'زيدان' },

  // المواصفات الخاصة
  { title: 'أشول (قدم يسرى)', description: 'يلعب بقدمه اليسرى', type: 'trait', targetValue: 'أشول' },
  { title: 'أسمر البشرة', description: 'من أصحاب البشرة السمراء', type: 'trait', targetValue: 'أسمر' },
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
  // Four Corners
  [0, 3, 12, 15],
];

export function checkBingoWin(cells: BingoCell[]): {
  isBingo: boolean;
  matchedVector?: number[];
} {
  for (const vector of BINGO_WIN_VECTORS) {
    const isWin = vector.every((idx) => cells[idx]?.isMarked);
    if (isWin) {
      return { isBingo: true, matchedVector: vector };
    }
  }
  return { isBingo: false };
}

export function getRandomRoulettePlayer(excludeIds: string[] = []): BingoRoulettePlayer {
  const available = STATIC_BINGO_PLAYERS.filter((p) => !excludeIds.includes(p.id));
  const pool = available.length > 0 ? available : STATIC_BINGO_PLAYERS;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    id: picked.id,
    name: picked.name,
    photoUrl: picked.imageUrl || picked.photoUrl || '',
    currentClub: picked.club || picked.currentClub || '',
    clubs: picked.clubs || [picked.club],
    nationality: picked.country || picked.nationality || '',
    trophies: picked.trophies || [],
    traits: picked.traits || [],
  };
}

/**
 * Pre-generate 16 cells and 20 roulette players and preload all images in the background
 */
export function generatePreloadedBingoPool(): {
  sampleCard: BingoCell[];
  roulettePool: BingoRoulettePlayer[];
} {
  const shuffledCells = [...BINGO_CELL_POOL].sort(() => Math.random() - 0.5).slice(0, 16);
  const sampleCard: BingoCell[] = shuffledCells.map((item, idx) => ({
    id: `cell_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    ...item,
    isMarked: false,
  }));

  const shuffledPlayers = [...STATIC_BINGO_PLAYERS].sort(() => Math.random() - 0.5).slice(0, 20);
  const roulettePool: BingoRoulettePlayer[] = shuffledPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    photoUrl: p.imageUrl || p.photoUrl || '',
    currentClub: p.club || p.currentClub || '',
    clubs: p.clubs || [p.club],
    nationality: p.country || p.nationality || '',
    trophies: p.trophies || [],
    traits: p.traits || [],
  }));

  const urlsToPreload: string[] = [
    ...sampleCard.map((c) => c.imageUrl),
    ...roulettePool.map((p) => p.photoUrl),
  ].filter((u): u is string => Boolean(u));
  preloadBingoBatch(urlsToPreload);

  return { sampleCard, roulettePool };
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
    // Left-footed check
    if (target.includes('أشول') || target.includes('يسار')) {
      const LEFTIES = ['ميسي', 'صلاح', 'مارادونا', 'روبن', 'دي ماريا', 'سيلفا', 'بيل', 'غريزمان', 'هالاند', 'روبرتو كارلوس', 'محرز', 'فان بيرسي', 'ديبالا', 'البا', 'ساكا', 'اوديجارد', 'فودين'];
      if (LEFTIES.some((l) => player.name.includes(l))) return true;
    }
    // Dark skin check
    if (target.includes('أسمر') || target.includes('سمراء')) {
      const DARK_SKIN = ['كانتي', 'فينيسيوس', 'مبابي', 'كوليبالي', 'بوغبا', 'توريه', 'ماني', 'ديمبيلي', 'كامافينغا', 'دروغبا', 'ايتو', 'رونالدينيو', 'بيليه', 'هنري', 'تشواميني', 'ساكا', 'روديغر', 'الابا', 'اوسيمين', 'البليهي', 'هوساوي', 'كانو', 'راشفورد', 'رودريغو', 'لوكاكو'];
      if (DARK_SKIN.some((d) => player.name.includes(d))) return true;
    }
  }

  // 5. Manager check
  if (cell.type === 'manager') {
    if (target.includes('غوارديولا') && player.clubs?.some((c) => ['برشلونة', 'بايرن ميونخ', 'مانشستر سيتي'].includes(c))) return true;
    if (target.includes('أنشيلوتي') && player.clubs?.some((c) => ['ريال مدريد', 'ميلان', 'تشيلسي', 'باريس سان جيرمان', 'بايرن ميونخ'].includes(c))) return true;
    if (target.includes('مورينيو') && player.clubs?.some((c) => ['ريال مدريد', 'تشيلسي', 'إنتر', 'مانشستر يونايتد', 'روما', 'بورتو'].includes(c))) return true;
    if (target.includes('زيدان') && player.clubs?.some((c) => ['ريال مدريد'].includes(c))) return true;
    if (target.includes('خيسوس') && player.clubs?.some((c) => ['الهلال', 'بنفيكا', 'فلامنغو', 'فنربخشة'].includes(c))) return true;
  }

  return false;
}
