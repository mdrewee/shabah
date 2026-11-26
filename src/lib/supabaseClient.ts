import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://gvzhhpdylhnwdkslcnsu.supabase.co';

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

// Singleton Supabase Client Instance (prevents GoTrueClient duplicate instantiation warning)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (input, init) => {
      if (typeof window !== 'undefined' && window.location.origin === 'https://shabahgames.netlify.app') {
        const request = new Request(input, init);
        const url = new URL(request.url);
        if (url.origin === 'https://gvzhhpdylhnwdkslcnsu.supabase.co') {
          const create = request.method === 'POST' && url.pathname === '/rest/v1/rpc/create_shabah_room';
          const lookup = request.method === 'GET' && url.pathname === '/rest/v1/rooms';
          if (create || lookup) {
            const path = create ? '/room-api/create' : '/room-api/rooms';
            return fetch(path + url.search, {
              method: request.method, headers: request.headers, signal: request.signal,
              body: create ? init?.body : undefined, credentials: 'omit', cache: 'no-store',
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
