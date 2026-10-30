import { FOOTBALL_PLAYERS_MASTER } from './footballMasterData';

export interface FootballPlayer {
  id: string;
  name: string;
  nameEn?: string;
  aliases?: string[];
  nationality?: string;
  currentClub?: string;
  clubs?: string[];
  position?: 'GK' | 'DEF' | 'MID' | 'FWD';
  photo?: string;
  photoUrl?: string;
  rating?: number;
  isLocalDb?: boolean;
}

export interface SimpleFootballPlayer {
  id: string;
  name: string;
  nameEn: string;
}

export const ADDITIONAL_100_PLAYERS: SimpleFootballPlayer[] = [
  // أساطير معتزلين
  { id: 'p_101', name: 'زين الدين زيدان', nameEn: 'Zinedine Zidane' },
  { id: 'p_102', name: 'رونالدو البرازيلي (الظاهرة)', nameEn: 'Ronaldo Nazario' },
  { id: 'p_103', name: 'رونالدينيو', nameEn: 'Ronaldinho' },
  { id: 'p_104', name: 'تييري هنري', nameEn: 'Thierry Henry' },
  { id: 'p_105', name: 'كاكا', nameEn: 'Kaka' },
  { id: 'p_106', name: 'أندريا بيرلو', nameEn: 'Andrea Pirlo' },
  { id: 'p_107', name: 'تشافي هيرنانديز', nameEn: 'Xavi Hernandez' },
  { id: 'p_108', name: 'أندريس إنييستا', nameEn: 'Andres Iniesta' },
  { id: 'p_109', name: 'باولو مالديني', nameEn: 'Paolo Maldini' },
  { id: 'p_110', name: 'روبرتو كارلوس', nameEn: 'Roberto Carlos' },
  { id: 'p_111', name: 'ديفيد بيكهام', nameEn: 'David Beckham' },
  { id: 'p_112', name: 'ستيفن جيرارد', nameEn: 'Steven Gerrard' },
  { id: 'p_113', name: 'فرانك لامبارد', nameEn: 'Frank Lampard' },
  { id: 'p_114', name: 'ديدييه دروغبا', nameEn: 'Didier Drogba' },
  { id: 'p_115', name: 'صامويل إيتو', nameEn: 'Samuel Etoo' },
  { id: 'p_116', name: 'واين روني', nameEn: 'Wayne Rooney' },
  { id: 'p_117', name: 'إيكر كاسياس', nameEn: 'Iker Casillas' },
  { id: 'p_118', name: 'جانلويجي بوفون', nameEn: 'Gianluigi Buffon' },
  { id: 'p_119', name: 'كارليس بويول', nameEn: 'Carles Puyol' },
  { id: 'p_120', name: 'فرانشيسكو توتي', nameEn: 'Francesco Totti' },
  { id: 'p_121', name: 'سيرجيو أغويرو', nameEn: 'Sergio Aguero' },
  { id: 'p_122', name: 'مسعود أوزيل', nameEn: 'Mesut Ozil' },
  { id: 'p_123', name: 'أرين روبين', nameEn: 'Arjen Robben' },
  { id: 'p_124', name: 'فرانك ريبيري', nameEn: 'Franck Ribery' },
  { id: 'p_125', name: 'زلاتان إبراهيموفيتش', nameEn: 'Zlatan Ibrahimovic' },

  // نجوم بارزون ولاعبون حاليون
  { id: 'p_126', name: 'فينيسيوس جونيور', nameEn: 'Vinicius Junior' },
  { id: 'p_127', name: 'جود بيلينجهام', nameEn: 'Jude Bellingham' },
  { id: 'p_128', name: 'إيرلينغ هالاند', nameEn: 'Erling Haaland' },
  { id: 'p_129', name: 'رودري', nameEn: 'Rodri' },
  { id: 'p_130', name: 'بوكايو ساكا', nameEn: 'Bukayo Saka' },
  { id: 'p_131', name: 'برناردو سيلفا', nameEn: 'Bernardo Silva' },
  { id: 'p_132', name: 'فيل فودين', nameEn: 'Phil Foden' },
  { id: 'p_133', name: 'ديكلان رايس', nameEn: 'Declan Rice' },
  { id: 'p_134', name: 'فلوريان فيرتز', nameEn: 'Florian Wirtz' },
  { id: 'p_135', name: 'جمال موسيالا', nameEn: 'Jamal Musiala' },
  { id: 'p_136', name: 'لامين يامال', nameEn: 'Lamine Yamal' },
  { id: 'p_137', name: 'رافينيا', nameEn: 'Raphinha' },
  { id: 'p_138', name: 'فيديريكو فالفيردي', nameEn: 'Federico Valverde' },
  { id: 'p_139', name: 'إدواردو كافامينغا', nameEn: 'Eduardo Camavinga' },
  { id: 'p_140', name: 'أوريليان تشواميني', nameEn: 'Aurelien Tchouameni' },
  { id: 'p_141', name: 'أنتوان غريزمان', nameEn: 'Antoine Griezmann' },
  { id: 'p_142', name: 'هاري كين', nameEn: 'Harry Kane' },
  { id: 'p_143', name: 'كيميتش', nameEn: 'Joshua Kimmich' },
  { id: 'p_144', name: 'ليروي ساني', nameEn: 'Leroy Sane' },
  { id: 'p_145', name: 'كول بالمر', nameEn: 'Cole Palmer' },
  { id: 'p_146', name: 'ألكسندر إيزاك', nameEn: 'Alexander Isak' },
  { id: 'p_147', name: 'برونو فيرنانديز', nameEn: 'Bruno Fernandes' },
  { id: 'p_148', name: 'سون هيونغ مين', nameEn: 'Son Heung-min' },
  { id: 'p_149', name: 'مارتن أوديغارد', nameEn: 'Martin Odegaard' },
  { id: 'p_150', name: 'ويليام صليبا', nameEn: 'William Saliba' },
  { id: 'p_151', name: 'فيرجيل فان دايك', nameEn: 'Virgil van Dijk' },
  { id: 'p_152', name: 'ترينت ألكسندر أرنولد', nameEn: 'Trent Alexander-Arnold' },
  { id: 'p_153', name: 'أليسون بيكر', nameEn: 'Alisson Becker' },
  { id: 'p_154', name: 'تيبو كورتوا', nameEn: 'Thibaut Courtois' },
  { id: 'p_155', name: 'إميليانو مارتينيز', nameEn: 'Emiliano Martinez' },
  { id: 'p_156', name: 'أندريه تير شتيغن', nameEn: 'Marc-Andre ter Stegen' },
  { id: 'p_157', name: 'أنخيل دي ماريا', nameEn: 'Angel Di Maria' },
  { id: 'p_158', name: 'جوليان ألفاريز', nameEn: 'Julian Alvarez' },
  { id: 'p_159', name: 'لاوتارو مارتينيز', nameEn: 'Lautaro Martinez' },
  { id: 'p_160', name: 'أشرف حكيمي', nameEn: 'Achraf Hakimi' },
  { id: 'p_161', name: 'رياض محرز', nameEn: 'Riyad Mahrez' },
  { id: 'p_162', name: 'ياسين بونو', nameEn: 'Yassine Bounou' },
  { id: 'p_163', name: 'سالم الدوسري', nameEn: 'Salem Al-Dawsari' },
  { id: 'p_164', name: 'ساديو ماني', nameEn: 'Sadio Mane' },
  { id: 'p_165', name: 'كاليدو كوليبالي', nameEn: 'Kalidou Koulibaly' },
  { id: 'p_166', name: 'ألفونسو ديفيز', nameEn: 'Alphonso Davies' },
  { id: 'p_167', name: 'فيكتور أوسيمين', nameEn: 'Victor Osimhen' },
  { id: 'p_168', name: 'خفيتشا كفاراتسخيليا', nameEn: 'Khvicha Kvaratskhelia' },
  { id: 'p_169', name: 'رافاييل لياو', nameEn: 'Rafael Leao' },
  { id: 'p_170', name: 'ثيو هيرنانديز', nameEn: 'Theo Hernandez' },
  { id: 'p_171', name: 'روبن دياز', nameEn: 'Ruben Dias' },
  { id: 'p_172', name: 'جوسكو غفارديول', nameEn: 'Josko Gvardiol' },
  { id: 'p_173', name: 'إلكاي غوندوغان', nameEn: 'Ilkay Gundogan' },
  { id: 'p_174', name: 'توني كروس', nameEn: 'Toni Kroos' },
  { id: 'p_175', name: 'لوكا مودريتش', nameEn: 'Luka Modric' },
  { id: 'p_176', name: 'سيرجيو بوسكيتس', nameEn: 'Sergio Busquets' },
  { id: 'p_177', name: 'كاسيميرو', nameEn: 'Casemiro' },
  { id: 'p_178', name: 'سيرجيو راموس', nameEn: 'Sergio Ramos' },
  { id: 'p_179', name: 'تياغو سيلفا', nameEn: 'Thiago Silva' },
  { id: 'p_180', name: 'ماركوس راشفورد', nameEn: 'Marcus Rashford' },
  { id: 'p_181', name: 'راندال كولو مواني', nameEn: 'Randal Kolo Muani' },
  { id: 'p_182', name: 'عثمان ديمبيلي', nameEn: 'Ousmane Dembele' },
  { id: 'p_183', name: 'كينغسلي كومان', nameEn: 'Kingsley Coman' },
  { id: 'p_184', name: 'غابرييل جيسوس', nameEn: 'Gabriel Jesus' },
  { id: 'p_185', name: 'ريتشارليسون', nameEn: 'Richarlison' },
  { id: 'p_186', name: 'أليكسيس ماك أليستير', nameEn: 'Alexis Mac Allister' },
  { id: 'p_187', name: 'إنزو فيرنانديز', nameEn: 'Enzo Fernandez' },
  { id: 'p_188', name: 'مويسيس كايسيدو', nameEn: 'Moises Caicedo' },
  { id: 'p_189', name: 'دومينيك سوبوسلاي', nameEn: 'Dominik Szoboszlai' },
  { id: 'p_190', name: 'غافي', nameEn: 'Gavi' },
  { id: 'p_191', name: 'بيدري', nameEn: 'Pedri' },
  { id: 'p_192', name: 'فرينكي دي يونغ', nameEn: 'Frenkie de Jong' },
  { id: 'p_193', name: 'جواو فيليكس', nameEn: 'Joao Felix' },
  { id: 'p_194', name: 'جواو كانسيلو', nameEn: 'Joao Cancelo' },
  { id: 'p_195', name: 'روميلو لوكاكو', nameEn: 'Romelu Lukaku' },
  { id: 'p_196', name: 'ألفارو موراتا', nameEn: 'Alvaro Morata' },
  { id: 'p_197', name: 'باولو ديبالا', nameEn: 'Paulo Dybala' },
  { id: 'p_198', name: 'دوشان فلاهوفيتش', nameEn: 'Dusan Vlahovic' },
  { id: 'p_199', name: 'يان أوبلاك', nameEn: 'Jan Oblak' },
  { id: 'p_200', name: 'مانويل نوير', nameEn: 'Manuel Neuer' },
];

// Convert master players and merge with additional 100 stars
const masterItems: FootballPlayer[] = FOOTBALL_PLAYERS_MASTER.map((p) => ({
  id: p.id,
  name: p.name,
  nameEn: p.aliases?.[0] || '',
  aliases: p.aliases,
  nationality: p.nationality,
  currentClub: p.currentClub,
  clubs: p.clubs,
  position: p.position,
  photo: p.photo,
  photoUrl: p.photo,
  rating: 88,
  isLocalDb: true,
}));

const additionalItems: FootballPlayer[] = ADDITIONAL_100_PLAYERS.map((p) => ({
  id: p.id,
  name: p.name,
  nameEn: p.nameEn,
  aliases: [p.nameEn],
  nationality: '',
  currentClub: '',
  clubs: [],
  position: 'FWD',
  rating: 88,
  isLocalDb: true,
}));

export const FOOTBALL_PLAYERS: FootballPlayer[] = [...masterItems, ...additionalItems];

// دالة تنظيف وتطبيع النصوص العربية للبحث المرن
export function normalizeSearch(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\-_.]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function searchPlayersLocally(query: string, limit = 15): FootballPlayer[] {
  if (!query || query.trim().length === 0) return [];

  const cleanQuery = normalizeSearch(query);

  return FOOTBALL_PLAYERS.filter((player) => {
    const nameAr = normalizeSearch(player.name || '');
    const nameEn = (player.nameEn || '').toLowerCase();
    const aliases = (player.aliases || []).map(normalizeSearch).join(' ');

    return (
      nameAr.includes(cleanQuery) ||
      nameEn.includes(cleanQuery) ||
      aliases.includes(cleanQuery)
    );
  }).slice(0, limit);
}
