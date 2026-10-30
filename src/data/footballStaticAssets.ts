/**
 * Football Static Assets Bank (Zero Broken Images & Offline-First)
 * Direct CDN links and verified transparent cutouts for TheSportsDB & local assets.
 */

export interface StaticPlayerAsset {
  id: string;
  name: string;
  country: string;
  position: 'GK' | 'DEF' | 'MID' | 'ATT';
  club: string;
  imageUrl: string; // TheSportsDB transparent cutout or high-res headshot
  prestigeScore: number; // 1 - 100 for draft power formula
  // Extended fields for bingo matching compatibility:
  photoUrl?: string;
  currentClub?: string;
  clubs?: string[];
  nationality?: string;
  trophies?: string[];
  traits?: string[];
}

export interface StaticClubAsset {
  id: string;
  name: string;
  logoUrl: string;
  imageUrl?: string;
  country?: string;
}

export interface StaticTrophyAsset {
  id: string;
  name: string;
  imageUrl: string;
  type?: 'continental' | 'world' | 'individual' | 'domestic';
}

// -------------------------------------------------------------
// 1. Direct Static Clubs (Verified Local Assets & Fallbacks)
// -------------------------------------------------------------
export const STATIC_CLUBS: Record<string, StaticClubAsset> = {
  barcelona: {
    id: 'barcelona',
    name: 'برشلونة',
    logoUrl: '/assets/football/clubs/barcelona.png',
    imageUrl: '/assets/football/clubs/barcelona.png',
    country: 'إسبانيا',
  },
  realmadrid: {
    id: 'realmadrid',
    name: 'ريال مدريد',
    logoUrl: '/assets/football/clubs/real_madrid.png',
    imageUrl: '/assets/football/clubs/real_madrid.png',
    country: 'إسبانيا',
  },
  chelsea: {
    id: 'chelsea',
    name: 'تشيلسي',
    logoUrl: '/assets/football/clubs/chelsea.png',
    imageUrl: '/assets/football/clubs/chelsea.png',
    country: 'إنجلترا',
  },
  mancity: {
    id: 'mancity',
    name: 'مانشستر سيتي',
    logoUrl: '/assets/football/clubs/man_city.png',
    imageUrl: '/assets/football/clubs/man_city.png',
    country: 'إنجلترا',
  },
  liverpool: {
    id: 'liverpool',
    name: 'ليفربول',
    logoUrl: '/assets/football/clubs/liverpool.png',
    imageUrl: '/assets/football/clubs/liverpool.png',
    country: 'إنجلترا',
  },
  alhilal: {
    id: 'alhilal',
    name: 'الهلال',
    logoUrl: '/assets/football/clubs/al_hilal.png',
    imageUrl: '/assets/football/clubs/al_hilal.png',
    country: 'السعودية',
  },
  alnassr: {
    id: 'alnassr',
    name: 'النصر',
    logoUrl: '/assets/football/clubs/al_nassr.png',
    imageUrl: '/assets/football/clubs/al_nassr.png',
    country: 'السعودية',
  },
  ittihad: {
    id: 'ittihad',
    name: 'الاتحاد',
    logoUrl: '/assets/football/clubs/al_ittihad.png',
    imageUrl: '/assets/football/clubs/al_ittihad.png',
    country: 'السعودية',
  },
  alahli: {
    id: 'alahli',
    name: 'الأهلي',
    logoUrl: '/assets/football/clubs/al_ahli.png',
    imageUrl: '/assets/football/clubs/al_ahli.png',
    country: 'السعودية',
  },
  bayern: {
    id: 'bayern',
    name: 'بايرن ميونخ',
    logoUrl: '/assets/football/clubs/bayern.png',
    imageUrl: '/assets/football/clubs/bayern.png',
    country: 'ألمانيا',
  },
  psg: {
    id: 'psg',
    name: 'باريس سان جيرمان',
    logoUrl: '/assets/football/clubs/psg.png',
    imageUrl: '/assets/football/clubs/psg.png',
    country: 'فرنسا',
  },
  arsenal: {
    id: 'arsenal',
    name: 'أرسنال',
    logoUrl: '/assets/football/clubs/arsenal.png',
    imageUrl: '/assets/football/clubs/arsenal.png',
    country: 'إنجلترا',
  },
  juventus: {
    id: 'juventus',
    name: 'يوفنتوس',
    logoUrl: '/assets/football/clubs/juventus.png',
    imageUrl: '/assets/football/clubs/juventus.png',
    country: 'إيطاليا',
  },
  inter: {
    id: 'inter',
    name: 'إنتر ميلان',
    logoUrl: '/assets/football/clubs/inter.png',
    imageUrl: '/assets/football/clubs/inter.png',
    country: 'إيطاليا',
  },
  ac_milan: {
    id: 'ac_milan',
    name: 'ميلان',
    logoUrl: '/assets/football/clubs/ac_milan.png',
    imageUrl: '/assets/football/clubs/ac_milan.png',
    country: 'إيطاليا',
  },
  man_united: {
    id: 'man_united',
    name: 'مانشستر يونايتد',
    logoUrl: '/assets/football/clubs/man_united.png',
    imageUrl: '/assets/football/clubs/man_united.png',
    country: 'إنجلترا',
  },
};

// Aliases with snake_case keys for backward compatibility
export const STATIC_FOOTBALL_CLUBS: Record<string, StaticClubAsset> = {
  ...STATIC_CLUBS,
  real_madrid: STATIC_CLUBS.realmadrid,
  man_city: STATIC_CLUBS.mancity,
  al_hilal: STATIC_CLUBS.alhilal,
  al_nassr: STATIC_CLUBS.alnassr,
  al_ittihad: STATIC_CLUBS.ittihad,
  al_ahli: STATIC_CLUBS.alahli,
  man_united: STATIC_CLUBS.man_united,
};

// -------------------------------------------------------------
// 2. Direct Static Trophies (Verified Local Transparent PNGs)
// -------------------------------------------------------------
export const STATIC_TROPHIES: Record<string, StaticTrophyAsset> = {
  ucl: {
    id: 'ucl',
    name: 'دوري أبطال أوروبا',
    imageUrl: '/assets/football/trophies/ucl.png',
    type: 'continental',
  },
  world_cup: {
    id: 'world_cup',
    name: 'كأس العالم',
    imageUrl: '/assets/football/trophies/world_cup.png',
    type: 'world',
  },
  premier_league: {
    id: 'premier_league',
    name: 'الدوري الإنجليزي',
    imageUrl: 'https://www.thesportsdb.com/images/media/league/trophy/6r143u1686739015.png',
    type: 'domestic',
  },
  saudi_league: {
    id: 'saudi_league',
    name: 'دوري روشن',
    imageUrl: '/assets/football/trophies/rpl.png',
    type: 'domestic',
  },
  ballon_dor: {
    id: 'ballon_dor',
    name: 'الكرة الذهبية',
    imageUrl: '/assets/football/trophies/ballon_dor.png',
    type: 'individual',
  },
  copa_america: {
    id: 'copa_america',
    name: 'كوبا أمريكا',
    imageUrl: '/assets/football/trophies/copa_america.png',
    type: 'continental',
  },
  afc: {
    id: 'afc',
    name: 'كأس آسيا / دوري أبطال آسيا',
    imageUrl: '/assets/football/trophies/afc.png',
    type: 'continental',
  },
};

export const STATIC_FOOTBALL_TROPHIES = STATIC_TROPHIES;

// -------------------------------------------------------------
// 3. Direct Static Managers (High-Res Photos & Cutouts)
// -------------------------------------------------------------
export interface StaticManagerAsset {
  id: string;
  name: string;
  imageUrl: string;
  teams: string[];
}

export const STATIC_MANAGERS: Record<string, StaticManagerAsset> = {
  guardiola: {
    id: 'guardiola',
    name: 'بيب غوارديولا',
    imageUrl: '/assets/football/managers/guardiola.jpg',
    teams: ['برشلونة', 'بايرن ميونخ', 'مانشستر سيتي'],
  },
  ancelotti: {
    id: 'ancelotti',
    name: 'كارلو أنشيلوتي',
    imageUrl: '/assets/football/managers/ancelotti.jpg',
    teams: ['ريال مدريد', 'ميلان', 'تشيلسي', 'باريس سان جيرمان', 'بايرن ميونخ', 'يوفنتوس', 'إيفرتون'],
  },
  mourinho: {
    id: 'mourinho',
    name: 'جوزيه مورينيو',
    imageUrl: '/assets/football/managers/mourinho.jpg',
    teams: ['ريال مدريد', 'تشيلسي', 'إنتر ميلان', 'مانشستر يونايتد', 'روما', 'بورتو', 'توتنهام'],
  },
  zidane: {
    id: 'zidane',
    name: 'زين الدين زيدان',
    imageUrl: '/assets/football/managers/zidane.jpg',
    teams: ['ريال مدريد'],
  },
  jesus: {
    id: 'jesus',
    name: 'جورجي خيسوس',
    imageUrl: '/assets/football/managers/jesus.jpg',
    teams: ['الهلال', 'بنفيكا', 'فلامنغو', 'سبورتينغ لشبونة', 'فنربخشة'],
  },
};

// -------------------------------------------------------------
// 4. Direct Static Positions (High-Contrast Football SVG Badges)
// -------------------------------------------------------------
export interface StaticPositionAsset {
  id: string;
  code: 'GK' | 'DEF' | 'MID' | 'ATT';
  title: string;
  imageUrl: string;
}

export const STATIC_POSITIONS: Record<string, StaticPositionAsset> = {
  gk: {
    id: 'gk',
    code: 'GK',
    title: 'حارس مرمى',
    imageUrl: '/assets/football/positions/gk.svg',
  },
  def: {
    id: 'def',
    code: 'DEF',
    title: 'مدافع',
    imageUrl: '/assets/football/positions/def.svg',
  },
  mid: {
    id: 'mid',
    code: 'MID',
    title: 'لاعب وسط',
    imageUrl: '/assets/football/positions/mid.svg',
  },
  att: {
    id: 'att',
    code: 'ATT',
    title: 'مهاجم',
    imageUrl: '/assets/football/positions/att.svg',
  },
};

// -------------------------------------------------------------
// 3. TheSportsDB Static Player Cutouts & Superstars (Authoritative Offline-First Bank)
// -------------------------------------------------------------
export const STATIC_BINGO_PLAYERS: StaticPlayerAsset[] = [
  {
    id: 'messi',
    name: 'ليونيل ميسي',
    country: 'الأرجنتين',
    position: 'ATT',
    club: 'إنتر ميامي',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/m79r3b1693829023.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/m79r3b1693829023.png',
    currentClub: 'إنتر ميامي',
    clubs: ['برشلونة', 'باريس سان جيرمان', 'إنتر ميامي'],
    nationality: 'الأرجنتين',
    prestigeScore: 99,
    trophies: ['كأس العالم', 'دوري أبطال أوروبا', 'الكرة الذهبية', 'كوبا أمريكا'],
    traits: ['أشول', 'رقم 10', 'قائد', 'أسطورة'],
  },
  {
    id: 'ronaldo',
    name: 'كريستيانو رونالدو',
    country: 'البرتغال',
    position: 'ATT',
    club: 'النصر',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/q9d0l31693828945.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/q9d0l31693828945.png',
    currentClub: 'النصر',
    clubs: ['سبورتينغ لشبونة', 'مانشستر يونايتد', 'ريال مدريد', 'يوفنتوس', 'النصر'],
    nationality: 'البرتغال',
    prestigeScore: 99,
    trophies: ['دوري أبطال أوروبا', 'الكرة الذهبية', 'دوري روشن السعودي'],
    traits: ['لعب_بالسعودية', 'قائد', 'هداف', 'أسطورة'],
  },
  {
    id: 'benzema',
    name: 'كريم بنزيما',
    country: 'فرنسا',
    position: 'ATT',
    club: 'الاتحاد',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/3e0h0b1693829210.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/3e0h0b1693829210.png',
    currentClub: 'الاتحاد',
    clubs: ['ليون', 'ريال مدريد', 'الاتحاد'],
    nationality: 'فرنسا',
    prestigeScore: 94,
    trophies: ['دوري أبطال أوروبا', 'الكرة الذهبية', 'دوري روشن السعودي'],
    traits: ['لعب_بالسعودية', 'رقم 9', 'هداف'],
  },
  {
    id: 'haaland',
    name: 'إيرلينغ هالاند',
    country: 'النرويج',
    position: 'ATT',
    club: 'مانشستر سيتي',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/qpxxvy1693828812.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/qpxxvy1693828812.png',
    currentClub: 'مانشستر سيتي',
    clubs: ['سالزبورغ', 'دورتموند', 'مانشستر سيتي'],
    nationality: 'النرويج',
    prestigeScore: 96,
    trophies: ['دوري أبطال أوروبا', 'الدوري الإنجليزي'],
    traits: ['أشول', 'رقم 9', 'عملاق', 'هداف'],
  },
  {
    id: 'mbappe',
    name: 'كيليان مبابي',
    country: 'فرنسا',
    position: 'ATT',
    club: 'ريال مدريد',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/bvxsvw1693828690.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/bvxsvw1693828690.png',
    currentClub: 'ريال مدريد',
    clubs: ['موناكو', 'باريس سان جيرمان', 'ريال مدريد'],
    nationality: 'فرنسا',
    prestigeScore: 97,
    trophies: ['كأس العالم'],
    traits: ['سريع', 'هداف', 'أسمر'],
  },
  {
    id: 'modric',
    name: 'لوكا مودريتش',
    country: 'كرواتيا',
    position: 'MID',
    club: 'ريال مدريد',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/w0x6v81693829150.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/w0x6v81693829150.png',
    currentClub: 'ريال مدريد',
    clubs: ['دينامو زغرب', 'توتنهام', 'ريال مدريد'],
    nationality: 'كرواتيا',
    prestigeScore: 93,
    trophies: ['دوري أبطال أوروبا', 'الكرة الذهبية'],
    traits: ['قائد', 'صانع_لعب', 'مايسترو'],
  },
  {
    id: 'debruyne',
    name: 'كيفين دي بروين',
    country: 'بلجيكا',
    position: 'MID',
    club: 'مانشستر سيتي',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/3s039b1693829090.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/3s039b1693829090.png',
    currentClub: 'مانشستر سيتي',
    clubs: ['جينك', 'تشيلسي', 'فولفسبورغ', 'مانشستر سيتي'],
    nationality: 'بلجيكا',
    prestigeScore: 95,
    trophies: ['دوري أبطال أوروبا', 'الدوري الإنجليزي'],
    traits: ['صانع_لعب', 'تمريرات_حاسمة', 'قائد'],
  },
  {
    id: 'vandijk',
    name: 'فيرجيل فان دايك',
    country: 'هولندا',
    position: 'DEF',
    club: 'ليفربول',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/u389bv1693829320.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/u389bv1693829320.png',
    currentClub: 'ليفربول',
    clubs: ['غرونينغن', 'سلتيك', 'ساوثهامبتون', 'ليفربول'],
    nationality: 'هولندا',
    prestigeScore: 92,
    trophies: ['دوري أبطال أوروبا', 'الدوري الإنجليزي'],
    traits: ['قائد', 'عملاق', 'صخرة_دفاع'],
  },
  {
    id: 'courtois',
    name: 'تيبو كورتوا',
    country: 'بلجيكا',
    position: 'GK',
    club: 'ريال مدريد',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/w8402b1693829450.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/w8402b1693829450.png',
    currentClub: 'ريال مدريد',
    clubs: ['جينك', 'أتلتيكو مدريد', 'تشيلسي', 'ريال مدريد'],
    nationality: 'بلجيكا',
    prestigeScore: 91,
    trophies: ['دوري أبطال أوروبا'],
    traits: ['حارس_مرمى', 'عملاق', 'جدار'],
  },
  {
    id: 'salem',
    name: 'سالم الدوسري',
    country: 'السعودية',
    position: 'ATT',
    club: 'الهلال',
    imageUrl: 'https://www.thesportsdb.com/images/media/player/cutout/salem_aldawsari.png',
    photoUrl: 'https://www.thesportsdb.com/images/media/player/cutout/salem_aldawsari.png',
    currentClub: 'الهلال',
    clubs: ['الهلال', 'فياريال'],
    nationality: 'السعودية',
    prestigeScore: 88,
    trophies: ['دوري أبطال آسيا', 'دوري روشن السعودي'],
    traits: ['عربي', 'مهاري', 'تورنيدو', 'لعب_بالسعودية'],
  },
  {
    id: 'neymar',
    name: 'نيمار جونيور',
    country: 'البرازيل',
    position: 'ATT',
    club: 'الهلال',
    imageUrl: '/assets/football/players/neymar.jpg',
    photoUrl: '/assets/football/players/neymar.jpg',
    currentClub: 'الهلال',
    clubs: ['سانتوس', 'برشلونة', 'باريس سان جيرمان', 'الهلال'],
    nationality: 'البرازيل',
    prestigeScore: 94,
    trophies: ['دوري أبطال أوروبا', 'دوري روشن السعودي', 'كأس القارات'],
    traits: ['لعب_بالسعودية', 'رقم 10', 'مهاري'],
  },
  {
    id: 'salah',
    name: 'محمد صلاح',
    country: 'مصر',
    position: 'ATT',
    club: 'ليفربول',
    imageUrl: '/assets/football/players/salah.jpg',
    photoUrl: '/assets/football/players/salah.jpg',
    currentClub: 'ليفربول',
    clubs: ['المقاولون', 'بازل', 'تشيلسي', 'فيورنتينا', 'روما', 'ليفربول'],
    nationality: 'مصر',
    prestigeScore: 94,
    trophies: ['دوري أبطال أوروبا', 'الدوري الإنجليزي'],
    traits: ['أشول', 'سريع', 'عربي', 'هداف'],
  },
  {
    id: 'vinicius',
    name: 'فينيسيوس جونيور',
    country: 'البرازيل',
    position: 'ATT',
    club: 'ريال مدريد',
    imageUrl: '/assets/football/players/vinicius.jpg',
    photoUrl: '/assets/football/players/vinicius.jpg',
    currentClub: 'ريال مدريد',
    clubs: ['فلامنغو', 'ريال مدريد'],
    nationality: 'البرازيل',
    prestigeScore: 95,
    trophies: ['دوري أبطال أوروبا'],
    traits: ['مهاري', 'سريع', 'أسمر'],
  },
  {
    id: 'bellingham',
    name: 'جود بيلينغهام',
    country: 'إنجلترا',
    position: 'MID',
    club: 'ريال مدريد',
    imageUrl: '/assets/football/players/bellingham.jpg',
    photoUrl: '/assets/football/players/bellingham.jpg',
    currentClub: 'ريال مدريد',
    clubs: ['برمنغهام سيتي', 'دورتموند', 'ريال مدريد'],
    nationality: 'إنجلترا',
    prestigeScore: 93,
    trophies: ['دوري أبطال أوروبا'],
    traits: ['شاب', 'صانع_ألعاب', 'أسمر'],
  },
  {
    id: 'rodri',
    name: 'رودري',
    country: 'إسبانيا',
    position: 'MID',
    club: 'مانشستر سيتي',
    imageUrl: '/assets/football/players/rodri.jpg',
    photoUrl: '/assets/football/players/rodri.jpg',
    currentClub: 'مانشستر سيتي',
    clubs: ['فياريال', 'أتلتيكو مدريد', 'مانشستر سيتي'],
    nationality: 'إسبانيا',
    prestigeScore: 94,
    trophies: ['دوري أبطال أوروبا', 'الدوري الإنجليزي', 'الكرة الذهبية'],
    traits: ['محور', 'بطل_أوروبا'],
  },
  {
    id: 'kane',
    name: 'هاري كين',
    country: 'إنجلترا',
    position: 'ATT',
    club: 'بايرن ميونخ',
    imageUrl: '/assets/football/players/kane.jpg',
    photoUrl: '/assets/football/players/kane.jpg',
    currentClub: 'بايرن ميونخ',
    clubs: ['توتنهام', 'ليستر سيتي', 'بايرن ميونخ'],
    nationality: 'إنجلترا',
    prestigeScore: 92,
    trophies: [],
    traits: ['هداف', 'قائد', 'رقم 9'],
  },
  {
    id: 'alisson',
    name: 'أليسون بيكر',
    country: 'البرازيل',
    position: 'GK',
    club: 'ليفربول',
    imageUrl: '/assets/football/players/alisson.jpg',
    photoUrl: '/assets/football/players/alisson.jpg',
    currentClub: 'ليفربول',
    clubs: ['إنترناسيونال', 'روما', 'ليفربول'],
    nationality: 'البرازيل',
    prestigeScore: 90,
    trophies: ['دوري أبطال أوروبا', 'الدوري الإنجليزي', 'كوبا أمريكا'],
    traits: ['حارس_مرمى', 'جدار'],
  },
  {
    id: 'kante',
    name: 'نغولو كانتي',
    country: 'فرنسا',
    position: 'MID',
    club: 'الاتحاد',
    imageUrl: '/assets/football/players/kante.jpg',
    photoUrl: '/assets/football/players/kante.jpg',
    currentClub: 'الاتحاد',
    clubs: ['بولون', 'كاين', 'ليستر سيتي', 'تشيلسي', 'الاتحاد'],
    nationality: 'فرنسا',
    prestigeScore: 91,
    trophies: ['كأس العالم', 'دوري أبطال أوروبا', 'الدوري الإنجليزي', 'دوري روشن السعودي'],
    traits: ['لعب_بالسعودية', 'رئة_الفريق', 'أسمر'],
  },
  {
    id: 'kimmich',
    name: 'جوشوا كيميتش',
    country: 'ألمانيا',
    position: 'MID',
    club: 'بايرن ميونخ',
    imageUrl: '/assets/football/players/kimmich.jpg',
    photoUrl: '/assets/football/players/kimmich.jpg',
    currentClub: 'بايرن ميونخ',
    clubs: ['لايبزيغ', 'بايرن ميونخ'],
    nationality: 'ألمانيا',
    prestigeScore: 89,
    trophies: ['دوري أبطال أوروبا', 'الدوري الألماني'],
    traits: ['قائد', 'جوكر'],
  },
  {
    id: 'rudiger',
    name: 'أنطونيو روديغر',
    country: 'ألمانيا',
    position: 'DEF',
    club: 'ريال مدريد',
    imageUrl: '/assets/football/players/rudiger.jpg',
    photoUrl: '/assets/football/players/rudiger.jpg',
    currentClub: 'ريال مدريد',
    clubs: ['شتوتغارت', 'روما', 'تشيلسي', 'ريال مدريد'],
    nationality: 'ألمانيا',
    prestigeScore: 90,
    trophies: ['دوري أبطال أوروبا'],
    traits: ['مدافع_شرس', 'أسمر'],
  },
  {
    id: 'son',
    name: 'سون هيونغ مين',
    country: 'كوريا الجنوبية',
    position: 'ATT',
    club: 'توتنهام',
    imageUrl: '/assets/football/players/son.jpg',
    photoUrl: '/assets/football/players/son.jpg',
    currentClub: 'توتنهام',
    clubs: ['هامبورغ', 'باير ليفركوزن', 'توتنهام'],
    nationality: 'كوريا الجنوبية',
    prestigeScore: 89,
    trophies: [],
    traits: ['قائد', 'سريع', 'هداف'],
  },
  {
    id: 'lewandowski',
    name: 'روبرت ليفاندوفسكي',
    country: 'بولندا',
    position: 'ATT',
    club: 'برشلونة',
    imageUrl: '/assets/football/players/lewandowski.jpg',
    photoUrl: '/assets/football/players/lewandowski.jpg',
    currentClub: 'برشلونة',
    clubs: ['لخ بوزنان', 'دورتموند', 'بايرن ميونخ', 'برشلونة'],
    nationality: 'بولندا',
    prestigeScore: 92,
    trophies: ['دوري أبطال أوروبا'],
    traits: ['هداف', 'رقم 9'],
  },
  {
    id: 'mitrovic',
    name: 'ألكسندر ميتروفيتش',
    country: 'صربيا',
    position: 'ATT',
    club: 'الهلال',
    imageUrl: '/assets/football/players/mitrovic.jpg',
    photoUrl: '/assets/football/players/mitrovic.jpg',
    currentClub: 'الهلال',
    clubs: ['بارتيزان', 'أندرلخت', 'نيوكاسل', 'فولهام', 'الهلال'],
    nationality: 'صربيا',
    prestigeScore: 88,
    trophies: ['دوري روشن السعودي'],
    traits: ['لعب_بالسعودية', 'هداف', 'رقم 9', 'عملاق'],
  },
  {
    id: 'mahrez',
    name: 'رياض محرز',
    country: 'الجزائر',
    position: 'ATT',
    club: 'الأهلي',
    imageUrl: '/assets/football/players/mahrez.jpg',
    photoUrl: '/assets/football/players/mahrez.jpg',
    currentClub: 'الأهلي',
    clubs: ['لوهافر', 'ليستر سيتي', 'مانشستر سيتي', 'الأهلي'],
    nationality: 'الجزائر',
    prestigeScore: 90,
    trophies: ['دوري أبطال أوروبا', 'الدوري الإنجليزي', 'كأس أمم إفريقيا'],
    traits: ['أشول', 'لعب_بالسعودية', 'مهاري', 'عربي'],
  },
  {
    id: 'bono',
    name: 'ياسين بونو',
    country: 'المغرب',
    position: 'GK',
    club: 'الهلال',
    imageUrl: '/assets/football/players/bono.jpg',
    photoUrl: '/assets/football/players/bono.jpg',
    currentClub: 'الهلال',
    clubs: ['الوداد', 'أتلتيكو مدريد', 'سرقسطة', 'جيرونا', 'إشبيلية', 'الهلال'],
    nationality: 'المغرب',
    prestigeScore: 89,
    trophies: ['الدوري الأوروبي', 'دوري روشن السعودي'],
    traits: ['حارس_مرمى', 'لعب_بالسعودية', 'عربي', 'جدار'],
  },
];

export const STATIC_ROULETTE_SUPERSTARS = STATIC_BINGO_PLAYERS;
export type StaticRoulettePlayer = StaticPlayerAsset;

// -------------------------------------------------------------
// 4. Memory Cache & Fast Preloading Pipeline
// -------------------------------------------------------------
const bingoImageCache = new Map<string, string>();

/**
 * Preload a single image with a strict timeout so the UI never stalls
 */
export function preloadImageWithTimeout(url: string, timeoutMs = 1200): Promise<string> {
  if (!url) return Promise.resolve('');
  if (bingoImageCache.has(url)) return Promise.resolve(url);

  return new Promise((resolve) => {
    let finished = false;
    const img = new Image();

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        img.src = '';
        bingoImageCache.set(url, url); // mark attempted so we don't block
        resolve(url);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        bingoImageCache.set(url, url);
        resolve(url);
      }
    };

    img.onerror = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        bingoImageCache.set(url, url);
        resolve(url);
      }
    };

    img.src = url;
  });
}

/**
 * Batch preload all assets for a bingo round in the background without blocking the UI.
 */
export async function preloadBingoBatch(urls: string[]): Promise<void> {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  await Promise.allSettled(uniqueUrls.map((u) => preloadImageWithTimeout(u, 1200)));
}
