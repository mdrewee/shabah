import React, { FC } from 'react';
import { DraftPosition } from '../types';
import { Shield } from 'lucide-react';

export interface TVSlotItem {
  playerName: string;
  playerPhoto?: string;
  conditionTitle?: string;
  conditionPrompt?: string;
  isConditionMet?: boolean;
  conditionReason?: string;
  isPositionValid?: boolean;
  positionReason?: string;
}

export interface DraftTVPitchProps {
  contestantName: string;
  clubName?: string;
  clubBadgeUrl?: string;
  slots: Partial<Record<DraftPosition, TVSlotItem | null>>;
  isEvaluating?: boolean;
  isCurrentPicker?: boolean;
  validConditionsCount?: number;
  overallPercentage?: number;
  rankBadge?: string;
}

const POSITION_LABELS: Record<DraftPosition, string> = {
  FWD: 'مهاجم (FWD)',
  MID: 'خط وسط (MID)',
  DEF_1: 'مدافع 1 (DEF 1)',
  DEF_2: 'مدافع 2 (DEF 2)',
  GK: 'حارس مرمى (GK)',
};

export const DraftTVPitch: FC<DraftTVPitchProps> = ({
  contestantName,
  clubName,
  clubBadgeUrl,
  slots,
  isEvaluating = false,
  isCurrentPicker = false,
  validConditionsCount,
  overallPercentage,
  rankBadge,
}) => {
  const renderSlotCard = (pos: DraftPosition) => {
    const slotData = slots[pos];
    const isFilled = Boolean(slotData && slotData.playerName && slotData.playerName !== 'فارغ');
    const posLabel = POSITION_LABELS[pos];

    if (!isFilled) {
      return (
        <div
          key={pos}
          className="border-2 border-dashed border-[#F7F4EC]/50 bg-[#F7F4EC]/10 rounded-xl px-2.5 py-1.5 text-center text-[#F7F4EC] select-none min-w-[90px] sm:min-w-[110px]"
        >
          <span className="text-[11px] font-black block leading-tight">[{posLabel}]</span>
          <span className="text-[9px] font-bold opacity-60 block mt-0.5">شاغر</span>
        </div>
      );
    }

    const isCondMet = slotData?.isConditionMet ?? true;
    const isPosValid = slotData?.isPositionValid ?? true;

    return (
      <div
        key={pos}
        className="bg-[#F7F4EC] border-2 border-[#2C2A29] text-[#2C2A29] p-2 rounded-xl shadow-[2px_2px_0px_#2C2A29] flex flex-col items-center justify-center text-center max-w-[130px] sm:max-w-[155px] w-full select-none relative transition-all"
      >
        {/* Player Name in bold text */}
        <span className="font-black text-xs sm:text-sm text-[#2C2A29] truncate w-full block">
          {slotData?.playerName}
        </span>

        {/* Assigned condition title in small font */}
        {slotData?.conditionTitle && (
          <span className="text-[10px] text-[#2C2A29]/70 font-bold truncate w-full block mt-0.5">
            {slotData.conditionTitle}
          </span>
        )}

        {/* In Evaluation Phase: Stamped validation badges */}
        {isEvaluating && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1 w-full pt-1 border-t border-[#2C2A29]/15">
            {isCondMet ? (
              <span className="bg-[#8A9A5B] text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-[#2C2A29]">
                ✓ مطابق
              </span>
            ) : (
              <span className="bg-[#C68B59] text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-[#2C2A29]">
                ✗ غير مطابق
              </span>
            )}

            {slotData?.isPositionValid !== undefined && (
              <span
                className={`text-[9px] font-black px-1 py-0.5 rounded border border-[#2C2A29] ${
                  isPosValid ? 'bg-[#8A9A5B] text-white' : 'bg-[#B85C5C] text-white'
                }`}
              >
                {isPosValid ? '✓ المركز صحيح' : '✗ المركز خاطئ'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`border-3 border-[#2C2A29] shadow-[5px_5px_0px_#2C2A29] rounded-2xl p-4 relative overflow-hidden min-h-[360px] flex flex-col justify-between bg-[#43603E] select-none transition-all ${
        isCurrentPicker ? 'ring-4 ring-[#8A9A5B]' : ''
      }`}
      dir="rtl"
    >
      {/* Field Markings (SVG / CSS lines in #F7F4EC/40) */}
      {/* Top Midfield Line and Center Circle Arc */}
      <div className="absolute top-0 left-0 right-0 h-0.5 border-b-2 border-[#F7F4EC]/35 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-x-2 border-[#F7F4EC]/30 rounded-b-full pointer-events-none" />

      {/* Penalty Box (18-yard) at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-52 h-24 border-t-2 border-x-2 border-[#F7F4EC]/35 rounded-t-xl pointer-events-none" />

      {/* Goal Area (6-yard) at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-10 border-t-2 border-x-2 border-[#F7F4EC]/35 rounded-t-lg pointer-events-none" />

      {/* Penalty Spot & Penalty Arc */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#F7F4EC]/50 pointer-events-none" />
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-20 h-8 border-t-2 border-[#F7F4EC]/30 rounded-t-full pointer-events-none" />

      {/* Subtle Grass Stripes */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.2) 24px, rgba(0,0,0,0.2) 48px)',
        }}
      />

      {/* Pitch Header: Contestant Name + Club Badge */}
      <div className="relative z-10 flex items-center justify-between pb-2 border-b border-[#F7F4EC]/25 mb-1 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {clubBadgeUrl ? (
            <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/40 p-1 flex items-center justify-center shrink-0">
              <img
                src={clubBadgeUrl}
                alt={clubName || ''}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <Shield size={22} className="text-white shrink-0" />
          )}

          <div className="min-w-0 text-right">
            <h4 className="text-white font-black text-sm sm:text-base leading-tight truncate">
              {contestantName}
            </h4>
            {clubName && (
              <span className="text-[#F7F4EC]/80 font-bold text-[10px] block truncate">
                {clubName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {rankBadge && (
            <span className="bg-[#2C2A29] text-white text-[11px] font-black px-2.5 py-1 rounded-xl border border-white/30">
              {rankBadge}
            </span>
          )}
          {isCurrentPicker && (
            <span className="bg-[#8A9A5B] text-white text-[11px] font-black px-2.5 py-1 rounded-full border border-white/40 animate-pulse">
              يختار الآن ⚡
            </span>
          )}
          {validConditionsCount !== undefined && (
            <span className="bg-[#F7F4EC] text-[#2C2A29] text-xs font-black px-2 py-0.5 rounded-lg border border-[#2C2A29]">
              {validConditionsCount}/5 شروط
            </span>
          )}
          {overallPercentage !== undefined && (
            <span className="bg-[#8A9A5B] text-white text-xs font-black px-2 py-0.5 rounded-lg border border-[#2C2A29] font-mono">
              {overallPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* The 5 Position Slots on the Pitch */}
      {/* 1. مهاجم (FWD): Centered at the top near the midfield line */}
      <div className="relative z-10 w-full flex justify-center py-1">
        {renderSlotCard('FWD')}
      </div>

      {/* 2. خط وسط (MID): Centered in the middle zone */}
      <div className="relative z-10 w-full flex justify-center py-1">
        {renderSlotCard('MID')}
      </div>

      {/* 3. مدافع 1 (DEF 1) & مدافع 2 (DEF 2): Flanking the defensive zone */}
      <div className="relative z-10 w-full flex justify-around px-2 sm:px-6 py-1">
        {renderSlotCard('DEF_1')}
        {renderSlotCard('DEF_2')}
      </div>

      {/* 4. حارس مرمى (GK): Positioned inside the goal area at the bottom */}
      <div className="relative z-10 w-full flex justify-center pt-1 pb-0.5">
        {renderSlotCard('GK')}
      </div>
    </div>
  );
};
