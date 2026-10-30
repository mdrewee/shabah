import { FOOTBALL_PLAYERS_MASTER, FootballPlayer } from '../../../data/footballMasterData';
import { ADDITIONAL_100_PLAYERS } from '../../../data/footballPlayers';

export interface FootballSearchResult {
  id: string;
  name: string;
  photoUrl?: string;
  currentClub?: string;
  clubs?: string[];
  nationality?: string;
  position?: 'GK' | 'DEF' | 'MID' | 'FWD';
  isLocalDb: boolean;
}

/**
 * Robust Arabic and Latin text normalizer for accurate football searches
 */
export function normalizeFootballSearch(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic Tashkeel / Harakat
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\-_.]/g, ' ')
    .replace(/\s+/g, ' ');
}

// In-memory index of 500+ local players (master DB + additional 100 global stars)
const localMasterItems: Array<{
  player: FootballPlayer;
  searchHaystack: string;
}> = FOOTBALL_PLAYERS_MASTER.map((p) => {
  const haystack = [
    p.name,
    ...(p.aliases || []),
    p.nationality || '',
    p.currentClub || '',
    ...(p.clubs || []),
  ]
    .map(normalizeFootballSearch)
    .join(' ');

  return { player: p, searchHaystack: haystack };
});

const additional100Items: Array<{
  player: FootballPlayer;
  searchHaystack: string;
}> = ADDITIONAL_100_PLAYERS.map((p) => {
  const haystack = [p.name, p.nameEn].map(normalizeFootballSearch).join(' ');
  const playerObj: FootballPlayer = {
    id: p.id,
    name: p.name,
    nationality: '',
    position: 'FWD',
    rating: 88,
  };
  return { player: playerObj, searchHaystack: haystack };
});

const localPlayersIndex = [...localMasterItems, ...additional100Items];

/**
 * 1. Search local master database with instant synchronous responsiveness
 */
export function searchLocalFootballPlayers(query: string, limit = 8): FootballSearchResult[] {
  const normQ = normalizeFootballSearch(query);
  if (!normQ || normQ.length < 2) return [];

  const matched: FootballSearchResult[] = [];

  for (const item of localPlayersIndex) {
    if (item.searchHaystack.includes(normQ)) {
      matched.push({
        id: item.player.id,
        name: item.player.name,
        photoUrl: item.player.photo,
        currentClub: item.player.currentClub,
        clubs: item.player.clubs,
        nationality: item.player.nationality,
        position: item.player.position,
        isLocalDb: true,
      });
      if (matched.length >= limit) break;
    }
  }

  return matched;
}

/**
 * 2. Search TheSportsDB API as live online fallback
 */
export async function searchTheSportsDbApi(query: string): Promise<FootballSearchResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 3) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(cleanQ)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.player)) return [];

    return data.player.slice(0, 5).map((p: any) => {
      let mappedPos: 'GK' | 'DEF' | 'MID' | 'FWD' = 'FWD';
      const posStr = (p.strPosition || '').toLowerCase();
      if (posStr.includes('goalkeeper')) mappedPos = 'GK';
      else if (posStr.includes('defen') || posStr.includes('back')) mappedPos = 'DEF';
      else if (posStr.includes('midfield')) mappedPos = 'MID';

      return {
        id: `sportsdb_${p.idPlayer}`,
        name: p.strPlayer,
        photoUrl: p.strCutout || p.strThumb || undefined,
        currentClub: p.strTeam,
        nationality: p.strNationality,
        position: mappedPos,
        isLocalDb: false,
      };
    });
  } catch {
    return [];
  }
}

/**
 * 3. Unified hybrid search combining local verified DB with TheSportsDB API
 */
export async function hybridFootballSearch(query: string): Promise<FootballSearchResult[]> {
  const localResults = searchLocalFootballPlayers(query, 7);
  if (localResults.length >= 4) {
    return localResults;
  }

  try {
    const apiResults = await searchTheSportsDbApi(query);
    const existingNames = new Set(localResults.map((r) => normalizeFootballSearch(r.name)));
    const uniqueApi = apiResults.filter((r) => !existingNames.has(normalizeFootballSearch(r.name)));
    return [...localResults, ...uniqueApi].slice(0, 8);
  } catch {
    return localResults;
  }
}

/**
 * 4. Resolve footballer from name (local DB exact match or fallback)
 */
export function resolveFootballerByName(name: string): FootballPlayer | null {
  const normQ = normalizeFootballSearch(name);
  if (!normQ) return null;

  for (const item of localPlayersIndex) {
    const pNorm = normalizeFootballSearch(item.player.name);
    if (pNorm === normQ) return item.player;
    if (item.player.aliases?.some((a) => normalizeFootballSearch(a) === normQ)) {
      return item.player;
    }
  }

  // Substring match if name is long enough
  if (normQ.length >= 4) {
    for (const item of localPlayersIndex) {
      const pNorm = normalizeFootballSearch(item.player.name);
      if (pNorm.includes(normQ) || normQ.includes(pNorm)) {
        return item.player;
      }
    }
  }

  return null;
}

/**
 * 5. Clean SVG Player Silhouette Data URI (Brutalist fallback when photo is missing)
 */
export const SILHOUETTE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23FFFFFF"><circle cx="50" cy="35" r="20" fill="%230A0A0A"/><path d="M15 90 C15 65 30 55 50 55 C70 55 85 65 85 90 Z" fill="%230A0A0A"/></svg>`;
