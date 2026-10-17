import { WikidataClub, WIKIDATA_CLUBS } from '../data/wikidataClubs';
import { MutualLinkChallenge } from '../pages/football/mutual-link/types';

export { WIKIDATA_CLUBS };
export type { WikidataClub };

export interface LiveMatchedPlayer {
  id: string;
  nameAr: string;
  nameEn: string;
  photoUrl: string;
}

export type LiveChallenge = MutualLinkChallenge;

export const normalizeArabicFootball = (text: string): string => {
  return (text || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/\s+/g, '') // Strips spaces: "حمد الله" -> "حمدالله"
    .replace(/^ال/g, '') // Strips leading "ال"
    .replace(/[\u064B-\u065F\u0670]/g, '');
};

// In-memory cache to ensure instant retrieval if same pair is queried again
const mutualPlayersCache = new Map<string, LiveMatchedPlayer[]>();

/**
 * Fetch every player who played for Club A and Club B from Wikidata SPARQL API live
 */
export const fetchMutualPlayersFromWikidata = async (
  clubA: WikidataClub,
  clubB: WikidataClub
): Promise<LiveMatchedPlayer[]> => {
  const pairKey = [clubA.id, clubB.id].sort().join('___');
  if (mutualPlayersCache.has(pairKey)) {
    return mutualPlayersCache.get(pairKey)!;
  }

  const teamAQids = (clubA.qids || [clubA.qid]).map((q) => `wd:${q}`).join(' ');
  const teamBQids = (clubB.qids || [clubB.qid]).map((q) => `wd:${q}`).join(' ');

  const sparqlQuery = `
    SELECT DISTINCT ?player ?nameAr ?nameEn ?image WHERE {
      VALUES ?teamA { ${teamAQids} }
      VALUES ?teamB { ${teamBQids} }
      ?player wdt:P106 wd:Q937857;
              wdt:P54 ?teamA;
              wdt:P54 ?teamB.
      OPTIONAL {
        ?player rdfs:label ?nameAr.
        FILTER(LANG(?nameAr) = "ar")
      }
      OPTIONAL {
        ?player rdfs:label ?nameEn.
        FILTER(LANG(?nameEn) = "en")
      }
      OPTIONAL { ?player wdt:P18 ?image. }
    }
    LIMIT 50
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'MayyazFootballGame/2.0 (web-app@mayyaz.com)',
      },
    });

    if (!res.ok) {
      console.warn(`[Wikidata] Status ${res.status} for ${clubA.name} x ${clubB.name}`);
      return [];
    }

    const json = await res.json();
    const bindings = json.results?.bindings || [];
    const results: LiveMatchedPlayer[] = [];

    for (const b of bindings) {
      const qid = b.player?.value?.split('/').pop() || '';
      const nameAr = b.nameAr?.value || '';
      const nameEn = b.nameEn?.value || '';
      const rawImage = b.image?.value || '';

      // Must have at least an Arabic or English name
      const primaryName = nameAr || nameEn;
      if (!primaryName) continue;

      // Safe image routing through weserv image cache proxy
      let safePhoto = '';
      if (rawImage) {
        const clean = rawImage.replace(/^https?:\/\//, '');
        safePhoto = `https://images.weserv.nl/?url=${encodeURIComponent(clean)}&w=250&output=webp`;
      }

      results.push({
        id: qid,
        nameAr: primaryName,
        nameEn: nameEn,
        photoUrl: safePhoto,
      });
    }

    mutualPlayersCache.set(pairKey, results);
    return results;
  } catch (err) {
    console.error(`[Wikidata] Query failed for ${clubA.name} x ${clubB.name}:`, err);
    return [];
  }
};

/**
 * Pre-generate a guaranteed valid challenge from live Wikidata API
 */
export const generateLiveChallengeAsync = async (
  usedPairs: Set<string>
): Promise<MutualLinkChallenge | null> => {
  // Shuffle clubs for non-repeating randomized matchups
  const clubs = [...WIKIDATA_CLUBS].sort(() => 0.5 - Math.random());

  // Prioritize classic, high-likelihood, and Cross-League Saudi x European pairings
  const highProbabilityPairs: [string, string][] = [
    // Cross-League Saudi x European Powerhouses (Karim Benzema, Cristiano Ronaldo, Riyad Mahrez, Saud Abdulhamid, Aubameyang, Henderson/Wijnaldum, etc.)
    ['al_ittihad', 'real_madrid'],
    ['al_hilal', 'roma'],
    ['al_nassr', 'man_united'],
    ['al_ahli', 'man_city'],
    ['al_ettifaq', 'liverpool'],
    ['al_qadsiah', 'arsenal'],
    ['al_qadsiah', 'dortmund'],
    ['al_nassr', 'real_madrid'],
    ['al_hilal', 'chelsea'],
    ['al_ahli', 'barcelona'],
    ['al_shabab', 'barcelona'],
    ['al_ittihad', 'chelsea'],
    ['al_nassr', 'bayern'],
    ['al_hilal', 'psg'],

    // Intra-Saudi Classics
    ['al_ittihad', 'al_nassr'],
    ['al_hilal', 'al_ittihad'],
    ['al_hilal', 'al_nassr'],
    ['al_ahli', 'al_ittihad'],
    ['al_hilal', 'al_shabab'],
    ['al_ittihad', 'al_qadsiah'],

    // European Classics
    ['real_madrid', 'barcelona'],
    ['chelsea', 'arsenal'],
    ['man_united', 'real_madrid'],
    ['ajax', 'barcelona'],
    ['juventus', 'milan'],
    ['inter', 'milan'],
    ['liverpool', 'man_city'],
    ['psg', 'barcelona'],
    ['bayern', 'dortmund'],
    ['chelsea', 'real_madrid'],
    ['roma', 'juventus'],
    ['man_united', 'ajax'],
    ['arsenal', 'man_city'],
    ['tottenham', 'chelsea'],
    ['newcastle', 'liverpool'],
  ];

  // Try high probability pairs if unused
  for (const [idA, idB] of highProbabilityPairs) {
    const pairKey = [idA, idB].sort().join('-');
    if (usedPairs.has(pairKey)) continue;

    const clubA = clubs.find((c) => c.id === idA);
    const clubB = clubs.find((c) => c.id === idB);
    if (!clubA || !clubB) continue;

    const players = await fetchMutualPlayersFromWikidata(clubA, clubB);
    if (players.length > 0) {
      usedPairs.add(pairKey);
      return buildLiveChallengePayload(clubA, clubB, players);
    }
  }

  // Random scan across all pairs until a valid mutual connection is found
  for (let i = 0; i < clubs.length; i++) {
    for (let j = i + 1; j < clubs.length; j++) {
      const pairKey = [clubs[i].id, clubs[j].id].sort().join('-');
      if (usedPairs.has(pairKey)) continue;

      const players = await fetchMutualPlayersFromWikidata(clubs[i], clubs[j]);
      if (players.length > 0) {
        usedPairs.add(pairKey);
        return buildLiveChallengePayload(clubs[i], clubs[j], players);
      }
    }
  }

  return null;
};

/**
 * Build valid normalized answer strings for all matching players
 */
function buildLiveChallengePayload(
  clubA: WikidataClub,
  clubB: WikidataClub,
  players: LiveMatchedPlayer[]
): MutualLinkChallenge {
  const answerStringsSet = new Set<string>();

  players.forEach((p) => {
    if (p.nameAr) {
      answerStringsSet.add(normalizeArabicFootball(p.nameAr));
      p.nameAr.split(/\s+/).forEach((part) => {
        if (part.length > 2) {
          answerStringsSet.add(normalizeArabicFootball(part));
        }
      });
    }
    if (p.nameEn) {
      answerStringsSet.add(normalizeArabicFootball(p.nameEn));
      p.nameEn.split(/\s+/).forEach((part) => {
        if (part.length > 2) {
          answerStringsSet.add(normalizeArabicFootball(part));
        }
      });
    }
  });

  const validDisplayNames = players.map((p) => p.nameAr || p.nameEn);
  const primaryHero = players.find((p) => p.photoUrl) || players[0];

  return {
    id: `challenge_${Date.now()}_${clubA.id}_${clubB.id}`,
    clubA,
    clubB,
    entityA: { id: clubA.id, name: clubA.name, image: clubA.badgeUrl },
    entityB: { id: clubB.id, name: clubB.name, image: clubB.badgeUrl },
    validPlayers: players,
    validAnswerStrings: Array.from(answerStringsSet),
    validDisplayNames,
    revealItem: {
      id: primaryHero?.id,
      name: primaryHero?.nameAr || primaryHero?.nameEn || '',
      image: primaryHero?.photoUrl || '',
      subtitle: `لعب مع ${clubA.name} و ${clubB.name}`,
    },
  };
}

/**
 * Validate a user's guess against live Wikidata valid answers
 */
export const validateLiveAnswer = (
  submittedText: string,
  validAnswerStrings: string[]
): boolean => {
  if (!submittedText || !submittedText.trim()) return false;
  const cleanSubmitted = normalizeArabicFootball(submittedText);
  if (!cleanSubmitted) return false;

  return validAnswerStrings.some((ans) => {
    return (
      ans === cleanSubmitted ||
      ans.includes(cleanSubmitted) ||
      cleanSubmitted.includes(ans)
    );
  });
};
