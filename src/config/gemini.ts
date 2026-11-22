import { callGeminiWithFallback } from '../services/geminiClient';
export { callGeminiWithFallback };

export interface GeminiRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

export async function generateWithGemini(
  prompt: string,
  optionsOrJsonMode: GeminiRequestOptions | boolean = {}
): Promise<string | null> {
  const options = typeof optionsOrJsonMode === 'boolean' ? { jsonMode: optionsOrJsonMode } : optionsOrJsonMode;
  try {
    return await callGeminiWithFallback(prompt, {
      systemInstruction: options.systemPrompt,
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 1500,
      jsonMode: options.jsonMode ?? false,
    });
  } catch (error) {
    console.warn('[Shabah AI] Analysis unavailable:', error);
    return null;
  }
}
