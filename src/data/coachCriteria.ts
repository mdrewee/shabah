export interface CoachCriterion {
  id: string;
  title: string;
  description: string;
  rulePrompt?: string;
  slotRole?: 'FWD' | 'MID' | 'DEF' | 'GK' | 'ANY';
}

export const OPEN_COACH_CRITERIA: CoachCriterion[] = [
  {
    id: 'crit_01',
    title: 'فائز بدوري أبطال أوروبا',
    description: 'أي لاعب رفع ذات الأذنين عبر التاريخ',
    rulePrompt: 'أي لاعب توج بلقب دوري أبطال أوروبا (UCL)',
  },
  {
    id: 'crit_02',
    title: 'بطل كأس العالم',
    description: 'أي لاعب توج باللقب الأغلى مع منتخب بلاده',
    rulePrompt: 'أي لاعب حقق لقب كأس العالم مع منتخب بلاده',
  },
  {
    id: 'crit_03',
    title: 'حقق جائزة الكرة الذهبية (Ballon d\'Or)',
    description: 'أي أسطورة فاز بالبالون دور',
    rulePrompt: 'أي لاعب توج بالكرة الذهبية كأفضل لاعب في العالم',
  },
  {
    id: 'crit_04',
    title: 'أسطورة من قارة أمريكا الجنوبية',
    description: 'أي لاعب لاتيني (برازيل، أرجنتين، أوروغواي...)',
    rulePrompt: 'أي نجم كرة قدم من دول أمريكا الجنوبية',
  },
  {
    id: 'crit_05',
    title: 'أسطورة من القارة الأفريقية',
    description: 'أي نجم أفريقي تألق في الملاعب العالمية',
    rulePrompt: 'أي نجم كرة قدم من قارة أفريقيا',
  },
  {
    id: 'crit_06',
    title: 'هداف تاريخي أو فائز بالحذاء الذهبي',
    description: 'أي مهاجم أو هداف لا يشق له غبار',
    rulePrompt: 'هداف تاريخي أو فائز بجائزة هداف أو حذاء ذهبي',
  },
  {
    id: 'crit_07',
    title: 'حارس مرمى تاريخي',
    description: 'أي حارس مرمى عملاق في تاريخ الكرة',
    rulePrompt: 'أي حارس مرمى شهير عبر تاريخ كرة القدم',
    slotRole: 'GK',
  },
  {
    id: 'crit_08',
    title: 'قائد رفع بطولة كبرى لمنتخب بلاده',
    description: 'كابتن قاد بلاده لمجد قاري أو عالمي',
    rulePrompt: 'قائد منتخب توج بكأس العالم أو اليورو أو كوبا أمريكا أو كأس أفريقيا أو آسيا',
  },
  {
    id: 'crit_09',
    title: 'لاعب حقق بطولة الدوري في ٣ دول مختلفة',
    description: 'رحالة حصد بطولات الدوري في أكثر من دوري',
    rulePrompt: 'لاعب توج بلقب الدوري المحلي في 3 دول مختلفة على الأقل',
  },
  {
    id: 'crit_10',
    title: 'لاعب اشتهر بتنفيذ الركلات الحرة المباشرة',
    description: 'متخصص ضربات ثابتة وصاحب أهداف لا تُنسى',
    rulePrompt: 'لاعب اشتهر عالمياً بمهارة تسجيل الركلات الحرة المباشرة',
  },
  {
    id: 'crit_11',
    title: 'مدافع تاريخي أو بطل قاطع للكرات',
    description: 'قلب دفاع أو ظهير صنع هيبة دفاعية عظيمة',
    rulePrompt: 'مدافع أسطوري (قلب دفاع أو ظهير)',
    slotRole: 'DEF',
  },
  {
    id: 'crit_12',
    title: 'صانع ألعاب تاريخي (رقم 10 كلاسيكي)',
    description: 'مهندس خط الوسط وصاحب التمريرات الساحرة',
    rulePrompt: 'صانع ألعاب أو لاعب وسط هجومي كلاسيكي',
    slotRole: 'MID',
  },
  {
    id: 'crit_13',
    title: 'لاعب خاض أكثر من 100 مباراة دولية',
    description: 'نجم صاحب مسيرة دولية طويلة وثابتة',
    rulePrompt: 'لاعب يمتلك نادي المئة (خاض 100 مباراة دولية رسمية أو أكثر)',
  },
  {
    id: 'crit_14',
    title: 'لاعب حقق الثلاثية التاريخية في موسم واحد',
    description: 'دوري وكأس وأبطال في نفس الموسم',
    rulePrompt: 'لاعب حقق الثلاثية الكبرى (دوري وكأس ودوري أبطال) في موسم واحد',
  },
  {
    id: 'crit_15',
    title: 'لاعب توج ببطولة كوبا أمريكا',
    description: 'أي نجم رفع الكأس اللاتينية العريقة',
    rulePrompt: 'لاعب فاز بلقب بطولة كوبا أمريكا مع منتخب بلاده',
  },
];

export const COACH_CRITERIA_BANK = OPEN_COACH_CRITERIA;

/**
 * سحب 5 شروط مفتوحة عشوائية بدون تكرار طوال المباراة
 */
export function getRandomMatchCriteria(totalRounds = 5): CoachCriterion[] {
  const shuffled = [...OPEN_COACH_CRITERIA].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(totalRounds, shuffled.length));
}
