// src/pages/ai/ai-room/AiRoomTVView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Play,
  RotateCcw,
  Clock,
  HelpCircle,
  ShieldAlert,
  Crown,
  X,
  Maximize,
  Minimize,
  Copy,
  Check,
  Trophy,
  Award,
} from 'lucide-react';
import { useRoom, roomBus, cleanRoomCode } from '../../../lib/roomBus';
import { sound } from '../../../lib/audio';
import { supabase } from '../../../lib/supabase';
import { AVATARS_POOL } from './avatars';
import {
  AiRoomPhase,
  Suspect,
  QuestionSubmission,
  AnswerSubmission,
  ChatMessage,
  VoteSubmission,
  RoundScoreResult,
} from './types';
import { QRCodeView } from '../../../components/common/QRCodeView';
import { EvidenceBoard, shuffleArray } from './components/EvidenceBoard';
import { AnonymousChatBox } from './components/AnonymousChatBox';
import { AvatarBadge } from './components/AvatarBadge';
import { calculateRoundScores } from './services/scoringConfig';
import { generateAiAnswers, generateAiChatReply } from './services/aiRoomService';
import { ARCHETYPES, Archetype, selectRoundArchetype } from './archetypes';
import { SessionMemory, initialSessionMemory, createInitialSessionMemory, harvestHumanHabits } from './services/sessionMemory';
import { calculateHumanDelay } from './services/textSanitizer';
import { harvestMatchConversations } from './services/banterHarvester';
import { buildChatContext } from './services/chatContextBuilder';

const DEFAULT_QUESTIONS = [
  'وش أغرب موقف محرج صار لك وما تنساه؟',
  'لو معك مليون ريال تصرفها بيوم واحد وش تسوي؟',
  'وش أكثر تصريفة تمشيها على الناس دايماً؟',
  'وش أسوأ وجبة أكلتها بحياتك؟',
  'لو انحشرت في جزيرة مهجورة وش اول شي تسويه؟',
  'وش اغرب عذر سلكت فيه عشان تتهرب من عزيمة؟',
  'لو تفتح مشروع فاشل وش بيكون اسمه؟',
  'وش أسوأ صفة ممكن تكتشفها في صديقك المفضل؟',
];

const TOTAL_ROUNDS = 3;

export const AiRoomTVView: React.FC = () => {
  const params = useParams();
  const rawCode = (params.code || params.roomId || params.id || '').trim().toUpperCase() || 'TAQ1';
  const roomId = cleanRoomCode(rawCode);
  const navigate = useNavigate();

  const { room } = useRoom(roomId);
  const activeRoom = room || roomBus.getRoom(roomId) || roomBus.createRoom(roomId);

  useEffect(() => {
    if (activeRoom && activeRoom.selectedGameId !== 'ai-room') {
      activeRoom.selectedGameId = 'ai-room';
      roomBus.saveRoom(activeRoom);
      roomBus.emit('STATE_UPDATED', roomId, activeRoom);
    }
  }, [roomId, activeRoom]);

  // Players in room (excluding TV host)
  const players = useMemo(() => {
    return (activeRoom.players || []).filter((p) => p && p.id && p.id !== 'host_tv');
  }, [activeRoom.players]);

  // Game States
  const [phase, setPhase] = useState<AiRoomPhase>('LOBBY');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [questions, setQuestions] = useState<[string, string]>(['', '']);
  const [receivedQuestions, setReceivedQuestions] = useState<QuestionSubmission[]>([]);
  const [receivedAnswers, setReceivedAnswers] = useState<AnswerSubmission[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [votes, setVotes] = useState<VoteSubmission[]>([]);
  const [scoreResult, setScoreResult] = useState<RoundScoreResult | null>(null);
  const [cumulativeScores, setCumulativeScores] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Automated Roulette Animation States
  const [rouletteActive, setRouletteActive] = useState<boolean>(false);
  const [rouletteHighlightedAvatarId, setRouletteHighlightedAvatarId] = useState<string | null>(null);
  const [namesUnmasked, setNamesUnmasked] = useState<boolean>(false);

  // Ready system in Lobby & Between Rounds
  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({});
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const [nextRoundCountdown, setNextRoundCountdown] = useState<number | null>(null);

  // TopBar controls
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const channelRef = useRef<any>(null);
  const lastChatTimeRef = useRef<number>(Date.now());
  const aiReplyingRef = useRef<boolean>(false);
  const sessionMemoryRef = useRef<SessionMemory>(initialSessionMemory);
  const currentArchetypeRef = useRef<Archetype>(ARCHETYPES[0]);
  const isTransitioningToAnswersRef = useRef<boolean>(false);
  const aiRoundMessagesCountRef = useRef<number>(0);
  const aiLastSpokeTimeRef = useRef<number>(0);
  const openingTimeoutRef = useRef<any>(null);
  const lastSyncResponsePerPlayer = useRef<Map<string, number>>(new Map());
  const recentAiRepliesRef = useRef<string[]>([]);

  // Authoritative State Refs for Realtime Sync
  const phaseRef = useRef<AiRoomPhase>(phase);
  const currentRoundRef = useRef<number>(currentRound);
  const questionsRef = useRef<[string, string]>(questions);
  const receivedAnswersRef = useRef<AnswerSubmission[]>(receivedAnswers);
  const suspectsRef = useRef<Suspect[]>(suspects);
  const timeLeftRef = useRef<number>(timeLeft);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    receivedAnswersRef.current = receivedAnswers;
  }, [receivedAnswers]);
  useEffect(() => {
    suspectsRef.current = suspects;
  }, [suspects]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Join URL for QR Code
  const joinUrl = `${window.location.origin}/room/${roomId}/join`;

  // Broadcast state helper
  const broadcastToRoom = useCallback((event: string, payload: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }, []);

  // Setup Supabase Realtime Channel
  useEffect(() => {
    const channelName = `room_${roomId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'PLAYER_READY_UPDATE' }, ({ payload }: { payload: any }) => {
        if (!payload?.playerId) return;
        setReadyMap((prev) => ({
          ...prev,
          [payload.playerId]: !!payload.isReady,
        }));
      })
      .on('broadcast', { event: 'AI_ROOM_SUBMIT_QUESTION' }, ({ payload }: { payload: any }) => {
        if (!payload) return;
        setReceivedQuestions((prev) => {
          if (prev.some((q) => q.playerId === payload.playerId)) return prev;
          sound.playBuzzer();
          return [...prev, payload];
        });
      })
      .on('broadcast', { event: 'AI_ROOM_SUBMIT_ANSWERS' }, ({ payload }: { payload: any }) => {
        if (!payload || !Array.isArray(payload.answers)) return;
        setReceivedAnswers((prev) => {
          const filtered = prev.filter((a) => a.avatarId !== payload.avatarId);
          sound.playClick();
          return [...filtered, ...payload.answers];
        });
      })
      .on('broadcast', { event: 'AI_ROOM_CHAT_MSG' }, ({ payload }: { payload: any }) => {
        if (!payload) return;
        lastChatTimeRef.current = Date.now();
        if (openingTimeoutRef.current) {
          clearTimeout(openingTimeoutRef.current);
          openingTimeoutRef.current = null;
        }
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          sound.playClick();
          return [...prev, payload];
        });
      })
      .on('broadcast', { event: 'CAST_VOTE' }, ({ payload }: { payload: any }) => {
        if (!payload) return;
        setVotes((prev) => {
          const filtered = prev.filter((v) => v.voterAvatarId !== payload.voterAvatarId);
          sound.playBuzzer();
          return [...filtered, payload];
        });
      })
      .on('broadcast', { event: 'AI_ROOM_SUBMIT_VOTE' }, ({ payload }: { payload: any }) => {
        if (!payload) return;
        setVotes((prev) => {
          const filtered = prev.filter((v) => v.voterAvatarId !== payload.voterAvatarId);
          sound.playBuzzer();
          return [...filtered, payload];
        });
      })
      .on('broadcast', { event: 'REQUEST_PHASE_SYNC' }, ({ payload }: { payload: any }) => {
        const requestingPlayerId = payload?.playerId || 'all';
        const now = Date.now();
        const lastResp = lastSyncResponsePerPlayer.current.get(requestingPlayerId) || 0;
        if (now - lastResp < 2500) {
          // Throttled per requesting player: drop rapid duplicate sync requests
          return;
        }
        lastSyncResponsePerPlayer.current.set(requestingPlayerId, now);

        const curPhase = phaseRef.current;
        const curRound = currentRoundRef.current;
        const curQuestions = questionsRef.current;
        const curAnswers = receivedAnswersRef.current;
        const curSuspects = suspectsRef.current;
        const curTimeLeft = timeLeftRef.current;

        console.log('[TV] Responding to REQUEST_PHASE_SYNC for player:', requestingPlayerId, 'currentPhase:', curPhase);

        const syncPayload = {
          targetPlayerId: payload?.playerId,
          phase: curPhase,
          currentPhase: curPhase,
          round: curRound,
          questions: curQuestions,
          answers: curAnswers,
          durationSeconds: curTimeLeft,
          suspects: curSuspects.map((s) => ({
            avatarId: s.avatarId,
            avatarName: s.avatarName,
            iconName: s.iconName,
            bgTone: s.bgTone,
          })),
          timestamp: now,
        };

        // Send authoritative sync state targeting the requesting player
        broadcastToRoom('PHASE_SYNC_STATE', syncPayload);
        broadcastToRoom('AI_ROOM_PHASE_SYNC', syncPayload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, broadcastToRoom]);

  // Timer Tick
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Copy Room Code Handler
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      sound.playClick();
    });
  };

  // Kick Player from Lobby
  const handleKickPlayer = (targetId: string) => {
    roomBus.kickPlayer(roomId, targetId);
    broadcastToRoom('PLAYER_KICKED', { playerId: targetId });
    setReadyMap((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
    sound.playClick();
  };

  // Start Round helper (Fresh random avatars each round!)
  const startRound = useCallback(
    (roundNumber: number) => {
      if (players.length < 4) return;

      sound.playSuccess();
      const shuffledPool = shuffleArray(AVATARS_POOL);

      // Human suspects
      const newSuspects: Suspect[] = players.map((p, idx) => ({
        avatarId: shuffledPool[idx].id,
        avatarName: shuffledPool[idx].name,
        iconName: shuffledPool[idx].iconName,
        bgTone: shuffledPool[idx].bgTone,
        isAi: false,
        realPlayerId: p.id,
        realPlayerName: p.name,
      }));

      // Virtual AI Suspect (Injected in local game state ONLY!)
      const aiAvatar = shuffledPool[players.length];
      const aiSuspect: Suspect = {
        avatarId: aiAvatar.id,
        avatarName: aiAvatar.name,
        iconName: aiAvatar.iconName,
        bgTone: aiAvatar.bgTone,
        isAi: true,
        realPlayerName: 'الذكاء الاصطناعي',
      };

      // Secretly draw dynamic persona archetype for this round
      const roundArchetype = selectRoundArchetype(sessionMemoryRef.current.previousAiArchetypes);
      currentArchetypeRef.current = roundArchetype;
      sessionMemoryRef.current.previousAiArchetypes.push(roundArchetype.id);

      const allSuspects = shuffleArray([...newSuspects, aiSuspect]);
      setSuspects(allSuspects);
      setCurrentRound(roundNumber);
      setQuestions(['', '']);
      setReceivedQuestions([]);
      setReceivedAnswers([]);
      setChatMessages([]);
      setVotes([]);
      setScoreResult(null);
      setRouletteActive(false);
      setRouletteHighlightedAvatarId(null);
      setNamesUnmasked(false);
      setAutoStartCountdown(null);
      setReadyMap({});
      setNextRoundCountdown(null);
      isTransitioningToAnswersRef.current = false;
      aiRoundMessagesCountRef.current = 0;
      aiLastSpokeTimeRef.current = 0;
      if (openingTimeoutRef.current) {
        clearTimeout(openingTimeoutRef.current);
        openingTimeoutRef.current = null;
      }

      // Private assignments map: playerId -> avatarId
      const assignments: Record<string, string> = {};
      newSuspects.forEach((s) => {
        if (s.realPlayerId) {
          assignments[s.realPlayerId] = s.avatarId;
        }
      });

      setPhase('QUESTIONS');
      setTimeLeft(35);

      broadcastToRoom('START_NEXT_ROUND', { round: roundNumber });
      broadcastToRoom('AI_ROOM_START', {
        round: roundNumber,
        totalRounds: TOTAL_ROUNDS,
        suspects: allSuspects.map((s) => ({
          avatarId: s.avatarId,
          avatarName: s.avatarName,
          iconName: s.iconName,
          bgTone: s.bgTone,
        })),
        assignments,
        phase: 'QUESTIONS',
        durationSeconds: 35,
      });
    },
    [players, broadcastToRoom]
  );

  // Auto-Start Check in Lobby: players >= 4 and all ready
  useEffect(() => {
    if (phase !== 'LOBBY') {
      setAutoStartCountdown(null);
      return;
    }

    const hasMinPlayers = players.length >= 4;
    const allReady = hasMinPlayers && players.every((p) => readyMap[p.id] === true);

    if (allReady) {
      if (autoStartCountdown === null) {
        setAutoStartCountdown(3);
      }
    } else {
      setAutoStartCountdown(null);
    }
  }, [phase, players, readyMap, autoStartCountdown]);

  // Auto-Start Countdown Tick
  useEffect(() => {
    if (autoStartCountdown === null) return;
    if (autoStartCountdown === 0) {
      startRound(1);
      return;
    }

    const t = setTimeout(() => {
      setAutoStartCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(t);
  }, [autoStartCountdown, startRound]);

  // QUESTIONS Phase -> ANSWERS Phase (Guaranteed Selection & Multi-Broadcast)
  useEffect(() => {
    if (phase !== 'QUESTIONS') return;
    if (isTransitioningToAnswersRef.current) return;

    const allSubmitted = players.length > 0 && receivedQuestions.length >= players.length;
    if (timeLeft === 0 || allSubmitted) {
      isTransitioningToAnswersRef.current = true;
      sound.playSuccess();

      let pool = receivedQuestions.map((q) => (q.question || '').trim()).filter(Boolean);
      if (pool.length < 2) {
        const unusedDefaults = DEFAULT_QUESTIONS.filter((dq) => !pool.includes(dq));
        pool = [...pool, ...unusedDefaults];
      }
      const shuffled = pool.sort(() => Math.random() - 0.5);
      const chosenQuestions: [string, string] = [
        shuffled[0] || DEFAULT_QUESTIONS[0],
        shuffled[1] || DEFAULT_QUESTIONS[1],
      ];
      setQuestions(chosenQuestions);

      setPhase('ANSWERS');
      setTimeLeft(45);

      const payload = {
        round: currentRound,
        questions: chosenQuestions,
        phase: 'ANSWERS',
        durationSeconds: 45,
        timestamp: Date.now(),
      };

      // Single authoritative broadcast
      broadcastToRoom('START_ANSWERING_PHASE', payload);
      broadcastToRoom('AI_ROOM_QUESTIONS_SELECTED', payload);
      broadcastToRoom('PHASE_CHANGED', payload);
    }
  }, [phase, timeLeft, receivedQuestions, players.length, broadcastToRoom, currentRound]);

  // Strict Pre-Chat Barrier: Await AI Answers before opening Investigation
  useEffect(() => {
    if (phase !== 'ANSWERS') return;

    const totalExpectedAnswers = players.length * 2;
    const allAnswered = receivedAnswers.length >= totalExpectedAnswers;

    if (timeLeft === 0 || allAnswered) {
      sound.playSuccess();
      setPhase('GENERATING_AI_ANSWERS');

      const aiSuspect = suspects.find((s) => s.isAi);
      const aiAvatarName = aiSuspect?.avatarName || 'المشتبه فيه';
      const humanAnswerTexts = receivedAnswers.map((a) => a.answer);

      // AWAIT Edge Function call
      generateAiAnswers({
        questions,
        humanAnswers: humanAnswerTexts,
        aiAvatarName,
        archetype: currentArchetypeRef.current,
        groupSlang: Array.from(sessionMemoryRef.current.cumulativeSlang).slice(-15),
      }).then(([aiAns0, aiAns1]) => {
        if (!aiSuspect) return;
        const aiAnswerSubmissions: AnswerSubmission[] = [
          { avatarId: aiSuspect.avatarId, questionIndex: 0, answer: aiAns0 },
          { avatarId: aiSuspect.avatarId, questionIndex: 1, answer: aiAns1 },
        ];

        // Fisher-Yates shuffle suspects order on Evidence Board so AI position is completely randomized
        const allAnswersList = [...receivedAnswers, ...aiAnswerSubmissions];
        const shuffledAvatarIds = shuffleArray(suspects.map((s) => s.avatarId));
        const shuffledQ0 = shuffledAvatarIds
          .map((id) => allAnswersList.find((a) => a.avatarId === id && a.questionIndex === 0))
          .filter(Boolean) as AnswerSubmission[];
        const shuffledQ1 = shuffledAvatarIds
          .map((id) => allAnswersList.find((a) => a.avatarId === id && a.questionIndex === 1))
          .filter(Boolean) as AnswerSubmission[];
        const combined = [...shuffledQ0, ...shuffledQ1];
        setReceivedAnswers(combined);

        // Move to Investigation with 3 minutes
        setPhase('INVESTIGATION');
        setTimeLeft(180);
        aiRoundMessagesCountRef.current = 0;
        aiLastSpokeTimeRef.current = 0;

        // Broadcast phase transition to all devices
        broadcastToRoom('PHASE_CHANGED', {
          phase: 'INVESTIGATION',
          answers: combined,
          durationSeconds: 180,
        });

        // Probabilistic Opening AI Message:
        // 50% chance the AI doesn't speak first at all (waits for humans to talk).
        // 50% chance it sends an opening remark after 5.5 to 8.5 seconds, but cancels if a human speaks first.
        if (openingTimeoutRef.current) {
          clearTimeout(openingTimeoutRef.current);
          openingTimeoutRef.current = null;
        }

        const willOpen = Math.random() < 0.5;
        if (willOpen) {
          const openDelay = 5500 + Math.floor(Math.random() * 3000); // 5.5s to 8.5s
          openingTimeoutRef.current = setTimeout(async () => {
            openingTimeoutRef.current = null;
            if (aiRoundMessagesCountRef.current >= 7) return;

            const reply = await generateAiChatReply({
              recentMessages: [],
              formattedChatLog: 'لا توجد رسائل سابقة بعد، الشات توه يبدأ',
              targetSender: 'الشباب',
              targetText: 'بداية اللعبة وهدوء الشات',
              recentAiReplies: recentAiRepliesRef.current,
              trigger: 'silence',
              aiAvatarName,
              suspectsList: suspects.map((s) => s.avatarName),
              roundEvidence:
                `السؤال الأول: ${questions[0]}\nالسؤال الثاني: ${questions[1]}\n\nإجابات المشتبهين في لوحة الأدلة:\n` +
                suspects
                  .map((s) => {
                    const ans0 = combined.find((a) => a.avatarId === s.avatarId && a.questionIndex === 0)?.answer || 'بدون إجابة';
                    const ans1 = combined.find((a) => a.avatarId === s.avatarId && a.questionIndex === 1)?.answer || 'بدون إجابة';
                    return `- [${s.avatarName}] (${s.isAi ? 'أنت' : 'لاعب'}):\n   * جواب س1: "${ans0}"\n   * جواب س2: "${ans1}"`;
                  })
                  .join('\n'),
              humanAnswers: humanAnswerTexts,
              archetype: currentArchetypeRef.current,
              groupSlang: Array.from(sessionMemoryRef.current.cumulativeSlang).slice(-15),
              laughSamples: Array.from(sessionMemoryRef.current.laughStyles).slice(-5),
              pastTopics: sessionMemoryRef.current.referencedTopics.slice(-3),
              roundNumber: currentRound,
            });

            const defaultOpenings = [
              'يلا ركزوا يا عيال لا يضيعنا المندس',
              'هههههه الحين بيشتغل دور المحققين',
              'في واحد بيننا حاس انه متورط الصدق',
              'خلونا نشوف مين اللي بيبدأ يرقع الحين',
              'روقونا يا عيال وركزوا باللعب',
            ];
            const randomOpening = defaultOpenings[Math.floor(Math.random() * defaultOpenings.length)];
            const textToDeliver = reply || randomOpening;
            recentAiRepliesRef.current = [...recentAiRepliesRef.current.slice(-4), textToDeliver];

            const openingMsg: ChatMessage = {
              id: `ai_${Date.now()}`,
              avatarId: aiSuspect.avatarId,
              avatarName: aiSuspect.avatarName,
              text: textToDeliver,
              timestamp: Date.now(),
            };

            setChatMessages((prev) => [...prev, openingMsg]);
            broadcastToRoom('AI_ROOM_CHAT_MSG', openingMsg);
            lastChatTimeRef.current = Date.now();
            aiLastSpokeTimeRef.current = Date.now();
            aiRoundMessagesCountRef.current += 1;
          }, openDelay);
        }
      });
    }
  }, [phase, timeLeft, receivedAnswers, players.length, suspects, questions, broadcastToRoom]);

  // Hyper-Responsive In-Chat AI Response (<1.5s delay, Dialect-aware & Proactive Accusation Ticker)
  useEffect(() => {
    if (phase !== 'INVESTIGATION') return;

    const aiSuspect = suspects.find((s) => s.isAi);
    if (!aiSuspect) return;

    const aiAvatarName = aiSuspect.avatarName;
    const suspectsList = suspects.map((s) => s.avatarName);

    const formatRoundEvidence = () => {
      return (
        `السؤال الأول: ${questions[0]}\nالسؤال الثاني: ${questions[1]}\n\nإجابات المشتبهين في لوحة الأدلة:\n` +
        suspects
          .map((s) => {
            const ans0 =
              receivedAnswers.find((a) => a.avatarId === s.avatarId && a.questionIndex === 0)?.answer ||
              'بدون إجابة';
            const ans1 =
              receivedAnswers.find((a) => a.avatarId === s.avatarId && a.questionIndex === 1)?.answer ||
              'بدون إجابة';
            return `- [${s.avatarName}] (${s.isAi ? 'أنت' : 'لاعب'}):\n   * جواب س1: "${ans0}"\n   * جواب س2: "${ans1}"`;
          })
          .join('\n')
      );
    };

    const triggerFastAiReply = async (
      trigger: 'mention' | 'silence' | 'heated' | 'proactive_accusation',
      targetAccusee?: string
    ) => {
      if (aiReplyingRef.current) return;
      if (aiRoundMessagesCountRef.current >= 7) return;

      const now = Date.now();
      if (trigger === 'mention') {
        // Cooldown: don't respond to rapid mentions (<3.5s)
        if (now - aiLastSpokeTimeRef.current < 3500) return;
        // 15% chance to ignore mention to foil bot-pinging tricks
        if (Math.random() < 0.15) return;
      }

      aiReplyingRef.current = true;

      const { formattedChatLog, targetSender, targetText } = buildChatContext(
        chatMessages.slice(-6).map((m) => ({
          senderAvatar: m.avatarName,
          text: m.text,
        })),
        aiAvatarName
      );

      const replyText = await generateAiChatReply({
        recentMessages: chatMessages.slice(-6).map((m) => ({
          sender: m.avatarName,
          text: m.text,
        })),
        formattedChatLog,
        targetSender,
        targetText,
        recentAiReplies: recentAiRepliesRef.current,
        trigger,
        aiAvatarName,
        suspectsList,
        roundEvidence: formatRoundEvidence(),
        targetAccusee,
        humanAnswers: receivedAnswers.map((a) => a.answer),
        archetype: currentArchetypeRef.current,
        groupSlang: Array.from(sessionMemoryRef.current.cumulativeSlang).slice(-15),
        laughSamples: Array.from(sessionMemoryRef.current.laughStyles).slice(-5),
        pastTopics: sessionMemoryRef.current.referencedTopics.slice(-3),
        roundNumber: currentRound,
      });

      // Minimal Human Delay: delayMs = 800 + Math.min(wordsCount * 200, 1000) (Response is delivered in 1.0 to 1.8s maximum)
      const wordsCount = (replyText || '').trim().split(/\s+/).filter(Boolean).length;
      const delayMs = 800 + Math.min(wordsCount * 200, 1000);

      setTimeout(() => {
        recentAiRepliesRef.current = [...recentAiRepliesRef.current.slice(-4), replyText];

        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          avatarId: aiSuspect.avatarId,
          avatarName: aiSuspect.avatarName,
          text: replyText,
          timestamp: Date.now(),
        };

        setChatMessages((prev) => [...prev, aiMsg]);
        broadcastToRoom('AI_ROOM_CHAT_MSG', aiMsg);
        lastChatTimeRef.current = Date.now();
        aiLastSpokeTimeRef.current = Date.now();
        aiRoundMessagesCountRef.current += 1;
        aiReplyingRef.current = false;
      }, delayMs);
    };

    // 1. Fast reply on direct mention in latest message
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (
      lastMsg &&
      lastMsg.avatarId !== aiSuspect.avatarId &&
      lastMsg.text.includes(aiAvatarName)
    ) {
      triggerFastAiReply('mention');
      return;
    }

    // 2. Banter ticker: every 3 human messages without AI speaking
    const lastAiIndex = chatMessages.map((m) => m.avatarId === aiSuspect.avatarId).lastIndexOf(true);
    const humanMessagesSinceAi =
      lastAiIndex === -1 ? chatMessages.length : chatMessages.length - 1 - lastAiIndex;

    if (humanMessagesSinceAi >= 3 && !aiReplyingRef.current) {
      triggerFastAiReply('heated');
      return;
    }

    // 3. Proactive Silence Ticker (7 seconds of silence)
    const interval = setInterval(() => {
      const now = Date.now();
      const silenceDuration = now - lastChatTimeRef.current;
      const timeSinceAiSpoke = now - aiLastSpokeTimeRef.current;

      if (
        silenceDuration >= 7000 &&
        timeSinceAiSpoke >= 7000 &&
        !aiReplyingRef.current &&
        chatMessages.length > 0 &&
        aiRoundMessagesCountRef.current < 7
      ) {
        const humanSuspects = suspects.filter((s) => !s.isAi);
        const target =
          humanSuspects.length > 0
            ? humanSuspects[Math.floor(Math.random() * humanSuspects.length)].avatarName
            : undefined;
        triggerFastAiReply('proactive_accusation', target);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [phase, chatMessages, suspects, receivedAnswers, questions, broadcastToRoom]);

  // INVESTIGATION -> VOTING (180s expires)
  useEffect(() => {
    if (phase !== 'INVESTIGATION') return;
    if (timeLeft === 0) {
      sound.playBuzzer();
      setPhase('VOTING');
      setTimeLeft(45);

      broadcastToRoom('AI_ROOM_VOTING_START', {
        phase: 'VOTING',
        durationSeconds: 45,
      });
    }
  }, [phase, timeLeft, broadcastToRoom]);

  // VOTING -> REVEAL (Automated Roulette Animation)
  useEffect(() => {
    if (phase !== 'VOTING') return;

    const allVoted = players.length > 0 && votes.length >= players.length;
    if (timeLeft === 0 || allVoted) {
      sound.playSuccess();
      const results = calculateRoundScores(suspects, votes, cumulativeScores);
      setScoreResult(results);
      setCumulativeScores(results.playerPoints);

      // Harvest human habits and store round topics into match session memory
      sessionMemoryRef.current = harvestHumanHabits(
        chatMessages.map((m) => m.text),
        receivedAnswers.map((a) => a.answer),
        sessionMemoryRef.current
      );
      if (questions[0] || questions[1]) {
        sessionMemoryRef.current.referencedTopics.push(`س: ${questions[0]} | س: ${questions[1]}`);
      }

      // Harvest authentic human dialogue turns into Supabase human_banter_vault
      const mappedChatLogs = chatMessages.map((m) => {
        const s = suspects.find((sp) => sp.avatarId === m.avatarId || sp.avatarName === m.avatarName);
        return {
          senderAvatar: m.avatarName,
          senderPlayerId: s?.realPlayerId,
          text: m.text,
        };
      });
      const aiSuspectName = suspects.find((s) => s.isAi)?.avatarName;
      const roundQuestionText = questions[0]
        ? (questions[1] ? `س: ${questions[0]} | س: ${questions[1]}` : `س: ${questions[0]}`)
        : undefined;

      harvestMatchConversations(
        supabase,
        roomId,
        mappedChatLogs,
        results.masterBlufferPlayerId,
        aiSuspectName,
        roundQuestionText
      ).catch((err) => console.warn('[Harvest Banter Error]:', err));

      setPhase('REVEAL');
      broadcastToRoom('AI_ROOM_REVEAL_START', {
        phase: 'REVEAL',
        round: currentRound,
      });

      // Start Automated Roulette (3.5 seconds)
      setRouletteActive(true);
      setNamesUnmasked(false);

      const aiSuspect = suspects.find((s) => s.isAi);
      const allIds = suspects.map((s) => s.avatarId);
      let stepIndex = 0;

      const rouletteInterval = setInterval(() => {
        setRouletteHighlightedAvatarId(allIds[stepIndex % allIds.length]);
        sound.playClick();
        stepIndex++;
      }, 130);

      // Land firmly on AI avatar after 3.5 seconds
      setTimeout(() => {
        clearInterval(rouletteInterval);
        setRouletteActive(false);
        if (aiSuspect) {
          setRouletteHighlightedAvatarId(aiSuspect.avatarId);
        }
        sound.playSuccess();

        // Automatically unmask real player names 1.8 seconds later (Zero clicks required)
        setTimeout(() => {
          setNamesUnmasked(true);
        }, 1800);
      }, 3500);
    }
  }, [phase, timeLeft, votes.length, players.length, suspects, cumulativeScores, currentRound, chatMessages, receivedAnswers, questions, broadcastToRoom]);

  // Advance to Next Round or Final GameOver
  const handleProceedNextRound = useCallback(() => {
    sound.playClick();
    if (currentRound < TOTAL_ROUNDS) {
      // Start next round with brand new random avatars
      startRound(currentRound + 1);
    } else {
      // Conclude match: GameOver Podium
      setPhase('GAME_OVER');
      broadcastToRoom('AI_ROOM_GAME_OVER', {
        finalScores: cumulativeScores,
      });
    }
  }, [currentRound, startRound, cumulativeScores, broadcastToRoom]);

  // Between-Rounds All-Ready Auto-Advancement
  useEffect(() => {
    if (phase !== 'REVEAL' || !namesUnmasked) {
      setNextRoundCountdown(null);
      return;
    }

    const hasPlayers = players.length > 0;
    const allReady = hasPlayers && players.every((p) => readyMap[p.id] === true);

    if (allReady) {
      if (nextRoundCountdown === null) {
        setNextRoundCountdown(2);
      }
    } else {
      setNextRoundCountdown(null);
    }
  }, [phase, namesUnmasked, players, readyMap, nextRoundCountdown]);

  // Between-Rounds Countdown Tick
  useEffect(() => {
    if (nextRoundCountdown === null) return;
    if (nextRoundCountdown === 0) {
      handleProceedNextRound();
      return;
    }

    const timer = setTimeout(() => {
      setNextRoundCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [nextRoundCountdown, handleProceedNextRound]);

  // TopBar Exit Action (Ochre Orange ONLY)
  const handleTopBarExitAction = () => {
    sound.playClick();
    if (phase === 'LOBBY') {
      broadcastToRoom('ROOM_TERMINATED', {});
      navigate('/');
    } else {
      setPhase('LOBBY');
      setSuspects([]);
      setReceivedQuestions([]);
      setReceivedAnswers([]);
      setChatMessages([]);
      setVotes([]);
      setScoreResult(null);
      setReadyMap({});
      setAutoStartCountdown(null);
      setCurrentRound(1);
      sessionMemoryRef.current = createInitialSessionMemory();
      broadcastToRoom('AI_ROOM_RESET', {});
    }
  };

  // Sorted Leaderboard
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (cumulativeScores[b.id] || 0) - (cumulativeScores[a.id] || 0));
  }, [players, cumulativeScores]);

  return (
    <div
      dir="rtl"
      className="w-full h-screen bg-[#E5E0D5] text-[#2C2A29] flex flex-col font-sans select-none overflow-hidden"
    >
      {/* TopBar Layout - ALL Buttons Ochre Orange #C68B59 */}
      <header className="h-20 px-8 flex items-center justify-between border-b-2 border-[#2C2A29] bg-[#F7F4EC] shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#8A9A5B] border-2 border-[#2C2A29] flex items-center justify-center text-white shadow-[2px_2px_0px_#2C2A29]">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#2C2A29] tracking-tight">
              غرفة الذكاء الاصطناعي
            </h1>
            <p className="text-xs font-bold text-[#5C4033]">
              فئة ذكاء اصطناعي • طق عصي
            </p>
          </div>
        </div>

        {/* Phase Indicator & Timer */}
        {phase !== 'LOBBY' && phase !== 'GAME_OVER' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#E5E0D5] rounded-xl border-2 border-[#2C2A29] font-black text-sm shadow-[2px_2px_0px_#2C2A29]">
              <Clock size={18} className="text-[#5C4033]" />
              <span>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="px-4 py-2 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-black text-sm shadow-[2px_2px_0px_#2C2A29]">
              الجولة {currentRound} من {TOTAL_ROUNDS} •{' '}
              {phase === 'QUESTIONS' && 'كتابة الأسئلة'}
              {phase === 'ANSWERS' && 'الإجابات'}
              {phase === 'GENERATING_AI_ANSWERS' && 'تجهيز التحقيق'}
              {phase === 'INVESTIGATION' && 'التحقيق والشات الحي'}
              {phase === 'VOTING' && 'التصويت النهائي'}
              {phase === 'REVEAL' && 'كشف الستار'}
            </div>
          </div>
        )}

        {/* TopBar Buttons STRICT Ochre Orange #C68B59 */}
        <div className="flex items-center gap-3">
          {/* Room Code Badge & Copy */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl px-4 py-2 font-bold hover:bg-[#2C2A29] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-150"
          >
            {copiedCode ? <Check size={16} /> : <Copy size={16} />}
            <span>رمز الغرفة: {roomId}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl px-4 py-2 font-bold hover:bg-[#2C2A29] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-150"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span>{isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة'}</span>
          </button>

          {/* Dynamic Exit / Back Button (Ochre Orange ONLY) */}
          <button
            type="button"
            onClick={handleTopBarExitAction}
            className="bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl px-4 py-2 font-bold hover:bg-[#2C2A29] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-150"
          >
            {phase === 'LOBBY' ? 'إنهاء اللعبة' : 'العودة للوبي'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        {/* 1. LOBBY PHASE */}
        {phase === 'LOBBY' && (
          <div className="h-full flex flex-col justify-between max-w-5xl mx-auto">
            {/* Center Stage: QR Code & Access Card */}
            <div className="bg-[#F7F4EC] p-6 rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] flex flex-col md:flex-row items-center gap-8 justify-between">
              <div className="shrink-0">
                <QRCodeView url={joinUrl} size={150} />
              </div>

              <div className="flex-1 text-right space-y-3">
                <div className="inline-block bg-[#E5E0D5] px-4 py-1.5 rounded-xl border-2 border-[#2C2A29] font-black text-xs text-[#5C4033]">
                  انضم عبر مسح الباركود أو إدخال الرمز
                </div>
                <div className="text-4xl font-black text-[#000000] tracking-wider">
                  {roomId}
                </div>
                <p className="text-base font-bold text-[#5C4033] leading-relaxed max-w-xl">
                  واحد بينكم روبوت ذكي ينسخ أسلوبكم ويسولف معكم في الغرفة.. التزموا بالصمت واكتشفوا المندس!
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 shrink-0">
                {autoStartCountdown !== null ? (
                  <div className="px-6 py-3 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] font-black text-center">
                    <span className="block text-xs">الجميع جاهز! الانطلاق خلال</span>
                    <span className="text-3xl font-black">{autoStartCountdown}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startRound(1)}
                    disabled={players.length < 4}
                    className="px-8 py-3.5 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-bold text-lg shadow-[4px_4px_0px_#2C2A29] hover:bg-[#2C2A29] active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-2"
                  >
                    <Play size={20} className="stroke-[3]" />
                    <span>بدء اللعبة (3 جولات)</span>
                  </button>
                )}

                {players.length < 4 && (
                  <span className="text-xs font-bold text-[#5C4033] bg-[#E5E0D5] px-3 py-1 rounded-lg border border-[#2C2A29]">
                    بانتظار اكتمال 4 لاعبين على الأقل للبدء
                  </span>
                )}
              </div>
            </div>

            {/* Section 9: Compact Balanced Pills for Lobby Players */}
            <div className="my-auto text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Users size={20} className="text-[#2C2A29]" />
                <h3 className="text-base font-black text-[#000000]">
                  اللاعبون المتصلون ({players.length}/12)
                </h3>
              </div>

              {players.length === 0 ? (
                <p className="text-xs font-bold text-stone-500">
                  بانتظار انضمام المتسابقين...
                </p>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto mt-4">
                  {players.map((p) => {
                    const isReady = readyMap[p.id] === true;
                    return (
                      <div
                        key={p.id}
                        className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] rounded-xl font-bold text-black text-sm"
                      >
                        <span
                          className={`w-2 h-2 rounded-full border border-[#2C2A29] ${
                            isReady ? 'bg-[#8A9A5B]' : 'bg-stone-300'
                          }`}
                        />
                        <span>{p.name}</span>
                        {isReady && (
                          <span className="text-[10px] text-[#8A9A5B] font-black">
                            جاهز
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleKickPlayer(p.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors"
                          title="طرد اللاعب"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. QUESTIONS PHASE */}
        {phase === 'QUESTIONS' && (
          <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-[#C68B59] rounded-2xl border-2 border-[#2C2A29] flex items-center justify-center text-white shadow-[4px_4px_0px_#2C2A29]">
              <HelpCircle size={36} />
            </div>
            <h2 className="text-2xl font-black text-[#000000]">
              اكتبوا أسئلتكم على الجوال الآن!
            </h2>
            <p className="text-sm font-bold text-[#5C4033] max-w-md">
              الجولة {currentRound} من 3: كل لاعب يكتب سؤالاً مفتوحاً للجلسة.
            </p>

            <div className="w-full bg-[#F7F4EC] p-5 rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] flex items-center justify-between">
              <span className="font-bold text-base text-[#000000]">الأسئلة المستلمة:</span>
              <span className="text-2xl font-black text-[#8A9A5B]">
                {receivedQuestions.length} / {players.length}
              </span>
            </div>
          </div>
        )}

        {/* 3. ANSWERS PHASE */}
        {phase === 'ANSWERS' && (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6 text-center">
            <h2 className="text-2xl font-black text-[#000000]">
              تم اختيار السؤالين! أرسلوا إجاباتكم
            </h2>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-right">
                <span className="text-xs font-black text-[#C68B59] block mb-2">
                  السؤال الأول:
                </span>
                <p className="font-bold text-base text-[#000000]">{questions[0]}</p>
              </div>
              <div className="p-5 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-right">
                <span className="text-xs font-black text-[#C68B59] block mb-2">
                  السؤال الثاني:
                </span>
                <p className="font-bold text-base text-[#000000]">{questions[1]}</p>
              </div>
            </div>

            <div className="w-full bg-[#F7F4EC] p-4 rounded-xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] flex items-center justify-between">
              <span className="font-bold text-sm text-[#5C4033]">
                بانتظار إجابات الجميع...
              </span>
              <span className="text-xl font-black text-[#8A9A5B]">
                {Math.floor(receivedAnswers.length / 2)} / {players.length} لاعبين
              </span>
            </div>
          </div>
        )}

        {/* Section 3: Strict Pre-Chat Barrier */}
        {phase === 'GENERATING_AI_ANSWERS' && (
          <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#C68B59] border-2 border-[#2C2A29] flex items-center justify-center text-white shadow-[4px_4px_0px_#2C2A29]">
              <Clock size={36} />
            </div>
            <h2 className="text-2xl font-black text-[#000000]">
              جاري تجهيز غرفة التحقيق...
            </h2>
            <p className="text-sm font-bold text-[#5C4033]">
              يتم دمج إجابات جميع المشتبه فيهم في لوحة الأدلة. لحظات ونبدأ!
            </p>
          </div>
        )}

        {/* 4. INVESTIGATION PHASE (Side-by-Side Questions + Locked Dimensions Chat) */}
        {phase === 'INVESTIGATION' && (
          <div className="h-full grid grid-cols-12 gap-6 overflow-hidden">
            <div className="col-span-7 h-full">
              <EvidenceBoard
                questions={questions}
                suspects={suspects}
                answers={receivedAnswers}
                mode="tv"
              />
            </div>
            <div className="col-span-5 h-full flex flex-col justify-center">
              <AnonymousChatBox
                messages={chatMessages}
                suspects={suspects}
                mode="tv"
              />
            </div>
          </div>
        )}

        {/* 5. VOTING PHASE */}
        {phase === 'VOTING' && (
          <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-[#8A9A5B] rounded-2xl border-2 border-[#2C2A29] flex items-center justify-center text-white shadow-[4px_4px_0px_#2C2A29]">
              <ShieldAlert size={36} />
            </div>
            <h2 className="text-2xl font-black text-[#000000]">
              انتهى وقت التحقيق! صوتوا الآن
            </h2>
            <p className="text-sm font-bold text-[#5C4033] max-w-md">
              صوتوا عبر الجوال لاختيار الأفاتار المشتبه بأنه الروبوت المتنكر.
            </p>

            <div className="w-full bg-[#F7F4EC] p-5 rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] flex items-center justify-between">
              <span className="font-bold text-base text-[#000000]">الأصوات المسجلة:</span>
              <span className="text-2xl font-black text-[#8A9A5B]">
                {votes.length} / {players.length}
              </span>
            </div>
          </div>
        )}

        {/* Section 6: Automated Roulette Reveal & Standings */}
        {phase === 'REVEAL' && scoreResult && (
          <div className="h-full flex flex-col justify-between max-w-5xl mx-auto overflow-y-auto">
            <div className="text-center my-2">
              <h2 className="text-2xl font-black text-[#000000] mb-1">
                كشف الستار - الجولة {currentRound} من {TOTAL_ROUNDS}
              </h2>
              <p className="text-xs font-bold text-[#5C4033]">
                {rouletteActive
                  ? 'جاري فحص الأفاتارات وسحب الستار...'
                  : 'تم الكشف عن الروبوت المندس وهويات المتسابقين!'}
              </p>
            </div>

            {/* Suspects Cards with Roulette Focus Animation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 my-3">
              {suspects.map((s) => {
                const isAi = s.isAi;
                const isHighlighted = rouletteHighlightedAvatarId === s.avatarId;
                const voteCount = votes.filter((v) => v.targetAvatarId === s.avatarId).length;

                return (
                  <div
                    key={s.avatarId}
                    className={`p-4 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center text-center ${
                      !rouletteActive && isAi
                        ? 'border-4 border-rose-600 bg-[#FFE5D9] shadow-[6px_6px_0px_#2C2A29]'
                        : isHighlighted
                        ? 'border-4 border-[#8A9A5B] bg-[#EAD7BB] shadow-[4px_4px_0px_#2C2A29]'
                        : 'border-[#2C2A29] bg-[#F7F4EC] shadow-[4px_4px_0px_#2C2A29]'
                    }`}
                  >
                    <AvatarBadge
                      suspect={s}
                      size="lg"
                      showRealName={namesUnmasked}
                    />

                    <div className="mt-2.5 px-3 py-1 bg-[#2C2A29] text-white rounded-full text-xs font-bold">
                      {voteCount} أصوات
                    </div>

                    {/* AI Firm Landing Badge */}
                    {!rouletteActive && isAi && (
                      <div className="mt-2 text-xs font-black text-white bg-rose-600 px-3 py-1 rounded-lg border border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]">
                        الروبوت المندس!
                      </div>
                    )}

                    {/* Correct Voters list under the AI Avatar */}
                    {!rouletteActive && isAi && scoreResult.correctVoterNames && scoreResult.correctVoterNames.length > 0 && (
                      <div className="mt-2 text-[10px] font-bold text-stone-700 bg-white p-2 rounded-lg border border-[#2C2A29] w-full">
                        <span className="block text-[#8A9A5B] font-black mb-0.5">صادوه (+5 pt):</span>
                        {scoreResult.correctVoterNames.join('، ')}
                      </div>
                    )}

                    {/* Master Bluff badge */}
                    {namesUnmasked && scoreResult.masterBlufferAvatarId === s.avatarId && (
                      <span className="mt-2 text-[11px] font-black text-[#5C4033] bg-[#E5E0D5] px-2 py-0.5 rounded border border-[#2C2A29] flex items-center gap-1">
                        <Crown size={12} />
                        أفضل ممثل (+8 pt)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Standings Leaderboard */}
            {namesUnmasked && (
              <div className="bg-[#F7F4EC] p-4 rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] my-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-sm text-[#000000] flex items-center gap-2">
                    <Trophy className="text-[#C68B59]" size={16} />
                    <span>لائحة الترتيب والنقاط التراكمية</span>
                  </h3>
                  <span className="text-xs font-bold text-[#5C4033]">
                    نهاية الجولة {currentRound} من {TOTAL_ROUNDS}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {sortedPlayers.map((p) => {
                    const totalPts = cumulativeScores[p.id] || 0;
                    const roundPts = scoreResult.roundPointsEarned[p.id] || 0;

                    return (
                      <div
                        key={p.id}
                        className="p-2.5 bg-white rounded-xl border border-[#2C2A29] flex items-center justify-between"
                      >
                        <span className="font-bold text-xs text-[#000000]">{p.name}</span>
                        <div className="text-left">
                          <span className="font-black text-sm text-[#8A9A5B]">
                            {totalPts} pt
                          </span>
                          {roundPts > 0 && (
                            <span className="block text-[9px] font-bold text-stone-500">
                              (+{roundPts})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Round Action */}
            {namesUnmasked && (
              <div className="flex flex-col items-center justify-center py-2 gap-2">
                {nextRoundCountdown !== null && (
                  <div className="px-6 py-2 bg-[#8A9A5B] text-white font-black text-sm rounded-xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] animate-pulse">
                    الجميع جاهز! بدء الجولة التالية خلال {nextRoundCountdown} ثوانٍ...
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleProceedNextRound}
                  className="px-8 py-3 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-bold shadow-[4px_4px_0px_#2C2A29] hover:bg-[#2C2A29] active:translate-y-0.5 transition-all duration-150 flex items-center gap-2"
                >
                  <RotateCcw size={18} />
                  <span>
                    {currentRound < TOTAL_ROUNDS
                      ? `الانتقال للجولة ${currentRound + 1}`
                      : 'عرض الفائزين بالبطولة'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Final Match Podium (After Round 3) */}
        {phase === 'GAME_OVER' && (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-[#C68B59] border-2 border-[#2C2A29] flex items-center justify-center text-white shadow-[6px_6px_0px_#2C2A29]">
              <Trophy size={44} />
            </div>

            <div>
              <h2 className="text-3xl font-black text-[#000000]">
                نهاية اللعبة وتتويج الأبطال!
              </h2>
              <p className="text-sm font-bold text-[#5C4033] mt-1">
                اكتملت الجولات الثلاث! إليكم ترتيب المتسابقين النهائي:
              </p>
            </div>

            {/* Podium (Top 3) */}
            <div className="w-full grid grid-cols-3 gap-4 items-end pt-4">
              {/* 2nd Place */}
              {sortedPlayers[1] && (
                <div className="bg-[#F7F4EC] p-4 rounded-2xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] flex flex-col items-center h-44 justify-between">
                  <span className="text-xs font-black text-stone-600">المركز الثاني</span>
                  <Award size={32} className="text-stone-400" />
                  <span className="font-black text-sm text-[#000000]">{sortedPlayers[1].name}</span>
                  <span className="font-black text-base text-[#8A9A5B]">
                    {cumulativeScores[sortedPlayers[1].id] || 0} pt
                  </span>
                </div>
              )}

              {/* 1st Place */}
              {sortedPlayers[0] && (
                <div className="bg-[#FFE5D9] p-5 rounded-2xl border-4 border-[#C68B59] shadow-[5px_5px_0px_#2C2A29] flex flex-col items-center h-52 justify-between">
                  <div className="flex items-center gap-1 text-xs font-black text-[#C68B59]">
                    <Crown size={16} />
                    <span>البطل الأول</span>
                  </div>
                  <Trophy size={42} className="text-[#C68B59]" />
                  <span className="font-black text-lg text-[#000000]">{sortedPlayers[0].name}</span>
                  <span className="font-black text-xl text-[#8A9A5B]">
                    {cumulativeScores[sortedPlayers[0].id] || 0} pt
                  </span>
                </div>
              )}

              {/* 3rd Place */}
              {sortedPlayers[2] && (
                <div className="bg-[#F7F4EC] p-4 rounded-2xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] flex flex-col items-center h-40 justify-between">
                  <span className="text-xs font-black text-amber-700">المركز الثالث</span>
                  <Award size={28} className="text-amber-600" />
                  <span className="font-black text-sm text-[#000000]">{sortedPlayers[2].name}</span>
                  <span className="font-black text-base text-[#8A9A5B]">
                    {cumulativeScores[sortedPlayers[2].id] || 0} pt
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleTopBarExitAction}
              className="px-8 py-3 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-bold shadow-[4px_4px_0px_#2C2A29] hover:bg-[#2C2A29] active:translate-y-0.5 transition-all duration-150 flex items-center gap-2"
            >
              <RotateCcw size={18} />
              <span>العودة للوبي</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
