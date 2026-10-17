import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  process?.env?.VITE_SUPABASE_URL ||
  'https://gvzhhpdylhnwdkslcnsu.supabase.co';

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  process?.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2emhocGR5bGhud2Rrc2xjbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzc5NDAsImV4cCI6MjA5NzExMzk0MH0.7wtnULiU1JqMRckRH5IOFCbjgvIKVD0JihI4-LyjshU';

// Singleton Supabase Client Instance (prevents GoTrueClient duplicate instantiation warning)
export const supabase = createClient(supabaseUrl, supabaseKey);

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
