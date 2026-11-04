/**
 * Resilient Gemini Client with Multi-Model Fallback Cascade
 * Handles 503 (Service Unavailable), 429 (Rate Limit), 500, and 404 errors seamlessly
 */

export const GEMINI_MODELS_CASCADE = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

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

  for (const model of GEMINI_MODELS_CASCADE) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const body: any = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });

      // Handle transient outages and rate limits by advancing to next model
      if (
        response.status === 503 ||
        response.status === 429 ||
        response.status === 500 ||
        response.status === 404
      ) {
        console.warn(
          `[GEMINI] Model ${model} returned ${response.status}. Falling back to next model in cascade...`
        );
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`[GEMINI] Model ${model} HTTP ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === 'string') {
        return text.trim();
      }
    } catch (err) {
      console.warn(`[GEMINI] Request failed on ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models in fallback cascade failed.');
}
