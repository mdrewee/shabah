import React from 'react';
import { FlyingTier } from './types';

export const GHOST_COLORS = [
  '#EF4444', // أحمر
  '#3B82F6', // أزرق
  '#10B981', // أخضر
  '#F59E0B', // أصفر
  '#8B5CF6', // بنفسجي
  '#EC4899', // وردي
  '#14B8A6', // تركواز
  '#F97316', // برتقالي
];

export function getGhostColor(index: number): string {
  return GHOST_COLORS[Math.abs(index) % GHOST_COLORS.length];
}

export function getTierDisplayLabel(tier?: FlyingTier): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  switch (tier) {
    case 'legendary':
    case 'rare':
      return {
        label: 'إجابة نادرة',
        bgColor: '#10B981',
        textColor: '#000000',
      };
    case 'uncommon':
    case 'common':
      return {
        label: 'إجابة شائعة',
        bgColor: '#3B82F6',
        textColor: '#FFFFFF',
      };
    case 'duplicated':
      return {
        label: 'إجابة مكررة',
        bgColor: '#F59E0B',
        textColor: '#000000',
      };
    case 'failed':
    default:
      return {
        label: 'إجابة خاطئة',
        bgColor: '#EF4444',
        textColor: '#FFFFFF',
      };
  }
}

export interface GhostAvatarProps {
  name: string;
  colorIndex: number;
  totalMeters: number;
  roundMeters?: number;
  answer?: string;
  comment?: string;
  tier?: FlyingTier;
  showAnswerCard?: boolean;
  isSpotlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GHOST_BODY_PATH =
  'M 60 14 C 85 14, 96 32, 96 58 C 96 76, 99 91, 98 102 C 97 110, 89 112, 83 106 C 78 101, 74 101, 70 106 C 65 112, 55 112, 50 106 C 46 101, 42 101, 37 106 C 31 112, 23 110, 22 102 C 21 91, 24 76, 24 58 C 24 32, 35 14, 60 14 Z';

export const GhostAvatar: React.FC<GhostAvatarProps> = ({
  name,
  colorIndex,
  totalMeters,
  roundMeters,
  answer,
  comment,
  tier,
  showAnswerCard = false,
  isSpotlight = false,
  size = 'md',
}) => {
  const ghostColor = getGhostColor(colorIndex);
  const tierInfo = getTierDisplayLabel(tier);

  const svgDimensions =
    size === 'lg' ? 'w-20 h-20' : size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Info Box Directly Above the Ghost */}
      <div
        className={`mb-1.5 flex flex-col items-center text-center bg-white text-black border-2 border-black rounded-xl px-3 py-1.5 transition-transform duration-300 ${
          isSpotlight ? 'min-w-[180px] max-w-[230px] scale-105 z-30' : 'min-w-[115px] max-w-[155px]'
        }`}
      >
        {/* Color Strip & Player Name */}
        <div className="flex items-center justify-center gap-1.5 w-full">
          <span
            className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
            style={{ backgroundColor: ghostColor }}
          />
          <span className="font-sans font-black text-xs sm:text-sm text-black truncate">
            {name}
          </span>
        </div>

        {/* Answer & Rarity Evaluation (Shown during Reveal) */}
        {showAnswerCard && (
          <div className="w-full mt-1 pt-1 border-t border-zinc-300 flex flex-col items-center gap-1">
            {tier && (
              <span
                className="px-2 py-0.5 rounded-md border border-black font-sans font-black text-[10px] leading-tight"
                style={{
                  backgroundColor: tierInfo.bgColor,
                  color: tierInfo.textColor,
                }}
              >
                {tierInfo.label}
                {typeof roundMeters === 'number' ? ` (+${roundMeters} متر)` : ''}
              </span>
            )}

            <span className="font-sans font-black text-xs sm:text-sm text-black break-words max-w-full leading-snug">
              {answer ? `"${answer}"` : 'بدون إجابة'}
            </span>

            {isSpotlight && comment && (
              <span className="font-sans font-bold text-[10px] text-zinc-700 leading-tight">
                {comment}
              </span>
            )}
          </div>
        )}

        {/* Cumulative Meters Counter */}
        <div className="mt-1 px-2 py-0.5 rounded-md bg-zinc-900 text-white font-mono font-black text-[11px] leading-none">
          {totalMeters} متر
        </div>
      </div>

      {/* Small Pointer Triangle */}
      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black -mt-1.5 mb-0.5" />

      {/* Clean Flat Shabah Ghost SVG */}
      <div className={`relative ${svgDimensions} flex items-center justify-center`}>
        <svg
          viewBox="0 0 120 124"
          className="w-full h-full overflow-visible"
          aria-label={name}
        >
          {/* Solid Offset Brutalist Shadow */}
          <path
            d={GHOST_BODY_PATH}
            fill="#000000"
            transform="translate(3, 4)"
          />

          {/* Main Ghost Body with Distinct Solid Player Color */}
          <path
            d={GHOST_BODY_PATH}
            fill={ghostColor}
            stroke="#000000"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* White Eye Backing for Contrast on Colored Body */}
          <ellipse
            cx="47"
            cy="53"
            rx="8.5"
            ry="10"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="3"
          />
          <ellipse
            cx="73"
            cy="53"
            rx="8.5"
            ry="10"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="3"
          />

          {/* Pupils */}
          {tier === 'failed' || tier === 'duplicated' ? (
            <g stroke="#000000" strokeWidth="3" strokeLinecap="round">
              <line x1="43" y1="49" x2="51" y2="57" />
              <line x1="51" y1="49" x2="43" y2="57" />
              <line x1="69" y1="49" x2="77" y2="57" />
              <line x1="77" y1="49" x2="69" y2="57" />
            </g>
          ) : (
            <g fill="#000000">
              <circle cx="47" cy="51" r="4.5" />
              <circle cx="73" cy="51" r="4.5" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
