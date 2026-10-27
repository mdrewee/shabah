import React from 'react';
import { CoachSquad, CoachVerdict } from '../types';
import { ShabahTacticalPitch } from './ShabahTacticalPitch';
import { formatPercent, toArabicNumber } from '../../../../utils/numberFormat';
import { CheckCircle2, RotateCcw, Trophy, Users } from 'lucide-react';
import { sound } from '../../../../lib/audio';

interface ContestantItem {
  id: string;
  name: string;
}

interface CoachDraftTVViewProps {
  contestants: ContestantItem[];
  squads: Record<string, CoachSquad>;
  verdict?: CoachVerdict | null;
  statusBanner?: string | null;
  roundNumber?: number;
  totalRounds?: number;
  readyPlayers?: string[];
  currentTurnPlayerId?: string | null;
  currentTurnPlayerName?: string | null;
  turnSecondsRemaining?: number;
  onNextRound?: () => void;
  onReturnToLobby?: () => void;
}

export const CoachDraftTVView: React.FC<CoachDraftTVViewProps> = ({
  contestants,
  squads,
  verdict,
  statusBanner,
  roundNumber = 1,
  totalRounds = 5,
  readyPlayers = [],
  currentTurnPlayerId,
  currentTurnPlayerName,
  turnSecondsRemaining,
  onNextRound,
  onReturnToLobby,
}) => {
  const count = contestants.length;

  // Responsive Grid Class based on contestant count (up to 10 players)
  const getGridClass = () => {
    if (count <= 2) {
      return 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-6';
    }
    if (count <= 4) {
      return 'grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto gap-4';
    }
    if (count <= 6) {
      return 'grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-3.5';
    }
    if (count <= 8) {
      return 'grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto gap-3';
    }
    return 'grid-cols-2 md:grid-cols-5 max-w-7xl mx-auto gap-2.5';
  };

  const isCompact = count > 4;
  const isFinalRound = roundNumber >= totalRounds;

  return (
    <div className="w-full flex flex-col items-center gap-4 py-2 px-3 sm:px-6 select-none">
      {/* 1. Live Broadcast Status Banner or Active Turn Indicator */}
      {!verdict && currentTurnPlayerName && (
        <div className="w-full max-w-2xl shabah-border-wrap animate-in fade-in duration-300">
          <div className="shabah-border-inner">
            <div className="shabah-surface px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-base font-black text-[#0A0A0A]">
                  دور المتسابق: <strong className="underline text-emerald-700">{currentTurnPlayerName}</strong> يختار لاعبه التكتيكي...
                </span>
              </div>
              {turnSecondsRemaining !== undefined && (
                <span className="px-3 py-1 rounded-full bg-[#0A0A0A] text-emerald-400 font-mono text-sm font-black shadow-md">
                  {toArabicNumber(turnSecondsRemaining)} ث
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {statusBanner && !verdict && !currentTurnPlayerName && (
        <div className="w-full max-w-3xl shabah-pill-wrap animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="shabah-pill-inner">
            <div className="shabah-pill-surface px-6 py-2 text-sm sm:text-base font-black text-[#0A0A0A] text-center">
              {statusBanner}
            </div>
          </div>
        </div>
      )}

      {/* 2. Verdict Banner if round ended */}
      {verdict && (
        <div className="w-full max-w-4xl shabah-border-wrap animate-in zoom-in-95 duration-300">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-4 sm:p-5 flex flex-col items-center text-center gap-3">
              <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-white font-black text-xs">
                {isFinalRound ? 'صافرة نهاية المباراة • التتويج النهائي' : `صافرة نهاية الجولة ${toArabicNumber(roundNumber)} من ${toArabicNumber(totalRounds)}`}
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-[#0A0A0A]">
                {verdict.coachBanner}
              </h2>

              {/* Readiness / Next Round Controls on TV */}
              <div className="w-full pt-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-600">
                  <Users className="w-4 h-4 text-neutral-500" />
                  <span>
                    جاهزية المتسابقين: {toArabicNumber(readyPlayers.length)} من {toArabicNumber(contestants.length)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isFinalRound && onNextRound && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onNextRound();
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm border-2 border-emerald-700 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>بدء الجولة التالية فوراً</span>
                    </button>
                  )}

                  {isFinalRound && onReturnToLobby && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onReturnToLobby();
                      }}
                      className="px-5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white font-black text-xs sm:text-sm border-2 border-[#0A0A0A] shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>العودة للوبي</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dynamic Responsive Grid of Gray Pitches */}
      <div className={`w-full grid ${getGridClass()} items-start`}>
        {contestants.map((c, index) => {
          const squad = squads[c.id] || { playerId: c.id, playerName: c.name, slots: {} };
          const evalItem = verdict?.evaluations.find((e) => e.playerId === c.id);
          const isReady = readyPlayers.includes(c.id);

          return (
            <div key={c.id} className="flex flex-col items-center gap-2 w-full">
              {/* Pitch */}
              <ShabahTacticalPitch
                squad={squad}
                contestantName={c.name}
                evaluationSlots={evalItem?.slots}
                isCompact={isCompact}
              />

              {/* Evaluation score pill & coach roast summary */}
              {evalItem && (
                <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="text-[11px] font-black text-neutral-400">
                      المركز {toArabicNumber(evalItem.rank || index + 1)}
                    </span>
                    <span className="text-sm font-black text-emerald-400">
                      {formatPercent(evalItem.totalPercentage)}
                    </span>
                    {verdict && !isFinalRound && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isReady
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        <CheckCircle2 className={`w-3 h-3 ${isReady ? 'text-emerald-400' : 'text-neutral-500'}`} />
                        <span>{isReady ? 'جاهز' : 'ينتظر'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-neutral-300 leading-snug line-clamp-2">
                    "{evalItem.critique}"
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
