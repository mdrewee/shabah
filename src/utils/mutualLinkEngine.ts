import {
  PLAYERS_DB,
  CLUBS_DB,
  getMutualPlayers,
  getMutualClubs,
  normalizeArabicFootball,
  validateMutualAnswer,
  FootballPlayerRecord,
  ClubRecord,
} from './footballHistoryEngine';
import { getMutualPlayersFromDb } from '../lib/footballDatabase';

export type MutualLinkType = 'PLAYER_TO_PLAYER' | 'CLUB_TO_CLUB';

export interface MutualLinkChallenge {
  id: string;
  type: MutualLinkType;
  entityA: { id?: string; name: string; image: string };
  entityB: { id?: string; name: string; image: string };
  validAnswers: string[]; // Normalized strings for instant exhaustive matching
  validDisplayNames: string[]; // All valid human-readable answer names
  revealItem: {
    id?: string;
    name: string;
    image: string;
    subtitle?: string;
  };
  matchingPlayers?: {
    id: string;
    name: string;
    photo?: string;
    aliases: string[];
  }[];
}

export const TOTAL_ROUNDS = 10;

/**
 * Helper to get club badge from local CLUBS_DB or fallback
 */
export const getClubBadge = (clubName: string): string => {
  const norm = normalizeArabicFootball(clubName);
  const found = CLUBS_DB.find(
    (c) => normalizeArabicFootball(c.name) === norm ||
           c.aliases.some((a) => normalizeArabicFootball(a) === norm)
  );
  return found?.badgeUrl || '/assets/football/default-club.svg';
};

/**
 * Expand club names into all valid normalized search terms and aliases
 */
export function expandClubAnswers(clubNames: string[]): string[] {
  const result = new Set<string>();

  for (const cName of clubNames) {
    result.add(normalizeArabicFootball(cName));
    if (cName.startsWith('ال')) {
      result.add(normalizeArabicFootball(cName.slice(2)));
    }

    const norm = normalizeArabicFootball(cName);
    const club = CLUBS_DB.find(
      (c) => normalizeArabicFootball(c.name) === norm ||
             c.aliases.some((a) => normalizeArabicFootball(a) === norm)
    );

    if (club) {
      result.add(normalizeArabicFootball(club.name));
      if (club.name.startsWith('ال')) {
        result.add(normalizeArabicFootball(club.name.slice(2)));
      }
      club.aliases.forEach((a) => {
        result.add(normalizeArabicFootball(a));
        if (a.startsWith('ال')) {
          result.add(normalizeArabicFootball(a.slice(2)));
        }
      });
    }
  }

  return Array.from(result).filter(Boolean);
}

/**
 * Procedural Question Generator for "حلقة الوصل"
 * Clubs Only Rule (منع المنتخبات نهائياً):
 * - Strictly 10 rounds (TOTAL_ROUNDS = 10).
 * - Club-to-Club: Answer is ANY mutual player who represented both clubs.
 * - Player-to-Player: Answer is ANY mutual club shared between both players.
 * Guaranteed 0ms offline execution directly against PLAYERS_DB and CLUBS_DB.
 */
export const generateMutualLinkChallenges = (count = TOTAL_ROUNDS): MutualLinkChallenge[] => {
  const challenges: MutualLinkChallenge[] = [];
  const players = PLAYERS_DB;
  const clubs = CLUBS_DB;

  // Curate all valid clubs with at least 1 player
  const activeClubs = clubs.filter((club) =>
    players.some((p) => p.clubs.includes(club.name))
  );

  const usedSignatures = new Set<string>();

  // Pre-identified classic rivalries / high-connection pairings
  const popularClubPairs: [string, string][] = [
    ['الهلال', 'الاتحاد'],
    ['ريال مدريد', 'برشلونة'],
    ['مانشستر يونايتد', 'ريال مدريد'],
    ['تشيلسي', 'أرسنال'],
    ['ليفربول', 'مانشستر سيتي'],
    ['أياكس أمستردام', 'برشلونة'],
    ['يوفنتوس', 'ميلان'],
    ['إنتر ميلان', 'ميلان'],
    ['الهلال', 'النصر'],
    ['الأهلي', 'الاتحاد'],
    ['باريس سان جيرمان', 'برشلونة'],
    ['بايرن ميونخ', 'بوروسيا دورتموند'],
    ['مانشستر يونايتد', 'أياكس أمستردام'],
    ['تشيلسي', 'ريال مدريد'],
    ['أرسنال', 'مانشستر سيتي'],
    ['الهلال', 'الشباب'],
    ['الاتحاد', 'القادسية'],
    ['بنفيكا', 'أتلتيكو مدريد'],
    ['بورتو', 'ريال مدريد'],
    ['سبورتينغ لشبونة', 'مانشستر يونايتد'],
    ['بي إس في آيندهوفن', 'برشلونة'],
    ['فاينورد روتردام', 'ليفربول'],
  ];

  for (let i = 0; i < count; i++) {
    // Alternate 50% Club-to-Club and 50% Player-to-Player
    const isClubMode = i % 2 === 0;

    if (isClubMode) {
      let clubA = '', clubB = '';
      let mutualPlayers: FootballPlayerRecord[] = [];
      let attempts = 0;

      // Try popular pairs first if available
      for (const [pA, pB] of popularClubPairs) {
        const sig = [pA, pB].sort().join('___');
        if (!usedSignatures.has(sig)) {
          const matches = getMutualPlayers(pA, pB);
          if (matches.length > 0) {
            clubA = pA;
            clubB = pB;
            mutualPlayers = matches;
            break;
          }
        }
      }

      // Random search fallback
      while (mutualPlayers.length === 0 && attempts < 100) {
        attempts++;
        const c1 = activeClubs[Math.floor(Math.random() * activeClubs.length)];
        const c2 = activeClubs[Math.floor(Math.random() * activeClubs.length)];
        if (!c1 || !c2 || c1.name === c2.name) continue;

        const sig = [c1.name, c2.name].sort().join('___');
        if (usedSignatures.has(sig)) continue;

        const matches = getMutualPlayers(c1.name, c2.name);
        if (matches.length > 0) {
          clubA = c1.name;
          clubB = c2.name;
          mutualPlayers = matches;
        }
      }

      if (mutualPlayers.length > 0) {
        const sig = [clubA, clubB].sort().join('___');
        usedSignatures.add(sig);

        // Pick primary hero (prefer player with photo)
        const primaryHero = mutualPlayers.find((p) => p.photo && !p.photo.includes('default')) || mutualPlayers[0];

        // Exhaustive validAnswers: includes ALL matching players and their aliases
        const validAnswersSet = new Set<string>();
        mutualPlayers.forEach((p) => {
          validAnswersSet.add(normalizeArabicFootball(p.name));
          if (p.name.startsWith('ال')) {
            validAnswersSet.add(normalizeArabicFootball(p.name.slice(2)));
          }
          p.aliases.forEach((a) => {
            validAnswersSet.add(normalizeArabicFootball(a));
            if (a.startsWith('ال')) {
              validAnswersSet.add(normalizeArabicFootball(a.slice(2)));
            }
          });
        });

        const validDisplayNames = mutualPlayers.map((p) => p.name);

        challenges.push({
          id: `ml_club_${Date.now()}_${i}`,
          type: 'CLUB_TO_CLUB',
          entityA: { name: clubA, image: getClubBadge(clubA) },
          entityB: { name: clubB, image: getClubBadge(clubB) },
          validAnswers: Array.from(validAnswersSet),
          validDisplayNames,
          revealItem: {
            id: primaryHero.id,
            name: primaryHero.name,
            image: primaryHero.photo,
            subtitle: `لعب مع ${clubA} و ${clubB}`,
          },
          matchingPlayers: mutualPlayers.map((p) => ({
            id: p.id,
            name: p.name,
            photo: p.photo,
            aliases: p.aliases,
          })),
        });
        continue;
      }
    }

    // Player-to-Player Mode: Find 2 players with at least 1 mutual CLUB (STRICTLY CLUBS ONLY - NO NATIONAL TEAMS)
    let pA: FootballPlayerRecord | null = null;
    let pB: FootballPlayerRecord | null = null;
    let mutualClubs: string[] = [];
    let pAttempts = 0;

    while (mutualClubs.length === 0 && pAttempts < 150) {
      pAttempts++;
      pA = players[Math.floor(Math.random() * players.length)];
      pB = players[Math.floor(Math.random() * players.length)];
      if (!pA || !pB || pA.id === pB.id) continue;

      const sig = [pA.id, pB.id].sort().join('___');
      if (usedSignatures.has(sig)) continue;

      mutualClubs = getMutualClubs(pA.id, pB.id);
    }

    if (pA && pB && mutualClubs.length > 0) {
      const sig = [pA.id, pB.id].sort().join('___');
      usedSignatures.add(sig);

      const primaryClub = mutualClubs[0];
      const validAnswers = expandClubAnswers(mutualClubs);

      challenges.push({
        id: `ml_player_${Date.now()}_${i}`,
        type: 'PLAYER_TO_PLAYER',
        entityA: { id: pA.id, name: pA.name, image: pA.photo },
        entityB: { id: pB.id, name: pB.name, image: pB.photo },
        validAnswers,
        validDisplayNames: mutualClubs,
        revealItem: {
          id: primaryClub,
          name: primaryClub,
          image: getClubBadge(primaryClub),
          subtitle: `نادي مشترك بين ${pA.name} و ${pB.name}`,
        },
      });
    }
  }

  // Ensure exactly count challenges
  return challenges.slice(0, count);
};

/**
 * Asynchronously enrich challenge answers from Supabase historical database if available
 */
export async function enrichChallengeFromDb(challenge: MutualLinkChallenge): Promise<MutualLinkChallenge> {
  if (challenge.type === 'CLUB_TO_CLUB') {
    try {
      const dbPlayers = await getMutualPlayersFromDb(challenge.entityA.name, challenge.entityB.name);
      if (dbPlayers && dbPlayers.length > 0) {
        const answersSet = new Set(challenge.validAnswers);
        const displayNamesSet = new Set(challenge.validDisplayNames);

        dbPlayers.forEach((p) => {
          answersSet.add(normalizeArabicFootball(p.name));
          if (p.name.startsWith('ال')) {
            answersSet.add(normalizeArabicFootball(p.name.slice(2)));
          }
          displayNamesSet.add(p.name);
        });

        return {
          ...challenge,
          validAnswers: Array.from(answersSet),
          validDisplayNames: Array.from(displayNamesSet),
        };
      }
    } catch {
      // Fallback silently to in-memory data
    }
  }

  return challenge;
}
