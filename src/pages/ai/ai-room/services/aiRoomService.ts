// src/pages/ai/ai-room/services/aiRoomService.ts

import { supabase } from '../../../../lib/supabase';
import { sanitizeAiOutput } from './textSanitizer';
import { analyzeGroupStyle } from './styleProfiler';
import { detectRoomDialect } from './dialectDetector';
import { sanitizeAndValidateReply } from './postSanitizer';
import { Archetype } from '../archetypes';

export interface GenerateAnswersPayload {
  questions: [string, string];
  humanAnswers: string[];
  aiAvatarName: string;
  archetype?: Archetype;
  groupSlang?: string[];
}

export interface ChatReplyPayload {
  recentMessages: { sender: string; text: string }[];
  formattedChatLog?: string;
  targetSender?: string;
  targetText?: string;
  recentAiReplies?: string[];
  trigger: 'mention' | 'silence' | 'heated' | 'proactive_accusation';
  aiAvatarName: string;
  suspectsList: string[];
  roundNumber?: number;
  archetype?: Archetype;
  groupSlang?: string[];
  laughSamples?: string[];
  pastTopics?: string[];
  roundEvidence?: string;
  targetAccusee?: string;
  styleStats?: string;
  humanAnswers?: string[];
  dialect?: string;
}

const FALLBACK_ANSWERS_1 = [
  'كبسة دجاج مع لبن بارد وسدحة',
  'قلت لهم الوالد يبيني بمشوار ضروري',
  'مغسلة سيارات وما فيها موية',
  'يسحب عليك بنص الخطة بدون عذر',
  'اتكي تحت النخلة لين يجيني فرج',
  'قلت بطني يعورني وما اقدر اجي',
];

const FALLBACK_ANSWERS_2 = [
  'ارقد في خيمة صغيرة لين تفرج',
  'قلت سيارتي بنشرت وجالس انتظر السطحة',
  'مطعم شاورما باردة بدون ثوم',
  'يتكلم من وراك ويسوي نفسه خوي',
  'شاهي نعناع بالبراد ومروق عالاخر',
  'سويت نفسي نايم وسحبت على جوالي',
];

const FALLBACK_CHAT_REPLIES = [
  'ههههههه اسلم بس',
  'ما عندك سالفة والله',
  'روقنا انت وياه',
  'ترا الوضع مريب كلكم',
  'صامل انت الحين؟',
];

export async function generateAiAnswers(
  payload: GenerateAnswersPayload
): Promise<[string, string]> {
  try {
    const styleProfile = analyzeGroupStyle(payload.humanAnswers);

    const { data, error } = await supabase.functions.invoke('ai-room', {
      body: {
        action: 'generate_answers',
        questions: payload.questions,
        styleGuidance: styleProfile.stylePromptInjection,
        aiAvatarName: payload.aiAvatarName,
        humanAnswers: payload.humanAnswers,
        archetype: payload.archetype,
        groupSlang: payload.groupSlang || [],
      },
    });

    if (!error && data?.answers && Array.isArray(data.answers) && data.answers.length >= 2) {
      return [
        sanitizeAndValidateReply(data.answers[0], payload.aiAvatarName),
        sanitizeAndValidateReply(data.answers[1], payload.aiAvatarName),
      ];
    }
  } catch (err) {
    console.warn('Failed to call Edge Function for AI answers, using styled fallback:', err);
  }

  // Graceful fallback
  const a1 = sanitizeAndValidateReply(
    FALLBACK_ANSWERS_1[Math.floor(Math.random() * FALLBACK_ANSWERS_1.length)],
    payload.aiAvatarName
  );
  const a2 = sanitizeAndValidateReply(
    FALLBACK_ANSWERS_2[Math.floor(Math.random() * FALLBACK_ANSWERS_2.length)],
    payload.aiAvatarName
  );
  return [a1, a2];
}

export async function generateAiChatReply(
  payload: ChatReplyPayload
): Promise<string> {
  const effectiveDialect =
    payload.dialect ||
    detectRoomDialect((payload.recentMessages || []).map((m) => m.text));

  try {
    const styleProfile = analyzeGroupStyle(payload.humanAnswers || []);
    const { data, error } = await supabase.functions.invoke('ai-room', {
      body: {
        action: 'chat_reply',
        styleGuidance: styleProfile.stylePromptInjection,
        dialect: effectiveDialect,
        ...payload,
      },
    });

    if (!error && data?.text) {
      return sanitizeAndValidateReply(data.text, payload.aiAvatarName);
    }
  } catch (err) {
    console.warn('Failed to call Edge Function for AI chat reply, using fallback:', err);
  }

  // Circuit-breaker safe fallback
  return sanitizeAndValidateReply(
    FALLBACK_CHAT_REPLIES[Math.floor(Math.random() * FALLBACK_CHAT_REPLIES.length)],
    payload.aiAvatarName
  );
}
