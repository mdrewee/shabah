import React from 'react';
import { CoachSquad, CoachVerdict } from '../types';
import { ShabahTacticalPitch } from './ShabahTacticalPitch';
import { formatPercent, toArabicNumber } from '../../../../utils/numberFormat';

interface ContestantItem {
  id: string;
  name: string;
}

interface CoachDraftTVViewProps {
  contestants: ContestantItem[];
  squads: Record<string, CoachSquad>;
  verdict?: CoachVerdict | null;
  statusBanner?: string | null;
}

export const CoachDraftTVView: React.FC<CoachDraftTVViewProps> = ({
  contestants,
  squads,
  verdict,
  statusBanner,
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

  return (
    <div className="w-full flex flex-col items-center gap-4 py-2 px-3 sm:px-6 select-none">
      {/* 1. Live Broadcast Status Banner */}
      {statusBanner && !verdict && (
        <div className="w-full max-w-3xl shabah-pill-wrap animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="shabah-pill-inner">
            <div className="shabah-pill-surface px-6 py-2 text-sm sm:text-base font-black text-[#0A0A0A] text-center">
              ⚡ {statusBanner}
            </div>
          </div>
        </div>
      )}

      {/* 2. Verdict Banner if match ended */}
      {verdict && (
        <div className="w-full max-w-4xl shabah-border-wrap animate-in zoom-in-95 duration-300">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-4 sm:p-5 flex flex-col items-center text-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs">
                صافرة النهاية • النتيجة الرسمية
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0A0A0A]">
                {verdict.coachBanner}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dynamic Responsive Grid of Gray Pitches */}
      <div className={`w-full grid ${getGridClass()} items-start`}>
        {contestants.map((c, index) => {
          const squad = squads[c.id] || { playerId: c.id, playerName: c.name, slots: {} };
          const evalItem = verdict?.evaluations.find((e) => e.playerId === c.id);

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
                <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1 shadow-sm">
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="text-[11px] font-black text-neutral-400">
                      المركز {toArabicNumber(evalItem.rank || index + 1)}
                    </span>
                    <span className="text-sm font-black text-emerald-400">
                      {formatPercent(evalItem.totalPercentage)}
                    </span>
                    {evalItem.matchPointsAwarded !== undefined && (
                      <span className="text-[11px] font-black text-amber-400">
                        +{toArabicNumber(evalItem.matchPointsAwarded)} نقاط
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
