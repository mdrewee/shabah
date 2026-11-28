import {RoundCelebration,roundLeaders} from '../../../../components/common/RoundCelebration';
import {ResultNavigator,resultCardId} from '../../../../components/common/ResultNavigator';
import { canonicalDraftName, fitsDraftSlot, isDraftPlayerTaken, resolveDraftPlayer, searchDraftPlayers } from '../draftPlayers';
import React, { useState, useEffect, useRef } from 'react';
import {
  CoachSlotKey,
  CoachSquad,
  CoachPlayerPick,
  ClaimedPlayerInfo,
  COACH_SLOTS_ORDER,
  COACH_SLOT_CONFIG,
  SquadEvaluationResult,
} from '../types';
import { ShabahTacticalPitch } from './ShabahTacticalPitch';
import {
  normalizeFootballSearch,
  FootballSearchResult,
} from '../footballDataService';
import { formatPercent, toArabicNumber } from '../../../../utils/numberFormat';
import { Search, CheckCircle, AlertCircle, Clock, Check, X, Lock, ShieldCheck } from 'lucide-react';
import { sound } from '../../../../lib/audio';
import { roomBus } from '../../../../lib/roomBus';
import { DRAFT_ROUND_TIME, TOTAL_COACH_ROUNDS } from '../coachConfig';

const defaultRoundTime = DRAFT_ROUND_TIME;

interface CoachDraftMobileViewProps {
  roomCode?: string;
  contestantId: string;
  contestantName: string;
  squad: CoachSquad;
  roundNumber: number;
  totalRounds?: number;
  conditionTitle: string;
  conditionId: string;
  conditionDescription?: string;
  claimedPlayers: Record<string, ClaimedPlayerInfo>;
  currentRoundSelections?: Record<string, CoachPlayerPick>;
  usedPlayersAcrossMatch?: string[];
  isReadyForNextRound?: boolean;
  onReadyForNextRound?: () => void;
  evaluationResult?: SquadEvaluationResult | null;
  verificationMode?: 'local' | 'mixed' | 'ai';
  onRetryEvaluation?:()=>void;
  isMyTurn?: boolean;
  currentTurnPlayerName?: string;
  turnSecondsRemaining?: number;
}

export const CoachDraftMobileView: React.FC<CoachDraftMobileViewProps> = ({
  roomCode = '',
  contestantId,
  contestantName,
  squad,
  roundNumber,
  totalRounds = TOTAL_COACH_ROUNDS,
  conditionTitle,
  conditionId,
  conditionDescription,
  claimedPlayers,
  currentRoundSelections = {},
  usedPlayersAcrossMatch = [],
  isReadyForNextRound = false,
  onReadyForNextRound,
  evaluationResult,
  verificationMode,
  onRetryEvaluation,
  turnSecondsRemaining,
}) => {
  // 1. Step 1: Select Vacant Slot (Strict Slot Selection Route)
  const defaultSlot = COACH_SLOTS_ORDER[(roundNumber - 1) % 5] || 'FWD';
  const [selectedSlotKey, setSelectedSlotKey] = useState<CoachSlotKey>(defaultSlot);

  useEffect(() => {
    // If the default round slot is vacant, select it; otherwise find the first vacant slot
    const roundSlot = COACH_SLOTS_ORDER[(roundNumber - 1) % 5] || 'FWD';
    if (!squad.slots[roundSlot]?.playerName || squad.slots[roundSlot]?.playerName.includes('خانة فارغة')) {
      setSelectedSlotKey(roundSlot);
    } else {
      const firstVacant = COACH_SLOTS_ORDER.find(
        (k) => !squad.slots[k]?.playerName || squad.slots[k]?.playerName.includes('خانة فارغة')
      );
      if (firstVacant) setSelectedSlotKey(firstVacant);
    }
  }, [roundNumber]);

  const activeSlotConfig = COACH_SLOT_CONFIG[selectedSlotKey] || COACH_SLOT_CONFIG['FWD'];

  // Local countdown timer per round
  const [localSecondsLeft, setLocalSecondsLeft] = useState(turnSecondsRemaining ?? defaultRoundTime);

  useEffect(() => {
    setLocalSecondsLeft(turnSecondsRemaining ?? defaultRoundTime);
    const interval = window.setInterval(() => {
      setLocalSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [roundNumber, turnSecondsRemaining]);

  // Search input & suggestions state
  const [claimPending,setClaimPending]=useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<FootballSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear search on round change
  useEffect(() => {
    setSearchInput('');
    setSuggestions([]);
    setErrorMessage(null);
  }, [roundNumber]);

  // Listen for claim rejection from TV host
  useEffect(() => {
    const unsubRejection = roomBus.on('CLAIM_PLAYER_REJECTED', (evt: any) => {
      const payload = evt?.data || evt;
      if (evt.roomCode === roomCode && payload && payload.contestantId === contestantId) {
        sound.playBuzz?.();
        setClaimPending(false);
        setErrorMessage(payload.reason || 'تعذر حجز اللاعب! سبقه شخص آخر');
      }
    });

    return () => {
      unsubRejection();
    };
  }, [contestantId, roomCode]);

  // Immediate 100% In-Memory Local Search (Zero Latency, Zero Network, Zero CORS)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 140);
    setSearchInput(val);
    setErrorMessage(null);

    const clean = val.trim();
    if (!clean || clean.length < 1) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const results = searchDraftPlayers(clean, 15);
    setSuggestions(results);
    setIsSearching(false);
  };

  // Check if selected slot is already filled
  const myPickForSelectedSlot = squad.slots[selectedSlotKey];
  const hasPickedThisRound = Boolean(currentRoundSelections[contestantId]);
  const confirmedSlot = hasPickedThisRound ? COACH_SLOTS_ORDER.find((slot) =>
    squad.slots[slot]?.playerName === currentRoundSelections[contestantId]?.playerName) : undefined;
  const isSelectedSlotFilled = Boolean(
    myPickForSelectedSlot?.playerName && !myPickForSelectedSlot.playerName.includes('خانة فارغة')
  );

  // Request Claim for player (Simultaneous race with first-come first-served)
  const handleSelectSuggestedPlayer = (player: FootballSearchResult) => {
    if (claimPending || localSecondsLeft<=0 || hasPickedThisRound || isSelectedSlotFilled) return;
    sound.playClick();
    setErrorMessage(null);

    if (isDraftPlayerTaken(player.name, [...Object.keys(claimedPlayers), ...usedPlayersAcrossMatch])) {
      setErrorMessage('هذا اللاعب تم اختياره مسبقاً');
      return;
    }
    if (!fitsDraftSlot(player.position, selectedSlotKey)) {
      setErrorMessage('مركز اللاعب لا يطابق الخانة المختارة.');
      return;
    }

    // Send Real-Time Claim Request to TV host (authoritative lock)
    setClaimPending(true);
    roomBus.broadcastClaimPlayerRequest(roomCode, {
      contestantId,
      contestantName,
      player: {
        id: player.id,
        name: player.name,
        photoUrl: player.photoUrl,
        position: player.position,
        isLocalDb: player.isLocalDb,
      },
      roundIndex: roundNumber,
      slotKey: selectedSlotKey,
      roomCode,
    });

    setSearchInput('');
    setSuggestions([]);
  };

  const handleConfirmCustomName = () => {
    if (claimPending || localSecondsLeft<=0 || hasPickedThisRound || isSelectedSlotFilled) return;
    sound.playClick();
    setErrorMessage(null);

    const clean = searchInput.trim();
    if (clean.length < 2) {
      setErrorMessage('اكتب اسم اللاعب أولاً.');
      return;
    }

    if (isDraftPlayerTaken(clean, [...Object.keys(claimedPlayers), ...usedPlayersAcrossMatch])) {
      setErrorMessage('هذا اللاعب تم اختياره مسبقاً');
      return;
    }
    if (!fitsDraftSlot(resolveDraftPlayer(clean)?.position, selectedSlotKey)) {
      setErrorMessage('مركز اللاعب لا يطابق الخانة المختارة.');
      return;
    }

    setClaimPending(true);
    roomBus.broadcastClaimPlayerRequest(roomCode, {
      contestantId,
      contestantName,
      player: {
        id: `custom_${Date.now()}`,
        name: clean,
        isLocalDb: false,
      },
      roundIndex: roundNumber,
      slotKey: selectedSlotKey,
      roomCode,
    });

    setSearchInput('');
    setSuggestions([]);
  };

  useEffect(()=>{setClaimPending(false);},[roundNumber,hasPickedThisRound]);
  useEffect(()=>{
    if(!claimPending)return;
    const timer=setTimeout(()=>{setClaimPending(false);setErrorMessage('لم يصل تأكيد الحجز؛ تحقق من الاتصال وحاول مجددًا.');},5000);
    return()=>clearTimeout(timer);
  },[claimPending]);

  // If match evaluation is ready, show personal evaluation card
  if (evaluationResult) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-4 py-2 px-3 select-none">
        {verificationMode!=='ai' && <div role="status" className="rounded-xl border border-amber-700 bg-amber-950/30 p-3 text-xs text-amber-200">{verificationMode==='mixed'?'بعض الخانات تحتاج مراجعة إضافية.':'النتيجة من التحقق المحلي؛ بعض الشروط التاريخية قد تحتاج مراجعة الشبح.'}{onRetryEvaluation && <button className="block w-full mt-2 rounded-lg bg-amber-300 text-black p-2 font-bold" onClick={onRetryEvaluation}>إعادة المراجعة الذكية</button>}</div>}
        <RoundCelebration award="مهندس التشكيلة" names={verificationMode==='ai' && evaluationResult.rank===1?[contestantName]:[]}/>
        {/* Personal Score Banner */}
        <div className="shabah-border-wrap">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-5 flex flex-col items-center text-center gap-2">
              <span className="text-xs font-black text-neutral-500">{verificationMode==='ai'?'تقييم تشكيلتك النهائي':'تقييم تشكيلتك المبدئي'}</span>
              <div className="text-4xl sm:text-5xl font-black text-[#0A0A0A]">
                {formatPercent(evaluationResult.totalPercentage)}
              </div>

              {/* Point pill */}
              {evaluationResult.matchPointsAwarded !== undefined && (
                <div className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs">
                  المركز {toArabicNumber(evaluationResult.rank || 1)} • +{toArabicNumber(evaluationResult.matchPointsAwarded)} نقاط
                </div>
              )}

              <p className="mt-2 text-sm font-bold text-neutral-700 leading-relaxed border-t border-neutral-200 pt-3">
                "{evaluationResult.critique}"
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Slots Breakdown */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-black text-white px-1">تفاصيل الخانات الـ ٥:</h4>
          {COACH_SLOTS_ORDER.map((slotKey) => {
            const slotEval = evaluationResult.slots[slotKey];
            if (!slotEval) return null;

            return (
              <div
                key={slotKey}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-neutral-100 font-bold">
                    {COACH_SLOT_CONFIG[slotKey].label}: {slotEval.playerName}
                  </span>
                  <span className="text-neutral-300 text-[11px]">
                    {slotEval.needsReview?'تحقق محلي · ':''}{slotEval.conditionReason} • {slotEval.positionReason}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[10px] inline-flex items-center gap-1 ${
                      slotEval.needsReview && !slotEval.isValidCondition
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : slotEval.isValidCondition
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {slotEval.isValidCondition ? <Check className="w-2.5 h-2.5" /> : slotEval.needsReview ? '?' : <X className="w-2.5 h-2.5" />}
                    <span>شرط</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[10px] inline-flex items-center gap-1 ${
                      slotEval.isValidPosition
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {slotEval.isValidPosition ? <Check className="w-2.5 h-2.5" /> : slotEval.needsReview ? '?' : <X className="w-2.5 h-2.5" />}
                    <span>مركز</span>
                  </span>
                </div>
                <p className="mt-2 text-xs leading-6 text-zinc-300">الشرط: {slotEval.conditionReason}</p><p className="text-xs leading-6 text-zinc-300">المركز: {slotEval.positionReason}</p>
              </div>
            );
          })}
        </div>

        {/* Visual Pitch */}
        <ShabahTacticalPitch
          squad={squad}
          evaluationSlots={evaluationResult.slots}
          isCompact
        />

        {/* Next Round Readiness Button (Mobile) */}
        {onReadyForNextRound && roundNumber < totalRounds && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onReadyForNextRound();
            }}
            className={`w-full py-4 rounded-2xl font-black text-sm border-2 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-[2px_2px_0px_#0A0A0A] ${
              isReadyForNextRound
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-neutral-100'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isReadyForNextRound ? 'أنت جاهز للجولة التالية!' : 'أنا جاهز للجولة التالية'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 py-2 px-3 select-none">
      {/* 1. Top Condition Banner with Round Number and Live Countdown */}
      <div className="w-full p-4 rounded-2xl bg-zinc-950 border-2 border-zinc-800 flex flex-col gap-2 shadow-xl">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300">
            الجولة {toArabicNumber(roundNumber)} من {toArabicNumber(totalRounds)} • شرط تكتيكي
          </span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-black border transition-colors ${
              localSecondsLeft <= 6
                ? 'bg-red-950 text-red-400 border-red-700 animate-pulse'
                : 'bg-zinc-900 text-amber-400 border-zinc-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{toArabicNumber(localSecondsLeft)} ثانية</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <h2 className="text-base sm:text-lg font-black text-white leading-tight">
            {conditionTitle}
          </h2>
          {conditionDescription && (
            <p className="text-xs font-bold text-zinc-400 leading-relaxed">
              {conditionDescription}
            </p>
          )}
        </div>
      </div>

      {claimPending && <p role="status" className="text-amber-300 text-sm">بانتظار تأكيد حجز اللاعب…</p>}
      {/* 3. Steps 2 & 3: Search & Confirm Exclusive Player Lock */}
      {hasPickedThisRound || isSelectedSlotFilled ? (
        /* Slot Already Filled by contestant */
        <div className="w-full p-5 rounded-2xl bg-zinc-900 border-2 border-emerald-500/80 flex flex-col items-center text-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-emerald-400">
              تم حجز مركز {COACH_SLOT_CONFIG[confirmedSlot || selectedSlotKey].label}:
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {currentRoundSelections[contestantId]?.playerName || myPickForSelectedSlot?.playerName}
            </span>
          </div>

          <p role="status" className="text-sm font-bold text-emerald-300 mt-1">
            تم اعتماد اختيارك.
          </p>
        </div>
      ) : (
        /* Active Search & Claim State */
        <div className="shabah-border-wrap">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-neutral-700">
                  الخطوة ٢: ابحث واعتمد لاعباً لمركز [{activeSlotConfig.label}]:
                </span>
              </div>

              {/* Search input field */}
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder={`ابحث عن لاعب لمركز ${activeSlotConfig.label}...`}
                  className="w-full h-12 pr-10 pl-4 rounded-xl border-2 border-[#0A0A0A] text-[#0A0A0A] font-black placeholder-neutral-400 focus:outline-none bg-white text-sm"
                  autoFocus
                />
                <Search className="w-5 h-5 text-neutral-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>

              {searchInput.length >= 140 && <p role="status" className="text-sm text-amber-800">الحد الأقصى ١٤٠ حرفًا.</p>}
              {/* Error message */}
              {errorMessage && (
                <div role="alert" className="p-2.5 rounded-xl bg-red-100 border border-red-400 text-red-700 text-xs font-black flex items-center gap-1.5 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Suggestions list with brutalist lock indicators */}
              {suggestions.length > 0 && (
                <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 border-t border-neutral-200 pt-2">
                  {suggestions.map((p) => {
                    const norm = normalizeFootballSearch(canonicalDraftName(p.name));
                    const claim = claimedPlayers[norm];
                    const isClaimedByOther = Boolean(claim);
                    const isUsedPrev = usedPlayersAcrossMatch && usedPlayersAcrossMatch.includes(norm);
                    const wrongPosition = !fitsDraftSlot(p.position, selectedSlotKey);
                    const isBlocked = isClaimedByOther || isUsedPrev || wrongPosition;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={claimPending || localSecondsLeft<=0}
                        onClick={() => handleSelectSuggestedPlayer(p)}
                        className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between border transition-all ${
                          isBlocked
                            ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed opacity-60'
                            : 'bg-white hover:bg-neutral-50 border-neutral-200 text-[#0A0A0A] cursor-pointer active:scale-98'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Position & Rating Badge */}
                          <div className="w-9 h-9 rounded-xl bg-black border border-zinc-700 flex flex-col items-center justify-center text-white shrink-0">
                            <span className="font-mono text-[9px] font-bold text-zinc-400 leading-none">
                              {p.position || '؟'}
                            </span>
                            {p.rating != null && <span className="font-mono text-xs font-black text-emerald-400 leading-none mt-0.5">{p.rating}</span>}
                          </div>

                          <div className="flex flex-col">
                            <span className="font-black text-xs sm:text-sm">{p.name}</span>
                            <span className="text-[10px] text-neutral-500">
                              {p.position || 'المركز يحتاج تحققًا من الشبح'}
                            </span>
                          </div>
                        </div>

                        {isClaimedByOther ? (
                          <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-black flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3 text-red-600" />
                            <span>هذا اللاعب تم اختياره مسبقاً</span>
                          </span>
                        ) : isUsedPrev ? (
                          <span className="px-2 py-1 rounded bg-zinc-200 text-zinc-600 text-[10px] font-black shrink-0">
                            هذا اللاعب تم اختياره مسبقاً
                          </span>
                        ) : wrongPosition ? (
                          <span className="text-xs font-bold text-red-700">مركز غير مطابق</span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-emerald-600 text-white text-xs font-black shrink-0 transition-colors">
                            اعتماد كـ {activeSlotConfig.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-neutral-500">الأسماء خارج البنك تخضع للتحقق؛ اكتب الاسم الكامل لتجنب تشابه الأسماء.</p>
              {/* Custom Name Entry Button */}
              <button
                type="button"
                onClick={handleConfirmCustomName}
                disabled={claimPending || localSecondsLeft<=0}
                className="w-full py-3 rounded-xl bg-[#0A0A0A] hover:bg-emerald-700 text-white font-black text-xs sm:text-sm transition-transform active:scale-95 cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
              >
                {searchInput.trim().length >= 2 ? `اعتماد «${searchInput.trim()}»` : 'اعتماد الاسم المكتوب'} · {activeSlotConfig.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tactical Pitch Preview with clickable slots */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-black px-1 text-zinc-400">
          <span>تشكيلتك الحالية:</span>
          <span className="text-[11px] text-zinc-500">{hasPickedThisRound ? 'اختيارك مقفل حتى الجولة التالية' : 'اضغط على أي مركز لتحديده'}</span>
        </div>
        <ShabahTacticalPitch
          squad={squad}
          activeSlot={selectedSlotKey}
          onSlotClick={(slot) => {
            sound.playClick();
            if (!hasPickedThisRound) setSelectedSlotKey(slot);
          }}
          isCompact
        />
      </div>
    </div>
  );
};
