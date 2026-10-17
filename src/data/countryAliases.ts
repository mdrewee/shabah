import { normalizeArabic } from '../utils/arabicNormalizer';
import { CountryItem } from './countries';

export interface CountryMeta {
  canonicalName: string; // The official name matched in world.geojson & catalog
  aliases: string[];      // Alternative search keywords
}

export const COUNTRY_ALIASES: CountryMeta[] = [
  { canonicalName: 'الولايات المتحدة', aliases: ['امريكا', 'أمريكا', 'الولايات المتحدة الامريكية', 'الولايات المتحدة الأمريكية', 'أميركا', 'اميركا'] },
  { canonicalName: 'المملكة المتحدة', aliases: ['بريطانيا', 'انجلترا', 'إنجلترا', 'المملكه المتحده', 'بريطانيا العظمى'] },
  { canonicalName: 'فرنسا', aliases: ['الجمهورية الفرنسية', 'فرنسا'] },
  { canonicalName: 'إيطاليا', aliases: ['ايطاليا', 'إيطاليا', 'الجمهورية الإيطالية'] },
  { canonicalName: 'روسيا', aliases: ['الاتحاد الروسي', 'روسيا الاتحادية'] },
  { canonicalName: 'الإمارات العربية المتحدة', aliases: ['الامارات', 'الإمارات', 'دولة الامارات', 'دولة الإمارات'] },
  { canonicalName: 'المملكة العربية السعودية', aliases: ['السعودية', 'السعوديه', 'المملكه العربيه السعوديه'] },
  { canonicalName: 'كوريا الجنوبية', aliases: ['كوريا', 'جمهورية كوريا'] },
  { canonicalName: 'هولندا', aliases: ['الأراضي المنخفضة', 'نيدرلاند', 'الاراضي المنخفضة'] },
  { canonicalName: 'إسبانيا', aliases: ['اسبانيا', 'إسبانيا', 'مملكة إسبانيا'] },
  { canonicalName: 'ألمانيا', aliases: ['المانيا', 'ألمانيا', 'جمهورية ألمانيا الاتحادية'] },
  { canonicalName: 'مصر', aliases: ['جمهورية مصر العربية'] },
  { canonicalName: 'الصين', aliases: ['جمهورية الصين الشعبية'] },
  { canonicalName: 'تركيا', aliases: ['الجمهورية التركية'] },
  { canonicalName: 'اليابان', aliases: ['كوكب اليابان'] },
  { canonicalName: 'البرازيل', aliases: ['جمهورية البرازيل الاتحادية'] },
  { canonicalName: 'جنوب أفريقيا', aliases: ['جنوب افريقيا'] },
  { canonicalName: 'المكسيك', aliases: ['الولايات المكسيكية المتحدة'] },
  { canonicalName: 'الأرجنتين', aliases: ['الارجنتين'] },
  { canonicalName: 'إندونيسيا', aliases: ['اندونيسيا'] },
];

/**
 * Filter autocomplete suggestions matching input against canonical name AND aliases
 */
export function searchCountries(query: string, allCountries: string[]): string[] {
  const normQuery = normalizeArabic(query);
  const queryWithoutAl = normQuery.startsWith('ال') ? normQuery.slice(2) : normQuery;
  if (!normQuery) return [];

  return allCountries.filter((countryName) => {
    const normCountry = normalizeArabic(countryName);
    const countryWithoutAl = normCountry.startsWith('ال') ? normCountry.slice(2) : normCountry;

    // Check direct matching (with or without 'الـ')
    if (normCountry.includes(normQuery) || countryWithoutAl.includes(queryWithoutAl)) {
      return true;
    }

    // Check aliases
    const matchedMeta = COUNTRY_ALIASES.find((meta) => {
      const normCanonical = normalizeArabic(meta.canonicalName);
      return (
        meta.canonicalName === countryName ||
        normCanonical === normCountry ||
        normCountry.includes(normCanonical) ||
        normCanonical.includes(normCountry)
      );
    });
    if (matchedMeta) {
      return matchedMeta.aliases.some((alias) => {
        const normAlias = normalizeArabic(alias);
        const aliasWithoutAl = normAlias.startsWith('ال') ? normAlias.slice(2) : normAlias;
        return (
          normAlias.includes(normQuery) ||
          aliasWithoutAl.includes(queryWithoutAl) ||
          normQuery.includes(normAlias)
        );
      });
    }

    return false;
  });
}

/**
 * Filter CountryItem array directly for UI autocompletes
 */
export function searchCountryCatalog(
  query: string,
  catalog: CountryItem[],
  originIso?: string
): CountryItem[] {
  const normQuery = normalizeArabic(query);
  const queryWithoutAl = normQuery.startsWith('ال') ? normQuery.slice(2) : normQuery;
  const qLower = query.trim().toLowerCase();
  if (!normQuery && !qLower) return [];

  return catalog
    .filter((c) => {
      // Disallow picking origin country
      if (originIso && c.iso3 === originIso) return false;

      // English match
      if (c.nameEn && c.nameEn.toLowerCase().includes(qLower)) return true;

      const normCountry = normalizeArabic(c.nameAr);
      const countryWithoutAl = normCountry.startsWith('ال') ? normCountry.slice(2) : normCountry;

      // Direct Arabic matching (with or without 'الـ')
      if (normCountry.includes(normQuery) || countryWithoutAl.includes(queryWithoutAl)) {
        return true;
      }

      // Check aliases from COUNTRY_ALIASES table
      const matchedMeta = COUNTRY_ALIASES.find((m) => {
        const normCanonical = normalizeArabic(m.canonicalName);
        return (
          m.canonicalName === c.nameAr ||
          normCanonical === normCountry ||
          normCountry.includes(normCanonical) ||
          normCanonical.includes(normCountry)
        );
      });

      if (matchedMeta) {
        const aliasMatch = matchedMeta.aliases.some((alias) => {
          const normAlias = normalizeArabic(alias);
          const aliasWithoutAl = normAlias.startsWith('ال') ? normAlias.slice(2) : normAlias;
          return (
            normAlias.includes(normQuery) ||
            aliasWithoutAl.includes(queryWithoutAl) ||
            normQuery.includes(normAlias)
          );
        });
        if (aliasMatch) return true;
      }

      // Check item's own aliases if present
      if (c.aliases && Array.isArray(c.aliases)) {
        const itemAliasMatch = c.aliases.some((alias) => {
          const normAlias = normalizeArabic(alias);
          const aliasWithoutAl = normAlias.startsWith('ال') ? normAlias.slice(2) : normAlias;
          return (
            normAlias.includes(normQuery) ||
            aliasWithoutAl.includes(queryWithoutAl) ||
            normQuery.includes(normAlias)
          );
        });
        if (itemAliasMatch) return true;
      }

      return false;
    })
    .slice(0, 10);
}
