import React from 'react';
import { HexCell } from '../../types/game';

interface HexBoardProps {
  cells: HexCell[];
  activeCellId: string | null;
  onSelectCell?: (cellId: string) => void;
  interactive?: boolean;
  className?: string;
  showHelperBanner?: boolean;
  gameTitle?: string;
  winningPath?: string[];
}

export const HexBoard: React.FC<HexBoardProps> = ({
  cells,
  activeCellId,
  onSelectCell,
  interactive = true,
  className = '',
  showHelperBanner = true,
  gameTitle,
  winningPath = [],
}) => {
  // Detect Category Mode: scale cells by ~15-20% for category labels
  const isCategoryMode =
    cells.some((c) => c.label.length > 3) ||
    (gameTitle ? gameTitle.includes('الأصناف') : false);

  // Hexagon Geometry Constants for SVG (dynamically scaled for categories)
  const R = isCategoryMode ? 44 : 38; // outer radius (~16% larger in category mode)
  const horizSpacing = isCategoryMode ? 74 : 68;
  const vertSpacing = isCategoryMode ? 62 : 57; // 1.5 * R

  const originX = isCategoryMode ? 96 : 110;
  const originY = isCategoryMode ? 96 : 100;

  const svgWidth = isCategoryMode ? 560 : 550;
  const svgHeight = isCategoryMode ? 465 : 445;

  // Compute 6 vertices of a pointy-topped hexagon
  const getHexPoints = (cx: number, cy: number, r: number) => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      const x = cx + r * Math.cos(angleRad);
      const y = cy + r * Math.sin(angleRad);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // Static Corner Anchors in Red (#C04A3E terracotta/brick red)
  const cornerTopLeft = { cx: originX - horizSpacing / 2, cy: originY - vertSpacing };
  const cornerBottomLeft = { cx: originX - horizSpacing / 2, cy: originY + 5 * vertSpacing };

  // Top border hexagons: Team 2 (Ochre Yellow)
  const topBorderHexes = [0, 1, 2, 3, 4].map((c) => {
    const cx = originX + c * horizSpacing + horizSpacing / 2;
    const cy = originY - vertSpacing;
    return { id: `top_border_${c}`, cx, cy };
  });

  // Bottom border hexagons: Team 2 (Ochre Yellow)
  const bottomBorderHexes = [0, 1, 2, 3, 4].map((c) => {
    const cx = originX + c * horizSpacing + horizSpacing / 2;
    const cy = originY + 5 * vertSpacing;
    return { id: `bottom_border_${c}`, cx, cy };
  });

  // Left border hexagons: Team 1 (Olivine Green)
  const leftBorderHexes = [0, 1, 2, 3, 4].map((r) => {
    const isOdd = r % 2 !== 0;
    const cx = originX - horizSpacing + (isOdd ? horizSpacing / 2 : 0);
    const cy = originY + r * vertSpacing;
    return { id: `left_border_${r}`, cx, cy };
  });

  // Right border hexagons: Team 1 (Olivine Green)
  const rightBorderHexes = [0, 1, 2, 3, 4].map((r) => {
    const isOdd = r % 2 !== 0;
    const cx = originX + 5 * horizSpacing + (isOdd ? horizSpacing / 2 : 0);
    const cy = originY + r * vertSpacing;
    return { id: `right_border_${r}`, cx, cy };
  });

  const formattedCategoryTitle = gameTitle
    ? `فئة: خلية ${gameTitle.replace(/^خلية\s*/, '')}`
    : 'فئة: خلية الحروف الكلاسيكية';

  // Helper to split multi-word category labels cleanly into 2 lines maximum
  const wrapLabel = (label: string): string[] => {
    if (label.length <= 4) return [label];
    const words = label.trim().split(/\s+/);
    if (words.length <= 1) return [label];
    if (words.length === 2) return words;
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  };

  return (
    <div
      style={{
        boxShadow:
          'inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -4px 6px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.18)',
      }}
      className={`relative p-4 md:p-6 bg-sand-50 border-[7px] border-[#BAAE9F] rounded-3xl select-none overflow-hidden flex flex-col items-center ${className}`}
    >
      <style>
        {`
          @keyframes goldPulse {
            0%, 100% {
              fill: #F59E0B;
              stroke: #B45309;
              filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.9));
            }
            50% {
              fill: #FEF08A;
              stroke: #D97706;
              filter: drop-shadow(0 0 14px rgba(251, 191, 36, 1));
            }
          }
          .animate-gold-pulse {
            animation: goldPulse 1.2s infinite ease-in-out;
          }
        `}
      </style>

      {/* Header Banner: Dynamic Category Title */}
      <div className="mb-2 text-center">
        <span className="inline-flex items-center gap-2 text-xs md:text-sm font-black text-ink-950 bg-sand-200 border-2 border-ink-950 px-5 py-1 rounded-full shadow-tactile-sm font-display">
          <span className="w-2.5 h-2.5 rounded-full bg-ochre-600"></span>
          <span>{formattedCategoryTitle}</span>
        </span>
      </div>

      {/* Optional Helper Banner when waiting for cell selection */}
      {showHelperBanner && !activeCellId && interactive && (
        <div className="mb-2 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-800 bg-sand-100 border border-ink-950/40 px-3.5 py-0.5 rounded-full">
            <span>اضغط على أي خلية سداسية لبدء التنافس حولها</span>
          </span>
        </div>
      )}

      {/* SVG Hex Board with Border Hexagons */}
      <div className="w-full flex items-center justify-center py-2 px-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[580px] h-auto drop-shadow-sm"
        >
          <defs>
            <radialGradient id="activeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FAF0CA" />
              <stop offset="100%" stopColor="#E9BA86" />
            </radialGradient>
          </defs>

          {/* ======================================================== */}
          {/* STATIC CORNER ANCHOR CELLS (Ochre `#C68B59` matching border) */}
          {/* ======================================================== */}
          <polygon
            points={getHexPoints(cornerTopLeft.cx, cornerTopLeft.cy, R)}
            fill="#C68B59"
            stroke="#99582A"
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="opacity-95"
          />
          <polygon
            points={getHexPoints(cornerBottomLeft.cx, cornerBottomLeft.cy, R)}
            fill="#C68B59"
            stroke="#99582A"
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="opacity-95"
          />

          {/* ======================================================== */}
          {/* STATIC BORDER HEXAGONS (Solid Colors, No Arrows/Icons)    */}
          {/* ======================================================== */}

          {/* Top Flank: Team 2 (Ochre Clay `#C68B59`) */}
          {topBorderHexes.map((hex) => (
            <polygon
              key={hex.id}
              points={getHexPoints(hex.cx, hex.cy, R)}
              fill="#C68B59"
              stroke="#99582A"
              strokeWidth={2.5}
              strokeLinejoin="round"
              className="opacity-95"
            />
          ))}

          {/* Bottom Flank: Team 2 (Ochre Clay `#C68B59`) */}
          {bottomBorderHexes.map((hex) => (
            <polygon
              key={hex.id}
              points={getHexPoints(hex.cx, hex.cy, R)}
              fill="#C68B59"
              stroke="#99582A"
              strokeWidth={2.5}
              strokeLinejoin="round"
              className="opacity-95"
            />
          ))}

          {/* Left Flank: Team 1 (Olivine Green `#8A9A5B`) */}
          {leftBorderHexes.map((hex) => (
            <polygon
              key={hex.id}
              points={getHexPoints(hex.cx, hex.cy, R)}
              fill="#8A9A5B"
              stroke="#556B2F"
              strokeWidth={2.5}
              strokeLinejoin="round"
              className="opacity-95"
            />
          ))}

          {/* Right Flank: Team 1 (Olivine Green `#8A9A5B`) */}
          {rightBorderHexes.map((hex) => (
            <polygon
              key={hex.id}
              points={getHexPoints(hex.cx, hex.cy, R)}
              fill="#8A9A5B"
              stroke="#556B2F"
              strokeWidth={2.5}
              strokeLinejoin="round"
              className="opacity-95"
            />
          ))}

          {/* ======================================================== */}
          {/* 25 CENTRAL PLAYABLE HEXAGONS                              */}
          {/* ======================================================== */}
          {cells.map((cell) => {
            const isOddRow = cell.row % 2 !== 0;
            const cx = originX + cell.col * horizSpacing + (isOddRow ? horizSpacing / 2 : 0);
            const cy = originY + cell.row * vertSpacing;

            const isActive = activeCellId === cell.id;
            const isClaimedByTeam1 = cell.owner === 'team_a';
            const isClaimedByTeam2 = cell.owner === 'team_b';
            const isWinningPath = winningPath.includes(cell.id);

            // Inactive Fill: #F3EFE6 with crisp borders #4A463D
            let fillColor = '#F3EFE6';
            let strokeColor = '#4A463D';
            let textColor = '#1A1917';
            let strokeWidth = 2.5;

            if (isWinningPath) {
              fillColor = '#F59E0B';
              strokeColor = '#B45309';
              textColor = '#1A1917';
              strokeWidth = 3.5;
            } else if (isClaimedByTeam1) {
              fillColor = '#8A9A5B';
              strokeColor = '#556B2F';
              textColor = '#FAF8F5';
            } else if (isClaimedByTeam2) {
              fillColor = '#C68B59';
              strokeColor = '#99582A';
              textColor = '#FAF8F5';
            } else if (isActive) {
              fillColor = 'url(#activeGlow)';
              strokeColor = '#D99B26';
              strokeWidth = 3.5;
            }

            const points = getHexPoints(cx, cy, R);
            const lines = wrapLabel(cell.label);

            return (
              <g
                key={cell.id}
                onClick={() => {
                  if (interactive && onSelectCell && cell.owner === 'none') {
                    onSelectCell(cell.id);
                  }
                }}
                className={`transition-colors duration-150 ${
                  cell.owner === 'none' && interactive
                    ? 'cursor-pointer hover:brightness-95'
                    : 'cursor-default'
                } ${isActive ? 'animate-pulse' : ''} ${isWinningPath ? 'animate-gold-pulse' : ''}`}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              >
                {/* Hexagon Polygon */}
                <polygon
                  points={points}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  className="transition-colors duration-150"
                />

                {/* Inner active indicator ring */}
                {isActive && !isWinningPath && (
                  <polygon
                    points={getHexPoints(cx, cy, R - 6)}
                    fill="none"
                    stroke="#D99B26"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Main Label: 1-line or clean 2-lines with zero clipping */}
                {lines.length === 1 ? (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor}
                    className={`font-black font-display select-none transition-colors ${
                      cell.label.length > 5
                        ? 'text-xs md:text-sm font-semibold'
                        : cell.label.length > 2
                        ? 'text-sm md:text-base font-bold'
                        : 'text-2xl md:text-3xl font-black'
                    }`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {cell.label}
                  </text>
                ) : (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor}
                    className="text-xs md:text-sm leading-tight text-center font-semibold select-none"
                    style={{ pointerEvents: 'none' }}
                  >
                    <tspan x={cx} dy="-0.65em">
                      {lines[0]}
                    </tspan>
                    <tspan x={cx} dy="1.3em">
                      {lines[1]}
                    </tspan>
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
