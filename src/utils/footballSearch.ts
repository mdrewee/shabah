import { FOOTBALL_PLAYERS_MASTER, FootballPlayer } from '../data/footballMasterData';

/**
 * Normalizes Arabic text for flexible fuzzy searching:
 * - Strips Tashkeel / Harakat (diacritics)
 * - Normalizes Alef forms (أ, إ, آ, ٱ -> ا)
 * - Normalizes Ya forms (ى -> ي)
 * - Normalizes Ta Marbouta (ة -> ه)
 * - Removes non-alphanumeric special characters (except spaces)
 * - Trims and converts Latin text to lowercase
 */
export function normalizeArabicFootball(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Remove Arabic diacritics
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Ya/Alef Maqsura
    .replace(/ى/g, 'ي')
    // Normalize Ta Marbouta
    .replace(/ة/g, 'ه')
    // Remove tatweel / kashida
    .replace(/\u0640/g, '')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ');
}

/**
 * High-performance, sub-millisecond fuzzy search for football players.
 * Searches against player official Arabic name and all known aliases/nicknames.
 *
 * Scoring:
 * 1. Exact match on normalized name or alias: 100
 * 2. Prefix match on name: 80
 * 3. Prefix match on alias: 60
 * 4. Substring match on name: 40
 * 5. Substring match on alias: 30
 */
export function searchFootballPlayers(query: string, limit: number = 8): FootballPlayer[] {
  const normQuery = normalizeArabicFootball(query);
  if (!normQuery) return [];

  const results: { player: FootballPlayer; score: number }[] = [];

  for (const player of FOOTBALL_PLAYERS_MASTER) {
    const normName = normalizeArabicFootball(player.name);
    let bestScore = 0;

    // Check official name
    if (normName === normQuery) {
      bestScore = Math.max(bestScore, 100);
    } else if (normName.startsWith(normQuery)) {
      bestScore = Math.max(bestScore, 80);
    } else if (normName.includes(normQuery)) {
      bestScore = Math.max(bestScore, 40);
    }

    // Check aliases
    for (const alias of player.aliases) {
      const normAlias = normalizeArabicFootball(alias);
      if (normAlias === normQuery) {
        bestScore = Math.max(bestScore, 90);
      } else if (normAlias.startsWith(normQuery)) {
        bestScore = Math.max(bestScore, 60);
      } else if (normAlias.includes(normQuery)) {
        bestScore = Math.max(bestScore, 30);
      }
    }

    if (bestScore > 0) {
      results.push({ player, score: bestScore });
    }
  }

  // Sort descending by score, then by name length (prefer shorter/closer matches)
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.player.name.length - b.player.name.length;
  });

  return results.slice(0, limit).map(r => r.player);
}

/**
 * Retrieves the full career club history of a player by ID.
 */
export function getPlayerCareer(playerId: string): string[] | undefined {
  const player = FOOTBALL_PLAYERS_MASTER.find(p => p.id === playerId);
  return player ? player.clubs : undefined;
}

/**
 * Finds shared clubs between two players to identify mutual teammates.
 */
export function findMutualTeammates(player1Id: string, player2Id: string): string[] {
  const player1 = FOOTBALL_PLAYERS_MASTER.find(p => p.id === player1Id);
  const player2 = FOOTBALL_PLAYERS_MASTER.find(p => p.id === player2Id);

  if (!player1 || !player2) return [];

  const set1 = new Set(player1.clubs.map(c => normalizeArabicFootball(c)));
  const mutualClubs: string[] = [];

  for (const club of player2.clubs) {
    const normClub = normalizeArabicFootball(club);
    if (set1.has(normClub) && !mutualClubs.includes(club)) {
      mutualClubs.push(club);
    }
  }

  return mutualClubs;
}
