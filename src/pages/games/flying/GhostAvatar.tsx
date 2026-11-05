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

// Helper to calculate a slightly darker shade for 16-bit pixel shading
function getDarkerShade(hex: string): string {
  switch (hex) {
    case '#EF4444': return '#B91C1C';
    case '#3B82F6': return '#1D4ED8';
    case '#10B981': return '#047857';
    case '#F59E0B': return '#B45309';
    case '#8B5CF6': return '#6D28D9';
    case '#EC4899': return '#BE185D';
    case '#14B8A6': return '#0F766E';
    case '#F97316': return '#C2410C';
    default: return '#1F2937';
  }
}

export function getTierDisplayLabel(tier?: FlyingTier): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  switch (tier) {
    case 'legendary':
      return {
        label: 'أسطوري',
        bgColor: '#F59E0B',
        textColor: '#000000',
      };
    case 'rare':
      return {
        label: 'نادر',
        bgColor: '#10B981',
        textColor: '#000000',
      };
    case 'uncommon':
      return {
        label: 'متوسط',
        bgColor: '#3B82F6',
        textColor: '#FFFFFF',
      };
    case 'common':
      return {
        label: 'شائع',
        bgColor: '#64748B',
        textColor: '#FFFFFF',
      };
    case 'duplicated':
      return {
        label: 'مكرر',
        bgColor: '#D97706',
        textColor: '#000000',
      };
    case 'failed':
    default:
      return {
        label: 'خاطئ',
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
  const shadeColor = getDarkerShade(ghostColor);
  const tierInfo = getTierDisplayLabel(tier);

  const scaleClass =
    size === 'lg' ? 'scale-125' : size === 'sm' ? 'scale-75' : 'scale-100';

  const isFailedOrDupe = tier === 'failed' || tier === 'duplicated';

  return (
    <div className={`relative flex flex-col items-center select-none pixel-art ${scaleClass}`}>
      {/* =========================================================
          RETRO PIXEL-BOX INFO CARD ABOVE GHOST
          Pure 16-Bit Arcade Brutalist Card (Zero Round Corners)
          ========================================================= */}
      <div
        className={`mb-2 flex flex-col items-center text-center bg-[#0B0F17] text-white border-4 border-black shadow-[4px_4px_0px_#000] p-2.5 transition-all duration-200 ${
          isSpotlight
            ? 'min-w-[200px] max-w-[250px] scale-105 z-30 shadow-[6px_6px_0px_#000]'
            : 'min-w-[130px] max-w-[170px]'
        }`}
      >
        {/* Top Header: Player Name + Pixel Color Dot */}
        <div className="flex items-center justify-center gap-2 w-full pb-1 border-b-2 border-zinc-800">
          <div
            className="w-3 h-3 border-2 border-black shrink-0 shadow-[1px_1px_0px_#000]"
            style={{ backgroundColor: ghostColor }}
          />
          <span className="font-mono font-black text-xs sm:text-sm text-white truncate tracking-wide">
            {name}
          </span>
        </div>

        {/* Answer & Tier Breakdown (During Reveal) */}
        {showAnswerCard && (
          <div className="w-full mt-1.5 flex flex-col items-center gap-1.5">
            {tier && (
              <div
                className="px-2 py-0.5 border-2 border-black font-mono font-black text-[11px] shadow-[2px_2px_0px_#000]"
                style={{
                  backgroundColor: tierInfo.bgColor,
                  color: tierInfo.textColor,
                }}
              >
                <span>{tierInfo.label}</span>
                {typeof roundMeters === 'number' && roundMeters > 0 ? (
                  <span> (+{roundMeters}م)</span>
                ) : null}
              </div>
            )}

            <span className="font-mono font-black text-xs text-amber-300 break-words max-w-full leading-tight">
              {answer ? `"${answer}"` : 'بدون إجابة'}
            </span>

            {isSpotlight && comment && (
              <span className="font-mono text-[10px] text-zinc-400 leading-tight">
                {comment}
              </span>
            )}
          </div>
        )}

        {/* Total Altitude Meter Counter */}
        <div className="mt-1.5 px-2.5 py-0.5 bg-black text-white border border-zinc-700 font-mono font-black text-xs tracking-wider">
          {totalMeters} م
        </div>
      </div>

      {/* Small Stepped Pixel Pointer Downward */}
      <div className="flex flex-col items-center -mt-2 mb-1">
        <div className="w-4 h-1 bg-black" />
        <div className="w-2 h-1 bg-black" />
      </div>

      {/* =========================================================
          RETRO 16-BIT PIXEL GHOST SPRITE (96x108 SVG Canvas)
          Drawn on a pure pixel grid with crispEdges
          ========================================================= */}
      <div className="relative w-20 h-24 flex items-center justify-center animate-pixel-float">
        <svg
          viewBox="0 0 16 18"
          className="w-full h-full"
          style={{ shapeRendering: 'crispEdges' }}
          aria-label={name}
        >
          {/* Outer Black Pixel Outline */}
          {/* Row 0: Dome apex */}
          <rect x="5" y="0" width="6" height="1" fill="#000000" />

          {/* Row 1: Dome shoulders */}
          <rect x="3" y="1" width="2" height="1" fill="#000000" />
          <rect x="11" y="1" width="2" height="1" fill="#000000" />

          {/* Row 2: Upper sides */}
          <rect x="2" y="2" width="1" height="1" fill="#000000" />
          <rect x="13" y="2" width="1" height="1" fill="#000000" />

          {/* Row 3..12: Vertical side outlines */}
          <rect x="1" y="3" width="1" height="10" fill="#000000" />
          <rect x="14" y="3" width="1" height="10" fill="#000000" />

          {/* Ghost Body Base Color (Solid 16-bit Fill) */}
          <rect x="5" y="1" width="6" height="1" fill={ghostColor} />
          <rect x="3" y="2" width="10" height="1" fill={ghostColor} />
          <rect x="2" y="3" width="12" height="10" fill={ghostColor} />

          {/* Shading: Right & Lower Darker Pixels for 16-Bit Depth */}
          <rect x="12" y="4" width="2" height="9" fill={shadeColor} />
          <rect x="11" y="10" width="2" height="3" fill={shadeColor} />
          <rect x="4" y="11" width="8" height="2" fill={shadeColor} />

          {/* Highlight: Left Shoulder Bright Pixel */}
          <rect x="4" y="2" width="2" height="1" fill="#FFFFFF" opacity="0.4" />
          <rect x="3" y="3" width="1" height="2" fill="#FFFFFF" opacity="0.4" />

          {/* Retro Pixel Eyes */}
          {isFailedOrDupe ? (
            /* X Eyes when failed / duplicated */
            <g fill="#000000">
              {/* Left X */}
              <rect x="4" y="5" width="1" height="1" />
              <rect x="6" y="5" width="1" height="1" />
              <rect x="5" y="6" width="1" height="1" />
              <rect x="4" y="7" width="1" height="1" />
              <rect x="6" y="7" width="1" height="1" />

              {/* Right X */}
              <rect x="9" y="5" width="1" height="1" />
              <rect x="11" y="5" width="1" height="1" />
              <rect x="10" y="6" width="1" height="1" />
              <rect x="9" y="7" width="1" height="1" />
              <rect x="11" y="7" width="1" height="1" />
            </g>
          ) : (
            /* Classic 16-Bit Square Eyes with Specular Glint */
            <g>
              {/* Left Eye: 2x3 pixels */}
              <rect x="4" y="5" width="2" height="3" fill="#000000" />
              <rect x="5" y="5" width="1" height="1" fill="#FFFFFF" />

              {/* Right Eye: 2x3 pixels */}
              <rect x="9" y="5" width="2" height="3" fill="#000000" />
              <rect x="10" y="5" width="1" height="1" fill="#FFFFFF" />
            </g>
          )}

          {/* Stepped Pixel Wavy Tail Bottom */}
          {/* Ripple 1 (Left) */}
          <rect x="2" y="13" width="3" height="1" fill={ghostColor} />
          <rect x="2" y="14" width="2" height="1" fill={ghostColor} />
          <rect x="2" y="15" width="1" height="1" fill="#000000" />
          <rect x="3" y="15" width="1" height="1" fill="#000000" />
          <rect x="4" y="14" width="1" height="1" fill="#000000" />

          {/* Ripple 2 (Center) */}
          <rect x="6" y="13" width="4" height="1" fill={shadeColor} />
          <rect x="6" y="14" width="4" height="1" fill={ghostColor} />
          <rect x="7" y="15" width="2" height="1" fill={ghostColor} />
          <rect x="7" y="16" width="2" height="1" fill="#000000" />
          <rect x="6" y="15" width="1" height="1" fill="#000000" />
          <rect x="9" y="15" width="1" height="1" fill="#000000" />
          <rect x="5" y="13" width="1" height="1" fill="#000000" />
          <rect x="10" y="13" width="1" height="1" fill="#000000" />

          {/* Ripple 3 (Right) */}
          <rect x="11" y="13" width="3" height="1" fill={shadeColor} />
          <rect x="12" y="14" width="2" height="1" fill={shadeColor} />
          <rect x="12" y="15" width="1" height="1" fill="#000000" />
          <rect x="13" y="15" width="1" height="1" fill="#000000" />
          <rect x="11" y="14" width="1" height="1" fill="#000000" />
          <rect x="14" y="13" width="1" height="1" fill="#000000" />

          {/* Tail Black Bottom Enclosure */}
          <rect x="1" y="13" width="1" height="1" fill="#000000" />
        </svg>

        {/* =========================================================
            PIXEL PARTICLE THRUST TRAIL (WHEN SPOTLIGHT / ASCENDING)
            ========================================================= */}
        {isSpotlight && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none">
            <div className="w-1.5 h-3 bg-[#F59E0B] shadow-[1px_1px_0px_#000] animate-pulse" />
            <div className="w-2 h-5 bg-[#EF4444] shadow-[1px_1px_0px_#000]" />
            <div className="w-2.5 h-6 bg-[#FEF08A] shadow-[1px_1px_0px_#000] animate-ping" />
            <div className="w-2 h-5 bg-[#F97316] shadow-[1px_1px_0px_#000]" />
            <div className="w-1.5 h-3 bg-[#F59E0B] shadow-[1px_1px_0px_#000] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};
