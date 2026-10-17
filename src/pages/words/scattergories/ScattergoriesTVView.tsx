import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Crown,
  CheckCircle2,
  Check,
  X,
  Clock,
  LogOut,
  ChevronLeft,
  Shuffle,
  ShieldAlert,
  Flame,
  Award
} from 'lucide-react';
import { useRoom, roomBus, cleanRoomCode } from '../../../lib/roomBus';
import { sound } from '../../../lib/audio';
import { GeographyGameLobby } from '../../../components/common/GeographyGameLobby';
import { FullscreenButton } from '../../../components/common/FullscreenButton';
import { GeoTopNavControls } from '../../../components/common/GeoTopNavControls';
import { formatPoints, toArabicNumber } from '../../../utils/numberFormat';
import {
  SCATTERGORIES_CATEGORIES,
  ARABIC_ALPHABET,
  ScattergoryCategoryId,
  doesWordStartWithLetter,
  cleanArabicWord,
  PlayerRoundSubmission
} from './scattergoriesData';

type ScattergoriesPhase = 'CONFIG' | 'ROULETTE' | 'PLAYING' | 'EVALUATION' | 'ROUND_SUMMARY' | 'GAME_OVER';

interface EvaluatedAnswer {
  playerId: string;
  playerName: string;
  category: ScattergoryCategoryId;
  rawWord: string;
  status: 'EMPTY' | 'WRONG_LETTER' | 'DUPLICATE' | 'UNIQUE';
  adminApproved: boolean; // false = vetoed to 0
  computedPoints: number;
}

export const ScattergoriesTVView: React.FC = () => {
  const params = useParams();
  const rawCode = (params.code || params.roomId || params.id || '').trim().toUpperCase() || 'TAQ1';
  const roomId = cleanRoomCode(rawCode);
  const navigate = useNavigate();

  const { room } = useRoom(roomId);
  const activeRoom = room || roomBus.getRoom(roomId) || roomBus.createRoom(roomId);

  // Players list
  const players = useMemo(() => {
    return (activeRoom.players || []).filter(p => p && p.id && p.id !== 'host_tv');
  }, [activeRoom.players]);

  // Game state
  const [phase, setPhase] = useState<ScattergoriesPhase>('CONFIG');
  const [currentRound, setCurrentRound] = useState(1);
  
  // Category constraint: strictly 4 to 5 categories
  const [selectedCategories, setSelectedCategories] = useState<ScattergoryCategoryId[]>([
    'girl_name',
    'boy_name',
    'jamad',
    'nabat',
    'bilad'
  ]);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [targetLetter, setTargetLetter] = useState<string>('');

  // Letter roulette animation state
  const [rouletteLetter, setRouletteLetter] = useState<string>('أ');
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [firstFinisherName, setFirstFinisherName] = useState<string>('');

  // Submissions: playerId -> submission
  const [submissions, setSubmissions] = useState<Record<string, PlayerRoundSubmission>>({});
  const submissionsRef = useRef<Record<string, PlayerRoundSubmission>>({});
  submissionsRef.current = submissions;
  const phaseRef = useRef<ScattergoriesPhase>(phase);
  phaseRef.current = phase;

  // Cumulative scores: playerId -> number
  const [cumulativeScores, setCumulativeScores] = useState<Record<string, number>>({});

  // Evaluated answers for the current round
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<EvaluatedAnswer[]>([]);

  // Admin Request System: Confirmation Modal on TV
  const [pendingAdminRequest, setPendingAdminRequest] = useState<{ playerId: string; playerName: string } | null>(null);
  const [designatedAdminId, setDesignatedAdminId] = useState<string | null>(null);
  const [phoneAdmins, setPhoneAdmins] = useState<Set<string>>(new Set());

  // Category toggle in config (STRICT: 4 to 5 categories)
  const handleToggleCategory = (catId: ScattergoryCategoryId) => {
    sound.playClick();
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        if (prev.length <= 4) {
          alert('يجب اختيار ٤ فئات كحد أدنى للجولة!');
          return prev;
        }
        return prev.filter(id => id !== catId);
      } else {
        if (prev.length >= 5) {
          alert('الحد الأقصى هو ٥ فئات فقط في الجولة!');
          return prev;
        }
        return [...prev, catId];
      }
    });
  };

  const pickRandomUnusedLetter = (): string => {
    const available = ARABIC_ALPHABET.filter(l => !usedLetters.includes(l));
    const pool = available.length > 0 ? available : ARABIC_ALPHABET;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // Kick player
  const handleKickPlayer = useCallback((playerId: string, playerName: string) => {
    if (window.confirm(`هل أنت متأكد من طرد اللاعب "${playerName}"؟`)) {
      sound.playClick();
      roomBus.kickPlayer(roomId, playerId);
    }
  }, [roomId]);

  // Unified TopBar: Global Ejection in Lobby
  const handleTerminateGame = useCallback(() => {
    if (window.confirm('هل أنت متأكد من إنهاء اللعبة بالكامل وإعادة جميع المتسابقين للصفحة الرئيسية؟')) {
      sound.playClick();
      roomBus.emit('GAME_TERMINATED', roomId, {});
      const ch = (roomBus as any).getChannel?.(roomId);
      if (ch) {
        try {
          ch.send({ type: 'broadcast', event: 'GAME_TERMINATED', payload: {} });
        } catch {}
      }
      navigate('/');
    }
  }, [roomId, navigate]);

  // Unified TopBar: Return to Lobby in Active Game
  const handleReturnToLobby = useCallback(() => {
    sound.playClick();
    setPhase('CONFIG');
    setTimeLeft(60);
    setSubmissions({});
    submissionsRef.current = {};
    roomBus.emit('RETURN_TO_LOBBY', roomId, {});
    const ch = (roomBus as any).getChannel?.(roomId);
    if (ch) {
      try {
        ch.send({ type: 'broadcast', event: 'RETURN_TO_LOBBY', payload: {} });
      } catch {}
    }
  }, [roomId]);

  // Admin Request Handlers
  const handleAcceptAdmin = (pId: string, pName: string) => {
    sound.playSuccess();
    setDesignatedAdminId(pId);
    setPhoneAdmins(new Set([pId]));
    setPendingAdminRequest(null);

    const payload = { adminId: pId, adminName: pName, accepted: true };
    roomBus.emit('ADMIN_REQUEST_RESOLVED', roomId, payload);
    const ch = (roomBus as any).getChannel?.(roomId);
    if (ch) {
      try {
        ch.send({ type: 'broadcast', event: 'ADMIN_REQUEST_RESOLVED', payload });
      } catch {}
    }
  };

  const handleRejectAdmin = (pId: string) => {
    sound.playClick();
    setPendingAdminRequest(null);

    const payload = { adminId: pId, accepted: false };
    roomBus.emit('ADMIN_REQUEST_RESOLVED', roomId, payload);
    const ch = (roomBus as any).getChannel?.(roomId);
    if (ch) {
      try {
        ch.send({ type: 'broadcast', event: 'ADMIN_REQUEST_RESOLVED', payload });
      } catch {}
    }
  };

  // Start round with 2.5s Random Letter Roulette (NO manual letter selection)
  const handleStartRound = () => {
    if (selectedCategories.length < 4 || selectedCategories.length > 5) {
      alert('يرجى اختيار ما بين ٤ إلى ٥ فئات للبدء!');
      return;
    }

    // System automatically draws random letter
    const pickedLetter = pickRandomUnusedLetter();
    setTargetLetter(pickedLetter);
    setUsedLetters(prev => (prev.includes(pickedLetter) ? prev : [...prev, pickedLetter]));
    setSubmissions({});
    submissionsRef.current = {};
    setTimeLeft(60);
    setFirstFinisherName('');

    // Enter Roulette Phase
    setPhase('ROULETTE');

    const roulettePayload = {
      targetLetter: pickedLetter,
      durationMs: 2500,
      categories: selectedCategories,
      round: currentRound
    };
    roomBus.emit('LETTER_ROULETTE_STARTED', roomId, roulettePayload);
    const ch = (roomBus as any).getChannel?.(roomId);
    if (ch) {
      try {
        ch.send({ type: 'broadcast', event: 'LETTER_ROULETTE_STARTED', payload: roulettePayload });
      } catch (e) {
        console.warn('[Broadcast Roulette Error]:', e);
      }
    }

    // TV fast-shuffling animation for 2.5 seconds
    const intervalTime = 70;
    const rouletteTimer = setInterval(() => {
      const randLetter = ARABIC_ALPHABET[Math.floor(Math.random() * ARABIC_ALPHABET.length)];
      setRouletteLetter(randLetter);
      sound.playTick();
    }, intervalTime);

    setTimeout(() => {
      clearInterval(rouletteTimer);
      setRouletteLetter(pickedLetter);
      sound.playRoundStart();

      setPhase('PLAYING');

      const roundPayload = {
        round: currentRound,
        letter: pickedLetter,
        categories: selectedCategories,
        durationSeconds: 60
      };
      roomBus.emit('ROUND_STARTED', roomId, roundPayload);
      if (ch) {
        try {
          ch.send({ type: 'broadcast', event: 'ROUND_STARTED', payload: roundPayload });
        } catch {}
      }
    }, 2500);
  };

  // Timer countdown in PLAYING phase
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        if (prev === 11) {
          sound.playTimerWarning();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Handle Time Up
  const handleTimeUp = () => {
    sound.playBuzzerHit();
    const ch = (roomBus as any).getChannel?.(roomId);
    if (ch) {
      try {
        ch.send({ type: 'broadcast', event: 'ROUND_TIME_UP', payload: {} });
      } catch {}
    }
    roomBus.emit('ROUND_TIME_UP', roomId, {});
    setTimeout(() => {
      evaluateRoundSubmissions();
    }, 400);
  };

  // Listen to ADMIN_REQUEST_SUBMITTED, SCATTERGORIES_SUBMIT, ROUND_STOPPED_BY_PLAYER, SCATTERGORIES_ADMIN_VETO, ADMIN_ADVANCE_NEXT_ROUND
  useEffect(() => {
    // 1. Admin Request Submitted from Mobile
    const unsubAdminReq = roomBus.on('ADMIN_REQUEST_SUBMITTED', (evt) => {
      const payload = (evt as any)?.data || (evt as any)?.payload || evt;
      if (!payload || !payload.playerId) return;

      if (!designatedAdminId) {
        sound.playTimerWarning();
        setPendingAdminRequest({ playerId: payload.playerId, playerName: payload.playerName || 'متسابق' });
      }
    });

    // 2. Submissions
    const unsubSubmit = roomBus.on('SCATTERGORIES_SUBMIT', (evt) => {
      const payload: PlayerRoundSubmission = (evt as any)?.data || (evt as any)?.payload || evt;
      if (!payload || !payload.playerId) return;

      sound.playClick();
      submissionsRef.current = {
        ...submissionsRef.current,
        [payload.playerId]: payload
      };
      setSubmissions(submissionsRef.current);
      try {
        sessionStorage.setItem(`scattergories_subs_${roomId}_round_${currentRound}`, JSON.stringify(submissionsRef.current));
      } catch {}

      // If already in evaluation phase, re-evaluate immediately so answers appear in review
      if (phaseRef.current === 'EVALUATION') {
        evaluateRoundSubmissions();
      }
    });

    // 3. Instant Round Stop when ANY player clicks "خلصت"
    const unsubPlayerStop = roomBus.on('ROUND_STOPPED_BY_PLAYER', (evt) => {
      const data = (evt as any)?.data || (evt as any)?.payload || evt;
      if (data?.playerName && phase === 'PLAYING') {
        sound.playBuzzerHit();
        setFirstFinisherName(data.playerName);
        evaluateRoundSubmissions();
      }
    });

    // 4. Remote Admin Veto from Mobile
    const unsubVeto = roomBus.on('SCATTERGORIES_ADMIN_VETO', (evt) => {
      const payload = (evt as any)?.data || (evt as any)?.payload || evt;
      if (!payload || !payload.category || !payload.playerId) return;

      sound.playClick();
      setEvaluatedAnswers(prev => {
        const next = prev.map(ans => {
          if (ans.category === payload.category && ans.playerId === payload.playerId) {
            const nextApproved = payload.approved !== undefined ? Boolean(payload.approved) : !ans.adminApproved;
            return {
              ...ans,
              adminApproved: nextApproved,
              computedPoints: nextApproved ? (ans.status === 'UNIQUE' ? 10 : ans.status === 'DUPLICATE' ? 5 : 0) : 0
            };
          }
          return ans;
        });

        // Broadcast updated sync to admin phone
        const ch = (roomBus as any).getChannel?.(roomId);
        if (ch) {
          try {
            ch.send({
              type: 'broadcast',
              event: 'SCATTERGORIES_EVAL_SYNC',
              payload: { evaluations: next, categories: selectedCategories, targetLetter }
            });
          } catch {}
        }

        return next;
      });
    });

    // 5. Remote Admin Advance Next Round from Mobile
    const unsubAdvance = roomBus.on('ADMIN_ADVANCE_NEXT_ROUND', () => {
      sound.playSuccess();
      handleConfirmEvaluation();
    });

    return () => {
      unsubAdminReq();
      unsubSubmit();
      unsubPlayerStop();
      unsubVeto();
      unsubAdvance();
    };
  }, [phase, designatedAdminId, roomId, selectedCategories, targetLetter, currentRound]);

  // Evaluate Round Submissions
  const evaluateRoundSubmissions = () => {
    let rawSubs = submissionsRef.current;
    if (Object.keys(rawSubs).length === 0) {
      try {
        const stored = sessionStorage.getItem(`scattergories_subs_${roomId}_round_${currentRound}`);
        if (stored) {
          rawSubs = JSON.parse(stored);
          submissionsRef.current = rawSubs;
          setSubmissions(rawSubs);
        }
      } catch {}
    }
    const evals: EvaluatedAnswer[] = [];

    selectedCategories.forEach(cat => {
      const wordToPlayers: Record<string, string[]> = {};

      players.forEach(p => {
        const sub = rawSubs[p.id];
        const rawWord = sub?.answers?.[cat] || '';
        const cleaned = cleanArabicWord(rawWord);

        if (!cleaned) {
          evals.push({
            playerId: p.id,
            playerName: p.name,
            category: cat,
            rawWord: '—',
            status: 'EMPTY',
            adminApproved: false,
            computedPoints: 0
          });
          return;
        }

        if (!doesWordStartWithLetter(cleaned, targetLetter)) {
          evals.push({
            playerId: p.id,
            playerName: p.name,
            category: cat,
            rawWord,
            status: 'WRONG_LETTER',
            adminApproved: false,
            computedPoints: 0
          });
          return;
        }

        if (!wordToPlayers[cleaned]) wordToPlayers[cleaned] = [];
        wordToPlayers[cleaned].push(p.id);
      });

      Object.entries(wordToPlayers).forEach(([word, pIds]) => {
        const isDuplicate = pIds.length > 1;
        pIds.forEach(pId => {
          const playerObj = players.find(pl => pl.id === pId);
          const rawWord = rawSubs[pId]?.answers?.[cat] || word;

          evals.push({
            playerId: pId,
            playerName: playerObj?.name || 'متسابق',
            category: cat,
            rawWord,
            status: isDuplicate ? 'DUPLICATE' : 'UNIQUE',
            adminApproved: true,
            computedPoints: isDuplicate ? 5 : 10
          });
        });
      });
    });

    setEvaluatedAnswers(evals);
    setPhase('EVALUATION');

    // Broadcast sync to admin phone
    const ch = (roomBus as any).getChannel?.(roomId);
    if (ch) {
      try {
        ch.send({
          type: 'broadcast',
          event: 'SCATTERGORIES_EVAL_SYNC',
          payload: { evaluations: evals, categories: selectedCategories, targetLetter }
        });
      } catch {}
    }
  };

  // Toggle Admin Approval on TV
  const handleToggleAdminApproval = (category: ScattergoryCategoryId, playerId: string) => {
    sound.playClick();
    setEvaluatedAnswers(prev => {
      const next = prev.map(ans => {
        if (ans.category === category && ans.playerId === playerId) {
          const nextApproved = !ans.adminApproved;
          return {
            ...ans,
            adminApproved: nextApproved,
            computedPoints: nextApproved ? (ans.status === 'UNIQUE' ? 10 : ans.status === 'DUPLICATE' ? 5 : 0) : 0
          };
        }
        return ans;
      });

      // Broadcast sync to admin phone
      const ch = (roomBus as any).getChannel?.(roomId);
      if (ch) {
        try {
          ch.send({
            type: 'broadcast',
            event: 'SCATTERGORIES_EVAL_SYNC',
            payload: { evaluations: next, categories: selectedCategories, targetLetter }
          });
        } catch {}
      }

      return next;
    });
  };

  // Confirm Evaluation & Add Scores
  const handleConfirmEvaluation = () => {
    sound.playSuccess();
    const roundPts: Record<string, number> = {};

    evaluatedAnswers.forEach(ans => {
      roundPts[ans.playerId] = (roundPts[ans.playerId] || 0) + (ans.adminApproved ? ans.computedPoints : 0);
    });

    setCumulativeScores(prev => {
      const updated = { ...prev };
      Object.entries(roundPts).forEach(([pId, pts]) => {
        updated[pId] = (updated[pId] || 0) + pts;
      });
      return updated;
    });

    const resultsPayload = {
      round: currentRound,
      roundPoints: roundPts,
      evaluatedAnswers
    };
    roomBus.emit('SCATTERGORIES_RESULTS', roomId, resultsPayload);
    const ch = (roomBus as any).getChannel?.(roomId);
    if (ch) {
      try {
        ch.send({ type: 'broadcast', event: 'SCATTERGORIES_RESULTS', payload: resultsPayload });
      } catch {}
    }

    setPhase('ROUND_SUMMARY');
  };

  // Next round
  const handleNextRound = () => {
    sound.playClick();
    if (currentRound >= 5) {
      setPhase('GAME_OVER');
    } else {
      setCurrentRound(prev => prev + 1);
      setPhase('CONFIG');
    }
  };

  // Category count validity
  const isCategoryCountValid = selectedCategories.length >= 4 && selectedCategories.length <= 5;

  // Sorted players for leaderboard
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const scoreA = cumulativeScores[a.id] || 0;
      const scoreB = cumulativeScores[b.id] || 0;
      return scoreB - scoreA;
    });
  }, [players, cumulativeScores]);

  // 1. CONFIG PHASE
  if (phase === 'CONFIG') {
    return (
      <div className="w-full h-[100dvh] flex flex-col bg-[#E5E0D5] select-none p-4 md:p-6 overflow-hidden" dir="rtl">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#2C2A29] mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8A9A5B] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#000000]">إعداد الجولة {currentRound} • اسم جماد نبات</h1>
              <p className="text-xs text-[#5C4033] font-bold">حدد من 4 إلى 5 فئات للبدء (يتم سحب الحرف عشوائياً عند الانطلاق)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <GeoTopNavControls
              roomCode={roomId}
              exitActionType="end_game"
              exitLabel="إنهاء اللعبة"
              onExit={handleTerminateGame}
              showRoomCode={true}
            />
            <FullscreenButton />
          </div>
        </div>

        {/* Main Grid: Categories on Left, Rules & Players on Right (NO LETTER SELECTION) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 mb-4">
          {/* Section 1: Categories Selection (STRICT: 4 to 5) */}
          <div className="lg:col-span-7 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-5 flex flex-col justify-between min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 border-b-2 border-[#2C2A29] pb-3">
                <span className={`text-xs font-black px-3 py-1 rounded-lg border-2 border-[#2C2A29] ${
                  isCategoryCountValid ? 'bg-[#8A9A5B] text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedCategories.length} من 5 فئات (مطلوب 4 - 5)
                </span>
                <h3 className="font-black text-lg text-[#000000]">اختيار الفئات (٤ إلى ٥ فئات)</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto pr-1 flex-1">
                {SCATTERGORIES_CATEGORIES.map(cat => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`p-3 rounded-xl border-2 border-[#2C2A29] font-bold text-xs flex items-center justify-between transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#8A9A5B] text-white shadow-[3px_3px_0px_#2C2A29] -translate-y-0.5'
                          : 'bg-[#E5E0D5] text-[#2C2A29] hover:bg-stone-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border border-[#2C2A29] flex items-center justify-center text-[10px] font-black ${
                        isSelected ? 'bg-white text-[#2C2A29]' : 'bg-transparent'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#2C2A29]/20 flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C4033]">
                {isCategoryCountValid ? '✓ جاهز للبدء' : '* يلزم تحديد 4 أو 5 فئات للتفعيل'}
              </span>

              <button
                disabled={!isCategoryCountValid}
                onClick={handleStartRound}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl border-2 border-[#2C2A29] font-black text-base transition-all ${
                  !isCategoryCountValid
                    ? 'bg-stone-400 text-stone-600 cursor-not-allowed opacity-60'
                    : 'bg-[#8A9A5B] hover:bg-[#2C2A29] text-white hover:text-[#E5E0D5] shadow-[4px_4px_0px_#2C2A29] hover:-translate-y-1 active:translate-y-0'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>بدء اللعبة وتدوير الحرف ◄</span>
              </button>
            </div>
          </div>

          {/* Section 2: Connected Players & Admin Status */}
          <div className="lg:col-span-5 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-5 flex flex-col justify-between min-h-0">
            <div>
              <div className="flex items-center justify-between border-b-2 border-[#2C2A29] pb-3 mb-3">
                <span className="text-xs font-black text-[#8A9A5B] bg-[#E5E0D5] px-2.5 py-1 rounded-lg border border-[#2C2A29]">
                  {players.length} لاعبين متصلين
                </span>
                <h3 className="font-black text-lg text-[#000000]">المتسابقون وحالة الأدمن</h3>
              </div>

              {designatedAdminId && (
                <div className="bg-[#8A9A5B]/15 border-2 border-[#8A9A5B] rounded-xl p-3 mb-3 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#8A9A5B]" />
                  <span className="text-xs font-black text-[#2C2A29]">
                    أدمن الجولة المعتمد: {players.find(p => p.id === designatedAdminId)?.name || 'متسابق'}
                  </span>
                </div>
              )}

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {players.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-xl shadow-[2px_2px_0px_#2C2A29]">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#000000]">{p.name}</span>
                      {designatedAdminId === p.id && (
                        <span className="bg-[#8A9A5B] text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-[#2C2A29]">
                          أدمن
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleKickPlayer(p.id, p.name)}
                      className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded bg-white/50 border border-red-300"
                    >
                      طرد
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-[#2C2A29] bg-[#E5E0D5] rounded-xl p-3 text-xs font-bold text-[#5C4033]">
              💡 بمجرد ضغط "بدء اللعبة وتدوير الحرف"، سيدور روليت الحروف تلقائياً لمدة 2.5 ثانية على جميع الأجهزة لاختيار حرف عشوائي غير مكرر.
            </div>
          </div>
        </div>

        {/* Admin Request Modal on TV */}
        {pendingAdminRequest && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[#F7F4EC] border-4 border-[#2C2A29] shadow-[8px_8px_0px_#2C2A29] rounded-2xl p-6 max-w-md w-full text-center">
              <div className="w-14 h-14 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#000000] mb-2">طلب صلاحية الأدمن والتحكيم</h3>
              <p className="text-sm font-bold text-[#5C4033] mb-6">
                اللاعب <span className="text-[#8A9A5B] font-black underline">{pendingAdminRequest.playerName}</span> يطلب صلاحية الأدمن لتحكيم ومراجعة إجابات المتسابقين من هاتفه.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleAcceptAdmin(pendingAdminRequest.playerId, pendingAdminRequest.playerName)}
                  className="flex-1 py-3 bg-[#8A9A5B] hover:bg-[#2C2A29] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  موافق
                </button>
                <button
                  onClick={() => handleRejectAdmin(pendingAdminRequest.playerId)}
                  className="flex-1 py-3 bg-[#E55353] hover:bg-[#2C2A29] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  مرفوض
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. ROULETTE PHASE (2.5s synchronized animation)
  if (phase === 'ROULETTE') {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-[#E5E0D5] p-6 select-none" dir="rtl">
        <div className="text-center space-y-6">
          <div className="inline-block bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] px-6 py-2 rounded-2xl font-black text-lg">
            سحب حرف الجولة {currentRound}...
          </div>

          {/* Big Jumbo Roulette Box */}
          <div className="w-48 h-48 md:w-64 md:h-64 bg-[#F7F4EC] border-4 border-[#2C2A29] shadow-[10px_10px_0px_#2C2A29] rounded-3xl flex items-center justify-center mx-auto">
            <span className="text-8xl md:text-9xl font-black text-[#2C2A29]">
              {rouletteLetter}
            </span>
          </div>

          <p className="text-sm md:text-base font-black text-[#5C4033]">
            جاري اختيار الحرف الأبجدي العشوائي للجولة...
          </p>
        </div>
      </div>
    );
  }

  // 3. PLAYING PHASE
  if (phase === 'PLAYING') {
    return (
      <div className="w-full h-[100dvh] flex flex-col bg-[#E5E0D5] select-none p-4 md:p-6 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#2C2A29] mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#8A9A5B] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl flex items-center justify-center text-3xl font-black text-white">
              {targetLetter}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#000000]">اسم جماد نبات • حرف: {targetLetter}</h1>
              <p className="text-xs text-[#5C4033] font-bold">الجولة {currentRound} • مدة الجولة: ٦٠ ثانية</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 60s Countdown Timer */}
            <div className={`flex items-center gap-2 px-5 py-2.5 border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-xl ${
              timeLeft <= 10 ? 'bg-red-500 text-white' : 'bg-[#F7F4EC] text-[#2C2A29]'
            }`}>
              <Clock className="w-6 h-6" />
              <span>{timeLeft} ثانية</span>
            </div>

            <GeoTopNavControls
              roomCode={roomId}
              exitActionType="return_lobby"
              exitLabel="العودة للوبي"
              onReturnToLobby={handleReturnToLobby}
              showRoomCode={false}
            />
            <FullscreenButton />
          </div>
        </div>

        {/* Live Submissions Tracker Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-8 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-5 flex flex-col justify-between min-h-0">
            <div>
              <h3 className="font-black text-base text-[#000000] border-b-2 border-[#2C2A29] pb-3 mb-4 flex items-center justify-between">
                <span>الفئات النشطة في هذه الجولة ({selectedCategories.length} فئات)</span>
                <span className="text-xs text-[#8A9A5B] font-bold">الحرف المطلوب: {targetLetter}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedCategories.map(catId => {
                  const catObj = SCATTERGORIES_CATEGORIES.find(c => c.id === catId);
                  return (
                    <div key={catId} className="bg-[#E5E0D5] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] rounded-xl p-4 text-center">
                      <span className="text-sm font-black text-[#2C2A29]">{catObj?.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {firstFinisherName && (
              <div className="bg-red-500 text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3 text-center text-sm font-black">
                أنهى اللاعب "{firstFinisherName}" أولاً! جاري إيقاف الجولة وتحكيم الإجابات...
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-5 flex flex-col min-h-0">
            <h3 className="font-black text-base text-[#000000] border-b-2 border-[#2C2A29] pb-3 mb-4 flex items-center justify-between">
              <span>حالة تسليم المتسابقين</span>
              <span className="text-xs text-[#8A9A5B] font-bold">
                {Object.keys(submissions).length} من {players.length}
              </span>
            </h3>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {players.map(p => {
                const isDone = Boolean(submissions[p.id]);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 border-2 border-[#2C2A29] rounded-xl shadow-[2px_2px_0px_#2C2A29] ${
                      isDone ? 'bg-[#8A9A5B] text-white font-black' : 'bg-[#E5E0D5] text-[#2C2A29]'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-xs font-bold">{isDone ? '✓ سلّم الإجابة' : 'يكتب الآن...'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. EVALUATION / REVIEW PHASE
  if (phase === 'EVALUATION') {
    return (
      <div className="w-full h-[100dvh] flex flex-col bg-[#E5E0D5] select-none p-4 md:p-6 overflow-hidden" dir="rtl">
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#2C2A29] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl flex items-center justify-center text-2xl font-black">
              {targetLetter}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#000000]">مراجعة وتحكيم الإجابات • حرف: {targetLetter}</h1>
              <p className="text-xs text-[#5C4033] font-bold">يمكن للأدمن من شاشته أو هاتفه قبول أو رفض أي إجابة</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirmEvaluation}
              className="px-6 py-2.5 bg-[#8A9A5B] hover:bg-[#2C2A29] text-white hover:text-[#E5E0D5] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-sm transition-all"
            >
              اعتماد النتائج والانتقال للترتيب ◄
            </button>
            <GeoTopNavControls
              roomCode={roomId}
              exitActionType="return_lobby"
              exitLabel="العودة للوبي"
              onReturnToLobby={handleReturnToLobby}
              showRoomCode={false}
            />
            <FullscreenButton />
          </div>
        </div>

        {/* Evaluation Board */}
        <div className="flex-1 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-4 overflow-y-auto min-h-0">
          <div className="space-y-6">
            {selectedCategories.map(catId => {
              const catObj = SCATTERGORIES_CATEGORIES.find(c => c.id === catId);
              const answersForCat = evaluatedAnswers.filter(a => a.category === catId);

              return (
                <div key={catId} className="bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-xl p-4 shadow-[2px_2px_0px_#2C2A29]">
                  <h3 className="font-black text-base text-[#000000] mb-3 flex items-center justify-between border-b border-[#2C2A29]/20 pb-2">
                    <span>{catObj?.label}</span>
                    <span className="text-xs text-[#5C4033] font-bold">{answersForCat.length} إجابات</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {answersForCat.map((ans, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border-2 border-[#2C2A29] rounded-xl shadow-[2px_2px_0px_#2C2A29] flex items-center justify-between ${
                          !ans.adminApproved
                            ? 'bg-red-100 text-red-900 line-through opacity-70'
                            : ans.status === 'UNIQUE'
                            ? 'bg-green-100 text-green-900 font-black'
                            : ans.status === 'DUPLICATE'
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        <div>
                          <div className="text-xs text-[#5C4033] font-bold">{ans.playerName}</div>
                          <div className="text-base font-black">{ans.rawWord}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-white/70 border border-[#2C2A29]">
                            {ans.adminApproved ? formatPoints(ans.computedPoints) : '+٠'}
                          </span>
                          <button
                            onClick={() => handleToggleAdminApproval(catId, ans.playerId)}
                            className={`w-8 h-8 rounded-lg border-2 border-[#2C2A29] font-black text-xs flex items-center justify-center transition-all ${
                              ans.adminApproved ? 'bg-red-500 text-white' : 'bg-[#8A9A5B] text-white'
                            }`}
                            title={ans.adminApproved ? 'رفض الإجابة' : 'قبول الإجابة'}
                          >
                            {ans.adminApproved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 5. ROUND SUMMARY / GAME OVER
  return (
    <div className="w-full h-[100dvh] flex flex-col bg-[#E5E0D5] select-none p-4 md:p-6 overflow-hidden" dir="rtl">
      <div className="flex items-center justify-between pb-4 border-b-2 border-[#2C2A29] mb-4">
        <h1 className="text-2xl font-black text-[#000000]">
          {phase === 'GAME_OVER' ? 'نهاية اللعبة • الترتيب النهائي' : `لوحة نتائج الجولة ${currentRound}`}
        </h1>
        <div className="flex items-center gap-3">
          <GeoTopNavControls
            roomCode={roomId}
            exitActionType="return_lobby"
            exitLabel="العودة للوبي"
            onReturnToLobby={handleReturnToLobby}
            showRoomCode={false}
          />
          <FullscreenButton />
        </div>
      </div>

      <div className="flex-1 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 flex flex-col justify-between max-w-4xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-black text-[#000000] mb-4">ترتيب المتسابقين</h2>
          <div className="space-y-3">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-4 border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl ${
                  idx === 0 ? 'bg-[#C68B59] text-white font-black' : 'bg-[#E5E0D5] text-[#2C2A29] font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">#{idx + 1}</span>
                  <span className="text-lg">{p.name}</span>
                </div>
                <span className="text-xl font-black">{formatPoints(cumulativeScores[p.id] || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t-2 border-[#2C2A29] flex justify-end">
          <button
            onClick={handleNextRound}
            className="px-8 py-3.5 bg-[#8A9A5B] hover:bg-[#2C2A29] text-white hover:text-[#E5E0D5] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-black text-lg transition-all"
          >
            {currentRound >= 3 ? 'إنهاء وحساب الفائز' : 'الانتقال للجولة التالية'}
          </button>
        </div>
      </div>
    </div>
  );
};
