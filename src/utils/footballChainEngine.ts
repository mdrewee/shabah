import { ChainPlayer, ChainStep } from '../pages/football/football-chain/types';
import { PLAYERS_DB, normalizeArabicFootball } from './footballHistoryEngine';
import { FOOTBALL_PLAYERS_MASTER, FootballPlayer } from '../data/footballMasterData';

export type { ChainPlayer, ChainStep };

export interface GeneratedChallenge {
  id: string;
  startPlayer: ChainPlayer;
  targetPlayer: ChainPlayer;
  minHops?: number;
}

/**
 * Normalizes club names for robust Arabic string matching:
 * - Uses normalizeArabicFootball from history engine
 * - Strips leading 'ال' and trims whitespace
 */
export const normalizeClub = (clubName: string): string => {
  if (!clubName) return '';
  return normalizeArabicFootball(clubName).replace(/\s+/g, '');
};

/**
 * Normalizes player names for collision and loop checks
 */
export const normalizePlayerName = (name: string): string => {
  if (!name) return '';
  return normalizeArabicFootball(name).replace(/\s+/g, ' ');
};

/**
 * Check if two players ever shared a senior club or national team.
 * STRICT: Returns entity name if they ever played together, or null if completely disconnected.
 */
export const getConnectingEntity = (
  playerA: ChainPlayer,
  playerB: ChainPlayer
): string | null => {
  if (!playerA || !playerB) return null;

  // 1. Check shared national team
  const natA = playerA.nationalTeam || playerA.nationality;
  const natB = playerB.nationalTeam || playerB.nationality;
  if (
    natA &&
    natB &&
    normalizeArabicFootball(natA) === normalizeArabicFootball(natB)
  ) {
    return `منتخب ${natA.trim()}`;
  }

  // 2. Check shared clubs
  if (playerA.clubs && playerB.clubs && playerA.clubs.length > 0 && playerB.clubs.length > 0) {
    const cleanClubsB = playerB.clubs.map((c) => normalizeClub(c));
    const sharedClub = playerA.clubs.find((club) => {
      const cleanA = normalizeClub(club);
      return cleanClubsB.some(
        (cleanB) => cleanA === cleanB || (cleanA.length > 3 && cleanB.length > 3 && (cleanA.includes(cleanB) || cleanB.includes(cleanA)))
      );
    });

    if (sharedClub) {
      return sharedClub;
    }
  }

  return null;
};

/**
 * Helper to build a complete ChainPlayer from a DB player record,
 * cross-referencing national team and photo if available.
 */
const buildChainPlayerFromRecord = (p: {
  id: string;
  name: string;
  photo?: string;
  clubs: string[];
  aliases?: string[];
}): ChainPlayer => {
  const masterMatch = FOOTBALL_PLAYERS_MASTER.find(
    (m) => m.id === p.id || normalizeArabicFootball(m.name) === normalizeArabicFootball(p.name)
  );

  return {
    id: p.id,
    name: p.name,
    photo: p.photo || masterMatch?.photo || '',
    photoUrl: p.photo || masterMatch?.photo || '',
    clubs: p.clubs || [],
    nationalTeam: masterMatch?.nationality || undefined,
    nationality: masterMatch?.nationality || undefined,
    nationalityCode: masterMatch?.nationalityCode || undefined,
    currentClub: masterMatch?.currentClub || p.clubs[0] || '',
    position: masterMatch?.position || undefined,
  };
};

/**
 * 100% Procedural Random Challenge Generator (STRICTLY NO DIRECT TEAMMATES)
 * Dynamically picks two disconnected players from memory.
 * Guaranteed distance >= 2 hops (they NEVER played together in any club or national team).
 */
export const generateRandomChainChallenge = (
  usedPairsSet: Set<string>
): GeneratedChallenge => {
  // Pool of viable players: players with at least 2 clubs so they are linkable
  const eligibleRecords = PLAYERS_DB.filter(
    (p) => p.clubs && p.clubs.length >= 2 && p.name && p.name.trim().length > 0
  );

  if (eligibleRecords.length < 2) {
    throw new Error('Not enough players in PLAYERS_DB to generate a chain challenge');
  }

  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const idxA = Math.floor(Math.random() * eligibleRecords.length);
    let idxB = Math.floor(Math.random() * eligibleRecords.length);
    while (idxB === idxA) {
      idxB = Math.floor(Math.random() * eligibleRecords.length);
    }

    const recA = eligibleRecords[idxA];
    const recB = eligibleRecords[idxB];
    const pairKey = [recA.id, recB.id].sort().join('___');

    if (usedPairsSet.has(pairKey)) continue;

    const playerA = buildChainPlayerFromRecord(recA);
    const playerB = buildChainPlayerFromRecord(recB);

    // STRICT RULE: They must NOT have any shared club or national team!
    const directLink = getConnectingEntity(playerA, playerB);
    if (!directLink) {
      usedPairsSet.add(pairKey);
      return {
        id: `chain_${Date.now()}_${pairKey}`,
        startPlayer: playerA,
        targetPlayer: playerB,
        minHops: 3,
      };
    }
  }

  // Fallback safe pick: search for any two disconnected eligible players
  for (let i = 0; i < eligibleRecords.length; i++) {
    const candidateA = buildChainPlayerFromRecord(eligibleRecords[i]);
    for (let j = eligibleRecords.length - 1; j > i; j--) {
      const candidateB = buildChainPlayerFromRecord(eligibleRecords[j]);
      if (!getConnectingEntity(candidateA, candidateB)) {
        return {
          id: `chain_fallback_${Date.now()}`,
          startPlayer: candidateA,
          targetPlayer: candidateB,
          minHops: 3,
        };
      }
    }
  }

  const pA = buildChainPlayerFromRecord(eligibleRecords[0]);
  const pB = buildChainPlayerFromRecord(eligibleRecords[eligibleRecords.length - 1]);
  return {
    id: `chain_fallback_${Date.now()}`,
    startPlayer: pA,
    targetPlayer: pB,
    minHops: 3,
  };
};

/**
 * Converts FootballPlayer from master data to ChainPlayer
 */
export const toChainPlayer = (p: FootballPlayer): ChainPlayer => ({
  id: p.id,
  name: p.name,
  photo: p.photo,
  photoUrl: p.photo,
  nationality: p.nationality,
  nationalTeam: p.nationality,
  nationalityCode: p.nationalityCode,
  clubs: p.clubs || [],
  currentClub: p.currentClub,
  position: p.position,
});

/**
 * Finds a player in the master dataset by ID or approximate name
 */
export const findChainPlayer = (query: string): ChainPlayer | null => {
  const normQuery = normalizePlayerName(query);
  if (!normQuery) return null;

  const found = FOOTBALL_PLAYERS_MASTER.find((p) => {
    if (p.id === query) return true;
    if (normalizePlayerName(p.name) === normQuery) return true;
    if (p.aliases && p.aliases.some((a) => normalizePlayerName(a) === normQuery)) return true;
    return false;
  });

  if (found) return toChainPlayer(found);

  const histFound = PLAYERS_DB.find((p) => {
    if (p.id === query) return true;
    if (normalizePlayerName(p.name) === normQuery) return true;
    if (p.aliases && p.aliases.some((a) => normalizePlayerName(a) === normQuery)) return true;
    return false;
  });

  return histFound ? buildChainPlayerFromRecord(histFound) : null;
};
