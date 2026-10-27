import React from 'react';
import { Check, X } from 'lucide-react';
import { CoachSlotKey, CoachSquad, COACH_SLOT_CONFIG, SlotVerification } from '../types';

interface ShabahTacticalPitchProps {
  squad?: CoachSquad | null;
  contestantName?: string;
  activeSlot?: CoachSlotKey | null;
  onSlotClick?: (slot: CoachSlotKey) => void;
  evaluationSlots?: Record<CoachSlotKey, SlotVerification> | null;
  isCompact?: boolean;
  className?: string;
}

export const ShabahTacticalPitch: React.FC<ShabahTacticalPitchProps> = ({
  squad,
  contestantName,
  activeSlot,
  onSlotClick,
  evaluationSlots,
  isCompact = false,
  className = '',
}) => {
  const gradientId = React.useId().replace(/:/g, '_');

  const renderSlotBadge = (slotKey: CoachSlotKey) => {
    const pick = squad?.slots?.[slotKey];
    const isSelected = activeSlot === slotKey;
    const isFilled = Boolean(pick && pick.playerName && !pick.playerName.includes('خانة فارغة'));
    const evalData = evaluationSlots?.[slotKey];

    const slotLabel = COACH_SLOT_CONFIG[slotKey].label;

    return (
      <div
        key={slotKey}
        onClick={() => onSlotClick && onSlotClick(slotKey)}
        className={`relative transition-all duration-150 select-none ${
          onSlotClick ? 'cursor-pointer active:scale-95' : ''
        }`}
      >
        {isFilled ? (
          // Filled Crisp White Card with Brutalist Shadow
          <div
            className={`bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-xl px-2 py-1 shadow-[2px_2px_0px_#0A0A0A] flex flex-col items-center justify-center text-center ${
              isSelected ? 'ring-2 ring-emerald-400' : ''
            } ${isCompact ? 'min-w-[80px] max-w-[110px]' : 'min-w-[100px] max-w-[140px]'}`}
          >
            <span
              className={`text-[#0A0A0A]/60 font-black mb-0.5 ${
                isCompact ? 'text-[9px]' : 'text-[10px]'
              }`}
            >
              {slotLabel}
            </span>

            {/* FULL NAME VISIBILITY RULE: Clean font-sans font-bold without clipping */}
            <span
              className={`font-sans font-bold text-[#0A0A0A] whitespace-normal break-words text-center leading-tight ${
                isCompact ? 'text-[11px]' : 'text-xs sm:text-sm'
              }`}
            >
              {pick?.playerName}
            </span>

            {/* Evaluation Badge if present */}
            {evalData && (
              <div className="mt-1 flex items-center gap-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black inline-flex items-center gap-1 ${
                    evalData.isValidCondition
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                      : 'bg-red-100 text-red-800 border border-red-400'
                  }`}
                  title={evalData.conditionReason}
                >
                  {evalData.isValidCondition ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                  <span>شرط</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black inline-flex items-center gap-1 ${
                    evalData.isValidPosition
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                      : 'bg-amber-100 text-amber-800 border border-amber-400'
                  }`}
                  title={evalData.positionReason}
                >
                  {evalData.isValidPosition ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                  <span>مركز</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          // Empty Slot: Dark gray dashed box with white label
          <div
            className={`border-2 border-dashed rounded-xl flex items-center justify-center text-center transition-colors ${
              isSelected
                ? 'border-white bg-white/10 text-white'
                : 'border-neutral-600 bg-neutral-900/60 text-neutral-300 hover:border-neutral-400'
            } ${
              isCompact
                ? 'min-w-[75px] max-w-[100px] py-1.5 px-1.5 text-[10px]'
                : 'min-w-[95px] max-w-[130px] py-2 px-2.5 text-xs sm:text-sm'
            } font-black`}
          >
            {slotLabel}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`shabah-border-wrap w-full overflow-hidden flex flex-col items-center ${className}`}
    >
      <div className="shabah-border-inner w-full">
        {/* Pitch Container: Dark slate gray (#18181B / #1E1E24) — NO GREEN */}
        <div
          className={`relative w-full bg-[#18181B] rounded-[18px] border-2 border-[#0A0A0A] overflow-hidden flex flex-col justify-between items-center ${
            isCompact ? 'p-2.5 min-h-[260px]' : 'p-4 min-h-[340px] sm:min-h-[380px]'
          }`}
        >
          {/* Half-pitch SVG Overlay Markings with Shabah Iridescent Gradient */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 300 400"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`pitchLines_${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B56BFF" />
                <stop offset="35%" stopColor="#38BDF8" />
                <stop offset="70%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#BEF264" />
              </linearGradient>
            </defs>

            {/* Outer boundary lines */}
            <rect
              x="10"
              y="10"
              width="280"
              height="380"
              rx="6"
              stroke={`url(#pitchLines_${gradientId})`}
              strokeWidth="2"
              opacity="0.75"
            />

            {/* Halfway line & center circle arc */}
            <line
              x1="10"
              y1="390"
              x2="290"
              y2="390"
              stroke={`url(#pitchLines_${gradientId})`}
              strokeWidth="2"
              opacity="0.75"
            />
            <path
              d="M 110 390 A 40 40 0 0 1 190 390"
              stroke={`url(#pitchLines_${gradientId})`}
              strokeWidth="2"
              opacity="0.75"
            />

            {/* 18-yard penalty box */}
            <rect
              x="50"
              y="10"
              width="200"
              height="100"
              stroke={`url(#pitchLines_${gradientId})`}
              strokeWidth="2"
              opacity="0.75"
            />

            {/* 6-yard goal box */}
            <rect
              x="95"
              y="10"
              width="110"
              height="40"
              stroke={`url(#pitchLines_${gradientId})`}
              strokeWidth="2"
              opacity="0.75"
            />

            {/* Penalty spot */}
            <circle
              cx="150"
              cy="75"
              r="3"
              fill={`url(#pitchLines_${gradientId})`}
              opacity="0.85"
            />

            {/* Penalty arc */}
            <path
              d="M 120 110 A 35 35 0 0 0 180 110"
              stroke={`url(#pitchLines_${gradientId})`}
              strokeWidth="2"
              opacity="0.75"
            />
          </svg>

          {/* Contestant Title Header */}
          {contestantName && (
            <div className="relative z-10 w-full flex items-center justify-between pb-1 px-1 border-b border-neutral-800">
              <span className="text-white font-black text-xs sm:text-sm tracking-wide">
                فريق: {contestantName}
              </span>
            </div>
          )}

          {/* 5 Tactical Slots Layout */}
          <div className="relative z-10 w-full flex-1 flex flex-col justify-around py-2">
            {/* 1. Goalkeeper slot (GK - top of goal area) */}
            <div className="w-full flex justify-center">{renderSlotBadge('GK')}</div>

            {/* 2. Defense Slots (DEF_1 & DEF_2 - left and right) */}
            <div className="w-full flex justify-around px-2 sm:px-4">
              {renderSlotBadge('DEF_1')}
              {renderSlotBadge('DEF_2')}
            </div>

            {/* 3. Midfield Slot (MID - center) */}
            <div className="w-full flex justify-center">{renderSlotBadge('MID')}</div>

            {/* 4. Forward Slot (FWD - attacking frontline) */}
            <div className="w-full flex justify-center">{renderSlotBadge('FWD')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
