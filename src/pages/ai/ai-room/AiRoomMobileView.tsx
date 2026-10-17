// src/pages/ai/ai-room/AiRoomMobileView.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Send,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { sound } from '../../../lib/audio';
import {
  AiRoomPhase,
  Suspect,
  QuestionSubmission,
  AnswerSubmission,
  ChatMessage,
  RoundScoreResult,
} from './types';
import { validateQuestion } from './services/textSanitizer';
import { AvatarBadge } from './components/AvatarBadge';
import { EvidenceBoard } from './components/EvidenceBoard';
import { AnonymousChatBox } from './components/AnonymousChatBox';
import { VotingGrid } from './components/VotingGrid';

const extractQuestions = (raw: any): [string, string] => {
  if (!Array.isArray(raw)) return ['', ''];
  const q0 =
    typeof raw[0] === 'object' && raw[0]?.text
      ? raw[0].text
      : typeof raw[0] === 'string'
      ? raw[0]
      : '';
  const q1 =
    typeof raw[1] === 'object' && raw[1]?.text
      ? raw[1].text
      : typeof raw[1] === 'string'
      ? raw[1]
      : '';
  return [q0, q1];
};

const safeOff = (ch: any, event: string) => {
  if (!ch) return;
  if (typeof ch.off === 'function') {
    try {
      ch.off('broadcast', { event });
    } catch {}
  }
  const list = ch.bindings?.broadcast;
  if (Array.isArray(list)) {
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      if (b?.filter?.event === event || b?.filter?.event === '*') {
        if (ch.channelAdapter?.off && b?.ref) {
          try {
            ch.channelAdapter.off('broadcast', b.ref);
          } catch {}
        }
        list.splice(i, 1);
      }
    }
  }
};

interface AiRoomMobileViewProps {
  channel?: RealtimeChannel | any;
  roomCode?: string;
  playerId?: string;
  playerName?: string;
}

export const AiRoomMobileView: React.FC<AiRoomMobileViewProps> = ({
  channel,
  roomCode = 'TAQ1',
  playerId = '',
  playerName = 'متسابق',
}) => {
  const [phase, setPhase] = useState<AiRoomPhase>('LOBBY');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [myAvatarId, setMyAvatarId] = useState<string>('');
  const [questions, setQuestions] = useState<[string, string]>(['', '']);
  const [allAnswers, setAllAnswers] = useState<AnswerSubmission[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  // Ready states
  const [isLobbyReady, setIsLobbyReady] = useState<boolean>(false);
  const [hasAcknowledgedMask, setHasAcknowledgedMask] = useState<boolean>(false);
  const [isNextRoundReady, setIsNextRoundReady] = useState<boolean>(false);

  // Form states
  const [questionInput, setQuestionInput] = useState<string>('');
  const [questionError, setQuestionError] = useState<string>('');
  const [hasSubmittedQuestion, setHasSubmittedQuestion] = useState<boolean>(false);

  const [answer0, setAnswer0] = useState<string>('');
  const [answer1, setAnswer1] = useState<string>('');
  const [hasSubmittedAnswers, setHasSubmittedAnswers] = useState<boolean>(false);

  // Evidence modal state for mobile
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);

  const channelRef = useRef<any>(channel);
  const phaseRef = useRef<AiRoomPhase>(phase);
  const lastSyncRequestRef = useRef<number>(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    channelRef.current = channel;
    if (channel && typeof channel.off !== 'function') {
      channel.off = (_type: string, filterOrOpts?: any) => {
        const targetEvent = typeof filterOrOpts === 'object' ? filterOrOpts?.event : filterOrOpts;
        safeOff(channel, targetEvent);
      };
    }
  }, [channel]);

  // Broadcast helper
  const sendBroadcast = useCallback((event: string, payload: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }, []);

  // Force wipe question-phase blockers and transition to Answering Phase (Strict Idempotency Guard)
  const handleForceToAnswering = useCallback((payload: any) => {
    // STRICT GUARD: If already in ANSWERS phase, drop duplicate broadcast immediately
    if (phaseRef.current === 'ANSWERS') {
      return;
    }

    console.log('[Mobile] Single authoritative advance to Answering Phase');

    // 1. Force wipe all question-phase blockers and form locks
    setQuestionError('');
    setQuestionInput('');
    setHasSubmittedQuestion(false);
    setHasAcknowledgedMask(true); // Player must NOT be gated behind mask acknowledgment!

    // 2. Set the 2 questions from server payload
    if (payload?.questions && Array.isArray(payload.questions)) {
      const [q0, q1] = extractQuestions(payload.questions);
      if (q0 || q1) {
        setQuestions([q0, q1]);
      }
    }

    if (payload?.round) {
      setCurrentRound(payload.round);
    }

    // 3. Authoritatively switch active phase to ANSWERS
    setPhase('ANSWERS');
    sound.playClick();
  }, []);

  // Setup broadcast listeners with clean unbind lifecycle on the passed channel ONLY
  useEffect(() => {
    if (!channel) return;

    channelRef.current = channel;

    const handleStart = ({ payload }: any) => {
      if (!payload) return;
      if (phaseRef.current === 'QUESTIONS') return;
      sound.playSuccess();
      setSuspects(payload.suspects || []);
      if (payload.assignments && payload.assignments[playerId]) {
        setMyAvatarId(payload.assignments[playerId]);
      }
      if (payload.round) {
        setCurrentRound(payload.round);
      }
      setPhase('QUESTIONS');
      setHasAcknowledgedMask(false);
      setHasSubmittedQuestion(false);
      setHasSubmittedAnswers(false);
      setHasVoted(false);
      setIsNextRoundReady(false);
      setQuestionInput('');
      setAnswer0('');
      setAnswer1('');
      setChatMessages([]);
      setAllAnswers([]);
      setQuestions(['', '']);
      setShowEvidenceModal(false);
      setQuestionError('');
    };

    const handleNextRound = ({ payload }: any) => {
      if (payload?.round) {
        setCurrentRound(payload.round);
      }
      setQuestionInput('');
      setAnswer0('');
      setAnswer1('');
      setHasSubmittedQuestion(false);
      setHasSubmittedAnswers(false);
      setChatMessages([]);
      setAllAnswers([]);
      setQuestions(['', '']);
      setHasVoted(false);
      setIsNextRoundReady(false);
      setHasAcknowledgedMask(false);
      setShowEvidenceModal(false);
      setQuestionError('');
    };

    const handleStartAnswering = ({ payload }: any) => {
      if (phaseRef.current === 'ANSWERS') return;
      console.log('[Mobile] Single authoritative advance to Answering Phase');
      handleForceToAnswering(payload);
    };

    const handleInvestigationStart = ({ payload }: any) => {
      if (!payload) return;
      if (phaseRef.current === 'INVESTIGATION') return;
      sound.playSuccess();
      setAllAnswers(payload.answers || []);
      setPhase('INVESTIGATION');
    };

    const handlePhaseChanged = ({ payload }: any) => {
      if (!payload?.phase) return;
      const normalized = payload.phase === 'ANSWERING' ? 'ANSWERS' : payload.phase;
      if (normalized === 'ANSWERS') {
        handleForceToAnswering(payload);
      } else {
        if (phaseRef.current === normalized) return;
        setPhase(normalized);
        if (payload.answers) {
          setAllAnswers(payload.answers);
        }
      }
    };

    const handlePhaseSync = ({ payload }: any) => {
      if (!payload) return;
      if (payload.targetPlayerId && payload.targetPlayerId !== playerId) return;
      console.log('[Mobile] Received Authoritative Phase Sync:', payload);

      if (payload.round) setCurrentRound(payload.round);
      if (payload.questions && Array.isArray(payload.questions)) {
        const [q0, q1] = extractQuestions(payload.questions);
        if (q0 || q1) setQuestions([q0, q1]);
      }
      if (payload.answers) setAllAnswers(payload.answers);
      if (payload.suspects && Array.isArray(payload.suspects) && payload.suspects.length > 0) {
        setSuspects((prev) => (prev.length === 0 ? payload.suspects : prev));
      }

      const rawPhase = payload.currentPhase || payload.phase;
      const normalized = rawPhase === 'ANSWERING' ? 'ANSWERS' : rawPhase;
      if (normalized === 'ANSWERS') {
        handleForceToAnswering(payload);
      } else if (normalized) {
        if (phaseRef.current !== normalized) {
          console.log('[Mobile] Synced to Phase:', normalized);
          setPhase(normalized);
        }
      }
    };

    const handleChatMessage = ({ payload }: any) => {
      if (!payload) return;
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [...prev, payload];
      });
    };

    const handleVotingStart = () => {
      if (phaseRef.current === 'VOTING') return;
      sound.playBuzzer();
      setPhase('VOTING');
      setShowEvidenceModal(false);
    };

    const handleRevealStart = () => {
      if (phaseRef.current === 'REVEAL') return;
      sound.playSuccess();
      setPhase('REVEAL');
    };

    const handleReset = () => {
      if (phaseRef.current === 'LOBBY') return;
      setPhase('LOBBY');
      setSuspects([]);
      setMyAvatarId('');
      setIsLobbyReady(false);
      setHasAcknowledgedMask(false);
      setHasSubmittedQuestion(false);
      setHasSubmittedAnswers(false);
      setHasVoted(false);
      setIsNextRoundReady(false);
      setQuestionInput('');
      setAnswer0('');
      setAnswer1('');
      setChatMessages([]);
      setAllAnswers([]);
      setQuestions(['', '']);
      setShowEvidenceModal(false);
      setQuestionError('');
    };

    const broadcastEvents = [
      'AI_ROOM_START',
      'START_NEXT_ROUND',
      'START_ANSWERING_PHASE',
      'AI_ROOM_QUESTIONS_SELECTED',
      'AI_ROOM_INVESTIGATION_START',
      'PHASE_CHANGED',
      'AI_ROOM_PHASE_CHANGE',
      'AI_ROOM_PHASE_SYNC',
      'PHASE_SYNC_STATE',
      'AI_ROOM_CHAT_MSG',
      'AI_ROOM_VOTING_START',
      'AI_ROOM_REVEAL_START',
      'AI_ROOM_RESET',
    ];

    // Detach any previous duplicate listeners on this channel
    broadcastEvents.forEach((ev) => {
      if (typeof channel.off === 'function') {
        channel.off('broadcast', { event: ev });
      }
      safeOff(channel, ev);
    });

    // Register listeners
    channel
      .on('broadcast', { event: 'AI_ROOM_START' }, handleStart)
      .on('broadcast', { event: 'START_NEXT_ROUND' }, handleNextRound)
      .on('broadcast', { event: 'START_ANSWERING_PHASE' }, handleStartAnswering)
      .on('broadcast', { event: 'AI_ROOM_QUESTIONS_SELECTED' }, handleStartAnswering)
      .on('broadcast', { event: 'AI_ROOM_INVESTIGATION_START' }, handleInvestigationStart)
      .on('broadcast', { event: 'PHASE_CHANGED' }, handlePhaseChanged)
      .on('broadcast', { event: 'AI_ROOM_PHASE_CHANGE' }, handlePhaseChanged)
      .on('broadcast', { event: 'AI_ROOM_PHASE_SYNC' }, handlePhaseSync)
      .on('broadcast', { event: 'PHASE_SYNC_STATE' }, handlePhaseSync)
      .on('broadcast', { event: 'AI_ROOM_CHAT_MSG' }, handleChatMessage)
      .on('broadcast', { event: 'AI_ROOM_VOTING_START' }, handleVotingStart)
      .on('broadcast', { event: 'AI_ROOM_REVEAL_START' }, handleRevealStart)
      .on('broadcast', { event: 'AI_ROOM_RESET' }, handleReset);

    return () => {
      // Unsubscribe all listeners on unmount
      broadcastEvents.forEach((ev) => {
        if (typeof channel.off === 'function') {
          channel.off('broadcast', { event: ev });
        }
        safeOff(channel, ev);
      });
    };
  }, [channel, playerId, handleForceToAnswering]);

  // Visibility change & Reconnection Guard (Throttled Phase Sync)
  useEffect(() => {
    if (!channel) return;

    const handleVisibilityChange = () => {
      const now = Date.now();
      // Only sync if visible, at least 10s cooldown, AND only while in LOBBY phase
      if (
        document.visibilityState === 'visible' &&
        now - lastSyncRequestRef.current > 10000 &&
        phaseRef.current === 'LOBBY'
      ) {
        lastSyncRequestRef.current = now;
        console.log('[Mobile] Visibility check: syncing lobby state');
        channel.send({
          type: 'broadcast',
          event: 'REQUEST_PHASE_SYNC',
          payload: { playerId },
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [channel, playerId]);

  // Initial Sync Request on Mount (respects 10-second cooldown, only in LOBBY)
  useEffect(() => {
    if (!channel) return;
    const now = Date.now();
    if (now - lastSyncRequestRef.current > 10000 && phaseRef.current === 'LOBBY') {
      lastSyncRequestRef.current = now;
      const timer = setTimeout(() => {
        if (channel && phaseRef.current === 'LOBBY') {
          channel.send({
            type: 'broadcast',
            event: 'REQUEST_PHASE_SYNC',
            payload: { playerId },
          });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [channel, playerId]);

  // Toggle Lobby Ready Handler
  const handleToggleLobbyReady = () => {
    const nextState = !isLobbyReady;
    setIsLobbyReady(nextState);
    sendBroadcast('PLAYER_READY_UPDATE', {
      playerId,
      isReady: nextState,
    });
    sound.playClick();
  };

  // Toggle Next Round Ready Handler
  const handleToggleNextRoundReady = () => {
    const nextState = !isNextRoundReady;
    setIsNextRoundReady(nextState);
    sendBroadcast('PLAYER_READY_UPDATE', {
      playerId,
      isReady: nextState,
    });
    sound.playClick();
  };

  // Submit Question Handler
  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionError('');

    const validation = validateQuestion(questionInput);
    if (!validation.isValid) {
      setQuestionError('هذا السؤال ممنوع، اسأل سؤالاً طبيعياً ومفتوحاً');
      sound.playBuzzer();
      return;
    }

    const submission: QuestionSubmission = {
      playerId,
      avatarId: myAvatarId,
      question: questionInput.trim(),
    };

    sendBroadcast('AI_ROOM_SUBMIT_QUESTION', submission);
    setHasSubmittedQuestion(true);
    sound.playClick();
  };

  // Submit Answers Handler
  const handleAnswersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer0.trim() || !answer1.trim()) return;

    const submissions: AnswerSubmission[] = [
      { avatarId: myAvatarId, questionIndex: 0, answer: answer0.trim() },
      { avatarId: myAvatarId, questionIndex: 1, answer: answer1.trim() },
    ];

    sendBroadcast('AI_ROOM_SUBMIT_ANSWERS', {
      avatarId: myAvatarId,
      answers: submissions,
    });

    setHasSubmittedAnswers(true);
    sound.playClick();
  };

  // Send Chat Message Handler
  const handleSendChatMessage = (text: string) => {
    const mySus = suspects.find((s) => s.avatarId === myAvatarId);
    if (!mySus) return;

    const newMsg: ChatMessage = {
      id: `msg_${playerId}_${Date.now()}`,
      avatarId: myAvatarId,
      avatarName: mySus.avatarName,
      text: text.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    sendBroadcast('AI_ROOM_CHAT_MSG', newMsg);
    sound.playClick();
  };

  // Submit Vote Handler (Dispatches both CAST_VOTE and AI_ROOM_SUBMIT_VOTE)
  const handleVote = async (targetAvatarId: string) => {
    const payload = {
      round: currentRound,
      voterPlayerId: playerId,
      voterAvatarId: myAvatarId,
      targetAvatarId,
    };

    sendBroadcast('CAST_VOTE', payload);
    sendBroadcast('AI_ROOM_SUBMIT_VOTE', payload);
    setHasVoted(true);
    sound.playSuccess();
  };

  const mySuspect = suspects.find((s) => s.avatarId === myAvatarId);

  return (
    <div
      dir="rtl"
      className="w-full h-[100dvh] max-h-[100dvh] bg-[#E5E0D5] text-[#2C2A29] flex flex-col font-sans select-none overflow-hidden"
    >
      {/* Top Mobile Bar */}
      <header className="px-4 py-3 bg-[#F7F4EC] border-b-2 border-[#2C2A29] flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          {mySuspect ? (
            <AvatarBadge suspect={mySuspect} size="sm" isSelf />
          ) : (
            <div className="flex items-center gap-1.5 font-black text-sm">
              <ShieldAlert size={18} className="text-[#8A9A5B]" />
              <span>غرفة الذكاء الاصطناعي</span>
            </div>
          )}
        </div>

        {/* Floating Evidence Button during Investigation */}
        {phase === 'INVESTIGATION' && (
          <button
            type="button"
            onClick={() => setShowEvidenceModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C68B59] text-white rounded-xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] font-bold text-xs hover:bg-[#2C2A29] active:translate-y-0.5 transition-all duration-150"
          >
            <FileText size={14} />
            <span>لوحة الأدلة</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 overflow-hidden flex flex-col">
        {/* المرحلة 0: اللوبي وزر "جاهز" الملموس */}
        {phase === 'LOBBY' && (
          <div className="h-full flex flex-col items-center justify-between py-6 px-4 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-center">
            {/* Room Info */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#5C4033] bg-[#E5E0D5] px-3 py-1 rounded-lg border border-[#2C2A29]">
                رمز الغرفة: {roomCode}
              </span>
              <h2 className="text-2xl font-black text-[#000000] pt-2">
                أهلاً بك، {playerName}
              </h2>
              <p className="text-xs font-bold text-[#5C4033] max-w-xs mx-auto">
                واحد بينكم روبوت ذكي ينسخ أسلوبكم ويسولف معكم في الغرفة.. التزموا بالصمت واكتشفوا المندس!
              </p>
            </div>

            {/* Tactile 3D Circular "جاهز" Button */}
            <div className="my-auto">
              <button
                type="button"
                onClick={handleToggleLobbyReady}
                className={`rounded-full w-44 h-44 flex flex-col items-center justify-center font-black transition-all duration-150 border-3 border-[#2C2A29] select-none ${
                  isLobbyReady
                    ? 'bg-stone-400 text-stone-800 shadow-[0_2px_0_#2C2A29] translate-y-2'
                    : 'bg-[#8A9A5B] text-white shadow-[0_8px_0_#2C2A29] hover:bg-[#78884d] active:shadow-[0_2px_0_#2C2A29] active:translate-y-2'
                }`}
              >
                <span className={isLobbyReady ? 'text-base' : 'text-3xl'}>
                  {isLobbyReady ? 'بانتظار باقي اللاعبين...' : 'جاهز'}
                </span>
                {!isLobbyReady && (
                  <span className="text-xs font-bold opacity-80 mt-1">اضغط للتأكيد</span>
                )}
              </button>
            </div>

            <p className="text-[11px] font-semibold text-stone-500">
              {isLobbyReady
                ? 'أنت جاهز الآن! ستبدأ اللعبة تلقائياً فور اكتمال اللاعبين.'
                : 'اضغط على الزر لتأكيد جاهزيتك للمضيف.'}
            </p>
          </div>
        )}

        {/* المرحلة 1: استلام القناع السري (Secret Mask Assignment) */}
        {phase === 'QUESTIONS' && !hasAcknowledgedMask && mySuspect && (
          <div className="h-full flex flex-col items-center justify-between p-6 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-center">
            <div className="space-y-2">
              <span className="text-xs font-black text-[#C68B59] bg-[#E5E0D5] px-3 py-1 rounded-full border border-[#2C2A29]">
                الجولة {currentRound} من 3
              </span>
              <h2 className="text-xl font-black text-[#000000]">
                تم توزيع الأقنعة!
              </h2>
            </div>

            {/* Mask Reveal Card */}
            <div className="p-6 bg-white rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] w-full max-w-xs space-y-4">
              <span className="text-xs font-bold text-[#5C4033] block">
                قناعك السري لهذه الجولة:
              </span>
              <div className="flex justify-center">
                <AvatarBadge suspect={mySuspect} size="lg" isSelf />
              </div>
              <p className="text-xs font-bold text-[#5C4033] bg-[#E5E0D5] p-3 rounded-xl border border-[#2C2A29] leading-relaxed">
                هذا قناعك السري لهذه الجولة.. لا تظهره لأحد وخلك طبيعي!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setHasAcknowledgedMask(true);
                sound.playClick();
              }}
              className="w-full max-w-xs py-3.5 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-bold text-base shadow-[4px_4px_0px_#2C2A29] hover:bg-[#2C2A29] active:translate-y-0.5 transition-all duration-150"
            >
              أنا جاهز ومستعد
            </button>
          </div>
        )}

        {/* المرحلة 2: كتابة السؤال (Question Submission - 35s) */}
        {phase === 'QUESTIONS' && hasAcknowledgedMask && (
          <div className="h-full flex flex-col justify-between p-4 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#C68B59]">
                <HelpCircle size={20} />
                <h2 className="text-lg font-black text-[#000000]">اكتب سؤالاً للجلسة</h2>
              </div>
              <p className="text-xs font-bold text-[#5C4033] mb-4">
                اكتب سؤالاً مفتوحاً أو محرجاً للجلسة لكشف الروبوت.
              </p>

              {questionError && (
                <div className="p-3 mb-3 bg-rose-100 border-2 border-rose-400 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{questionError}</span>
                </div>
              )}

              {hasSubmittedQuestion ? (
                <div className="p-6 bg-emerald-50 rounded-xl border-2 border-emerald-600 text-center space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-700 mx-auto" />
                  <h3 className="font-bold text-base text-emerald-900">
                    تم إرسال السؤال.. ننتظر باقي اللاعبين
                  </h3>
                  <p className="text-xs font-semibold text-emerald-800">
                    "{questionInput}"
                  </p>
                </div>
              ) : (
                <form onSubmit={handleQuestionSubmit} className="space-y-3">
                  <textarea
                    rows={3}
                    value={questionInput}
                    onChange={(e) => {
                      setQuestionInput(e.target.value);
                      setQuestionError('');
                    }}
                    placeholder="اكتب سؤالاً مفتوحاً أو محرجاً للجلسة..."
                    className="w-full p-3 rounded-xl border-2 border-[#2C2A29] bg-white font-bold text-sm text-[#000000] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B] shadow-[2px_2px_0px_#2C2A29]"
                  />
                  <button
                    type="submit"
                    disabled={!questionInput.trim()}
                    className="w-full py-3 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-bold text-sm shadow-[4px_4px_0px_#2C2A29] hover:bg-[#2C2A29] active:translate-y-0.5 disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <span>إرسال السؤال</span>
                    <Send size={16} className="transform rotate-180" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* المرحلة 3: الإجابة على السؤالين (Answering Phase - 45s) */}
        {phase === 'ANSWERS' && (
          <div className="h-full flex flex-col justify-between p-4 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] overflow-y-auto">
            <div>
              <h2 className="text-lg font-black text-[#000000] mb-1">
                أجب عن السؤالين المختارين
              </h2>
              <p className="text-xs font-bold text-[#5C4033] mb-3">
                جاوب بعفويتك وبطريقتك العادية
              </p>

              {hasSubmittedAnswers ? (
                <div className="p-6 bg-emerald-50 rounded-xl border-2 border-emerald-600 text-center space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-700 mx-auto" />
                  <h3 className="font-bold text-base text-emerald-900">
                    تم استلام إجاباتك، جاري تجهيز غرفة التحقيق...
                  </h3>
                </div>
              ) : (
                <form onSubmit={handleAnswersSubmit} className="space-y-4">
                  {/* Q1 */}
                  <div className="p-3 bg-white rounded-xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]">
                    <span className="text-[11px] font-black text-[#C68B59] block mb-1">
                      السؤال الأول:
                    </span>
                    <p className="font-bold text-xs mb-2 text-[#000000]">{questions[0]}</p>
                    <textarea
                      rows={2}
                      value={answer0}
                      onChange={(e) => setAnswer0(e.target.value)}
                      placeholder="إجابتك بعفوية..."
                      className="w-full p-2 bg-[#F7F4EC] rounded-lg border border-[#2C2A29] text-xs font-bold"
                    />
                  </div>

                  {/* Q2 */}
                  <div className="p-3 bg-white rounded-xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]">
                    <span className="text-[11px] font-black text-[#C68B59] block mb-1">
                      السؤال الثاني:
                    </span>
                    <p className="font-bold text-xs mb-2 text-[#000000]">{questions[1]}</p>
                    <textarea
                      rows={2}
                      value={answer1}
                      onChange={(e) => setAnswer1(e.target.value)}
                      placeholder="إجابتك بعفوية..."
                      className="w-full p-2 bg-[#F7F4EC] rounded-lg border border-[#2C2A29] text-xs font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!answer0.trim() || !answer1.trim()}
                    className="w-full py-3 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-bold text-sm shadow-[4px_4px_0px_#2C2A29] hover:bg-[#2C2A29] active:translate-y-0.5 disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <span>إرسال الإجابات</span>
                    <Send size={16} className="transform rotate-180" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* مرحلة الانتظار بين الإجابات والتحقيق */}
        {phase === 'GENERATING_AI_ANSWERS' && (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#C68B59] border-2 border-[#2C2A29] flex items-center justify-center text-white shadow-[2px_2px_0px_#2C2A29]">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-black text-[#000000]">
              جاري تجهيز غرفة التحقيق...
            </h3>
            <p className="text-xs font-bold text-[#5C4033] max-w-xs">
              يتم الآن تحليل أقوال الجميع ودمج إجابات المشتبه فيهم في لوحة الأدلة.
            </p>
          </div>
        )}

        {/* المرحلة 4: غرفة التحقيق والشات الحي (3 دقائق) */}
        {phase === 'INVESTIGATION' && (
          <div className="h-full flex flex-col overflow-hidden">
            <AnonymousChatBox
              messages={chatMessages}
              suspects={suspects}
              mySuspect={mySuspect}
              onSendMessage={handleSendChatMessage}
              mode="mobile"
            />
          </div>
        )}

        {/* المرحلة 5: شبكة التصويت (Voting Phase - 45s) */}
        {phase === 'VOTING' && (
          <div className="h-full flex flex-col overflow-hidden">
            <VotingGrid
              suspects={suspects}
              myAvatarId={myAvatarId}
              onVote={handleVote}
              hasVoted={hasVoted}
            />
          </div>
        )}

        {/* المرحلة 6: كشف الستار والنتائج (Simplified Mobile Reveal View) */}
        {phase === 'REVEAL' && (
          <div className="h-full flex flex-col justify-between p-6 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-center">
            {/* Clean Status Card */}
            <div className="space-y-3 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#8A9A5B] border-2 border-[#2C2A29] flex items-center justify-center text-white shadow-[3px_3px_0px_#2C2A29] mx-auto">
                <Check size={36} className="stroke-[3]" />
              </div>
              <h2 className="text-2xl font-black text-[#000000]">
                انتهت الجولة {currentRound}!
              </h2>
              <p className="text-base font-bold text-[#5C4033] max-w-xs mx-auto leading-relaxed">
                انظر لشاشة التلفاز لمشاهدة كشف الستار والنتائج!
              </p>
            </div>

            {/* 3D Circular Tactile "جاهز للجولة التالية" Button */}
            <div className="pb-4">
              <button
                type="button"
                onClick={handleToggleNextRoundReady}
                className={`rounded-full w-40 h-40 mx-auto flex flex-col items-center justify-center font-bold text-base transition-all duration-150 border-3 border-[#2C2A29] select-none ${
                  isNextRoundReady
                    ? 'bg-stone-400 text-stone-800 shadow-[0_2px_0_#2C2A29] translate-y-2'
                    : 'bg-[#8A9A5B] text-white shadow-[0_8px_0_#2C2A29] hover:bg-[#78884d] active:shadow-[0_2px_0_#2C2A29] active:translate-y-2'
                }`}
              >
                <span>{isNextRoundReady ? 'بانتظار المضيف...' : 'جاهز للجولة التالية'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Evidence Modal Sheet for Mobile (Vertical stack, NO tabs) */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end p-2 transition-all duration-150">
          <div className="bg-[#E5E0D5] rounded-3xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] max-h-[85vh] h-[85vh] flex flex-col overflow-hidden">
            <div className="p-3 bg-[#F7F4EC] border-b-2 border-[#2C2A29] flex items-center justify-between">
              <span className="font-black text-sm">لوحة أقوال المشتبه فيهم</span>
              <button
                type="button"
                onClick={() => setShowEvidenceModal(false)}
                className="p-1.5 bg-stone-200 hover:bg-stone-300 rounded-lg border border-[#2C2A29]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-2 overflow-hidden">
              <EvidenceBoard
                questions={questions}
                suspects={suspects}
                answers={allAnswers}
                mode="mobile"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
