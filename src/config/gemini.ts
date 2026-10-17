import { supabase } from '../lib/supabaseClient';

export const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-1.5-flash',
];

export interface GeminiRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

/**
 * Unified robust caller for Gemini API with multi-model fallback and Supabase Edge Function backup
 */
export async function generateWithGemini(
  prompt: string,
  options: GeminiRequestOptions = {}
): Promise<string | null> {
  const {
    systemPrompt,
    temperature = 0.7,
    maxOutputTokens = 1200,
    jsonMode = false,
  } = options;

  // 1. Try Direct Google Generative Language API
  if (GEMINI_API_KEY) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const body: any = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        };

        if (systemPrompt) {
          body.systemInstruction = {
            parts: [{ text: systemPrompt }],
          };
        }

        if (jsonMode) {
          body.generationConfig.responseMimeType = 'application/json';
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (err) {
        // try next candidate model
      }
    }
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
