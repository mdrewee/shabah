import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Clock,
  CheckCircle2,
  Award,
  ChevronLeft,
  LogOut,
  Crown,
  Lock,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { useRoom, roomBus, cleanRoomCode } from '../../../lib/roomBus';
import { sound } from '../../../lib/audio';
import {
  SCATTERGORIES_CATEGORIES,
  ARABIC_ALPHABET,
  ScattergoryCategoryId,
  PlayerRoundSubmission
} from './scattergoriesData';
import { GameTopBar } from '@/components/layout/GameTopBar';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { formatPoints, toArabicNumber } from '../../../utils/numberFormat';

interface ScattergoriesMobileViewProps {
  channel?: any;
  roomCode: string;
  playerId: string;
  playerName: string;
}

export const ScattergoriesMobileView: React.FC<ScattergoriesMobileViewProps> = ({
  channel,
  roomCode,
  playerId,
  playerName
}) => {
  const cleanCode = cleanRoomCode(roomCode);
  const navigate = useNavigate();
  const { room } = useRoom(cleanCode);

  // Round states
  const [currentRound, setCurrentRound] = useState(1);
  const [targetLetter, setTargetLetter] = useState<string>('');
  const [categories, setCategories] = useState<ScattergoryCategoryId[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Phase
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [stopperName, setStopperName] = useState<string>('');

  // Refs to avoid stale closures in event listeners
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const hasSubmittedRef = useRef(hasSubmitted);
  hasSubmittedRef.current = hasSubmitted;

  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  // Letter roulette animation state
  const [isRouletteActive, setIsRouletteActive] = useState(false);
  const [rouletteChar, setRouletteChar] = useState<string>('أ');

  // Admin Request System
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminRequestPending, setIsAdminRequestPending] = useState<boolean>(false);
  const [designatedAdminId, setDesignatedAdminId] = useState<string | null>(null);

  // Cumulative score
  const [myTotalScore, setMyTotalScore] = useState<number>(0);

  // Evaluation & Results state for Admin Correction Page
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  // Exit handler
  const handleExitGame = () => {
    if (window.confirm('هل تريد مغادرة الغرفة والعودة للصفحة الرئيسية؟')) {
      sound.playClick();
      sessionStorage.removeItem('taq_session_player_id');
      localStorage.removeItem('taq_room_code');
      try {
        sessionStorage.removeItem(`taghesi_player_${cleanCode}`);
        localStorage.removeItem(`taghesi_player_${cleanCode}`);
      } catch {}
      navigate('/');
    }
  };

  // Player Requests Admin Permission from TV
  const handleRequestAdmin = () => {
    if (designatedAdminId || isAdminRequestPending) return;
    sound.playClick();
    setIsAdminRequestPending(true);

    const payload = { playerId, playerName };
    roomBus.emit('ADMIN_REQUEST_SUBMITTED', cleanCode, payload);
    if (channel) {
      try {
        channel.send({ type: 'broadcast', event: 'ADMIN_REQUEST_SUBMITTED', payload });
      } catch {}
    }
  };

  // Admin Veto toggle from Correction Page
  const handleAdminToggleVeto = (category: string, targetPlayerId: string, currentApproved: boolean) => {
    sound.playClick();
    const nextApproved = !currentApproved;

    // Update locally
    setEvaluations(prev => prev.map(ans => {
      if (ans.category === category && ans.playerId === targetPlayerId) {
        return { ...ans, adminApproved: nextApproved };
      }
      return ans;
    }));

    const vetoPayload = { category, playerId: targetPlayerId, approved: nextApproved };
    roomBus.emit('SCATTERGORIES_ADMIN_VETO', cleanCode, vetoPayload);
    if (channel) {
      try {
        channel.send({ type: 'broadcast', event: 'SCATTERGORIES_ADMIN_VETO', payload: vetoPayload });
      } catch {}
    }
  };

  // Admin Advances Next Round
  const handleAdminAdvanceNext = () => {
    sound.playClick();
    roomBus.emit('ADMIN_ADVANCE_NEXT_ROUND', cleanCode, {});
    if (channel) {
      try {
        channel.send({ type: 'broadcast', event: 'ADMIN_ADVANCE_NEXT_ROUND', payload: {} });
      } catch {}
    }
  };

  // Submit my answers
  const handleSubmitAnswers = () => {
    if (hasSubmittedRef.current || isLockedRef.current) return;
    sound.playSuccess();
    setHasSubmitted(true);
    hasSubmittedRef.current = true;

    const sub: PlayerRoundSubmission = {
      playerId,
      playerName,
      submittedAt: Date.now(),
      answers: answersRef.current
    };

    roomBus.emit('SCATTERGORIES_SUBMIT', cleanCode, sub);
    if (channel) {
      try {
        channel.send({ type: 'broadcast', event: 'SCATTERGORIES_SUBMIT', payload: sub });
      } catch {}
    }
  };

  // Stop Round ("خلصت")
  const handleStopRound = () => {
    if (isLockedRef.current) return;
    sound.playBuzzerHit();
    setIsLocked(true);
    isLockedRef.current = true;
    handleSubmitAnswers();

    const stopPayload = { playerId, playerName };
    roomBus.emit('ROUND_STOPPED_BY_PLAYER', cleanCode, stopPayload);
    if (channel) {
      try {
        channel.send({ type: 'broadcast', event: 'ROUND_STOPPED_BY_PLAYER', payload: stopPayload });
      } catch {}
    }
  };

  // Listeners
  useEffect(() => {
    // 1. Admin Request Resolved
    const unsubAdminRes = roomBus.on('ADMIN_REQUEST_RESOLVED', (evt) => {
      const payload = (evt as any)?.data || (evt as any)?.payload || evt;
      if (!payload) return;

      if (payload.accepted) {
        setDesignatedAdminId(payload.adminId);
        if (payload.adminId === playerId) {
          setIsAdmin(true);
          setIsAdminRequestPending(false);
          sound.playSuccess();
        } else {
          setIsAdmin(false);
          setIsAdminRequestPending(false);
        }
      } else {
        if (payload.adminId === playerId) {
          setIsAdminRequestPending(false);
          sound.playTimerWarning();
          alert('تم رفض طلب الأدمن من قِبل الشاشة.');
        }
      }
    });

    // 2. Synchronized Letter Roulette
    const unsubRoulette = roomBus.on('LETTER_ROULETTE_STARTED', (evt) => {
      const payload = (evt as any)?.data || (evt as any)?.payload || evt;
      if (!payload || !payload.targetLetter) return;

      setIsRouletteActive(true);
      setIsRoundActive(false);
      setHasSubmitted(false);
      hasSubmittedRef.current = false;
      setIsLocked(false);
      isLockedRef.current = false;
      setIsEvaluating(false);
      setStopperName('');
      setEvaluations([]);
      setAnswers({});
      answersRef.current = {};
      setCurrentRound(payload.round || 1);
      setCategories(payload.categories || []);

      const rouletteTimer = setInterval(() => {
        const rand = ARABIC_ALPHABET[Math.floor(Math.random() * ARABIC_ALPHABET.length)];
        setRouletteChar(rand);
        sound.playTick();
      }, 70);

      setTimeout(() => {
        clearInterval(rouletteTimer);
        setRouletteChar(payload.targetLetter);
        setTargetLetter(payload.targetLetter);
        setIsRouletteActive(false);
        setIsRoundActive(true);
        sound.playRoundStart();
      }, payload.durationMs || 2500);
    });

    // 3. Round Started
    const unsubStart = roomBus.on('ROUND_STARTED', (evt) => {
      const payload = (evt as any)?.data || (evt as any)?.payload || evt;
      if (!payload || !payload.letter) return;

      if (!isRouletteActive) {
        sound.playRoundStart();
        setCurrentRound(payload.round || 1);
        setTargetLetter(payload.letter);
        setCategories(payload.categories || []);
        setAnswers({});
        answersRef.current = {};
        setHasSubmitted(false);
        hasSubmittedRef.current = false;
        setIsLocked(false);
        isLockedRef.current = false;
        setIsEvaluating(false);
        setIsRoundActive(true);
      }
    });

    // 4. Instant Round Stop when ANY player clicks "خلصت"
    const unsubStop = roomBus.on('ROUND_STOPPED_BY_PLAYER', (evt) => {
      const data = (evt as any)?.data || (evt as any)?.payload || evt;
      if (data) {
        sound.playBuzzerHit();
        setIsLocked(true);
        isLockedRef.current = true;
        setStopperName(data.playerName || 'أحد المتسابقين');

        if (!hasSubmittedRef.current) {
          setHasSubmitted(true);
          hasSubmittedRef.current = true;
          const autoSub: PlayerRoundSubmission = {
            playerId,
            playerName,
            submittedAt: Date.now(),
            answers: answersRef.current
          };
          roomBus.emit('SCATTERGORIES_SUBMIT', cleanCode, autoSub);
          if (channel) {
            try {
              channel.send({ type: 'broadcast', event: 'SCATTERGORIES_SUBMIT', payload: autoSub });
            } catch {}
          }
        }
      }
    });

    // 4b. Round Time Up broadcast from TV
    const unsubTimeUp = (roomBus.on as any)('ROUND_TIME_UP', () => {
      sound.playBuzzerHit();
      setIsLocked(true);
      isLockedRef.current = true;
      if (!hasSubmittedRef.current) {
        setHasSubmitted(true);
        hasSubmittedRef.current = true;
        const autoSub: PlayerRoundSubmission = {
          playerId,
          playerName,
          submittedAt: Date.now(),
          answers: answersRef.current
        };
        roomBus.emit('SCATTERGORIES_SUBMIT', cleanCode, autoSub);
        if (channel) {
          try {
            channel.send({ type: 'broadcast', event: 'SCATTERGORIES_SUBMIT', payload: autoSub });
          } catch {}
        }
      }
    });

    // 5. Evaluation Sync for Admin Correction Page
    const unsubEvalSync = (roomBus.on as any)('SCATTERGORIES_EVAL_SYNC', (evt: any) => {
      const data = (evt as any)?.data || (evt as any)?.payload || evt;
      if (data?.evaluations) {
        setIsEvaluating(true);
        setIsRoundActive(false);
        setEvaluations(data.evaluations);
      }
    });

    // 6. Results
    const unsubResults = roomBus.on('SCATTERGORIES_RESULTS', (evt) => {
      const data = (evt as any)?.data || (evt as any)?.payload || evt;
      if (data) {
        sound.playSuccess();
        setIsEvaluating(false);
        setIsRoundActive(false);
        const myPts = data.roundPoints?.[playerId] || 0;
        setMyTotalScore(prev => prev + myPts);
      }
    });

    // 7. Return to Lobby
    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', () => {
      setIsRoundActive(false);
      setIsEvaluating(false);
      setHasSubmitted(false);
      hasSubmittedRef.current = false;
      setIsLocked(false);
      isLockedRef.current = false;
      setAnswers({});
      answersRef.current = {};
    });

    return () => {
      unsubAdminRes();
      unsubRoulette();
      unsubStart();
      unsubStop();
      unsubTimeUp();
      unsubEvalSync();
      unsubResults();
      unsubLobby();
    };
  }, [playerId, cleanCode, isRouletteActive]);

  // RENDER 1: ROULETTE PHASE
  if (isRouletteActive) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-[#E5E0D5] p-6 select-none" dir="rtl">
        <div className="text-center space-y-6">
          <div className="bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] px-6 py-2 rounded-2xl font-black text-sm">
            سحب حرف الجولة...
          </div>
          <div className="w-36 h-36 bg-[#F7F4EC] border-4 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-3xl flex items-center justify-center mx-auto">
            <span className="text-7xl font-black text-[#2C2A29]">
              {rouletteChar}
            </span>
          </div>
          <p className="text-xs font-black text-[#5C4033]">
            استعد! ستفتح حقول الكلمات فور توقف الحرف...
          </p>
        </div>
      </div>
    );
  }

  // RENDER 2: ADMIN CORRECTION / GRADING DASHBOARD (صفحة التصحيح للأدمن)
  if (isEvaluating && isAdmin) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col bg-[#E5E0D5] select-none justify-between" dir="rtl">
        <GameTopBar
          roomCode={cleanCode}
          currentRound={currentRound}
          totalRounds={5}
          onExit={handleExitGame}
        />

        <div className="flex-1 flex flex-col p-3 min-h-0">
          {/* SubBar */}
          <div className="flex items-center justify-between bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl px-3 py-2 mb-3">
            <div className="flex items-center gap-1.5 bg-[#C68B59] text-white px-2.5 py-1 rounded-lg border border-[#2C2A29] text-xs font-black">
              <Crown className="w-3.5 h-3.5" />
              <span>لوحة تصحيح الأدمن • حرف: {targetLetter}</span>
            </div>

            <div className="bg-[#8A9A5B] text-white border-2 border-[#2C2A29] px-2.5 py-1 rounded-lg text-xs font-black">
              {formatPoints(myTotalScore)}
            </div>
          </div>

          {/* Correction List: Grouped by category */}
          <div className="flex-1 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-4 overflow-y-auto mb-3 space-y-4">
            <div className="text-center pb-2 border-b-2 border-[#2C2A29]">
              <h2 className="text-base font-black text-[#000000]">تحكيم إجابات المتسابقين</h2>
              <p className="text-xs font-bold text-[#5C4033]">انقر على الإجابة لتعديل حالتها بين مقبول ومرفوض</p>
            </div>

            {categories.map(catId => {
              const catObj = SCATTERGORIES_CATEGORIES.find(c => c.id === catId);
              const answersForCat = evaluations.filter(a => a.category === catId);

              return (
                <div key={catId} className="bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-xl p-3 shadow-[2px_2px_0px_#2C2A29]">
                  <h3 className="font-black text-sm text-[#000000] mb-2 flex items-center justify-between border-b border-[#2C2A29]/20 pb-1">
                    <span>{catObj?.label}</span>
                    <span className="text-xs text-[#5C4033] font-bold">{toArabicNumber(answersForCat.length)} إجابات</span>
                  </h3>

                  <div className="space-y-2">
                    {answersForCat.map((ans, idx) => {
                      const isApproved = ans.adminApproved;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 border-2 border-[#2C2A29] rounded-xl flex items-center justify-between ${
                            !isApproved ? 'bg-red-100 text-red-900 opacity-80' : 'bg-white text-[#2C2A29]'
                          }`}
                        >
                          <div>
                            <div className="text-[10px] text-[#5C4033] font-bold">{ans.playerName}</div>
                            <div className={`text-sm font-black ${!isApproved ? 'line-through' : ''}`}>
                              {ans.rawWord}
                            </div>
                          </div>

                          <button
                            onClick={() => handleAdminToggleVeto(catId, ans.playerId, isApproved)}
                            className={`px-3 py-1.5 rounded-lg border-2 border-[#2C2A29] text-xs font-black flex items-center gap-1 transition-all active:translate-y-0.5 ${
                              isApproved
                                ? 'bg-[#8A9A5B] text-white shadow-[2px_2px_0px_#2C2A29]'
                                : 'bg-[#E55353] text-white shadow-[2px_2px_0px_#2C2A29]'
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>مقبول (+١٠)</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5" />
                                <span>مرفوض (٠)</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin Action Button: Advance to Next Round */}
          <button
            onClick={handleAdminAdvanceNext}
            className="w-full py-4 bg-[#8A9A5B] hover:bg-[#2C2A29] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all active:translate-y-0.5"
          >
            <span>الانتقال للجولة التالية ◄</span>
          </button>
        </div>
      </div>
    );
  }

  // RENDER 3: EVALUATION WAITING FOR NON-ADMIN PLAYERS
  if (isEvaluating && !isAdmin) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col bg-[#E5E0D5] select-none justify-between" dir="rtl">
        <GameTopBar
          roomCode={cleanCode}
          currentRound={currentRound}
          totalRounds={5}
          onExit={handleExitGame}
        />

        <div className="flex-1 flex flex-col p-3 min-h-0">
          {/* SubBar */}
          <div className="flex items-center justify-between bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl px-3 py-2 mb-3">
            <div className="bg-[#2C2A29] text-white px-3 py-1 rounded-lg text-xs font-black">
              حرف: [ {targetLetter} ]
            </div>

            <div className="bg-[#8A9A5B] text-white border-2 border-[#2C2A29] px-2.5 py-1 rounded-lg text-xs font-black">
              {formatPoints(myTotalScore)}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl text-center">
            <Clock className="w-14 h-14 text-[#C68B59] mb-4" />
            <h2 className="text-xl font-black text-[#000000] mb-2">بانتظار تحكيم الإجابات...</h2>
            <p className="text-xs font-bold text-[#5C4033] mb-6">
              يقوم الأدمن بمراجعة الإجابات وتصحيحها الآن. ستظهر النتائج على الشاشة قريباً!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const myPlayerObj = room?.players?.find((p) => p.id === playerId);
  const isReadyNow = Boolean(myPlayerObj?.isReady ?? true);

  if (!isRoundActive) {
    const lobbyPlayers =
      room?.players && room.players.length > 0
        ? room.players.map((p) => ({
            id: p.id,
            name: p.name,
            isReady: Boolean(p.isReady ?? true),
          }))
        : [{ id: playerId, name: playerName, isReady: true }];

    return (
      <UnifiedShabahLobby
        roomCode={cleanCode}
        gameId="ai-arabic"
        gameTitle="AI عربي"
        players={lobbyPlayers}
        role="contestant"
        currentPlayerId={playerId}
        isReady={isReadyNow}
        onToggleReady={() => roomBus.togglePlayerReady(cleanCode, playerId)}
        onExit={handleExitGame}
        extraControls={
          <div className="flex items-center justify-center">
            {!designatedAdminId && !isAdmin ? (
              <button
                type="button"
                onClick={handleRequestAdmin}
                disabled={isAdminRequestPending}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>{isAdminRequestPending ? 'تم إرسال طلب الأدمن...' : 'طلب أدمن التصحيح'}</span>
              </button>
            ) : isAdmin ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-50 border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-emerald-600" />
                <span>أنت أدمن التصحيح في هذه الغرفة</span>
              </div>
            ) : null}
          </div>
        }
      />
    );
  }

  // RENDER 4: PLAYING PHASE & INPUT FORM
  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-[#E5E0D5] select-none justify-between" dir="rtl">
      <GameTopBar
        roomCode={cleanCode}
        currentRound={currentRound}
        totalRounds={5}
        onExit={handleExitGame}
      />

      <div className="flex-1 flex flex-col p-3 min-h-0 justify-between">
        {/* Status SubBar */}
        <div className="flex items-center justify-between bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl px-3 py-2 mb-3">
          <div className="bg-[#2C2A29] text-white border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-3 py-1 rounded-lg text-xs font-black">
            حرف: [ {targetLetter || '؟'} ]
          </div>

          <div className="bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-2.5 py-1 rounded-lg text-xs font-black">
            {formatPoints(myTotalScore)}
          </div>
        </div>

        {/* Main Content Area */}
        {(
          <div className="flex-1 flex flex-col justify-between mb-3 min-h-0">
            {/* Stopper Banner if another player tapped "خلصت" */}
            {stopperName && (
              <div className="bg-red-500 text-white border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] rounded-xl p-2.5 text-center text-xs font-black mb-3">
                أنهى المتسابق "{stopperName}" الجولة! تم قفل الإدخال.
              </div>
            )}

            {/* Categories Form Fields */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {categories.map(catId => {
                const catObj = SCATTERGORIES_CATEGORIES.find(c => c.id === catId);
                const val = answers[catId] || '';

                return (
                  <div key={catId} className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3">
                    <label className="block text-xs font-black text-[#2C2A29] mb-1">
                      {catObj?.label} (بحرف {targetLetter})
                    </label>
                    <input
                      type="text"
                      disabled={isLocked || hasSubmitted}
                      value={val}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [catId]: e.target.value }))}
                      placeholder={`اكتب ${catObj?.label} يبدأ بحرف ${targetLetter}...`}
                      className="w-full bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-lg px-3 py-2 text-sm font-black text-[#000000] focus:outline-none focus:border-[#8A9A5B] disabled:opacity-50"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Footer Button: "خلصت" Instant Lockout */}
        {isRoundActive && (
          <div className="pt-2 border-t-2 border-[#2C2A29]">
            <button
              onClick={handleStopRound}
              disabled={isLocked || hasSubmitted}
              className={`w-full py-4 rounded-xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] font-black text-base flex items-center justify-center gap-2 transition-all active:translate-y-0.5 ${
                isLocked || hasSubmitted
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-[#8A9A5B] hover:bg-[#2C2A29] text-white hover:-translate-y-0.5'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>{hasSubmitted ? 'تم تسليم إجاباتك' : 'خلصت! (إنهاء الجولة واعتماد الإجابات)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
