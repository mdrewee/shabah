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
  hybridFootballSearch,
  FootballSearchResult,
  normalizeFootballSearch,
} from '../footballDataService';
import { formatPercent, toArabicNumber } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import { Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface CoachDraftMobileViewProps {
  contestantId: string;
  contestantName: string;
  squad: CoachSquad;
  roundNumber: number;
  conditionTitle: string;
  conditionId: string;
  claimedPlayers: Record<string, ClaimedPlayerInfo>;
  onConfirmPick: (slotKey: CoachSlotKey, pick: CoachPlayerPick) => void;
  evaluationResult?: SquadEvaluationResult | null;
}

export const CoachDraftMobileView: React.FC<CoachDraftMobileViewProps> = ({
  contestantId,
  contestantName,
  squad,
  roundNumber,
  conditionTitle,
  conditionId,
  claimedPlayers,
  onConfirmPick,
  evaluationResult,
}) => {
  // Determine current active slot based on round number or user manual tap
  const defaultSlot = COACH_SLOTS_ORDER[(roundNumber - 1) % 5] || 'FWD';
  const [selectedSlot, setSelectedSlot] = useState<CoachSlotKey>(defaultSlot);

  useEffect(() => {
    setSelectedSlot(COACH_SLOTS_ORDER[(roundNumber - 1) % 5] || 'FWD');
  }, [roundNumber]);

  // Search input & suggestions state
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<FootballSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const clean = searchInput.trim();
    if (!clean || clean.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        const results = await hybridFootballSearch(clean);
        if (!isCancelled) {
          setSuggestions(results);
          setIsSearching(false);
        }
      } catch {
        if (!isCancelled) setIsSearching(false);
      }
    }, 180);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchInput]);

  const handleSelectSuggestedPlayer = (player: FootballSearchResult) => {
    sound.playClick();
    setErrorMessage(null);

    const norm = normalizeFootballSearch(player.name);
    const claim = claimedPlayers[norm];

    // Global player lock check
    if (claim && claim.contestantId !== contestantId) {
      setErrorMessage(`سبقك عليها غيرك! اختاره: ${claim.contestantName}`);
      sound.playTick();
      return;
    }

    onConfirmPick(selectedSlot, {
      playerName: player.name,
      isCustom: !player.isLocalDb,
      playerPhoto: player.photoUrl,
      matchedDbId: player.id,
      conditionId,
      conditionTitle,
      confirmedAt: Date.now(),
    });

    setSearchInput('');
    setSuggestions([]);
  };

  const handleConfirmCustomName = () => {
    sound.playClick();
    setErrorMessage(null);

    const clean = searchInput.trim();
    if (!clean) return;

    const norm = normalizeFootballSearch(clean);
    const claim = claimedPlayers[norm];

    if (claim && claim.contestantId !== contestantId) {
      setErrorMessage(`سبقك عليها غيرك! اختاره: ${claim.contestantName}`);
      sound.playTick();
      return;
    }

    onConfirmPick(selectedSlot, {
      playerName: clean,
      isCustom: true,
      conditionId,
      conditionTitle,
      confirmedAt: Date.now(),
    });

    setSearchInput('');
    setSuggestions([]);
  };

  const currentSlotPick = squad.slots[selectedSlot];

  // If match evaluation is ready, show personal evaluation card
  if (evaluationResult) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-4 py-2 px-3 select-none">
        {/* Personal Score Banner */}
        <div className="shabah-border-wrap">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-5 flex flex-col items-center text-center gap-2">
              <span className="text-xs font-black text-neutral-500">تقييم تشكيلتك النهائي</span>
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
                  <span className="text-neutral-400 font-bold">
                    {COACH_SLOT_CONFIG[slotKey].label}: {slotEval.playerName}
                  </span>
                  <span className="text-neutral-500 text-[11px]">
                    {slotEval.conditionReason} • {slotEval.positionReason}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[10px] ${
                      slotEval.isValidCondition
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {slotEval.isValidCondition ? '✓ شرط' : '✗ شرط'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[10px] ${
                      slotEval.isValidPosition
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {slotEval.isValidPosition ? '✓ مركز' : '✗ مركز'}
                  </span>
                </div>
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 py-2 px-3 select-none">
      {/* 1. Tactical Slot Selector Pills */}
      <div className="flex items-center justify-between gap-1 p-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
        {COACH_SLOTS_ORDER.map((slotKey) => {
          const isSelected = selectedSlot === slotKey;
          const isFilled = Boolean(squad.slots[slotKey]?.playerName);

          return (
            <button
              key={slotKey}
              type="button"
              onClick={() => {
                sound.playClick();
                setSelectedSlot(slotKey);
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-black transition-all ${
                isSelected
                  ? 'bg-white text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                  : isFilled
                  ? 'bg-neutral-800 text-neutral-300'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {COACH_SLOT_CONFIG[slotKey].label}
              {isFilled && <span className="mr-0.5 text-emerald-400">●</span>}
            </button>
          );
        })}
      </div>

      {/* 2. Search Box with Autocomplete & Custom Input Fallback */}
      <div className="shabah-border-wrap">
        <div className="shabah-border-inner">
          <div className="shabah-surface p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-neutral-500">
                الخانة المستهدفة: {COACH_SLOT_CONFIG[selectedSlot].label}
              </span>
              {currentSlotPick && (
                <span className="text-xs font-black text-emerald-600">
                  الحالي: {currentSlotPick.playerName}
                </span>
              )}
            </div>

            {/* Input field */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث عن لاعب أو اكتب اسمه..."
                className="w-full h-12 pr-10 pl-4 rounded-xl border-2 border-[#0A0A0A] text-[#0A0A0A] font-black placeholder-neutral-400 focus:outline-none bg-white text-sm"
              />
              <Search className="w-5 h-5 text-neutral-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-400 text-red-700 text-xs font-black flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Autocomplete suggestions list */}
            {suggestions.length > 0 && (
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 border-t border-neutral-200 pt-2">
                {suggestions.map((p) => {
                  const norm = normalizeFootballSearch(p.name);
                  const isClaimedByOther =
                    claimedPlayers[norm] && claimedPlayers[norm].contestantId !== contestantId;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isClaimedByOther}
                      onClick={() => handleSelectSuggestedPlayer(p)}
                      className={`w-full p-2 rounded-xl text-right flex items-center justify-between border transition-all ${
                        isClaimedByOther
                          ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed opacity-60'
                          : 'bg-white hover:bg-neutral-50 border-neutral-200 text-[#0A0A0A] cursor-pointer active:scale-98'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-xs sm:text-sm">{p.name}</span>
                        <span className="text-[10px] text-neutral-500">
                          {p.currentClub || p.nationality || ''} • {p.position || 'لاعب'}
                        </span>
                      </div>

                      {isClaimedByOther ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black">
                          اختاره: {claimedPlayers[norm].contestantName}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-[#0A0A0A] text-white text-[11px] font-black">
                          اختيار
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* CRITICAL RULE: Custom Name Entry Button */}
            {searchInput.trim().length >= 2 && (
              <button
                type="button"
                onClick={handleConfirmCustomName}
                className="w-full py-3 rounded-xl bg-[#0A0A0A] text-white font-black text-xs sm:text-sm hover:bg-neutral-800 transition-transform active:scale-95 cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
              >
                اعتماد الاسم المكتوب: "{searchInput.trim()}"
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tactical Pitch Preview */}
      <ShabahTacticalPitch
        squad={squad}
        activeSlot={selectedSlot}
        onSlotClick={(slot) => {
          sound.playClick();
          setSelectedSlot(slot);
          setErrorMessage(null);
        }}
        isCompact
      />
    </div>
  );
};
