/**
 * Comprehensive Sports Image Resolver for "شبح" (Shabah)
 * Resolves player photos from Wikipedia REST API with fallback to Arabic Wikipedia,
 * flags from FlagCDN, and lightweight SVG position badges.
 */
import { useState, useEffect } from 'react';

// In-memory cache to prevent repeated network calls across components
const imageCache: Record<string, string> = {};

// Fallback silhouettes
export const SILHOUETTE_PLAYER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23737373"><circle cx="50" cy="35" r="20"/><path d="M15 90 C 15 65, 30 55, 50 55 C 70 55, 85 65, 85 90 Z"/></svg>`;
export const SILHOUETTE_BADGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2322C55E"><polygon points="50 10, 85 25, 75 75, 50 95, 25 75, 15 25"/></svg>`;

// Map country names to ISO 2-letter codes for FlagCDN
const COUNTRY_ISO_MAP: Record<string, string> = {
  'السعودية': 'sa',
  'البرازيل': 'br',
  'الأرجنتين': 'ar',
  'فرنسا': 'fr',
  'إسبانيا': 'es',
  'البرتغال': 'pt',
  'إنجلترا': 'gb-eng',
  'ألمانيا': 'de',
  'إيطاليا': 'it',
  'هولندا': 'nl',
  'بلجيكا': 'be',
  'كرواتيا': 'hr',
  'المغرب': 'ma',
  'مصر': 'eg',
  'الجزائر': 'dz',
  'تونس': 'tn',
  'الأوروغواي': 'uy',
  'كولومبيا': 'co',
  'السنغال': 'sn',
  'نيجيريا': 'ng',
  'اليابان': 'jp',
  'كوريا الجنوبية': 'kr',
  'النرويج': 'no',
  'بولندا': 'pl',
};

/**
 * Resolve country flag URL via FlagCDN
 */
export function resolveCountryFlag(countryName: string): string | null {
  if (!countryName) return null;
  const clean = countryName.trim();
  const code = COUNTRY_ISO_MAP[clean];
  if (code) {
    return `https://flagcdn.com/w80/${code}.png`;
  }
  return null;
}

/**
 * Resolve player or sports entity image via Wikipedia REST API
 */
export async function fetchWikipediaImage(searchTerm: string): Promise<string | null> {
  const clean = searchTerm.trim();
  if (!clean) return null;

  const cacheKey = `wiki_${clean.toLowerCase()}`;
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }

  // Check localStorage cache
  try {
    const stored = localStorage.getItem(`shabah_img_${cacheKey}`);
    if (stored) {
      imageCache[cacheKey] = stored;
      return stored;
    }
  } catch {}

  const fetchSummary = async (lang: string, title: string) => {
    try {
      const resp = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!resp.ok) return null;
      const data = await resp.json();
      return data?.thumbnail?.source || data?.originalimage?.source || null;
    } catch {
      return null;
    }
  };

  try {
    // 1. Try English Wikipedia first (higher coverage of HD sports imagery)
    let url = await fetchSummary('en', clean);

    // 2. Fallback to Arabic Wikipedia
    if (!url) {
      url = await fetchSummary('ar', clean);
    }

    if (url) {
      imageCache[cacheKey] = url;
      try {
        localStorage.setItem(`shabah_img_${cacheKey}`, url);
      } catch {}
      return url;
    }
  } catch (err) {
    console.warn('Wikipedia image fetch error for:', clean, err);
  }

  return null;
}

/**
 * React hook to automatically resolve sports imagery
 */
export function useSportsImage(
  name: string | undefined | null,
  fallbackUrl: string = SILHOUETTE_PLAYER_SVG
) {
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!name || !name.trim()) {
      setImageUrl(fallbackUrl);
      return;
    }

    const trimmed = name.trim();
    if (imageCache[`wiki_${trimmed.toLowerCase()}`]) {
      setImageUrl(imageCache[`wiki_${trimmed.toLowerCase()}`]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchWikipediaImage(trimmed).then((res) => {
      if (!isMounted) return;
      setIsLoading(false);
      if (res) {
        setImageUrl(res);
      } else {
        setImageUrl(fallbackUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [name, fallbackUrl]);

  return { imageUrl, isLoading };
}
