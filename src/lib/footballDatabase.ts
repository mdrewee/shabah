import { supabase } from './supabase';
import { FOOTBALL_PLAYERS_MASTER } from '../data/footballMasterData';
import { normalizeArabicFootball } from '../utils/footballSearch';

export interface HistoricalPlayer {
  id: string;
  name_ar: string;
  name_en?: string | null;
  photo_url?: string | null;
  nationality_ar?: string | null;
  current_club_ar?: string | null;
}

export interface PlayerCareerClub {
  id: number;
  player_id: string;
  club_name_ar: string;
  club_name_en?: string | null;
  order_index: number;
}

/**
 * 1. Fetch all mutual players between two clubs (Exhaustive Historical Search)
 * First attempts Supabase RPC 'get_mutual_players'.
 * If offline or error, gracefully falls back to the in-memory master dataset.
 */
export async function getMutualPlayersFromDb(
  clubA: string,
  clubB: string
): Promise<{ id: string; name: string; photo?: string }[]> {
  try {
    const { data, error } = await supabase.rpc('get_mutual_players', {
      club_a: clubA,
      club_b: clubB,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => ({
        id: row.player_id,
        name: row.player_name,
        photo: row.photo || undefined,
      }));
    }
  } catch (err) {
    console.warn('[footballDatabase] RPC get_mutual_players error, using fallback:', err);
  }

  // Resilient offline fallback using local dataset
  const normA = normalizeArabicFootball(clubA);
  const normB = normalizeArabicFootball(clubB);

  const matched = FOOTBALL_PLAYERS_MASTER.filter(p => {
    const pClubs = p.clubs.map(c => normalizeArabicFootball(c));
    return pClubs.includes(normA) && pClubs.includes(normB);
  });

  return matched.map(p => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
  }));
}

/**
 * 2. Fetch all mutual clubs between two players (CLUBS ONLY - NO NATIONAL TEAMS)
 * Calls Supabase RPC 'get_mutual_clubs'.
 */
export async function getMutualClubsFromDb(
  playerAId: string,
  playerBId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_mutual_clubs', {
      player_a_id: playerAId,
      player_b_id: playerBId,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => row.club_name);
    }
  } catch (err) {
    console.warn('[footballDatabase] RPC get_mutual_clubs error, using fallback:', err);
  }

  // Local fallback
  const pA = FOOTBALL_PLAYERS_MASTER.find(p => p.id === playerAId);
  const pB = FOOTBALL_PLAYERS_MASTER.find(p => p.id === playerBId);
  if (!pA || !pB) return [];

  const normBClubs = pB.clubs.map(c => normalizeArabicFootball(c));
  return pA.clubs.filter(c => normBClubs.includes(normalizeArabicFootball(c)));
}

/**
 * 3. Reusable API for "مسيرة لاعب" (career-path)
 * Fetches authentic chronological career trajectory for any player
 */
export async function fetchPlayerCareerPath(
  playerId: string
): Promise<{ order: number; clubName: string }[]> {
  try {
    const { data, error } = await supabase
      .from('player_career_clubs')
      .select('order_index, club_name_ar')
      .eq('player_id', playerId)
      .order('order_index', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(row => ({
        order: row.order_index,
        clubName: row.club_name_ar,
      }));
    }
  } catch (err) {
    console.warn('[footballDatabase] fetchPlayerCareerPath error, using fallback:', err);
  }

  // Local fallback
  const p = FOOTBALL_PLAYERS_MASTER.find(x => x.id === playerId);
  if (!p || !p.clubs) return [];

  return p.clubs.map((club, idx) => ({
    order: idx + 1,
    clubName: club,
  }));
}

/**
 * 4. Reusable API for "كوّن فريقك" (draft-5)
 * Queries player details and career history to validate draft constraints
 */
export async function validateDraftPlayerSelection(
  playerId: string,
  requiredClubOrCountry?: string
): Promise<{ valid: boolean; player?: HistoricalPlayer; clubs: string[] }> {
  try {
    const [pRes, cRes] = await Promise.all([
      supabase.from('football_players').select('*').eq('id', playerId).single(),
      supabase.from('player_career_clubs').select('club_name_ar').eq('player_id', playerId),
    ]);

    if (!pRes.error && pRes.data) {
      const clubs = (cRes.data || []).map(r => r.club_name_ar);
      let valid = true;
      if (requiredClubOrCountry) {
        const normReq = normalizeArabicFootball(requiredClubOrCountry);
        const normClubs = clubs.map(c => normalizeArabicFootball(c));
        const normNat = normalizeArabicFootball(pRes.data.nationality_ar || '');
        valid = normClubs.includes(normReq) || normNat === normReq;
      }
      return { valid, player: pRes.data, clubs };
    }
  } catch (err) {
    console.warn('[footballDatabase] validateDraftPlayerSelection error, using fallback:', err);
  }

  // Local fallback
  const p = FOOTBALL_PLAYERS_MASTER.find(x => x.id === playerId);
  if (!p) return { valid: false, clubs: [] };

  let valid = true;
  if (requiredClubOrCountry) {
    const normReq = normalizeArabicFootball(requiredClubOrCountry);
    const normClubs = p.clubs.map(c => normalizeArabicFootball(c));
    const normNat = normalizeArabicFootball(p.nationality || '');
    valid = normClubs.includes(normReq) || normNat === normReq;
  }

  return {
    valid,
    player: {
      id: p.id,
      name_ar: p.name,
      photo_url: p.photo,
      nationality_ar: p.nationality,
      current_club_ar: p.currentClub,
    },
    clubs: p.clubs,
  };
}
