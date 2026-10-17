// supabase/functions/ai-room/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY =
  Deno.env.get('GEMINI_API_KEY') ||
  '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

const supabaseClient =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

export const detectRoomDialect = (recentMessages: string[]): string => {
  const text = recentMessages.join(' ');

  if (/(شنو|شسمه|زين|حجي|صج|شفيك|وايد|اشدعوه)/.test(text)) {
    return 'حساوي / شرقاوي';
  }
  if (/(ايش|فين|دحين|يا واد|ابوي|سيبه|اشبك|ياواد)/.test(text)) {
    return 'حجازي';
  }
  if (/(وش|ليه|اركد|يا رجال|تكفى|مير|تهقى|صامل)/.test(text)) {
    return 'نجدي';
  }
  if (/(مغزل|ذلحين|كنك|علامك|وش قومك)/.test(text)) {
    return 'جنوبي';
  }

  return 'عامية سعودية بيضاء دارجة';
};

export const sanitizeAndValidateReply = (rawText: string, aiAvatar: string): string => {
  console.log('[AI Raw Model Output]:', rawText);

  let cleaned = (rawText || '')
    .replace(/[.،؛!؟"'`\*]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .trim();

  // 1. Circuit Breaker: ONLY reject explicit robot admissions
  const strictlyRobotic = [
    /نموذج ذكاء اصطناعي/,
    /ذكاء اصطناعي/,
    /انا روبوت/,
    /نموذج لغوي/,
    /بصفتي ذكاء/
  ];

  for (const pattern of strictlyRobotic) {
    if (pattern.test(cleaned)) {
      console.warn('[Circuit Breaker] Explicit robot giveaway caught:', cleaned);
      cleaned = getRandomFallback(aiAvatar);
      break;
    }
  }

  // 2. Length Breaker: Keep up to 10 words, only truncate if excessively long paragraph
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 10) {
    cleaned = words.slice(0, 8).join(' ');
  }

  // 3. Gibberish / Empty Fallback
  if (!cleaned || cleaned.length < 2) {
    cleaned = getRandomFallback(aiAvatar);
  }

  console.log('[AI Sanitized Output]:', cleaned);
  return cleaned;
};

const getRandomFallback = (_aiAvatar: string): string => {
  const fallbacks = [
    'ههههههه اسلم بس',
    'ما عندك سالفة والله',
    'روقنا انت وياه',
    'ترا الوضع مريب كلكم',
    'صامل انت الحين؟'
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

async function fetchVaultFewShotSamples(): Promise<string> {
  if (!supabaseClient) return '';
  try {
    // 1. Fetch up to 8 master bluff records
    const { data: bluffData } = await supabaseClient
      .from('human_banter_vault')
      .select('trigger_message, reply_message')
      .eq('is_master_bluff', true)
      .limit(8);

    // 2. Fetch up to 8 general records
    const { data: generalData } = await supabaseClient
      .from('human_banter_vault')
      .select('trigger_message, reply_message')
      .limit(8);

    const combined: Array<{ trigger_message: string; reply_message: string }> = [];
    const seen = new Set<string>();

    for (const item of [...(bluffData || []), ...(generalData || [])]) {
      const key = `${item.trigger_message}:::${item.reply_message}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }

    if (combined.length === 0) return '';

    const shuffled = combined.sort(() => Math.random() - 0.5).slice(0, 10);
    return shuffled
      .map((b) => `- إذا انقال: "${b.trigger_message}" -> الرد البشري: "${b.reply_message}"`)
      .join('\n');
  } catch (err) {
    console.warn('[Banter Vault Query Error]:', err);
    return '';
  }
}

async function callGemini(
  promptText: string,
  maxTokens = 40,
  stopSequences: string[] = ["\n", "User:", "Player:"],
  temperature = 1.1
): Promise<string | null> {
  for (const model of CANDIDATE_MODELS) {
    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + GEMINI_API_KEY;

      const generationConfig: Record<string, any> = {
        temperature,
        maxOutputTokens: maxTokens,
        stopSequences,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      };

      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig,
        }),
      });

      if (!res.ok) {
        // Fallback retry without thinkingConfig if older model rejected it
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 1.1,
              maxOutputTokens: maxTokens,
              stopSequences,
            },
          }),
        });
      }

      if (!res.ok) {
        console.warn("Model " + model + " returned " + res.status);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (rawText) {
        return rawText;
      }
    } catch (err) {
      console.warn("Error calling model " + model + ":", err);
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const action = (payload.action || '').toLowerCase();

    if (action === 'generate_answers') {
      const { questions, aiAvatarName, archetype, groupSlang, styleGuidance } = payload;
      const q0 = questions?.[0] || 'سؤال عام';
      const q1 = questions?.[1] || 'سؤال عام آخر';

      const archetypePrompt = archetype?.behaviorPrompt || 'أنت شاب سعودي في استراحة تلعب مع أصحابك.';

      const slangContext = Array.isArray(groupSlang) && groupSlang.length > 0
        ? "استخدم أو لمّح على بعض مصطلحات الشباب: " + groupSlang.slice(0, 8).join(', ')
        : '';

      const styleContext = styleGuidance
        ? "\nتوجيهات أسلوب وطول إجابات اللاعبين الحاليين:\n" + styleGuidance
        : '';

      const prompt = "انت واحد من العيال في استراحة بالرياض اسمك المستعار \"" + (aiAvatarName || 'الذيب') + "\".\n" +
        archetypePrompt + "\n" +
        slangContext + "\n" +
        styleContext + "\n\n" +
        "جاوب على السؤالين التاليين بحسب شخصيتك بعفوية وسخرية واختصار شديد بلهجة شباب الرياض بدون تشكيل وبدون فصحى وبدون اي ايموجي:\n" +
        "السؤال الاول: " + q0 + "\n" +
        "السؤال الثاني: " + q1 + "\n\n" +
        "قواعد صارمة:\n" +
        "- طابق طول وطريقة إجابات اللاعبين (إذا هم يكتبون كلمة أو كلمتين، اكتب كلمة أو كلمتين فقط مثل: \"كبسة\", \"اندومي\", \"انام وافتك\", \"انحاش\").\n" +
        "- ممنوع نهائياً إعادة ذكر السؤال أو كلماته في جوابك.\n" +
        "- ممنوع التعليق على السؤال نفسه (مثل \"وش هالسؤال\" أو \"سؤالك محرج\" أو \"وش تحس فيه\").\n" +
        "- ادخل في الجواب مباشرة ومختصراً كأنه حدث حقيقي صار لك أو رأي فوري بكلمات طبيعية جداً.\n" +
        "- بدون همزات على الألف (اكتب \"انت\", \"اصلا\", \"ايه\").\n\n" +
        "اكتب الناتج بالتنسيق التالي فقط:\n" +
        "1: [جوابك الاول]\n" +
        "2: [جوابك الثاني]";

      const geminiText = await callGemini(prompt, 50, ["\n\n"]);
      const fallbackPool1 = [
        'كبسة دجاج مع لبن بارد وسدحة',
        'قلت لهم الوالد يبيني بمشوار ضروري',
        'مغسلة سيارات وما فيها موية',
        'يسحب عليك بنص الخطة بدون عذر',
        'اتكي تحت النخلة لين يجيني فرج',
        'قلت بطني يعورني وما اقدر اجي',
      ];
      const fallbackPool2 = [
        'ارقد في خيمة صغيرة لين تفرج',
        'قلت سيارتي بنشرت وجالس انتظر السطحة',
        'مطعم شاورما باردة بدون ثوم',
        'يتكلم من وراك ويسوي نفسه خوي',
        'شاهي نعناع بالبراد ومروق عالاخر',
        'سويت نفسي نايم وسحبت على جوالي',
      ];
      let ans0 = fallbackPool1[Math.floor(Math.random() * fallbackPool1.length)];
      let ans1 = fallbackPool2[Math.floor(Math.random() * fallbackPool2.length)];

      if (geminiText) {
        const lines = geminiText.split('\n').map((l: string) => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('1:') || line.includes('الاول:') || line.includes('الأول:')) {
            ans0 = line.replace(/^(1:|الاول:|الأول:)\s*/, '').trim();
          } else if (line.startsWith('2:') || line.includes('الثاني:')) {
            ans1 = line.replace(/^(2:|الثاني:)\s*/, '').trim();
          }
        }
      }

      ans0 = sanitizeAndValidateReply(ans0, aiAvatarName || 'الذيب');
      ans1 = sanitizeAndValidateReply(ans1, aiAvatarName || 'الذيب');

      return new Response(
        JSON.stringify({ answers: [ans0, ans1] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'chat_reply') {
      const {
        recentMessages,
        lastMessages,
        formattedChatLog,
        targetSender,
        targetText,
        recentAiReplies,
        aiAvatarName,
        aiAvatar,
        archetype,
        groupSlang,
        laughSamples,
        pastTopics,
        roundNumber,
        roundEvidence,
        evidence,
        targetAccusee,
        dialect,
      } = payload;

      const effectiveAiAvatar = aiAvatarName || aiAvatar || 'الذيب';
      const effectiveRound = roundNumber || 1;
      const effectiveEvidence = roundEvidence || evidence || 'لا توجد إجابات بعد';

      const msgsArray = Array.isArray(recentMessages) ? recentMessages : (Array.isArray(lastMessages) ? lastMessages : []);
      const effectiveChatLog = formattedChatLog || (
        msgsArray.length > 0
          ? msgsArray.slice(-6).map((m: any) => `[${m.sender || m.avatarName || 'لاعب'}]: ${m.text}`).join('\n')
          : 'لا توجد رسائل سابقة بعد'
      );

      // Determine target sender and message
      let effectiveTargetSender = targetSender;
      let effectiveTargetText = targetText;
      if (!effectiveTargetSender || !effectiveTargetText) {
        const lastHumanMsg = [...msgsArray].reverse().find((m: any) => {
          const s = m.sender || m.avatarName;
          return s && s !== effectiveAiAvatar;
        });
        effectiveTargetSender = lastHumanMsg ? (lastHumanMsg.sender || lastHumanMsg.avatarName) : (targetAccusee || 'شخص في الغرفة');
        effectiveTargetText = lastHumanMsg ? lastHumanMsg.text : 'بداية الشات';
      }

      const detectedDialect = dialect || detectRoomDialect(msgsArray.map((m: any) => m.text || ''));

      const slangText = Array.isArray(groupSlang) && groupSlang.length > 0
        ? groupSlang.slice(-15).join('، ')
        : 'طبيعي وعام';

      const laughText = Array.isArray(laughSamples) && laughSamples.length > 0
        ? laughSamples.join('، ')
        : 'هههههه';

      const pastTopicsText = Array.isArray(pastTopics) && pastTopics.length > 0
        ? pastTopics.slice(-5).join(' | ')
        : 'لا توجد بعد';

      const archetypeInstruction = archetype?.behaviorPrompt ||
        'أسلوبك: خوي مسالم يتفاعل مع كل ذبة وضحكة، يسرق مصطلحات الشباب اللي قالوها، ويسولف بعفوية كأنه جالس معهم على الكنبة.';

      // Fetch authentic human banter samples from human_banter_vault in Supabase
      const vaultFewShot = await fetchVaultFewShotSamples();
      const vaultSection = vaultFewShot
        ? "هذه عينات واقعية مأخوذة من ردود وسوالف شباب حقيقيين في جلسات لعب سابقة (تعلم منهم كيف يردون ويذبون):\n" + vaultFewShot + "\n\n"
        : '';

      const bannedReplies = Array.isArray(recentAiReplies) && recentAiReplies.length > 0
        ? recentAiReplies.filter(Boolean).map((r: string) => `- "${r}"`).join('\n')
        : 'لا توجد ردود سابقة';

      const prompt =
        "أنت متسابق بشري سعودي ذكي جالس في استراحة مع ربعك تلعبون لعبة شك واستجواب بأسماء مستعارة لكشف المندس.\n" +
        "اسمك المستعار في هذه الجولة: \"" + effectiveAiAvatar + "\".\n" +
        "الجولة الحالية: الجولة " + effectiveRound + " من 3.\n" +
        "لهجة الغرفة المكتشفة حالياً: " + detectedDialect + " (تكلم بقربها بعفوية وبدون تكلف).\n\n" +
        "شخصيتك المطلوبة في هذه الجولة خصيصاً:\n" +
        archetypeInstruction + "\n\n" +
        "معلوماتك التراكمية عن المجموعة (سرقتها من الجولات الماضية):\n" +
        "- كلمات دارجة قالوها الشباب: " + slangText + "\n" +
        "- طريقتهم بالضحك: " + laughText + "\n" +
        "- مواقف وإجابات قديمة رموها: " + pastTopicsText + "\n\n" +
        "لوحة الأدلة والأسئلة للجولة الحالية (استخدمها كسلاح):\n" +
        effectiveEvidence + "\n\n" +
        vaultSection +
        "سجل آخر السوالف في الشات:\n" +
        effectiveChatLog + "\n\n" +
        "الرسالة التي ترد عليها تحديداً الآن:\n" +
        "اللاعب [" + effectiveTargetSender + "] قال: \"" + effectiveTargetText + "\"\n\n" +
        "ردودك السابقة الممنوع تكرارها نهائياً في هذه الرسالة:\n" +
        bannedReplies + "\n\n" +
        "تعليمات صارمة جداً للفهم والتفاعل البشري:\n" +
        "1. رد مباشرة على كلام [" + effectiveTargetSender + "] وافهم مقصده:\n" +
        "   - إذا سألك سؤالاً: جاوب عليه بعفوية أو طقطق على سؤاله بالاسم.\n" +
        "   - إذا اتهمك: رد الاتهام عليه بالاسم: \"يا " + effectiveTargetSender + " شف وجهك بس\" أو \"مضيع انت؟\".\n" +
        "   - إذا كان يستهبل أو يضحك: ارمِ عليه ذبة تخص كلامه.\n" +
        "2. نوع في كلامك واكسر القوالب: لا تبدأ بنفس الكلمات كل مرة، وممنوع نهائياً تكرار أي رد من ردودك السابقة.\n" +
        "3. الأسلوب: عامية سعودية دارجة بحتة، بدون أي نقطة (.) في نهاية السطر، ومن 2 إلى 7 كلمات كحد أقصى.\n" +
        "4. اخرج نص الرد فقط دون أي أقواس أو أسماء:\n";

      let rawText = await callGemini(prompt, 40, ["\n", "User:", "Player:"]);

      // Anti-Repetition Check: If output matches any recent reply, retry once with temperature 1.2
      const isDuplicate = Array.isArray(recentAiReplies) && recentAiReplies.some((prev: string) => {
        if (!prev || !rawText) return false;
        const normPrev = prev.trim().replace(/[.،؛!؟"'`\*]/g, '');
        const normRaw = rawText.trim().replace(/[.،؛!؟"'`\*]/g, '');
        return normRaw === normPrev || (normRaw.length > 4 && normPrev.includes(normRaw));
      });

      if (isDuplicate) {
        console.warn('[Anti-Repetition Triggered]: Regenerating response with temp 1.2 to avoid repeat');
        const retryPrompt = prompt + "\n\nتنبيه أخير: الرد \"" + rawText + "\" مكرر وممنوع تماماً! اكتب رداً مختلفاً كلياً بفكرة جديدة:";
        const retryText = await callGemini(retryPrompt, 40, ["\n", "User:", "Player:"], 1.2);
        if (retryText) {
          rawText = retryText;
        }
      }

      const reply = sanitizeAndValidateReply(rawText || '', effectiveAiAvatar);

      return new Response(
        JSON.stringify({ text: reply, dialect: detectedDialect }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
