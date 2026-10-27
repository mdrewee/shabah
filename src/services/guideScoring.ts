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
  // Africa
  if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) return 'africa';
  // Europe
  if (lat >= 36 && lat <= 71 && lng >= -25 && lng <= 45) return 'europe';
  // Asia
  if (lat >= -11 && lat <= 81 && lng >= 25 && lng <= 180) return 'asia';

  return 'other';
}

/**
 * Evaluates points and brutalist feedback text based on distance and continent matching.
 */
export function evaluateGuess(
  distanceKm: number,
  isSameContinent: boolean
): GuessEvaluationResult {
  if (distanceKm <= 50) {
    return {
      points: 10,
      label: 'نفس المعلم والمنطقة بالملي!',
      tier: 'exact',
    };
  } else if (distanceKm <= 200) {
    return {
      points: 6,
      label: 'نفس المدينة والمحيط القريب!',
      tier: 'city',
    };
  } else if (distanceKm <= 900) {
    return {
      points: 3,
      label: 'نفس الدولة أو قريبة جداً!',
      tier: 'country',
    };
  } else if (isSameContinent || distanceKm <= 3500) {
    return {
      points: 1,
      label: 'في نفس القارة على الأقل!',
      tier: 'continent',
    };
  } else {
    return {
      points: 0,
      label: 'شاطح في قارة ثانية ضايع!',
      tier: 'miss',
    };
  }
}
