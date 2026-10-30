import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import {
  JudgeRoomState,
  JudgeVerdictResult,
  PlayerVerdict,
  ContestantExcuse,
  WorstExcuseRecord,
} from './types';
import {
  createInitialJudgeState,
  savePersistedJudgeState,
  getRankedJudgeContestants,
} from './judgeSync';
import { getNextUnplayedJudgeCase, JudgeCase } from '../../../data/judgePredicaments';
import { evaluateAllExcuses, evaluateBatchExcuses, PlayerExcuseSubmission } from '../../../services/judgeEngine';
import { JudgeTVCourtroom } from './components/JudgeTVCourtroom';
import { JudgeCourtWaitingScreen } from './components/JudgeCourtWaitingScreen';
import { JudgeFinalPodium } from './components/JudgeFinalPodium';
import { Gavel, Clock, Scale } from 'lucide-react';
import { toArabicNumber } from '../../../utils/numberFormat';

export const JudgeTVRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Realtime presence connection for Host TV
  const { connectedPlayers: realtimeContestants } = useRoomSync({
    roomCode,
    role: 'host',
  });

  const [judgeState, setJudgeState] = useState<JudgeRoomState>(() =>
    createInitialJudgeState(roomCode)
  );

  // Batch Excuse Collection Map & Evaluation Guard
  const [excusesMap, setExcusesMap] = useState<Record<string, { playerName: string; excuse: string }>>({});
  const excusesMapRef = useRef(excusesMap);
  const isJudgingRef = useRef<boolean>(false);

  useEffect(() => {
    excusesMapRef.current = excusesMap;
  }, [excusesMap]);

  const stateRef = useRef(judgeState);
  useEffect(() => {
    stateRef.current = judgeState;
    savePersistedJudgeState(roomCode, judgeState);
  }, [judgeState, roomCode]);

  // Merged connected contestants
  const mergedContestants =
    realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);

  // Synchronize state to mobile contestants
  const syncState = useCallback(
    (newState: JudgeRoomState) => {
      setJudgeState(newState);
      roomBus.broadcastJudgeSync(roomCode, newState);
    },
    [roomCode]
  );

  // -------------------------------------------------------------
  // Round Transitions
  // -------------------------------------------------------------

  const startRoundInput = useCallback(async () => {
    setExcusesMap({});
    excusesMapRef.current = {};
    isJudgingRef.current = false;

    const curr = stateRef.current;
    // Ensure case is from the unplayed 40 cases pool
    const activeCase =
      curr.currentPredicament && curr.currentPredicament.id?.startsWith('case_')
        ? curr.currentPredicament
        : getNextUnplayedJudgeCase([]);

    const nextState: JudgeRoomState = {
      ...curr,
      phase: 'case_briefing',
      roundNumber: 1,
      currentPredicament: activeCase,
      usedPredicamentIds: [activeCase.id],
      timerSeconds: 60,
      excuses: {},
      verdicts: {},
      verdictList: [],
      revealState: 'anonymous',
      readyPlayersNextRound: [],
    };
    syncState(nextState);

    await roomBus.broadcast('JUDGE_NEW_ROUND', {
      roomCode,
      currentCase: activeCase,
      roundNumber: 1,
      phase: 'case_briefing',
      timestamp: Date.now(),
    });
  }, [syncState, roomCode]);

  const handleStartDefenseTimer = useCallback(async () => {
    sound.playGavelStrike();
    const curr = stateRef.current;
    const nextState: JudgeRoomState = {
      ...curr,
      phase: 'defending',
      timerSeconds: 60,
    };
    syncState(nextState);
    await roomBus.broadcast('JUDGE_START_DEFENSE', {
      roomCode,
      duration: 60,
      timestamp: Date.now(),
    });
  }, [syncState, roomCode]);

  const executeJudging = useCallback(async () => {
    if (isJudgingRef.current) return;
    const curr = stateRef.current;
    if (curr.phase === 'JUDGING' || curr.phase === 'COURTROOM_VERDICT') return;

    isJudgingRef.current = true;
    sound.playTick();
    const judgingState: JudgeRoomState = {
      ...curr,
      phase: 'JUDGING',
    };
    syncState(judgingState);

    // Collect all contestants' excuses from excusesMapRef & curr.excuses
    const currentMap = { ...excusesMapRef.current };
    Object.values(curr.excuses || {}).forEach((e) => {
      if (!currentMap[e.playerId]) {
        currentMap[e.playerId] = {
          playerName: e.playerName,
          excuse: e.excuse,
        };
      }
    });

    const activeContestants = mergedContestants.filter((p) => p.id !== 'host_tv');

    // Fill in default for any connected player who failed to submit in time
    activeContestants.forEach((p) => {
      if (!currentMap[p.id] || !currentMap[p.id].excuse || !currentMap[p.id].excuse.trim()) {
        currentMap[p.id] = {
          playerName: p.name || 'متهم متخلف',
          excuse: 'التزم الصمت ولم يقدم أي دفاع',
        };
      }
    });

    const excuseArray: PlayerExcuseSubmission[] = Object.entries(currentMap).map(
      ([pId, val]) => ({
        playerId: pId,
        playerName: val.playerName,
        excuse: val.excuse || '',
      })
    );

    // Call Gemini 2.0 Flash batch evaluation
    const allVerdicts = await evaluateAllExcuses(
      curr.currentPredicament,
      excuseArray
    );

    const verdictsMap: Record<string, PlayerVerdict> = {};
    const updatedCumulative = { ...(curr.cumulativeScores || {}) };
    const updatedWorst = { ...(curr.worstExcuses || {}) };

    allVerdicts.forEach((v) => {
      verdictsMap[v.playerId] = v;
      updatedCumulative[v.playerId] =
        (updatedCumulative[v.playerId] || 0) + v.score;

      // Track worst excuses (guilty or low score)
      if (v.verdict === 'مذنب' || !updatedWorst[v.playerId]) {
        updatedWorst[v.playerId] = {
          playerId: v.playerId,
          playerName: v.playerName,
          excuse: v.excuse,
          predicamentTitle: curr.currentPredicament.title,
          judgeRoast: v.roast,
        };
      }
    });

    // Broadcast JUDGE_RESULTS_READY so all mobile contestants synchronize verdicts immediately
    await roomBus.broadcast('JUDGE_RESULTS_READY', {
      roomCode,
      verdicts: allVerdicts, // PlayerVerdict[]
      results: verdictsMap,
      timestamp: Date.now(),
    });
    sound.playGavelStrike();

    // Phase 1: Show anonymous excuses for 2.5 seconds, then reveal!
    const anonymousState: JudgeRoomState = {
      ...curr,
      phase: 'COURTROOM_VERDICT',
      verdicts: verdictsMap,
      verdictList: allVerdicts,
      revealState: 'anonymous',
      cumulativeScores: updatedCumulative,
      worstExcuses: updatedWorst,
      readyPlayersNextRound: [],
    };
    syncState(anonymousState);

    setTimeout(() => {
      const revealedState: JudgeRoomState = {
        ...stateRef.current,
        revealState: 'revealed',
      };
      syncState(revealedState);
      sound.playVictory();
    }, 2500);
  }, [syncState, roomCode, mergedContestants]);

  const handleNextRound = useCallback(async () => {
    setAutoAdvanceCountdown(null);
    setExcusesMap({});
    excusesMapRef.current = {};
    isJudgingRef.current = false;

    const curr = stateRef.current;

    if (curr.roundNumber >= curr.totalRounds) {
      // Advance to Final Podium
      const podiumState: JudgeRoomState = {
        ...curr,
        phase: 'PODIUM',
      };
      syncState(podiumState);
      sound.playVictory();
      return;
    }

    // Pick new unplayed judge case from 40-case pool with memory
    const nextCase = getNextUnplayedJudgeCase(curr.usedPredicamentIds || []);
    const nextRoundNumber = curr.roundNumber + 1;

    const nextRoundState: JudgeRoomState = {
      ...curr,
      phase: 'case_briefing',
      roundNumber: nextRoundNumber,
      currentPredicament: nextCase,
      usedPredicamentIds: [...(curr.usedPredicamentIds || []), nextCase.id],
      timerSeconds: 60,
      excuses: {},
      verdicts: {},
      verdictList: [],
      revealState: 'anonymous',
      readyPlayersNextRound: [],
    };
    syncState(nextRoundState);

    await roomBus.broadcast('JUDGE_NEW_ROUND', {
      roomCode,
      currentCase: nextCase,
      roundNumber: nextRoundNumber,
      phase: 'case_briefing',
      timestamp: Date.now(),
    });
  }, [syncState, roomCode]);

  const handleEndGame = useCallback(async () => {
    try {
      await roomBus.terminateRoom(roomCode, 'تم إنهاء الغرفة بواسطة المضيف');
    } catch (err) {
      console.warn('[JudgeTVRoot] terminateRoom error:', err);
    }
    sessionStorage.clear();
    localStorage.removeItem('current_room_code');
    window.location.href = '/';
  }, [roomCode]);

  const handleReturnToLobby = useCallback(() => {
    const nextState: JudgeRoomState = {
      ...createInitialJudgeState(roomCode),
      phase: 'LOBBY',
    };
    roomBus.broadcastReturnToLobby(roomCode);
    syncState(nextState);
  }, [roomCode, syncState]);

  // -------------------------------------------------------------
  // Countdown Timer for defending Phase (active only during defense)
  // -------------------------------------------------------------
  useEffect(() => {
    if (judgeState.phase !== 'defending' && judgeState.phase !== 'EXCUSE_INPUT') return;

    const interval = setInterval(() => {
      setJudgeState((prev) => {
        if (prev.phase !== 'defending' && prev.phase !== 'EXCUSE_INPUT') return prev;
        const nextSec = prev.timerSeconds - 1;

        if (nextSec <= 0) {
          clearInterval(interval);
          if (!isJudgingRef.current) {
            // Broadcast JUDGE_TIME_UP immediately to trigger auto-submitting drafts on contestants' phones
            roomBus.broadcast('JUDGE_TIME_UP', {
              roomCode,
              timestamp: Date.now(),
            });

            // 1-second grace period for auto-submitted network packets to arrive before Gemini batch request
            setTimeout(() => {
              executeJudging();
            }, 1000);
          }
          return { ...prev, timerSeconds: 0 };
        }

        if (nextSec <= 5) {
          sound.playTick();
        }

        const updated = { ...prev, timerSeconds: nextSec };
        roomBus.broadcastJudgeSync(roomCode, updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [judgeState.phase, executeJudging, roomCode]);

  // -------------------------------------------------------------
  // Realtime Broadcast Listeners
  // -------------------------------------------------------------
  useEffect(() => {
    // Handler for incoming excuses (SUBMIT_EXCUSE & JUDGE_SUBMIT_EXCUSE)
    const handleIncomingExcuse = (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload || !payload.playerId) return;

      const curr = stateRef.current;
      if (curr.phase !== 'defending' && curr.phase !== 'EXCUSE_INPUT') return;

      const playerId = payload.playerId;
      const playerName = payload.playerName || 'متهم';
      const excuse = (payload.excuse || '').trim();

      setExcusesMap((prev) => {
        const next = {
          ...prev,
          [playerId]: { playerName, excuse },
        };
        excusesMapRef.current = next;

        // Trigger condition: All connected contestants submitted
        const connectedPlayers = mergedContestants.filter((p) => p.id !== 'host_tv');
        const targetCount = Math.max(1, connectedPlayers.length);
        const submittedCount = Object.keys(next).length;

        if (submittedCount >= targetCount && !isJudgingRef.current) {
          // Delay briefly to allow any final state to settle, then execute batch
          setTimeout(() => {
            executeJudging();
          }, 80);
        }

        return next;
      });

      // Also keep judgeState.excuses synchronized for live UI indicators
      setJudgeState((prev) => ({
        ...prev,
        excuses: {
          ...prev.excuses,
          [playerId]: {
            playerId,
            playerName,
            excuse,
            submittedAt: Date.now(),
          },
        },
      }));
    };

    const unsubJudgeExcuse = roomBus.on('JUDGE_SUBMIT_EXCUSE', handleIncomingExcuse);
    const unsubSubmitExcuse = roomBus.on('SUBMIT_EXCUSE', handleIncomingExcuse);

    // 2. Inter-round Ready update
    const unsubReady = roomBus.on('PLAYER_READY_UPDATE', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode !== roomCode || !payload) return;

      const curr = stateRef.current;
      if (curr.phase !== 'COURTROOM_VERDICT') return;

      const currentReady = new Set(curr.readyPlayersNextRound || []);
      if (payload.isReady) {
        currentReady.add(payload.playerId);
      } else {
        currentReady.delete(payload.playerId);
      }

      const nextReadyList = Array.from(currentReady);
      const updatedState: JudgeRoomState = {
        ...curr,
        readyPlayersNextRound: nextReadyList,
      };

      syncState(updatedState);
    });

    return () => {
      unsubJudgeExcuse?.();
      unsubSubmitExcuse?.();
      unsubReady?.();
    };
  }, [roomCode, mergedContestants, syncState, executeJudging]);

  // -------------------------------------------------------------
  // Dynamic Watcher: Early evaluation if an active player leaves and all remaining have submitted
  // -------------------------------------------------------------
  useEffect(() => {
    if (
      (judgeState.phase !== 'defending' && judgeState.phase !== 'EXCUSE_INPUT') ||
      isJudgingRef.current
    )
      return;
    const connectedPlayers = mergedContestants.filter((p) => p.id !== 'host_tv');
    if (connectedPlayers.length === 0) return;

    const submittedKeys = Object.keys(excusesMapRef.current);
    const allSubmitted = connectedPlayers.every((c) => submittedKeys.includes(c.id));

    if (allSubmitted && submittedKeys.length > 0) {
      setTimeout(() => {
        executeJudging();
      }, 80);
    }
  }, [mergedContestants, judgeState.phase, executeJudging]);

  // -------------------------------------------------------------
  // 3-Second Auto-Advance Countdown when readyCount >= 2
  // -------------------------------------------------------------
  useEffect(() => {
    if (judgeState.phase !== 'COURTROOM_VERDICT') {
      setAutoAdvanceCountdown(null);
      return;
    }

    const readyCount = (judgeState.readyPlayersNextRound || []).length;
    const requiredReady = Math.min(2, Math.max(1, mergedContestants.length));

    if (readyCount >= requiredReady) {
      if (autoAdvanceCountdown === null) {
        setAutoAdvanceCountdown(3);
      }
    } else {
      setAutoAdvanceCountdown(null);
    }
  }, [judgeState.phase, judgeState.readyPlayersNextRound, mergedContestants.length, autoAdvanceCountdown]);

  useEffect(() => {
    if (autoAdvanceCountdown === null) return;

    if (autoAdvanceCountdown <= 0) {
      handleNextRound();
      return;
    }

    sound.playTick();
    const timer = setTimeout(() => {
      setAutoAdvanceCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoAdvanceCountdown, handleNextRound]);

  // -------------------------------------------------------------
  // View Rendering
  // -------------------------------------------------------------

  // 1. Lobby View
  if (judgeState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-judge"
        gameTitle="الشبح القاضي"
        role="host"
        onStartGame={startRoundInput}
      />
    );
  }

  // 2. Judging Analysis Phase (Dedicated Waiting Screen)
  if (judgeState.phase === 'JUDGING') {
    return (
      <div dir="rtl" className="w-full h-screen max-h-screen bg-black text-white flex flex-col justify-between p-6 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-sans text-xs">الغرفة:</span>
            <span className="font-sans font-bold text-white tracking-widest">{roomCode}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturnToLobby}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              العودة للوبي
            </button>
            <button
              onClick={handleEndGame}
              className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-200 font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              إنهاء اللعبة
            </button>
          </div>
        </div>

        {/* Shifting Eyes Waiting Screen */}
        <div className="flex-1 flex items-center justify-center">
          <JudgeCourtWaitingScreen isTV={true} />
        </div>
      </div>
    );
  }

  // 3. Case Briefing & Defense Input Phase (TV Screen View)
  if (
    judgeState.phase === 'case_briefing' ||
    judgeState.phase === 'defending' ||
    judgeState.phase === 'EXCUSE_INPUT'
  ) {
    const isBriefing = judgeState.phase === 'case_briefing';
    const submittedCount = Object.keys(judgeState.excuses || {}).length;
    const totalCount = Math.max(1, mergedContestants.length);

    return (
      <div
        dir="rtl"
        className="w-full h-screen max-h-screen bg-black text-white p-8 flex flex-col items-center justify-between select-none"
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-1 rounded-2xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_20px_rgba(181,107,255,0.3)]">
              <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center">
                <Gavel className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 font-sans font-bold text-xs flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>{judgeState.currentPredicament.contextTag}</span>
                </span>
                <span className="text-xs font-sans text-zinc-400">
                  الجلسة {toArabicNumber(judgeState.roundNumber)} من {toArabicNumber(judgeState.totalRounds)}
                </span>
              </div>
              <h1 className="text-2xl font-sans font-black text-white">
                {judgeState.currentPredicament.title}
              </h1>
            </div>
          </div>

          {/* Countdown Timer & Navigation Actions */}
          <div className="flex items-center gap-3">
            {isBriefing ? (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 border border-amber-500/60 text-amber-400 font-sans font-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>قراءة القضية (العداد متوقف)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-purple-400 font-sans font-extrabold text-2xl shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <Clock className="w-6 h-6 animate-pulse" />
                <span>{toArabicNumber(judgeState.timerSeconds)} ثانية</span>
              </div>
            )}

            <button
              onClick={handleReturnToLobby}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              العودة للوبي
            </button>

            <button
              onClick={handleEndGame}
              className="px-3.5 py-2.5 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-200 font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              إنهاء اللعبة
            </button>
          </div>
        </div>

        {/* Center: The Predicament Showcase Card with Key Evidence & Start Button */}
        <div className="w-full max-w-4xl my-auto text-center space-y-4">
          <div className="p-8 rounded-3xl bg-zinc-950 border-2 border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <div className="text-xs font-sans font-bold text-purple-400 mb-2">
              لائحة الاتهام ووقائع القضية:
            </div>
            <p className="font-sans font-black text-2xl sm:text-3xl text-zinc-100 leading-relaxed mb-6">
              "{judgeState.currentPredicament.description}"
            </p>

            {judgeState.currentPredicament.keyEvidence && (
              <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-red-950/40 border border-red-800/80 text-right">
                <div className="text-xs font-sans font-bold text-red-400 mb-1">
                  الدليل القاطع الذي يجب على المتهم تفنيده:
                </div>
                <div className="font-sans text-sm font-bold text-red-200 leading-relaxed">
                  {judgeState.currentPredicament.keyEvidence}
                </div>
              </div>
            )}

            {isBriefing ? (
              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  onClick={handleStartDefenseTimer}
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-sans font-black text-2xl rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  بدء الجلسة وكتابة الأعذار ⏳
                </button>
                <span className="text-xs font-sans text-zinc-400">
                  المتسابقون يقرؤون القضية الآن في جوالاتهم.. اضغط الزر لبدء العداد (60 ثانية)
                </span>
              </div>
            ) : (
              <div className="inline-block mt-4 px-4 py-2 rounded-xl bg-black border border-zinc-800 text-xs font-sans text-zinc-400">
                فككوا الدليل الآن واكتبوا أعذاركم في الجوال قبل انتهاء الوقت...
              </div>
            )}
          </div>
        </div>

        {/* Bottom Submission Progress Bar */}
        <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          {isBriefing ? (
            <div className="w-full text-center font-sans text-xs font-bold text-zinc-400">
              جلسة الاستماع مغلقة مؤقتاً لقراءة القضية وتأمل الأدلة
            </div>
          ) : (
            <>
              <div className="font-sans text-sm text-zinc-300">
                أعذار معتمدة للمحكمة:{' '}
                <strong className="text-purple-400 font-black text-base">
                  {toArabicNumber(submittedCount)} من {toArabicNumber(totalCount)}
                </strong>
              </div>

              <button
                onClick={executeJudging}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                إغلاق المرافعات والنطق بالحكم فوراً
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 4. Courtroom Verdict Reveal Phase (Zero-Scroll TV Courtroom)
  if (judgeState.phase === 'COURTROOM_VERDICT') {
    return (
      <JudgeTVCourtroom
        state={judgeState}
        onNextRound={handleNextRound}
        readyPlayersCount={judgeState.readyPlayersNextRound?.length || 0}
        totalConnectedCount={Math.max(1, mergedContestants.length)}
        isAutoAdvancingCountdown={autoAdvanceCountdown}
        onReturnToLobby={handleReturnToLobby}
        onEndGame={handleEndGame}
      />
    );
  }

  // 5. Final Podium Phase
  const ranked = getRankedJudgeContestants(judgeState.cumulativeScores, mergedContestants);
  return (
    <JudgeFinalPodium
      rankedContestants={ranked}
      worstExcuses={judgeState.worstExcuses || {}}
      isTV={true}
      onReturnToLobby={handleReturnToLobby}
    />
  );
};

export default JudgeTVRoot;
