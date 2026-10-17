import { normalizeArabic } from '../utils/arabicNormalizer';
import { COUNTRIES_CATALOG } from './countries';
import { COUNTRY_ALIASES } from './countryAliases';

export interface TourismLexiconItem {
  nameAr: string;
  nameEn?: string;
  type: string;
  aliases?: string[];
}

export const TOURISM_EXTRA_ENTRIES: TourismLexiconItem[] = [
  { nameAr: 'باريس', nameEn: 'Paris', type: 'مدينة وعاصمة', aliases: ['العاصمة الفرنسية'] },
  { nameAr: 'طوكيو', nameEn: 'Tokyo', type: 'مدينة وعاصمة', aliases: ['العاصمة اليابانية'] },
  { nameAr: 'العلا', nameEn: 'AlUla', type: 'منطقة تراثية', aliases: ['مدائن صالح', 'الحجر', 'محافظة العلا'] },
  { nameAr: 'روما', nameEn: 'Rome', type: 'مدينة وعاصمة', aliases: ['العاصمة الإيطالية', 'روما القديمة'] },
  { nameAr: 'دبي', nameEn: 'Dubai', type: 'مدينة', aliases: ['إمارة دبي'] },
  { nameAr: 'القاهرة', nameEn: 'Cairo', type: 'مدينة وعاصمة', aliases: ['قاهرة المعز', 'العاصمة المصرية'] },
  { nameAr: 'مدريد', nameEn: 'Madrid', type: 'مدينة وعاصمة', aliases: ['العاصمة الإسبانية'] },
  { nameAr: 'البندقية', nameEn: 'Venice', type: 'مدينة', aliases: ['فينيسيا', 'فينيس'] },
  { nameAr: 'إسطنبول', nameEn: 'Istanbul', type: 'مدينة', aliases: ['القسطنطينية', 'استانبول', 'اسطنبول'] },
  { nameAr: 'أنقرة', nameEn: 'Ankara', type: 'عاصمة', aliases: ['العاصمة التركية'] },
  { nameAr: 'لندن', nameEn: 'London', type: 'مدينة وعاصمة', aliases: ['مدينة الضباب', 'العاصمة البريطانية'] },
  { nameAr: 'سيدني', nameEn: 'Sydney', type: 'مدينة', aliases: ['سيدنى'] },
  { nameAr: 'كانبيرا', nameEn: 'Canberra', type: 'عاصمة' },
  { nameAr: 'مكة المكرمة', nameEn: 'Mecca', type: 'مدينة مقدسة', aliases: ['مكة', 'مكه', 'مكه المكرمه', 'بكة', 'البلد الحرام'] },
  { nameAr: 'المدينة المنورة', nameEn: 'Medina', type: 'مدينة مقدسة', aliases: ['المدينة', 'المدينه', 'المدينه المنوره', 'طيبة', 'طيبة الطيبة'] },
  { nameAr: 'عمان', nameEn: 'Amman', type: 'عاصمة', aliases: ['عمّان', 'العاصمة الأردنية'] },
  { nameAr: 'نيويورك', nameEn: 'New York', type: 'مدينة', aliases: ['نيويورك سيتي', 'مدينة نيويورك'] },
  { nameAr: 'واشنطن', nameEn: 'Washington', type: 'عاصمة', aliases: ['واشنطن العاصمة'] },
  { nameAr: 'الرباط', nameEn: 'Rabat', type: 'عاصمة', aliases: ['العاصمة المغربية'] },
  { nameAr: 'مراكش', nameEn: 'Marrakech', type: 'مدينة', aliases: ['المدينة الحمراء'] },
  { nameAr: 'فاس', nameEn: 'Fes', type: 'مدينة' },
  { nameAr: 'البتراء', nameEn: 'Petra', type: 'معلم تاريخي', aliases: ['البترا', 'المدينة الوردية'] },
  { nameAr: 'برن', nameEn: 'Bern', type: 'عاصمة' },
  { nameAr: 'جنيف', nameEn: 'Geneva', type: 'مدينة' },
  { nameAr: 'زيورخ', nameEn: 'Zurich', type: 'مدينة' },
  { nameAr: 'نيودلهي', nameEn: 'New Delhi', type: 'عاصمة', aliases: ['دلهي'] },
  { nameAr: 'الرياض', nameEn: 'Riyadh', type: 'عاصمة', aliases: ['العاصمة السعودية'] },
  { nameAr: 'جدة', nameEn: 'Jeddah', type: 'مدينة', aliases: ['عروس البحر الأحمر'] },
  { nameAr: 'الدوحة', nameEn: 'Doha', type: 'عاصمة' },
  { nameAr: 'الكويت', nameEn: 'Kuwait City', type: 'عاصمة' },
  { nameAr: 'المنامة', nameEn: 'Manama', type: 'عاصمة' },
  { nameAr: 'مسقط', nameEn: 'Muscat', type: 'عاصمة' },
  { nameAr: 'أبوظبي', nameEn: 'Abu Dhabi', type: 'عاصمة', aliases: ['ابوظبي'] },
  { nameAr: 'بيروت', nameEn: 'Beirut', type: 'عاصمة' },
  { nameAr: 'دمشق', nameEn: 'Damascus', type: 'عاصمة' },
  { nameAr: 'بغداد', nameEn: 'Baghdad', type: 'عاصمة' },
  { nameAr: 'القدس', nameEn: 'Jerusalem', type: 'مدينة مقدسة', aliases: ['بيت المقدس', 'القدس الشريف'] },
  { nameAr: 'برلين', nameEn: 'Berlin', type: 'عاصمة' },
  { nameAr: 'أمستردام', nameEn: 'Amsterdam', type: 'عاصمة' },
  { nameAr: 'فيينا', nameEn: 'Vienna', type: 'عاصمة' },
  { nameAr: 'أثينا', nameEn: 'Athens', type: 'عاصمة' },
  { nameAr: 'موسكو', nameEn: 'Moscow', type: 'عاصمة' },
  { nameAr: 'بكين', nameEn: 'Beijing', type: 'عاصمة' },
  { nameAr: 'ريو دي جانيرو', nameEn: 'Rio de Janeiro', type: 'مدينة', aliases: ['ريو'] },
  { nameAr: 'برازيليا', nameEn: 'Brasilia', type: 'عاصمة' },
  { nameAr: 'برج إيفل', nameEn: 'Eiffel Tower', type: 'معلم', aliases: ['ايفل', 'برج ايفل'] },
  { nameAr: 'تاج محل', nameEn: 'Taj Mahal', type: 'معلم' },
  { nameAr: 'سور الصين العظيم', nameEn: 'Great Wall of China', type: 'معلم' },
  { nameAr: 'برج خليفة', nameEn: 'Burj Khalifa', type: 'معلم' },
  { nameAr: 'الأهرامات', nameEn: 'Pyramids of Giza', type: 'معلم', aliases: ['أهرامات الجيزة', 'اهرامات الجيزة'] },
  { nameAr: 'الكولوسيوم', nameEn: 'Colosseum', type: 'معلم' },
  { nameAr: 'تمثال الحرية', nameEn: 'Statue of Liberty', type: 'معلم' },
  { nameAr: 'متحف اللوفر', nameEn: 'Louvre Museum', type: 'معلم', aliases: ['اللوفر'] },
  { nameAr: 'برج بيزا المائل', nameEn: 'Leaning Tower of Pisa', type: 'معلم', aliases: ['برج بيزا'] },
  { nameAr: 'ماتشو بيتشو', nameEn: 'Machu Picchu', type: 'معلم' },
  { nameAr: 'جبل فوجي', nameEn: 'Mount Fuji', type: 'معلم' }
];

export function getFullTourismLexicon(): TourismLexiconItem[] {
  const map = new Map<string, TourismLexiconItem>();

  // 1. Countries Catalog
  COUNTRIES_CATALOG.forEach(c => {
    const norm = normalizeArabic(c.nameAr);
    if (!map.has(norm)) {
      map.set(norm, {
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        type: 'دولة',
        aliases: c.aliases || []
      });
    }
  });

  // 2. Extra entries (cities, capitals, landmarks)
  TOURISM_EXTRA_ENTRIES.forEach(e => {
    const norm = normalizeArabic(e.nameAr);
    if (map.has(norm)) {
      const existing = map.get(norm)!;
      existing.type = e.type || existing.type;
      existing.aliases = Array.from(new Set([...(existing.aliases || []), ...(e.aliases || [])]));
    } else {
      map.set(norm, { ...e });
    }
  });

  return Array.from(map.values());
}

export function searchTourismLexicon(query: string, limit = 8): TourismLexiconItem[] {
  const normQuery = normalizeArabic(query);
  const qWithoutAl = normQuery.startsWith('ال') ? normQuery.slice(2) : normQuery;
  const qLower = query.trim().toLowerCase();

  if (!normQuery && !qLower) return [];

  const lexicon = getFullTourismLexicon();

  return lexicon.filter(item => {
    // English match
    if (item.nameEn && item.nameEn.toLowerCase().includes(qLower)) return true;

    const normName = normalizeArabic(item.nameAr);
    const nameWithoutAl = normName.startsWith('ال') ? normName.slice(2) : normName;

    // Direct Arabic match
    if (normName.includes(normQuery) || nameWithoutAl.includes(qWithoutAl)) return true;

    // Item aliases match
    if (item.aliases && item.aliases.some(alias => {
      const normA = normalizeArabic(alias);
      const aliasWithoutAl = normA.startsWith('ال') ? normA.slice(2) : normA;
      return normA.includes(normQuery) || aliasWithoutAl.includes(qWithoutAl);
    })) {
      return true;
    }

    // Country aliases table check
    const matchedMeta = COUNTRY_ALIASES.find(m => {
      const normCanonical = normalizeArabic(m.canonicalName);
      return (
        m.canonicalName === item.nameAr ||
        normCanonical === normName ||
        normName.includes(normCanonical) ||
        normCanonical.includes(normName)
      );
    });

    if (matchedMeta) {
      return matchedMeta.aliases.some(alias => {
        const normA = normalizeArabic(alias);
        const aliasWithoutAl = normA.startsWith('ال') ? normA.slice(2) : normA;
        return normA.includes(normQuery) || aliasWithoutAl.includes(qWithoutAl);
      });
    }

    return false;
  }).slice(0, limit);
}

export function isAnswerCorrect(userAnswer: string, targetEntity: string, targetAliases: string[] = []): boolean {
  if (!userAnswer || !targetEntity) return false;

  const normUser = normalizeArabic(userAnswer);
  const normUserClean = normUser.startsWith('ال') ? normUser.slice(2) : normUser;

  const normTarget = normalizeArabic(targetEntity);
  const normTargetClean = normTarget.startsWith('ال') ? normTarget.slice(2) : normTarget;

  // 1. Direct exact or without 'الـ' match
  if (normUser === normTarget || normUserClean === normTargetClean) {
    return true;
  }

  // 2. Target aliases list check
  const allAliases = [...targetAliases];

  // Also check COUNTRY_ALIASES if target is a country
  const countryMeta = COUNTRY_ALIASES.find(m => {
    const normCan = normalizeArabic(m.canonicalName);
    return m.canonicalName === targetEntity || normCan === normTarget;
  });
  if (countryMeta) {
    allAliases.push(...countryMeta.aliases);
  }

  // Extra entries aliases check
  const extra = TOURISM_EXTRA_ENTRIES.find(e => {
    const normE = normalizeArabic(e.nameAr);
    return e.nameAr === targetEntity || normE === normTarget;
  });
  if (extra && extra.aliases) {
    allAliases.push(...extra.aliases);
  }

  for (const alias of allAliases) {
    const normA = normalizeArabic(alias);
    const normAClean = normA.startsWith('ال') ? normA.slice(2) : normA;
    if (normUser === normA || normUserClean === normAClean) {
      return true;
    }
  }

  return false;
}
