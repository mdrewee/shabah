import { toArabicNumber } from '../utils/numberFormat';

/**
 * Precise Geographic Distance & Scoring Engine for "الشبح المرشد"
 * Uses Haversine Great-Circle Distance and 5-tier accuracy grading.
 */

export type GuideTier = 'exact' | 'city' | 'country' | 'continent' | 'miss';

export interface GuessEvaluationResult {
  points: number;
  label: string;
  tier: GuideTier;
}

/**
 * Calculates Great-Circle distance in kilometers between two lat/lng coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Approximates continent from coordinate bounds.
 */
export function inferContinentFromCoords(
  lat: number,
  lng: number
): 'asia' | 'africa' | 'europe' | 'north_america' | 'south_america' | 'oceania' | 'other' {
  // South America
  if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return 'south_america';
  // North America
  if (lat >= 7 && lat <= 83 && lng >= -168 && lng <= -52) return 'north_america';
  // Oceania / Australia
  if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) return 'oceania';
  // Arabian Peninsula is in Asia, outside the coarse Africa bounds.
  if (lat >= 12 && lat <= 37 && lng >= 34 && lng <= 60) return 'asia';
  // Africa
  if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) return 'africa';
  // Europe
  if (lat >= 36 && lat <= 71 && lng >= -25 && lng <= 45) return 'europe';
  // Asia
  if (lat >= -11 && lat <= 81 && lng >= 25 && lng <= 180) return 'asia';

  return 'other';
}

const GUIDE_DISTANCE_BANDS: ReadonlyArray<{ maxKm: number; points: number; tier: GuideTier }> = [
  { maxKm: 50, points: 10, tier: 'exact' },
  { maxKm: 200, points: 8, tier: 'city' },
  { maxKm: 900, points: 6, tier: 'country' },
  { maxKm: 3500, points: 3, tier: 'continent' },
  { maxKm: 6000, points: 1, tier: 'continent' },
];
const longestBand = GUIDE_DISTANCE_BANDS[GUIDE_DISTANCE_BANDS.length - 1].maxKm;

export const GUIDE_SCORING_LEGEND = GUIDE_DISTANCE_BANDS.map(({ maxKm, points }) =>
  `حتى ${toArabicNumber(maxKm)} كم = ${toArabicNumber(points)}`).join('، ') +
  `، وأبعد من ${toArabicNumber(longestBand)} كم = صفر.`;

export function evaluateGuess(distanceKm: number, _isSameContinent: boolean): GuessEvaluationResult {
  const band = GUIDE_DISTANCE_BANDS.find(({ maxKm }) => distanceKm <= maxKm);
  return band ? { points: band.points, tier: band.tier, label: `على بعد ${toArabicNumber(band.maxKm)} كم أو أقل` }
    : { points: 0, tier: 'miss', label: `أبعد من ${toArabicNumber(longestBand)} كم` };
}
