/**
 * Authoritative Player Identity Management
 * Ensures playerId is strictly fetched from sessionStorage/localStorage once and never re-minted
 */

export function getOrCreatePlayerId(): string {
  let id =
    sessionStorage.getItem('shabah_player_id') ||
    localStorage.getItem('shabah_player_id') ||
    sessionStorage.getItem('party_player_id') ||
    sessionStorage.getItem('taghesi_playerId') ||
    localStorage.getItem('taghesi_playerId');

  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('shabah_player_id', id);
    localStorage.setItem('shabah_player_id', id);
    sessionStorage.setItem('party_player_id', id);
    sessionStorage.setItem('taghesi_playerId', id);
    localStorage.setItem('taghesi_playerId', id);
  }
  return id;
}

export function getPersistedPlayerName(): string {
  return (
    localStorage.getItem('shabah_player_name') ||
    sessionStorage.getItem('party_player_name') ||
    sessionStorage.getItem('taq_session_player_name') ||
    localStorage.getItem('taghesi_playerName') ||
    ''
  ).trim();
}

export function setPersistedPlayerName(name: string): void {
  const clean = name.trim();
  if (!clean) return;
  localStorage.setItem('shabah_player_name', clean);
  localStorage.setItem('taghesi_playerName', clean);
  sessionStorage.setItem('party_player_name', clean);
  sessionStorage.setItem('taq_session_player_name', clean);
}
