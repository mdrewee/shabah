export type BingoCategory =
  | 'club'       // شعار نادي (مثّل النادي في مسيرته)
  | 'country'    // علم دولة (جنسيته أو مثّل منتخبها)
  | 'manager'    // صورة مدرب (تدرّب تحت قيادته)
  | 'trophy'     // بطولة (حققها في تاريخه)
  | 'position'   // مركز (GK, DEF, MID, FWD)
  | 'number'     // رقم تيشيرت (ارتداه في مسيرته)
  | 'trait';     // صفة جسدية (أشول، أيمن، أسمر)

export interface BingoTileDefinition {
  id: string;
  category: BingoCategory;
  targetValue: string | number;
  label: string; // Compact label / tooltip
  iconUrl: string; // Image URL / SVG URL / Emoji
}

export interface PlayerBingoTile {
  index: number; // 0 to 15
  definition: BingoTileDefinition;
  isClaimed: boolean;
  claimedPlayer?: {
    id: string;
    name: string;
    photo: string;
  };
}

export interface ActiveFootballer {
  id: string;
  name: string;
  photo: string;
  clubs: string[];
  nationalities: string[];
  managers: string[];
  trophies: string[];
  positions: string[];
  shirtNumbers: number[];
  foot: 'left' | 'right';
  skinTone: 'dark' | 'light';
}

// -------------------------------------------------------------
// Authentic Visual Tiles Bank (Real Wikimedia / Flag CDN Assets)
// -------------------------------------------------------------
export const BINGO_TILES_BANK: BingoTileDefinition[] = [
  // --- الأندية (Real Club Logos) ---
  {
    id: 'club_real_madrid',
    category: 'club',
    targetValue: 'real_madrid',
    label: 'ريال مدريد',
    iconUrl: '/assets/football/clubs/real_madrid.png',
  },
  {
    id: 'club_barcelona',
    category: 'club',
    targetValue: 'barcelona',
    label: 'برشلونة',
    iconUrl: '/assets/football/clubs/barcelona.png',
  },
  {
    id: 'club_al_hilal',
    category: 'club',
    targetValue: 'al_hilal',
    label: 'الهلال',
    iconUrl: '/assets/football/clubs/al_hilal.png',
  },
  {
    id: 'club_al_nassr',
    category: 'club',
    targetValue: 'al_nassr',
    label: 'النصر',
    iconUrl: '/assets/football/clubs/al_nassr.png',
  },
  {
    id: 'club_al_ittihad',
    category: 'club',
    targetValue: 'al_ittihad',
    label: 'الاتحاد',
    iconUrl: '/assets/football/clubs/al_ittihad.png',
  },
  {
    id: 'club_al_ahli',
    category: 'club',
    targetValue: 'al_ahli',
    label: 'الأهلي السعودي',
    iconUrl: '/assets/football/clubs/al_ahli.png',
  },
  {
    id: 'club_man_city',
    category: 'club',
    targetValue: 'man_city',
    label: 'مانشستر سيتي',
    iconUrl: '/assets/football/clubs/man_city.png',
  },
  {
    id: 'club_man_united',
    category: 'club',
    targetValue: 'man_united',
    label: 'مانشستر يونايتد',
    iconUrl: '/assets/football/clubs/man_united.png',
  },
  {
    id: 'club_bayern',
    category: 'club',
    targetValue: 'bayern',
    label: 'بايرن ميونخ',
    iconUrl: '/assets/football/clubs/bayern.png',
  },
  {
    id: 'club_psg',
    category: 'club',
    targetValue: 'psg',
    label: 'باريس سان جيرمان',
    iconUrl: '/assets/football/clubs/psg.png',
  },
  {
    id: 'club_liverpool',
    category: 'club',
    targetValue: 'liverpool',
    label: 'ليفربول',
    iconUrl: '/assets/football/clubs/liverpool.png',
  },
  {
    id: 'club_arsenal',
    category: 'club',
    targetValue: 'arsenal',
    label: 'أرسنال',
    iconUrl: '/assets/football/clubs/arsenal.png',
  },
  {
    id: 'club_chelsea',
    category: 'club',
    targetValue: 'chelsea',
    label: 'تشيلسي',
    iconUrl: '/assets/football/clubs/chelsea.png',
  },
  {
    id: 'club_juventus',
    category: 'club',
    targetValue: 'juventus',
    label: 'يوفنتوس',
    iconUrl: '/assets/football/clubs/juventus.png',
  },
  {
    id: 'club_milan',
    category: 'club',
    targetValue: 'milan',
    label: 'ميلان',
    iconUrl: '/assets/football/clubs/ac_milan.png',
  },
  {
    id: 'club_inter',
    category: 'club',
    targetValue: 'inter',
    label: 'إنتر ميلان',
    iconUrl: '/assets/football/clubs/inter.png',
  },

  // --- المنتخبات والأعلام (Real National Flags) ---
  {
    id: 'flag_sa',
    category: 'country',
    targetValue: 'saudi',
    label: 'السعودية',
    iconUrl: '/assets/football/flags/sa.png',
  },
  {
    id: 'flag_br',
    category: 'country',
    targetValue: 'brazil',
    label: 'البرازيل',
    iconUrl: '/assets/football/flags/br.png',
  },
  {
    id: 'flag_ar',
    category: 'country',
    targetValue: 'argentina',
    label: 'الأرجنتين',
    iconUrl: '/assets/football/flags/ar.png',
  },
  {
    id: 'flag_fr',
    category: 'country',
    targetValue: 'france',
    label: 'فرنسا',
    iconUrl: '/assets/football/flags/fr.png',
  },
  {
    id: 'flag_pt',
    category: 'country',
    targetValue: 'portugal',
    label: 'البرتغال',
    iconUrl: '/assets/football/flags/pt.png',
  },
  {
    id: 'flag_es',
    category: 'country',
    targetValue: 'spain',
    label: 'إسبانيا',
    iconUrl: '/assets/football/flags/es.png',
  },
  {
    id: 'flag_de',
    category: 'country',
    targetValue: 'germany',
    label: 'ألمانيا',
    iconUrl: '/assets/football/flags/de.png',
  },
  {
    id: 'flag_eg',
    category: 'country',
    targetValue: 'egypt',
    label: 'مصر',
    iconUrl: '/assets/football/flags/eg.png',
  },
  {
    id: 'flag_ma',
    category: 'country',
    targetValue: 'morocco',
    label: 'المغرب',
    iconUrl: '/assets/football/flags/ma.png',
  },
  {
    id: 'flag_hr',
    category: 'country',
    targetValue: 'croatia',
    label: 'كرواتيا',
    iconUrl: '/assets/football/flags/hr.png',
  },

  // --- الكؤوس والبطولات (Trophies) ---
  {
    id: 'trophy_world_cup',
    category: 'trophy',
    targetValue: 'world_cup',
    label: 'كأس العالم',
    iconUrl: '/assets/football/trophies/world_cup.png',
  },
  {
    id: 'trophy_ucl',
    category: 'trophy',
    targetValue: 'ucl',
    label: 'دوري أبطال أوروبا',
    iconUrl: '/assets/football/trophies/ucl.png',
  },
  {
    id: 'trophy_ballon_dor',
    category: 'trophy',
    targetValue: 'ballon_dor',
    label: 'الكرة الذهبية',
    iconUrl: '/assets/football/trophies/ballon_dor.png',
  },
  {
    id: 'trophy_copa_america',
    category: 'trophy',
    targetValue: 'copa_america',
    label: 'كوبا أمريكا',
    iconUrl: '/assets/football/trophies/copa_america.png',
  },

  // --- المدربون (Real Manager Headshots) ---
  {
    id: 'mgr_guardiola',
    category: 'manager',
    targetValue: 'guardiola',
    label: 'بيب غوارديولا',
    iconUrl: '/assets/football/managers/guardiola.jpg',
  },
  {
    id: 'mgr_ancelotti',
    category: 'manager',
    targetValue: 'ancelotti',
    label: 'كارلو أنشيلوتي',
    iconUrl: '/assets/football/managers/ancelotti.jpg',
  },
  {
    id: 'mgr_mourinho',
    category: 'manager',
    targetValue: 'mourinho',
    label: 'جوزيه مورينيو',
    iconUrl: '/assets/football/managers/mourinho.jpg',
  },
  {
    id: 'mgr_jesus',
    category: 'manager',
    targetValue: 'jesus',
    label: 'جورجي جيسوس',
    iconUrl: '/assets/football/managers/jesus.jpg',
  },
  {
    id: 'mgr_zidane',
    category: 'manager',
    targetValue: 'zidane',
    label: 'زين الدين زيدان',
    iconUrl: '/assets/football/managers/zidane.jpg',
  },

  // --- المراكز والأرقام والصفات ---
  { id: 'pos_gk', category: 'position', targetValue: 'GK', label: 'حارس مرمى', iconUrl: '🧤' },
  { id: 'pos_fwd', category: 'position', targetValue: 'FWD', label: 'مهاجم', iconUrl: '⚡' },
  { id: 'pos_def', category: 'position', targetValue: 'DEF', label: 'مدافع', iconUrl: '🛡️' },
  { id: 'num_7', category: 'number', targetValue: 7, label: 'رقم 7', iconUrl: '7️⃣' },
  { id: 'num_10', category: 'number', targetValue: 10, label: 'رقم 10', iconUrl: '🔟' },
  { id: 'trait_left', category: 'trait', targetValue: 'left_foot', label: 'أشول (قدم يسرى)', iconUrl: '🦶' },
  {
    id: 'trait_dark',
    category: 'trait',
    targetValue: 'dark_skin',
    label: 'بشرة سمراء',
    iconUrl: '/assets/football/traits/dark_skin.jpg',
  },
];

// -------------------------------------------------------------
// Massive Real Players Bank (FOOTBALLERS_BINGO_MASTER)
// -------------------------------------------------------------
export const FOOTBALLERS_BINGO_MASTER: ActiveFootballer[] = [
  {
    id: 'ronaldo',
    name: 'كريستيانو رونالدو',
    photo: '/assets/football/players/ronaldo.jpg',
    clubs: ['al_nassr', 'real_madrid', 'man_united', 'juventus', 'sporting'],
    nationalities: ['portugal'],
    managers: ['ferguson', 'mourinho', 'zidane', 'ancelotti'],
    trophies: ['ucl', 'ballon_dor'],
    positions: ['FWD'],
    shirtNumbers: [7, 9],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'messi',
    name: 'ليونيل ميسي',
    photo: '/assets/football/players/messi.jpg',
    clubs: ['barcelona', 'psg', 'inter_miami'],
    nationalities: ['argentina'],
    managers: ['guardiola'],
    trophies: ['world_cup', 'ucl', 'copa_america', 'ballon_dor'],
    positions: ['FWD'],
    shirtNumbers: [10, 30],
    foot: 'left',
    skinTone: 'light',
  },
  {
    id: 'salem_aldawsari',
    name: 'سالم الدوسري',
    photo: '/assets/football/players/salem_aldawsari.jpg',
    clubs: ['al_hilal', 'villarreal'],
    nationalities: ['saudi'],
    managers: ['jesus'],
    trophies: ['ucl'], // AFC Champions
    positions: ['FWD'],
    shirtNumbers: [29, 10, 7],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'benzema',
    name: 'كريم بنزيما',
    photo: '/assets/football/players/benzema.jpg',
    clubs: ['al_ittihad', 'real_madrid', 'lyon'],
    nationalities: ['france'],
    managers: ['zidane', 'ancelotti', 'mourinho'],
    trophies: ['ucl', 'ballon_dor'],
    positions: ['FWD'],
    shirtNumbers: [9, 10],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'kante',
    name: 'نغولو كانتي',
    photo: '/assets/football/players/kante.jpg',
    clubs: ['al_ittihad', 'chelsea', 'leicester'],
    nationalities: ['france'],
    managers: ['mourinho', 'ancelotti'],
    trophies: ['world_cup', 'ucl'],
    positions: ['MID'],
    shirtNumbers: [7, 14],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'neymar',
    name: 'نيمار جونيور',
    photo: '/assets/football/players/neymar.jpg',
    clubs: ['al_hilal', 'psg', 'barcelona', 'santos'],
    nationalities: ['brazil'],
    managers: ['jesus'],
    trophies: ['ucl', 'copa_america'],
    positions: ['FWD'],
    shirtNumbers: [10, 11],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'mahrez',
    name: 'رياض محرز',
    photo: '/assets/football/players/mahrez.jpg',
    clubs: ['al_ahli', 'man_city', 'leicester'],
    nationalities: ['algeria'],
    managers: ['guardiola'],
    trophies: ['ucl'],
    positions: ['FWD'],
    shirtNumbers: [7, 26],
    foot: 'left',
    skinTone: 'light',
  },
  {
    id: 'modric',
    name: 'لوكا مودريتش',
    photo: '/assets/football/players/modric.jpg',
    clubs: ['real_madrid', 'tottenham', 'dinamo_zagreb'],
    nationalities: ['croatia'],
    managers: ['zidane', 'ancelotti', 'mourinho'],
    trophies: ['ucl', 'ballon_dor'],
    positions: ['MID'],
    shirtNumbers: [10, 14],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'vinicius',
    name: 'فينيسيوس جونيور',
    photo: '/assets/football/players/vinicius.jpg',
    clubs: ['real_madrid', 'flamengo'],
    nationalities: ['brazil'],
    managers: ['ancelotti', 'zidane'],
    trophies: ['ucl'],
    positions: ['FWD'],
    shirtNumbers: [7, 20],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'haaland',
    name: 'إيرلينغ هالاند',
    photo: '/assets/football/players/haaland.jpg',
    clubs: ['man_city', 'dortmund', 'salzburg'],
    nationalities: ['norway'],
    managers: ['guardiola'],
    trophies: ['ucl'],
    positions: ['FWD'],
    shirtNumbers: [9],
    foot: 'left',
    skinTone: 'light',
  },
  {
    id: 'albulayhi',
    name: 'علي البليهي',
    photo: '/assets/football/players/albulayhi.jpg',
    clubs: ['al_hilal', 'al_fateh'],
    nationalities: ['saudi'],
    managers: ['jesus'],
    trophies: ['ucl'],
    positions: ['DEF'],
    shirtNumbers: [5],
    foot: 'left',
    skinTone: 'dark',
  },
  {
    id: 'alharbi_firas',
    name: 'فراس البريكان',
    photo: '/assets/football/players/alburaikan.jpg',
    clubs: ['al_ahli', 'al_fateh', 'al_nassr'],
    nationalities: ['saudi'],
    managers: [],
    trophies: [],
    positions: ['FWD'],
    shirtNumbers: [9, 20],
    foot: 'left',
    skinTone: 'light',
  },
  {
    id: 'muller',
    name: 'توماس مولر',
    photo: '/assets/football/players/muller.jpg',
    clubs: ['bayern'],
    nationalities: ['germany'],
    managers: ['guardiola', 'ancelotti'],
    trophies: ['world_cup', 'ucl'],
    positions: ['FWD', 'MID'],
    shirtNumbers: [25, 13],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'kroos',
    name: 'توني كروس',
    photo: '/assets/football/players/kroos.jpg',
    clubs: ['real_madrid', 'bayern', 'leverkusen'],
    nationalities: ['germany'],
    managers: ['zidane', 'ancelotti', 'guardiola'],
    trophies: ['world_cup', 'ucl'],
    positions: ['MID'],
    shirtNumbers: [8],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'mbappe',
    name: 'كيليان مبابي',
    photo: '/assets/football/players/mbappe.jpg',
    clubs: ['real_madrid', 'psg', 'monaco'],
    nationalities: ['france'],
    managers: ['ancelotti'],
    trophies: ['world_cup'],
    positions: ['FWD'],
    shirtNumbers: [7, 9, 10],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'salah',
    name: 'محمد صلاح',
    photo: '/assets/football/players/salah.jpg',
    clubs: ['liverpool', 'roma', 'chelsea', 'basel'],
    nationalities: ['egypt'],
    managers: ['mourinho'],
    trophies: ['ucl'],
    positions: ['FWD'],
    shirtNumbers: [11, 10],
    foot: 'left',
    skinTone: 'dark',
  },
  {
    id: 'courtois',
    name: 'تيبو كورتوا',
    photo: '/assets/football/players/courtois.jpg',
    clubs: ['real_madrid', 'chelsea', 'atletico_madrid'],
    nationalities: ['belgium'],
    managers: ['zidane', 'ancelotti', 'mourinho'],
    trophies: ['ucl'],
    positions: ['GK'],
    shirtNumbers: [1],
    foot: 'left',
    skinTone: 'light',
  },
  {
    id: 'bounou',
    name: 'ياسين بونو',
    photo: '/assets/football/players/bono.jpg',
    clubs: ['al_hilal', 'sevilla', 'girona', 'atletico_madrid'],
    nationalities: ['morocco'],
    managers: ['jesus'],
    trophies: [],
    positions: ['GK'],
    shirtNumbers: [37, 13, 1],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'debruyne',
    name: 'كيفين دي بروين',
    photo: '/assets/football/players/debruyne.jpg',
    clubs: ['man_city', 'chelsea', 'wolfsburg', 'genk'],
    nationalities: ['belgium'],
    managers: ['guardiola', 'mourinho'],
    trophies: ['ucl'],
    positions: ['MID'],
    shirtNumbers: [17, 7],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'sadio_mane',
    name: 'ساديو ماني',
    photo: '/assets/football/players/mane.jpg',
    clubs: ['al_nassr', 'liverpool', 'bayern', 'southampton', 'salzburg'],
    nationalities: ['senegal'],
    managers: [],
    trophies: ['ucl'],
    positions: ['FWD'],
    shirtNumbers: [10, 17],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'firmino',
    name: 'روبرتو فيرمينو',
    photo: '/assets/football/players/firmino.jpg',
    clubs: ['al_ahli', 'liverpool', 'hoffenheim'],
    nationalities: ['brazil'],
    managers: [],
    trophies: ['ucl', 'copa_america'],
    positions: ['FWD'],
    shirtNumbers: [9, 10],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'kessie',
    name: 'فرانك كيسيه',
    photo: '/assets/football/players/kessie.jpg',
    clubs: ['al_ahli', 'barcelona', 'milan', 'atalanta'],
    nationalities: ['ivory_coast'],
    managers: [],
    trophies: [],
    positions: ['MID'],
    shirtNumbers: [79, 19],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'edouard_mendy',
    name: 'إدوارد ميندي',
    photo: '/assets/football/players/mendy.jpg',
    clubs: ['al_ahli', 'chelsea', 'rennes'],
    nationalities: ['senegal'],
    managers: [],
    trophies: ['ucl'],
    positions: ['GK'],
    shirtNumbers: [16, 1],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'ruben_neves',
    name: 'روبن نيفيز',
    photo: '/assets/football/players/neves.jpg',
    clubs: ['al_hilal', 'porto', 'wolves'],
    nationalities: ['portugal'],
    managers: ['jesus'],
    trophies: [],
    positions: ['MID'],
    shirtNumbers: [8],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'mitrovic',
    name: 'ألكسندر ميتروفيتش',
    photo: '/assets/football/players/mitrovic.jpg',
    clubs: ['al_hilal', 'fulham', 'newcastle', 'anderlecht'],
    nationalities: ['serbia'],
    managers: ['jesus'],
    trophies: [],
    positions: ['FWD'],
    shirtNumbers: [9, 45],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'koulibaly',
    name: 'كاليدو كوليبالي',
    photo: '/assets/football/players/koulibaly.jpg',
    clubs: ['al_hilal', 'chelsea', 'napoli'],
    nationalities: ['senegal'],
    managers: ['jesus', 'ancelotti'],
    trophies: [],
    positions: ['DEF'],
    shirtNumbers: [3, 26],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'cancelo',
    name: 'جواو كانسيلو',
    photo: '/assets/football/players/cancelo.jpg',
    clubs: ['al_hilal', 'barcelona', 'bayern', 'man_city', 'juventus', 'inter'],
    nationalities: ['portugal'],
    managers: ['guardiola', 'jesus'],
    trophies: [],
    positions: ['DEF'],
    shirtNumbers: [20, 7],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'saud_abdulhamid',
    name: 'سعود عبد الحميد',
    photo: '/assets/football/players/saud_abdulhamid.jpg',
    clubs: ['al_hilal', 'al_ittihad', 'roma'],
    nationalities: ['saudi'],
    managers: ['jesus'],
    trophies: ['ucl'],
    positions: ['DEF'],
    shirtNumbers: [66, 12],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'bellingham',
    name: 'جود بيلينغهام',
    photo: '/assets/football/players/bellingham.jpg',
    clubs: ['real_madrid', 'dortmund', 'birmingham'],
    nationalities: ['england'],
    managers: ['ancelotti'],
    trophies: ['ucl'],
    positions: ['MID'],
    shirtNumbers: [5, 22, 10],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'lewandowski',
    name: 'روبرت ليفاندوفسكي',
    photo: '/assets/football/players/lewandowski.jpg',
    clubs: ['barcelona', 'bayern', 'dortmund'],
    nationalities: ['poland'],
    managers: ['guardiola', 'ancelotti'],
    trophies: ['ucl'],
    positions: ['FWD'],
    shirtNumbers: [9],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'palmer',
    name: 'كول بالمر',
    photo: '/assets/football/players/palmer.jpg',
    clubs: ['chelsea', 'man_city'],
    nationalities: ['england'],
    managers: ['guardiola'],
    trophies: ['ucl'],
    positions: ['MID', 'FWD'],
    shirtNumbers: [20, 80],
    foot: 'left',
    skinTone: 'light',
  },
  {
    id: 'saka',
    name: 'بوكايو ساكا',
    photo: '/assets/football/players/saka.jpg',
    clubs: ['arsenal'],
    nationalities: ['england'],
    managers: [],
    trophies: [],
    positions: ['FWD'],
    shirtNumbers: [7],
    foot: 'left',
    skinTone: 'dark',
  },
  {
    id: 'neuer',
    name: 'مانويل نوير',
    photo: '/assets/football/players/neuer.jpg',
    clubs: ['bayern', 'schalke'],
    nationalities: ['germany'],
    managers: ['guardiola', 'ancelotti'],
    trophies: ['world_cup', 'ucl'],
    positions: ['GK'],
    shirtNumbers: [1],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'hakimi',
    name: 'أشرف حكيمي',
    photo: '/assets/football/players/hakimi.jpg',
    clubs: ['psg', 'inter', 'dortmund', 'real_madrid'],
    nationalities: ['morocco'],
    managers: ['zidane'],
    trophies: ['ucl'],
    positions: ['DEF'],
    shirtNumbers: [2],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'zidane_player',
    name: 'زين الدين زيدان',
    photo: '/assets/football/players/zidane_player.jpg',
    clubs: ['real_madrid', 'juventus', 'bordeaux'],
    nationalities: ['france'],
    managers: [],
    trophies: ['world_cup', 'ucl', 'ballon_dor'],
    positions: ['MID'],
    shirtNumbers: [5, 10],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'ronaldinho',
    name: 'رونالدينيو',
    photo: '/assets/football/players/ronaldinho.jpg',
    clubs: ['barcelona', 'milan', 'psg', 'flamengo'],
    nationalities: ['brazil'],
    managers: ['ancelotti'],
    trophies: ['world_cup', 'ucl', 'copa_america', 'ballon_dor'],
    positions: ['FWD', 'MID'],
    shirtNumbers: [10, 80],
    foot: 'right',
    skinTone: 'dark',
  },
  {
    id: 'ramos',
    name: 'سيرخيو راموس',
    photo: '/assets/football/players/ramos.jpg',
    clubs: ['real_madrid', 'psg', 'sevilla'],
    nationalities: ['spain'],
    managers: ['zidane', 'ancelotti', 'mourinho'],
    trophies: ['world_cup', 'ucl'],
    positions: ['DEF'],
    shirtNumbers: [4, 15],
    foot: 'right',
    skinTone: 'light',
  },
  {
    id: 'alisson',
    name: 'أليسون بيكر',
    photo: '/assets/football/players/alisson.jpg',
    clubs: ['liverpool', 'roma', 'internacional'],
    nationalities: ['brazil'],
    managers: [],
    trophies: ['ucl', 'copa_america'],
    positions: ['GK'],
    shirtNumbers: [1],
    foot: 'right',
    skinTone: 'light',
  },
];

// Backwards compatibility alias
export const FOOTBALL_BINGO_PLAYERS = FOOTBALLERS_BINGO_MASTER;

// Generates a well-balanced 16-tile board with diverse categories
export const generatePlayerBingoBoard = (allTiles: BingoTileDefinition[] = BINGO_TILES_BANK): PlayerBingoTile[] => {
  const categories: BingoCategory[] = ['club', 'country', 'manager', 'trophy', 'position', 'number', 'trait'];
  const poolByCategory: Record<string, BingoTileDefinition[]> = {};

  categories.forEach(cat => {
    poolByCategory[cat] = allTiles.filter(t => t.category === cat);
  });

  const selectedTiles: BingoTileDefinition[] = [];
  const selectedIds = new Set<string>();

  const pickFromCategory = (cat: BingoCategory, count: number) => {
    const list = [...(poolByCategory[cat] || [])].sort(() => 0.5 - Math.random());
    let added = 0;
    for (const item of list) {
      if (added >= count) break;
      if (!selectedIds.has(item.id)) {
        selectedIds.add(item.id);
        selectedTiles.push(item);
        added++;
      }
    }
  };

  // Quotas for balanced 16-slot grid
  pickFromCategory('club', 4);
  pickFromCategory('country', 3);
  pickFromCategory('trophy', 2);
  pickFromCategory('manager', 2);
  pickFromCategory('number', 2);
  pickFromCategory('position', 2);
  pickFromCategory('trait', 1);

  // Fallback to reach 16 tiles
  if (selectedTiles.length < 16) {
    const remaining = [...allTiles].sort(() => 0.5 - Math.random());
    for (const item of remaining) {
      if (selectedTiles.length >= 16) break;
      if (!selectedIds.has(item.id)) {
        selectedIds.add(item.id);
        selectedTiles.push(item);
      }
    }
  }

  const shuffledBoard = [...selectedTiles].sort(() => 0.5 - Math.random()).slice(0, 16);

  return shuffledBoard.map((definition, index) => ({
    index,
    definition,
    isClaimed: false,
  }));
};

// Immediate sub-millisecond evaluation
export const evaluateTileMatch = (
  player: ActiveFootballer,
  tile: BingoTileDefinition
): boolean => {
  if (!player || !tile) return false;

  switch (tile.category) {
    case 'club':
      return player.clubs.includes(tile.targetValue as string);
    case 'country':
      return player.nationalities.includes(tile.targetValue as string);
    case 'manager':
      return player.managers.includes(tile.targetValue as string);
    case 'trophy':
      return player.trophies.includes(tile.targetValue as string);
    case 'position':
      return player.positions.includes(tile.targetValue as string);
    case 'number':
      return player.shirtNumbers.includes(tile.targetValue as number);
    case 'trait':
      if (tile.targetValue === 'left_foot') return player.foot === 'left';
      if (tile.targetValue === 'right_foot') return player.foot === 'right';
      if (tile.targetValue === 'dark_skin') return player.skinTone === 'dark';
      return false;
    default:
      return false;
  }
};

// Pattern Verification: Rows, Columns, Diagonals, and 4 Corners
export const checkBingoWinDetails = (board: PlayerBingoTile[]): { won: boolean; winningIndices: number[] } => {
  if (!board || board.length < 16) return { won: false, winningIndices: [] };
  const claimed = board.map((t) => t.isClaimed);

  // Rows (4)
  for (let r = 0; r < 4; r++) {
    const start = r * 4;
    const indices = [start, start + 1, start + 2, start + 3];
    if (indices.every((i) => claimed[i])) {
      return { won: true, winningIndices: indices };
    }
  }

  // Columns (4)
  for (let c = 0; c < 4; c++) {
    const indices = [c, c + 4, c + 8, c + 12];
    if (indices.every((i) => claimed[i])) {
      return { won: true, winningIndices: indices };
    }
  }

  // Diagonals (2)
  if ([0, 5, 10, 15].every((i) => claimed[i])) {
    return { won: true, winningIndices: [0, 5, 10, 15] };
  }
  if ([3, 6, 9, 12].every((i) => claimed[i])) {
    return { won: true, winningIndices: [3, 6, 9, 12] };
  }

  // 4 Corners (1)
  if ([0, 3, 12, 15].every((i) => claimed[i])) {
    return { won: true, winningIndices: [0, 3, 12, 15] };
  }

  return { won: false, winningIndices: [] };
};

export const checkBingoWin = (board: PlayerBingoTile[]): boolean => {
  return checkBingoWinDetails(board).won;
};
