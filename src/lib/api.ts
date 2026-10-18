import { supabase } from './supabase';

/**
 * Arabic Text Normalization Utility
 * Standardizes alifs, taa marbuta, yaa, and strips tashkeel/diacritics.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic harakat
    .trim();
}

/**
 * Formats numbers into Saudi Riyals with Arabic formatting
 */
export function formatSAR(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '٠ ر.س';
  return new Intl.NumberFormat('ar-SA').format(num) + ' ر.س';
}

/**
 * Resolves active backend API base URL
 */
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000';

/**
 * Unified apiFetch:
 * Automatically acquires the Supabase Auth session token and injects 'Authorization: Bearer <token>'
 * Falls back to localStorage 'mayyaz_auth' token if GoTrue session is not directly established.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  let token: string | null = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
    }
  } catch (err) {
    console.warn('[apiFetch] Could not get supabase session:', err);
  }

  if (!token) {
    try {
      const stored = JSON.parse(localStorage.getItem('mayyaz_auth') || '{}');
      if (stored?.token) token = stored.token;
    } catch {}
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(targetUrl, {
    ...options,
    headers
  });
}
