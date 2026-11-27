function migrateStorage(storage: Storage) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
  for (const key of keys) {
    if (!key?.startsWith('taghesi_')) continue;
    const nextKey = key === 'taghesi_playerId' ? 'shabah_player_id'
      : key === 'taghesi_playerName' ? 'shabah_player_name'
      : key.startsWith('taghesi_player_') ? key.replace('taghesi_player_', 'shabah_room_player_')
      : key.startsWith('taghesi_host_') ? key.replace('taghesi_host_', 'shabah_moderator_')
      : key.replace('taghesi_', 'shabah_');
    const saved = storage.getItem(key);
    if (saved !== null && storage.getItem(nextKey) === null) storage.setItem(nextKey, saved);
    storage.removeItem(key);
  }
}

for (const kind of ['localStorage', 'sessionStorage'] as const) {
  try { migrateStorage(window[kind]); } catch { /* Storage can be disabled or full. */ }
}
