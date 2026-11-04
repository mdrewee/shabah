import { supabase } from '../lib/supabaseClient';
import {
  callGeminiWithFallback,
  GEMINI_MODELS_CASCADE,
  getGeminiApiKey as clientGetApiKey,
} from '../services/geminiClient';

export { callGeminiWithFallback, GEMINI_MODELS_CASCADE };

export const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

export function getGeminiApiKey(): string {
  return clientGetApiKey() || GEMINI_API_KEY || '';
}

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const CANDIDATE_MODELS = GEMINI_MODELS_CASCADE;

export interface GeminiRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

/**
 * Unified robust caller for Gemini API with multi-model fallback cascade
 */
export async function generateWithGemini(
  prompt: string,
  optionsOrJsonMode: GeminiRequestOptions | boolean = {}
): Promise<string | null> {
  let options: GeminiRequestOptions = {};
  if (typeof optionsOrJsonMode === 'boolean') {
    options = { jsonMode: optionsOrJsonMode };
  } else if (optionsOrJsonMode && typeof optionsOrJsonMode === 'object') {
    options = optionsOrJsonMode;
  }

  const {
    systemPrompt,
    temperature = 0.3,
    maxOutputTokens = 1500,
    jsonMode = false,
  } = options;

  // 1. Try Resilient Multi-Model Cascade
  try {
    const text = await callGeminiWithFallback(prompt, {
      systemInstruction: systemPrompt,
      temperature,
      maxOutputTokens,
      jsonMode,
    });
    if (text) return text;
  } catch (err) {
    console.warn('[generateWithGemini] Direct cascade failed, attempting Supabase Edge Function...', err);
  }

  // 2. Fallback to Supabase Edge Function 'ai-judge'
  try {
    const { data, error } = await supabase.functions.invoke('ai-judge', {
      body: { prompt, systemPrompt, jsonMode },
    });
    if (!error && data?.response) {
      return typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
    }
  } catch {}

  return null;
}
