import React from 'react';
import { ContestantBidState } from '../types';
import { formatPriceArabic, getRankOrdinalArabic, toArabicDigits } from '../brokerUtils';
import { Trophy, Flame, User } from 'lucide-react';

interface BrokerLeaderboardProps {
  contestants: ContestantBidState[];
  highlightedPlayerId?: string | null;
}

export const BrokerLeaderboard: React.FC<BrokerLeaderboardProps> = ({
  contestants,
  highlightedPlayerId,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 select-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-black text-white">
            لوحة السوم المباشر ({toArabicDigits(contestants.length)} متسابقين)
          </h2>
        </div>
        <span className="text-xs font-bold text-neutral-400">
          تحديث لحظي بدون كشف الشات
        </span>
      </div>

      {contestants.length === 0 ? (
        <div className="p-8 rounded-2xl bg-neutral-900 border-2 border-neutral-800 text-center text-neutral-400 font-bold">
          في انتظار دخول المتسابقين وبدء السوم...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {contestants.map((c) => {
            const isFirst = c.rank === 1;
            const isHighlighted = highlightedPlayerId === c.playerId;

            return (
              <div
                key={c.playerId}
                className={`transition-all duration-300 rounded-2xl p-4 border-[3px] ${
                  isHighlighted
                    ? 'scale-105 ring-4 ring-emerald-400 bg-white border-[#0A0A0A] shadow-[0_0_20px_rgba(74,222,128,0.5)]'
                    : isFirst
                    ? 'bg-amber-50 border-amber-500 shadow-[3px_3px_0px_#D97706]'
                    : 'bg-white border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  {/* Rank Badge */}
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      isFirst
                        ? 'bg-amber-500 text-white shadow-sm'
                        : c.rank === 2
                        ? 'bg-neutral-800 text-white'
                        : c.rank === 3
                        ? 'bg-amber-700/80 text-white'
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                    }`}
                  >
                    {getRankOrdinalArabic(c.rank)}
                  </span>

                  {/* Bullets indicator */}
                  <span className="text-[11px] font-bold text-neutral-500">
                    رصاصات: {toArabicDigits(c.bulletsRemaining)}
                  </span>
                </div>

                {/* Contestant Name */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-neutral-700" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#0A0A0A] truncate">
                    {c.playerName}
                  </h3>
                </div>

                {/* Current Bid Display */}
                <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-600">
                    وصل لسومة:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg sm:text-xl font-black text-[#0A0A0A]">
                      {formatPriceArabic(c.currentBid)}
                    </span>
                    {isFirst && <Flame className="w-4 h-4 text-amber-500" />}
                  </div>
                </div>

                {/* Score badge if has points */}
                {c.totalScore > 0 && (
                  <div className="mt-2 text-left">
                    <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      نقاط الفوز: +{toArabicDigits(c.totalScore)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
