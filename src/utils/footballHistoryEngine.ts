import masterData from '@/data/footballHistoricalMaster.json';

export interface FootballPlayerRecord {
  id: string;
  name: string;
  aliases: string[];
  photo: string;
  clubs: string[];
}

export interface ClubRecord {
  id: string;
  name: string;
  aliases: string[];
  badgeUrl: string;
  primaryColor: string;
}

export const PLAYERS_DB: FootballPlayerRecord[] = masterData.players;
export const CLUBS_DB: ClubRecord[] = masterData.clubs;

export const normalizeArabicFootball = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/^ال/g, '') // Lenient prefix matching
    .replace(/[\u064B-\u065F\u0670]/g, '');
};

// 1. Get ALL players who represented both Club A and Club B
export const getMutualPlayers = (clubAName: string, clubBName: string): FootballPlayerRecord[] => {
  return PLAYERS_DB.filter(
    (p) => p.clubs.includes(clubAName) && p.clubs.includes(clubBName)
  );
};

// 2. Get ALL mutual clubs between Player A and Player B (STRICTLY CLUBS ONLY - NO NATIONAL TEAMS)
export const getMutualClubs = (playerAId: string, playerBId: string): string[] => {
  const pA = PLAYERS_DB.find((p) => p.id === playerAId);
  const pB = PLAYERS_DB.find((p) => p.id === playerBId);
  if (!pA || !pB) return [];

  return pA.clubs.filter((club) => pB.clubs.includes(club));
};

// 3. Validation: Accepts ANY valid historical answer in the set
export const validateMutualAnswer = (submitted: string, validList: string[]): boolean => {
  if (!submitted || !submitted.trim()) return false;
  const cleanSubmitted = normalizeArabicFootball(submitted);

  return validList.some((validItem) => {
    const cleanValid = normalizeArabicFootball(validItem);
    return (
      cleanValid === cleanSubmitted ||
      cleanValid.includes(cleanSubmitted) ||
      cleanSubmitted.includes(cleanValid)
    );
  });
};
