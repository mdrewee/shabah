/**
 * Resilient Gemini Client with Multi-Model Fallback Cascade
 * Uses official stable v1beta models and sends API key via x-goog-api-key header
 */

// الموديلات الرسمية المستقرة في v1beta
export const WORKING_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

export const GEMINI_MODELS_CASCADE = WORKING_MODELS;

export function getGeminiApiKey(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return '';
}

export interface CallGeminiOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

export async function callGeminiWithFallback(
  prompt: string,
  optionsOrSystemInstruction?: string | CallGeminiOptions
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured');
  }

  let systemInstruction: string | undefined;
  let temperature = 0.2;
  let maxOutputTokens = 1500;
  let jsonMode = true;

  if (typeof optionsOrSystemInstruction === 'string') {
    systemInstruction = optionsOrSystemInstruction;
  } else if (optionsOrSystemInstruction && typeof optionsOrSystemInstruction === 'object') {
    systemInstruction = optionsOrSystemInstruction.systemInstruction;
    temperature = optionsOrSystemInstruction.temperature ?? 0.2;
    maxOutputTokens = optionsOrSystemInstruction.maxOutputTokens ?? 1500;
    jsonMode = optionsOrSystemInstruction.jsonMode ?? true;
  }

  let lastError: any = null;

  for (const model of WORKING_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const body: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      };

      if (jsonMode) {
        body.generationConfig.responseMimeType = 'application/json';
      }

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey, // إرسال المفتاح عبر الـ Header لأمان أعلى وتفادي مشاكل الـ URL encoding
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.warn(`[GEMINI] Model ${model} responded with status ${response.status}`);
        continue; // التبديل للموديل التالي فوراً عند أي خطأ 404 أو 503 أو 429
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      console.warn(`[GEMINI] Error with model ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini fallback models failed');
}
