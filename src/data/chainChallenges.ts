import { ChainChallenge, ChainPlayer } from '../pages/football/football-chain/types';
import { FOOTBALL_PLAYERS_MASTER } from './footballMasterData';
import { toChainPlayer, normalizePlayerName } from '../utils/footballChainEngine';

/**
 * Resilient, safe lookup for players in master data.
 * Uses Arabic normalization and partial matching.
 * NEVER throws fatal runtime exceptions.
 */
export const getPlayerByNameSafe = (queryName: string): ChainPlayer => {
  if (!queryName) {
    return {
      id: 'custom_unknown',
      name: 'لاعب غير محدد',
      clubs: [],
    };
  }

  const cleanQuery = normalizePlayerName(queryName);

  // 1. Exact or normalized match against name & aliases
  const matched = FOOTBALL_PLAYERS_MASTER.find((p) => {
    const normName = normalizePlayerName(p.name);
    if (normName === cleanQuery) return true;
    if (p.aliases && p.aliases.some((a) => normalizePlayerName(a) === cleanQuery)) return true;

    // Check partial containment (e.g. "غوندوغان" or "جوندوجان")
    if (
      cleanQuery.length >= 4 &&
      (normName.includes(cleanQuery) || cleanQuery.includes(normName))
    ) {
      return true;
    }
    return false;
  });

  if (matched) {
    return toChainPlayer(matched);
  }

  // 2. Safe Fallback Object (NEVER THROW FATAL ERROR)
  console.warn(`[ChainChallenges] Player not found in master data: "${queryName}". Using fallback entity.`);

  const fallbackClubs: string[] = [];
  if (queryName.includes('غوندوغان') || queryName.includes('جوندوجان')) {
    fallbackClubs.push('مانشستر سيتي', 'برشلونة', 'بوروسيا دورتموند');
  }

  return {
    id: `custom_${cleanQuery.replace(/\s+/g, '_')}`,
    name: queryName,
    clubs: fallbackClubs,
    nationality: 'ألمانيا',
  };
};

interface RawChainPair {
  id: string;
  startName: string;
  targetName: string;
  minHops: number;
  hint?: string;
}

const RAW_CHAIN_PAIRS: RawChainPair[] = [
  {
    id: 'ch_salah_messi',
    startName: 'محمد صلاح',
    targetName: 'ليونيل ميسي',
    minHops: 3,
    hint: 'عبر ليفربول (أليسون) أو روما أو باريس سان جيرمان',
  },
  {
    id: 'ch_benzema_haaland',
    startName: 'كريم بنزيما',
    targetName: 'إيرلينغ هالاند',
    minHops: 3,
    hint: 'عبر ريال مدريد ومانشستر سيتي أو بوروسيا دورتموند',
  },
  {
    id: 'ch_ronaldo_mbappe',
    startName: 'كريستيانو رونالدو',
    targetName: 'كيليان مبابي',
    minHops: 2,
    hint: 'عبر ريال مدريد أو باريس سان جيرمان أو يوفنتوس',
  },
  {
    id: 'ch_salem_neymar',
    startName: 'سالم الدوسري',
    targetName: 'نيمار',
    minHops: 1,
    hint: 'عبر نادي الهلال السعودي',
  },
  {
    id: 'ch_modric_debruyne',
    startName: 'لوكا مودريتش',
    targetName: 'كيفين دي بروين',
    minHops: 3,
    hint: 'عبر توتنهام أو تشيلسي أو مانشستر سيتي',
  },
  {
    id: 'ch_kante_lewandowski',
    startName: 'نغولو كانتي',
    targetName: 'روبرت ليفاندوفسكي',
    minHops: 3,
    hint: 'عبر تشيلسي وبرشلونة أو بايرن ميونخ',
  },
  {
    id: 'ch_bounou_courtois',
    startName: 'ياسين بونو',
    targetName: 'تيبو كورتوا',
    minHops: 2,
    hint: 'عبر أتلتيكو مدريد أو إشبيلية أو ريال مدريد',
  },
  {
    id: 'ch_mahrez_kane',
    startName: 'رياض محرز',
    targetName: 'هاري كين',
    minHops: 2,
    hint: 'عبر مانشستر سيتي أو ليستر سيتي أو توتنهام أو بايرن ميونخ',
  },
  {
    id: 'ch_alisson_neymar',
    startName: 'أليسون بيكر',
    targetName: 'نيمار',
    minHops: 1,
    hint: 'عبر منتخب البرازيل',
  },
  {
    id: 'ch_vinicius_bellingham',
    startName: 'فينيسيوس جونيور',
    targetName: 'جود بيلينغهام',
    minHops: 1,
    hint: 'عبر ريال مدريد',
  },
  {
    id: 'ch_hakimi_mbappe',
    startName: 'أشرف حكيمي',
    targetName: 'كيليان مبابي',
    minHops: 1,
    hint: 'عبر باريس سان جيرمان أو ريال مدريد',
  },
  {
    id: 'ch_mane_vandijk',
    startName: 'ساديو ماني',
    targetName: 'فيرجيل فان دايك',
    minHops: 1,
    hint: 'عبر ليفربول أو ساوثهامبتون',
  },
  {
    id: 'ch_griezmann_suarez',
    startName: 'أنطوان غريزمان',
    targetName: 'لويس سواريز',
    minHops: 1,
    hint: 'عبر برشلونة أو أتلتيكو مدريد',
  },
  {
    id: 'ch_kroos_casemiro',
    startName: 'توني كروس',
    targetName: 'كاسيميرو',
    minHops: 1,
    hint: 'عبر ريال مدريد',
  },
  {
    id: 'ch_son_kane',
    startName: 'سون هيونغ مين',
    targetName: 'هاري كين',
    minHops: 1,
    hint: 'عبر توتنهام هوتسبير',
  },
  {
    id: 'ch_ramos_messi',
    startName: 'سيرجيو راموس',
    targetName: 'ليونيل ميسي',
    minHops: 1,
    hint: 'عبر باريس سان جيرمان',
  },
  {
    id: 'ch_pedri_yamal',
    startName: 'بيدري',
    targetName: 'لامين يامال',
    minHops: 1,
    hint: 'عبر برشلونة ومنتخب إسبانيا',
  },
  {
    id: 'ch_salah_haaland',
    startName: 'محمد صلاح',
    targetName: 'إيرلينغ هالاند',
    minHops: 3,
    hint: 'عبر الدوري الإنجليزي (مانشستر سيتي وليفربول)',
  },
  {
    id: 'ch_benzema_ronaldo',
    startName: 'كريم بنزيما',
    targetName: 'كريستيانو رونالدو',
    minHops: 1,
    hint: 'عبر ريال مدريد',
  },
  {
    id: 'ch_mitrovic_neymar',
    startName: 'ألكسندر ميتروفيتش',
    targetName: 'نيمار',
    minHops: 1,
    hint: 'عبر الهلال السعودي',
  },
  {
    id: 'ch_otavio_ronaldo',
    startName: 'أوتافيو',
    targetName: 'كريستيانو رونالدو',
    minHops: 1,
    hint: 'عبر النصر ومنتخب البرتغال',
  },
  {
    id: 'ch_mahrez_firmino',
    startName: 'رياض محرز',
    targetName: 'روبرتو فيرمينو',
    minHops: 1,
    hint: 'عبر الأهلي السعودي',
  },
  {
    id: 'ch_kante_benzema',
    startName: 'نغولو كانتي',
    targetName: 'كريم بنزيما',
    minHops: 1,
    hint: 'عبر الاتحاد السعودي ومنتخب فرنسا',
  },
  {
    id: 'ch_bounou_neymar',
    startName: 'ياسين بونو',
    targetName: 'نيمار',
    minHops: 1,
    hint: 'عبر الهلال السعودي',
  },
  {
    id: 'ch_alaba_davies',
    startName: 'دافيد ألابا',
    targetName: 'ألفونسو ديفيز',
    minHops: 1,
    hint: 'عبر بايرن ميونخ',
  },
  {
    id: 'ch_rudiger_havertz',
    startName: 'أنطونيو روديغر',
    targetName: 'كاي هافيرتز',
    minHops: 1,
    hint: 'عبر تشيلسي ومنتخب ألمانيا',
  },
  {
    id: 'ch_gundogan_haaland',
    startName: 'إلكاي غوندوغان',
    targetName: 'إيرلينغ هالاند',
    minHops: 1,
    hint: 'عبر مانشستر سيتي',
  },
  {
    id: 'ch_lewandowski_muller',
    startName: 'روبرت ليفاندوفسكي',
    targetName: 'توماس مولر',
    minHops: 1,
    hint: 'عبر بايرن ميونخ',
  },
  {
    id: 'ch_neuer_terstegen',
    startName: 'مانويل نوير',
    targetName: 'مارك أندريه تير شتيغن',
    minHops: 1,
    hint: 'عبر منتخب ألمانيا',
  },
  {
    id: 'ch_ronaldo_cancelo',
    startName: 'كريستيانو رونالدو',
    targetName: 'جواو كانسيلو',
    minHops: 1,
    hint: 'عبر يوفنتوس ومنتخب البرتغال',
  },
];

export const CHAIN_CHALLENGES_BANK: ChainChallenge[] = (() => {
  const result: ChainChallenge[] = [];
  for (const pair of RAW_CHAIN_PAIRS) {
    try {
      const start = getPlayerByNameSafe(pair.startName);
      const target = getPlayerByNameSafe(pair.targetName);
      if (start && target) {
        result.push({
          id: pair.id,
          startPlayer: start,
          targetPlayer: target,
          minHops: pair.minHops,
          hint: pair.hint,
        });
      }
    } catch {
      // ignore
    }
  }
  return result;
})();

/**
 * Returns a randomized sequence of challenges for a 5-round match
 */
export const getRandomChainChallenges = (count: number = 5): ChainChallenge[] => {
  if (CHAIN_CHALLENGES_BANK.length === 0) return [];
  const shuffled = [...CHAIN_CHALLENGES_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
