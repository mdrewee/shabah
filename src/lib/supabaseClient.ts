import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://gvzhhpdylhnwdkslcnsu.supabase.co';

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

const roomRpcPaths = new Map([
  ['/rest/v1/rpc/create_shabah_room', '/room-api/create'],
  ['/rest/v1/rpc/lookup_shabah_room', '/room-api/lookup'],
  ['/rest/v1/rpc/change_shabah_room_game', '/room-api/change-game'],
  ['/rest/v1/rpc/read_shabah_room_snapshot', '/room-api/snapshot'],
  ['/rest/v1/rpc/issue_shabah_room_command', '/room-api/command'],
  ['/rest/v1/rpc/read_shabah_room_command', '/room-api/read-command'],
  ['/rest/v1/rpc/read_ghost_letter', '/room-api/read-letter'],
  ['/rest/v1/rpc/play_ghost_letter', '/room-api/play-letter'],
]);

// Singleton Supabase Client Instance (prevents GoTrueClient duplicate instantiation warning)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (input, init) => {
      if (typeof window !== 'undefined' && window.location.origin === 'https://shabahgames.netlify.app') {
        const request = new Request(input, init);
        const url = new URL(request.url);
        if (url.origin === 'https://gvzhhpdylhnwdkslcnsu.supabase.co') {
          const path = request.method === 'POST' ? roomRpcPaths.get(url.pathname) :
            request.method === 'GET' && url.pathname === '/rest/v1/rooms' ? '/room-api/rooms' : undefined;
          if (path) {
            return fetch(path + url.search, {
              method: request.method, headers: request.headers, signal: request.signal,
              body: request.method === 'POST' ? init?.body : undefined, credentials: 'omit', cache: 'no-store',
            });
          }
        }
      }
      return fetch(input, init);
    },
  },
});

/**
 * Resolves active authentication bearer token across:
 * 1. Active Supabase Auth session (supabase.auth.getSession())
 * 2. Passed AuthContext token
 * 3. Stored localStorage 'mayyaz_auth' session
 */
export const getAuthToken = async (contextToken?: string | null): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch {}

  if (contextToken) return contextToken;

  try {
    const stored = JSON.parse(localStorage.getItem('mayyaz_auth') || '{}');
    if (stored?.token) return stored.token;
  } catch {}

  return null;
};

export default supabase;
