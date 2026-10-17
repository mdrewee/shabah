export interface DraftClub {
  id: string;
  name: string;
  league: string;
  country: string;
  badgeUrl: string;
}

export const DRAFT_CURATED_CLUBS: DraftClub[] = [
  // دوري روشن السعودي (5)
  {
    id: 'al_hilal',
    name: 'الهلال',
    league: 'دوري روشن السعودي',
    country: 'السعودية',
    badgeUrl: 'https://cdn.sofifa.net/teams/605/120.png',
  },
  {
    id: 'al_nassr',
    name: 'النصر',
    league: 'دوري روشن السعودي',
    country: 'السعودية',
    badgeUrl: 'https://cdn.sofifa.net/teams/112139/120.png',
  },
  {
    id: 'al_ittihad',
    name: 'الاتحاد',
    league: 'دوري روشن السعودي',
    country: 'السعودية',
    badgeUrl: 'https://cdn.sofifa.net/teams/607/120.png',
  },
  {
    id: 'al_ahli',
    name: 'الأهلي',
    league: 'دوري روشن السعودي',
    country: 'السعودية',
    badgeUrl: 'https://cdn.sofifa.net/teams/112392/120.png',
  },
  {
    id: 'al_shabab',
    name: 'الشباب',
    league: 'دوري روشن السعودي',
    country: 'السعودية',
    badgeUrl: 'https://cdn.sofifa.net/teams/111706/120.png',
  },

  // الدوري الإسباني (3)
  {
    id: 'real_madrid',
    name: 'ريال مدريد',
    league: 'الدوري الإسباني',
    country: 'إسبانيا',
    badgeUrl: 'https://cdn.sofifa.net/teams/243/120.png',
  },
  {
    id: 'barcelona',
    name: 'برشلونة',
    league: 'الدوري الإسباني',
    country: 'إسبانيا',
    badgeUrl: 'https://cdn.sofifa.net/teams/241/120.png',
  },
  {
    id: 'atletico_madrid',
    name: 'أتلتيكو مدريد',
    league: 'الدوري الإسباني',
    country: 'إسبانيا',
    badgeUrl: 'https://cdn.sofifa.net/teams/240/120.png',
  },

  // الدوري الإيطالي (4)
  {
    id: 'juventus',
    name: 'يوفنتوس',
    league: 'الدوري الإيطالي',
    country: 'إيطاليا',
    badgeUrl: 'https://cdn.sofifa.net/teams/45/120.png',
  },
  {
    id: 'milan',
    name: 'ميلان',
    league: 'الدوري الإيطالي',
    country: 'إيطاليا',
    badgeUrl: 'https://cdn.sofifa.net/teams/47/120.png',
  },
  {
    id: 'inter',
    name: 'إنتر ميلان',
    league: 'الدوري الإيطالي',
    country: 'إيطاليا',
    badgeUrl: 'https://cdn.sofifa.net/teams/44/120.png',
  },
  {
    id: 'roma',
    name: 'روما',
    league: 'الدوري الإيطالي',
    country: 'إيطاليا',
    badgeUrl: 'https://cdn.sofifa.net/teams/52/120.png',
  },

  // الدوري الإنجليزي (6)
  {
    id: 'man_city',
    name: 'مانشستر سيتي',
    league: 'الدوري الإنجليزي',
    country: 'إنجلترا',
    badgeUrl: 'https://cdn.sofifa.net/teams/10/120.png',
  },
  {
    id: 'man_united',
    name: 'مانشستر يونايتد',
    league: 'الدوري الإنجليزي',
    country: 'إنجلترا',
    badgeUrl: 'https://cdn.sofifa.net/teams/11/120.png',
  },
  {
    id: 'liverpool',
    name: 'ليفربول',
    league: 'الدوري الإنجليزي',
    country: 'إنجلترا',
    badgeUrl: 'https://cdn.sofifa.net/teams/9/120.png',
  },
  {
    id: 'arsenal',
    name: 'أرسنال',
    league: 'الدوري الإنجليزي',
    country: 'إنجلترا',
    badgeUrl: 'https://cdn.sofifa.net/teams/1/120.png',
  },
  {
    id: 'chelsea',
    name: 'تشيلسي',
    league: 'الدوري الإنجليزي',
    country: 'إنجلترا',
    badgeUrl: 'https://cdn.sofifa.net/teams/5/120.png',
  },
  {
    id: 'tottenham',
    name: 'توتنهام',
    league: 'الدوري الإنجليزي',
    country: 'إنجلترا',
    badgeUrl: 'https://cdn.sofifa.net/teams/18/120.png',
  },

  // الدوري الفرنسي (1)
  {
    id: 'psg',
    name: 'باريس سان جيرمان',
    league: 'الدوري الفرنسي',
    country: 'فرنسا',
    badgeUrl: 'https://cdn.sofifa.net/teams/73/120.png',
  },

  // الدوري الهولندي (1)
  {
    id: 'ajax',
    name: 'أياكس أمستردام',
    league: 'الدوري الهولندي',
    country: 'هولندا',
    badgeUrl: 'https://cdn.sofifa.net/teams/245/120.png',
  },
];
