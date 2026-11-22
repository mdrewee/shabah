import { FOOTBALL_PLAYERS_MASTER } from './footballMasterData';
import type { StaticPlayerAsset } from './footballStaticAssets';

// Career data is reused from the local football bank; the roulette displays names only.
// Historical cross-checks: fcbarcelona.com/en/club/history/legendary-players,
// premierleague.com/en/events/hall-of-fame/inductees and realmadrid.com legends archives.
export const ADDITIONAL_BINGO_PLAYER_IDS = [
  // 12 goalkeepers.
  'p_gianluigi_buffon', 'p_iker_casillas', 'p_petr_cech', 'p_peter_schmeichel',
  'p_oliver_kahn', 'p_manuel_neuer', 'p_marc_andre_ter_stegen', 'p_ederson_moraes',
  'p_gianluigi_donnarumma', 'p_keylor_navas', 'p_mohammed_deayea', 'p_essam_hadary',
  // 28 defenders.
  'p_paolo_maldini', 'p_franco_baresi', 'p_alessandro_nesta', 'p_fabio_cannavaro',
  'p_roberto_carlos', 'p_cafu', 'p_carles_puyol', 'p_sergio_ramos',
  'p_javier_zanetti', 'p_marcelo_vieira', 'p_gerard_pique', 'p_jordi_alba',
  'p_diego_godin', 'p_david_alaba', 'p_dani_carvajal', 'p_joao_cancelo',
  'p_kyle_walker', 'p_john_stones', 'p_ruben_dias', 'p_achraf_hakimi',
  'p_marquinhos', 'p_kalidou_koulibaly', 'p_aymeric_laporte', 'p_nacho_fernandez',
  'p_yasser_shahrani', 'p_osama_hawsawi', 'p_hussein_abdulghani', 'p_ahmed_jamil',
  // 24 midfielders.
  'p_xavi_hernandez', 'p_andres_iniesta', 'p_sergio_busquets', 'p_xabi_alonso',
  'p_toni_kroos', 'p_zinedine_zidane', 'p_andrea_pirlo', 'p_clarence_seedorf',
  'p_kaka', 'p_paul_scholes', 'p_diego_maradona', 'p_david_beckham',
  'p_frank_lampard', 'p_steven_gerrard', 'p_patrick_vieira', 'p_yaya_toure',
  'p_mesut_ozil', 'p_wesley_sneijder', 'p_ronaldinho', 'p_rui_costa',
  'p_mohammed_noor', 'p_youssef_thunayan', 'p_nawaf_temyat', 'p_fahad_harifi',
  // 11 forwards.
  'p_thierry_henry', 'p_ronaldo_nazario', 'p_samuel_etoo', 'p_didier_drogba',
  'p_fernando_torres', 'p_david_villa', 'p_luis_suarez', 'p_arjen_robben',
  'p_wayne_rooney', 'p_yasser_qahtani', 'p_majed_abdullah',
] as const;

const leftFooted = new Set([
  'p_ederson_moraes', 'p_roberto_carlos', 'p_marcelo_vieira', 'p_jordi_alba',
  'p_david_alaba', 'p_aymeric_laporte', 'p_diego_maradona', 'p_mesut_ozil', 'p_arjen_robben',
]);
const darkSkin = new Set([
  'p_cafu', 'p_kalidou_koulibaly', 'p_achraf_hakimi', 'p_osama_hawsawi',
  'p_clarence_seedorf', 'p_patrick_vieira', 'p_yaya_toure',
  'p_thierry_henry', 'p_samuel_etoo', 'p_didier_drogba',
]);

export const ADDITIONAL_BINGO_PLAYERS: StaticPlayerAsset[] = ADDITIONAL_BINGO_PLAYER_IDS.map((id) => {
  const player = FOOTBALL_PLAYERS_MASTER.find((entry) => entry.id === id);
  if (!player) throw new Error(`Missing Bingo footballer: ${id}`);
  return {
    id, name: player.name, country: player.nationality,
    position: player.position === 'FWD' ? 'ATT' : player.position,
    club: player.currentClub, currentClub: player.currentClub,
    clubs: [...new Set(player.clubs.map((club) => id === 'p_essam_hadary' && club === 'الأهلي' ? 'الأهلي المصري' : club))], nationality: player.nationality,
    imageUrl: '', prestigeScore: player.rating || 85,
    trophies: (player.trophies || []).map((title) => title === 'الدوري السعودي' ? 'دوري روشن' : title),
    traits: [...new Set([...(player.traits || []), ...(leftFooted.has(id) ? ['أشول'] : []), ...(darkSkin.has(id) ? ['أسمر'] : [])])],
  };
});

// A club appearance alone does not establish that the player worked with its manager.
export const BINGO_MANAGER_PLAYERS: Record<string, readonly string[]> = {
  'غوارديولا': [
    'messi', 'haaland', 'debruyne', 'rodri', 'mahrez', 'kimmich', 'lewandowski',
    'p_manuel_neuer', 'p_ederson_moraes', 'p_carles_puyol', 'p_gerard_pique', 'p_david_alaba',
    'p_joao_cancelo', 'p_kyle_walker', 'p_john_stones', 'p_ruben_dias', 'p_aymeric_laporte',
    'p_xavi_hernandez', 'p_andres_iniesta', 'p_sergio_busquets', 'p_xabi_alonso', 'p_toni_kroos',
    'p_yaya_toure', 'p_thierry_henry', 'p_samuel_etoo', 'p_david_villa', 'p_arjen_robben',
  ],
  'أنشيلوتي': [
    'ronaldo', 'benzema', 'mbappe', 'modric', 'courtois', 'vinicius', 'bellingham', 'rudiger', 'kimmich', 'lewandowski',
    'p_gianluigi_buffon', 'p_iker_casillas', 'p_petr_cech', 'p_manuel_neuer', 'p_keylor_navas',
    'p_paolo_maldini', 'p_alessandro_nesta', 'p_cafu', 'p_fabio_cannavaro', 'p_kalidou_koulibaly',
    'p_sergio_ramos', 'p_marcelo_vieira', 'p_david_alaba', 'p_dani_carvajal', 'p_nacho_fernandez',
    'p_xabi_alonso', 'p_toni_kroos', 'p_zinedine_zidane', 'p_andrea_pirlo', 'p_clarence_seedorf', 'p_kaka', 'p_david_beckham',
    'p_frank_lampard', 'p_rui_costa', 'p_ronaldinho', 'p_didier_drogba', 'p_fernando_torres', 'p_arjen_robben',
    'p_ronaldo_nazario', 'p_thierry_henry',
  ],
  'مورينيو': [
    'ronaldo', 'benzema', 'modric', 'courtois', 'debruyne', 'salah', 'son', 'kane',
    'p_iker_casillas', 'p_petr_cech', 'p_sergio_ramos', 'p_marcelo_vieira', 'p_javier_zanetti',
    'p_xabi_alonso', 'p_kaka', 'p_frank_lampard', 'p_mesut_ozil', 'p_wesley_sneijder', 'p_patrick_vieira',
    'p_samuel_etoo', 'p_didier_drogba', 'p_arjen_robben', 'p_wayne_rooney',
  ],
  'زيدان': [
    'ronaldo', 'benzema', 'modric', 'courtois', 'vinicius',
    'p_keylor_navas', 'p_sergio_ramos', 'p_marcelo_vieira', 'p_dani_carvajal', 'p_nacho_fernandez', 'p_toni_kroos', 'p_achraf_hakimi',
  ],
  'خيسوس': [
    'ronaldo', 'salem', 'neymar', 'mitrovic', 'bono',
    'p_kalidou_koulibaly', 'p_joao_cancelo', 'p_yasser_shahrani',
  ],
};
