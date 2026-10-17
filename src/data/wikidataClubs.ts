export interface WikidataClub {
  id: string;
  name: string;
  qid: string; // Official Wikidata Entity ID
  qids?: string[]; // All relevant Wikidata Entity IDs (both football club & general club)
  badgeUrl: string;
  primaryColor: string;
  country: string;
}

export const WIKIDATA_CLUBS: WikidataClub[] = [
  // دوري روشن السعودي
  {
    id: 'al_hilal',
    name: 'الهلال',
    qid: 'Q311141',
    qids: ['Q311141', 'Q73965'],
    badgeUrl: 'https://cdn.sofifa.net/teams/605/120.png',
    primaryColor: '#002B7F',
    country: 'السعودية'
  },
  {
    id: 'al_ittihad',
    name: 'الاتحاد',
    qid: 'Q723793',
    qids: ['Q723793', 'Q309480'],
    badgeUrl: 'https://cdn.sofifa.net/teams/607/120.png',
    primaryColor: '#FFD700',
    country: 'السعودية'
  },
  {
    id: 'al_nassr',
    name: 'النصر',
    qid: 'Q812753',
    qids: ['Q812753', 'Q482764'],
    badgeUrl: 'https://cdn.sofifa.net/teams/112139/120.png',
    primaryColor: '#FEE12B',
    country: 'السعودية'
  },
  {
    id: 'al_ahli',
    name: 'الأهلي',
    qid: 'Q812739',
    qids: ['Q812739', 'Q44441'],
    badgeUrl: 'https://cdn.sofifa.net/teams/112392/120.png',
    primaryColor: '#005C29',
    country: 'السعودية'
  },
  {
    id: 'al_shabab',
    name: 'الشباب',
    qid: 'Q812747',
    qids: ['Q812747', 'Q2636005'],
    badgeUrl: 'https://cdn.sofifa.net/teams/111706/120.png',
    primaryColor: '#2C2A29',
    country: 'السعودية'
  },
  {
    id: 'al_ettifaq',
    name: 'الاتفاق',
    qid: 'Q1152011',
    qids: ['Q1152011', 'Q72844'],
    badgeUrl: 'https://cdn.sofifa.net/teams/112096/120.png',
    primaryColor: '#008000',
    country: 'السعودية'
  },
  {
    id: 'al_taawoun',
    name: 'التعاون',
    qid: 'Q1152014',
    qids: ['Q1152014', 'Q2613971'],
    badgeUrl: 'https://cdn.sofifa.net/teams/112393/120.png',
    primaryColor: '#F5D000',
    country: 'السعودية'
  },
  {
    id: 'al_fateh',
    name: 'الفتح',
    qid: 'Q2504959',
    qids: ['Q2504959', 'Q2701659'],
    badgeUrl: 'https://cdn.sofifa.net/teams/112390/120.png',
    primaryColor: '#003366',
    country: 'السعودية'
  },
  {
    id: 'al_wehda',
    name: 'الوحدة',
    qid: 'Q1152008',
    qids: ['Q1152008', 'Q812713'],
    badgeUrl: 'https://cdn.sofifa.net/teams/112408/120.png',
    primaryColor: '#C8102E',
    country: 'السعودية'
  },
  {
    id: 'al_qadsiah',
    name: 'القادسية',
    qid: 'Q1152003',
    qids: ['Q1152003', 'Q286191'],
    badgeUrl: 'https://cdn.sofifa.net/teams/112391/120.png',
    primaryColor: '#A50021',
    country: 'السعودية'
  },

  // الدوري الإنجليزي (الأمثلة الأبرز)
  {
    id: 'man_city',
    name: 'مانشستر سيتي',
    qid: 'Q50602',
    badgeUrl: 'https://cdn.sofifa.net/teams/10/120.png',
    primaryColor: '#6CABDD',
    country: 'إنجلترا'
  },
  {
    id: 'man_united',
    name: 'مانشستر يونايتد',
    qid: 'Q18656',
    badgeUrl: 'https://cdn.sofifa.net/teams/11/120.png',
    primaryColor: '#DA291C',
    country: 'إنجلترا'
  },
  {
    id: 'liverpool',
    name: 'ليفربول',
    qid: 'Q11308',
    badgeUrl: 'https://cdn.sofifa.net/teams/9/120.png',
    primaryColor: '#C8102E',
    country: 'إنجلترا'
  },
  {
    id: 'chelsea',
    name: 'تشيلسي',
    qid: 'Q9616',
    badgeUrl: 'https://cdn.sofifa.net/teams/5/120.png',
    primaryColor: '#034694',
    country: 'إنجلترا'
  },
  {
    id: 'arsenal',
    name: 'أرسنال',
    qid: 'Q9617',
    badgeUrl: 'https://cdn.sofifa.net/teams/1/120.png',
    primaryColor: '#EF0107',
    country: 'إنجلترا'
  },
  {
    id: 'tottenham',
    name: 'توتنهام',
    qid: 'Q18741',
    badgeUrl: 'https://cdn.sofifa.net/teams/18/120.png',
    primaryColor: '#132257',
    country: 'إنجلترا'
  },
  {
    id: 'aston_villa',
    name: 'أستون فيلا',
    qid: 'Q18711',
    badgeUrl: 'https://cdn.sofifa.net/teams/2/120.png',
    primaryColor: '#95BFE5',
    country: 'إنجلترا'
  },
  {
    id: 'newcastle',
    name: 'نيوكاسل يونايتد',
    qid: 'Q18716',
    badgeUrl: 'https://cdn.sofifa.net/teams/13/120.png',
    primaryColor: '#241F20',
    country: 'إنجلترا'
  },
  {
    id: 'west_ham',
    name: 'وست هام',
    qid: 'Q18747',
    badgeUrl: 'https://cdn.sofifa.net/teams/19/120.png',
    primaryColor: '#7A263A',
    country: 'إنجلترا'
  },

  // الدوري الهولندي
  {
    id: 'ajax',
    name: 'أياكس أمستردام',
    qid: 'Q13040',
    badgeUrl: 'https://cdn.sofifa.net/teams/245/120.png',
    primaryColor: '#D2122E',
    country: 'هولندا'
  },
  {
    id: 'psv',
    name: 'بي إس في آيندهوفن',
    qid: 'Q11993',
    badgeUrl: 'https://cdn.sofifa.net/teams/247/120.png',
    primaryColor: '#FF0000',
    country: 'هولندا'
  },
  {
    id: 'feyenoord',
    name: 'فاينورد روتردام',
    qid: 'Q13164',
    badgeUrl: 'https://cdn.sofifa.net/teams/246/120.png',
    primaryColor: '#ED1C24',
    country: 'هولندا'
  },

  // كبار أوروبا
  {
    id: 'real_madrid',
    name: 'ريال مدريد',
    qid: 'Q8682',
    badgeUrl: 'https://cdn.sofifa.net/teams/243/120.png',
    primaryColor: '#FFFFFF',
    country: 'إسبانيا'
  },
  {
    id: 'barcelona',
    name: 'برشلونة',
    qid: 'Q7156',
    badgeUrl: 'https://cdn.sofifa.net/teams/241/120.png',
    primaryColor: '#A50044',
    country: 'إسبانيا'
  },
  {
    id: 'atletico_madrid',
    name: 'أتلتيكو مدريد',
    qid: 'Q8701',
    badgeUrl: 'https://cdn.sofifa.net/teams/240/120.png',
    primaryColor: '#CB3524',
    country: 'إسبانيا'
  },
  {
    id: 'bayern',
    name: 'بايرن ميونخ',
    qid: 'Q15789',
    badgeUrl: 'https://cdn.sofifa.net/teams/21/120.png',
    primaryColor: '#DC052D',
    country: 'ألمانيا'
  },
  {
    id: 'dortmund',
    name: 'بوروسيا دورتموند',
    qid: 'Q41420',
    badgeUrl: 'https://cdn.sofifa.net/teams/22/120.png',
    primaryColor: '#FDE100',
    country: 'ألمانيا'
  },
  {
    id: 'psg',
    name: 'باريس سان جيرمان',
    qid: 'Q483020',
    badgeUrl: 'https://cdn.sofifa.net/teams/73/120.png',
    primaryColor: '#004170',
    country: 'فرنسا'
  },
  {
    id: 'juventus',
    name: 'يوفنتوس',
    qid: 'Q12263',
    badgeUrl: 'https://cdn.sofifa.net/teams/45/120.png',
    primaryColor: '#000000',
    country: 'إيطاليا'
  },
  {
    id: 'milan',
    name: 'ميلان',
    qid: 'Q1543',
    badgeUrl: 'https://cdn.sofifa.net/teams/47/120.png',
    primaryColor: '#FB090B',
    country: 'إيطاليا'
  },
  {
    id: 'inter',
    name: 'إنتر ميلان',
    qid: 'Q631',
    badgeUrl: 'https://cdn.sofifa.net/teams/44/120.png',
    primaryColor: '#010E80',
    country: 'إيطاليا'
  },
  {
    id: 'roma',
    name: 'روما',
    qid: 'Q2739',
    badgeUrl: 'https://cdn.sofifa.net/teams/52/120.png',
    primaryColor: '#8E1F2F',
    country: 'إيطاليا'
  }
];
