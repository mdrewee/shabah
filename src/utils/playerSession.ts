export const getOrCreatePlayerId = (): string => {
  let pid =
    sessionStorage.getItem('party_player_id') ||
    sessionStorage.getItem('taq_session_player_id') ||
    localStorage.getItem('shabah_player_id');
  if (!pid) {
    pid =
      'p_' +
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10));
  }
  sessionStorage.setItem('party_player_id', pid);
  sessionStorage.setItem('taq_session_player_id', pid);
  localStorage.setItem('shabah_player_id', pid);
  return pid;
};

export const setPersistedPlayerName = (name: string): void => {
  const clean = name.trim();
  if (!clean) return;
  localStorage.setItem('shabah_player_name', clean);
  localStorage.setItem('taghesi_playerName', clean);
  sessionStorage.setItem('party_player_name', clean);
  sessionStorage.setItem('taq_session_player_name', clean);
};

export const getPersistedPlayerName = (): string => {
  return (
    localStorage.getItem('shabah_player_name') ||
    sessionStorage.getItem('party_player_name') ||
    sessionStorage.getItem('taq_session_player_name') ||
    localStorage.getItem('taghesi_playerName') ||
    ''
  ).trim();
};

export const getOrCreatePlayerName = (fallback: string = 'ضيف شبح'): string => {
  let name = getPersistedPlayerName();
  if (!name || name === 'لاعب' || name === 'متسابق') {
    name = fallback;
  }
  sessionStorage.setItem('party_player_name', name);
  sessionStorage.setItem('taq_session_player_name', name);
  return name;
};

export const clearPlayerSession = (roomCode?: string): void => {
  sessionStorage.removeItem('party_player_id');
  sessionStorage.removeItem('party_player_name');
  sessionStorage.removeItem('taq_session_player_id');
  sessionStorage.removeItem('taq_session_player_name');
  if (roomCode) {
    const clean = roomCode.trim().toUpperCase();
    sessionStorage.removeItem(`taghesi_player_${clean}`);
    localStorage.removeItem(`taghesi_player_${clean}`);
  }
};
