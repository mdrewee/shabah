import React, { useEffect, useState } from 'react';
import { FlyingContestantResult } from './types';
import { GhostAvatar } from './GhostAvatar';

const MAX_WORLD_METERS = 1500;

export interface FlyingSkyWorldProps {
  contestants: Array<{ id: string; name: string }>;
  results: Record<string, FlyingContestantResult>;
  cumulativeMeters: Record<string, number>;
  activeSpotlightIndex: number;
  cameraMode: 'spotlight' | 'global_overview';
}

export const FlyingSkyWorld: React.FC<FlyingSkyWorldProps> = ({
  contestants,
  results,
  cumulativeMeters,
  activeSpotlightIndex,
  cameraMode,
}) => {
  // Track whether the current spotlighted ghost has launched from previousTotalMeters -> newTotalMeters
  const [hasLaunchedCurrent, setHasLaunchedCurrent] = useState(false);

  useEffect(() => {
    if (cameraMode !== 'spotlight') {
      setHasLaunchedCurrent(true);
      return;
    }
    // Start at previousTotalMeters so camera focuses on the ghost first, then launch upward after 650ms
    setHasLaunchedCurrent(false);
    const launchTimer = setTimeout(() => {
      setHasLaunchedCurrent(true);
    }, 650);

    return () => clearTimeout(launchTimer);
  }, [activeSpotlightIndex, cameraMode]);

  // Convert meters (0..1500) to vertical percentage inside the 3000px world
  const metersToBottomPercent = (meters: number): number => {
    const clamped = Math.max(0, Math.min(MAX_WORLD_METERS, meters));
    // 0m sits at 3% from bottom (standing on street sidewalk), 1500m sits at 95%
    return 3 + (clamped / MAX_WORLD_METERS) * 92;
  };

  // Determine each ghost's live displayed altitude
  const getGhostDisplayedMeters = (contestantId: string, index: number): number => {
    const res = results[contestantId];
    if (!res) {
      return cumulativeMeters[contestantId] || 0;
    }

    if (cameraMode === 'global_overview') {
      return res.newTotalMeters;
    }

    if (index < activeSpotlightIndex) {
      return res.newTotalMeters;
    }

    if (index === activeSpotlightIndex) {
      return hasLaunchedCurrent ? res.newTotalMeters : res.previousTotalMeters;
    }

    return res.previousTotalMeters;
  };

  // Camera transform calculation
  const totalCount = Math.max(1, contestants.length);
  const safeSpotlightIdx = Math.min(totalCount - 1, Math.max(0, activeSpotlightIndex));
  const activeContestant = contestants[safeSpotlightIdx];
  const activeAltitude = activeContestant
    ? getGhostDisplayedMeters(activeContestant.id, safeSpotlightIdx)
    : 0;

  // World is 260% of viewport height so camera can pan smoothly from 0m to 1500m
  // In global_overview, scale down so the whole range from ground (0m) to highest ghost is visible
  const highestMeters = Math.max(
    300,
    ...contestants.map((c, idx) => getGhostDisplayedMeters(c.id, idx))
  );

  // Horizontal position of each contestant (15% to 85%)
  const getContestantXPercent = (index: number, count: number): number => {
    if (count <= 1) return 50;
    const span = 70; // 15% to 85%
    return 15 + (index / (count - 1)) * span;
  };

  // Compute camera translateY and translateX
  let cameraScale = 1;
  let cameraTranslateXPercent = 0;
  let cameraTranslateYPercent = 0;

  if (cameraMode === 'spotlight' && activeContestant) {
    cameraScale = 1.15;
    // Note: in RTL or LTR, we position ghosts using left: `${xPercent}%`
    const xPercent = getContestantXPercent(safeSpotlightIdx, totalCount);
    cameraTranslateXPercent = (50 - xPercent) * 0.55;
    // Map altitude (0..1500m) to vertical pan of the 260vh world inside 100vh viewport
    // At 0m -> show bottom of world (translateY = 0%)
    // At 1500m -> show top of world (translateY = 58%)
    const altitudeRatio = Math.max(0, Math.min(1, activeAltitude / MAX_WORLD_METERS));
    cameraTranslateYPercent = altitudeRatio * 58;
  } else {
    // Global Zoom-Out: show from ground buildings up to highest ghost
    cameraScale = highestMeters > 900 ? 0.42 : highestMeters > 500 ? 0.52 : 0.65;
    cameraTranslateXPercent = 0;
    const midRatio = Math.min(0.45, (highestMeters / MAX_WORLD_METERS) * 0.32);
    cameraTranslateYPercent = midRatio * 40;
  }

  // Altitude markers every 100m (100m to 1500m)
  const altitudeMarkers = Array.from({ length: 15 }, (_, i) => (i + 1) * 100);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0F172A] select-none">
      {/* Moving Camera World Container (260vh tall, anchored at bottom) */}
      <div
        className="absolute left-0 right-0 bottom-0 w-full h-[260vh] origin-bottom transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transform: `translate3d(${cameraTranslateXPercent}%, ${cameraTranslateYPercent}%, 0) scale(${cameraScale})`,
        }}
      >
        {/* =========================================================
            5 SOLID ATMOSPHERIC COLOR BANDS (NO GRADIENTS)
            ========================================================= */}

        {/* 5. Outer Space Layer (1100m to 1500m -> bottom 70.7% to 100%) */}
        <div
          className="absolute left-0 right-0 bg-[#0F172A] border-b-2 border-black overflow-hidden"
          style={{ bottom: '70.7%', top: '0%' }}
        >
          {/* Flat SVG Stars & Planets */}
          <svg className="w-full h-full" viewBox="0 0 1200 500" preserveAspectRatio="none">
            {/* Solid Stars */}
            <rect x="90" y="60" width="8" height="8" fill="#FACC15" />
            <rect x="240" y="130" width="6" height="6" fill="#FFFFFF" />
            <rect x="410" y="75" width="8" height="8" fill="#FFFFFF" />
            <rect x="580" y="160" width="6" height="6" fill="#FACC15" />
            <rect x="760" y="55" width="8" height="8" fill="#FFFFFF" />
            <rect x="930" y="140" width="6" height="6" fill="#FACC15" />
            <rect x="1080" y="80" width="8" height="8" fill="#FFFFFF" />
            <rect x="160" y="290" width="6" height="6" fill="#FFFFFF" />
            <rect x="670" y="310" width="8" height="8" fill="#FACC15" />
            <rect x="1020" y="280" width="6" height="6" fill="#FFFFFF" />

            {/* Flat Ringed Planet (Left) */}
            <g transform="translate(180, 180)">
              <ellipse
                cx="0"
                cy="0"
                rx="68"
                ry="18"
                fill="none"
                stroke="#FACC15"
                strokeWidth="6"
                transform="rotate(-15)"
              />
              <circle cx="0" cy="0" r="36" fill="#F97316" stroke="#000000" strokeWidth="4" />
            </g>

            {/* Flat Moon / Planet (Right) */}
            <g transform="translate(960, 190)">
              <circle cx="0" cy="0" r="42" fill="#8B5CF6" stroke="#000000" strokeWidth="4" />
              <circle cx="-12" cy="-8" r="8" fill="#6D28D9" />
              <circle cx="14" cy="12" r="11" fill="#6D28D9" />
            </g>
          </svg>
        </div>

        {/* 4. Upper Sky Layer (750m to 1100m -> bottom 49.2% to 70.7%) */}
        <div
          className="absolute left-0 right-0 bg-[#1D4ED8] border-b-2 border-black overflow-hidden"
          style={{ bottom: '49.2%', height: '21.5%' }}
        >
          {/* Flat SVG Hot Air Balloons & High Clouds */}
          <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
            {/* Flat Cloud Left */}
            <g transform="translate(120, 210)">
              <rect
                x="0"
                y="20"
                width="150"
                height="36"
                rx="18"
                fill="#DBEAFE"
                stroke="#000000"
                strokeWidth="3"
              />
              <circle cx="45" cy="20" r="24" fill="#DBEAFE" stroke="#000000" strokeWidth="3" />
              <circle cx="95" cy="16" r="28" fill="#DBEAFE" stroke="#000000" strokeWidth="3" />
              <rect x="6" y="20" width="138" height="32" rx="14" fill="#DBEAFE" />
            </g>

            {/* Hot Air Balloon 1 */}
            <g transform="translate(340, 90)">
              <line x1="-10" y1="45" x2="-6" y2="66" stroke="#000000" strokeWidth="3" />
              <line x1="10" y1="45" x2="6" y2="66" stroke="#000000" strokeWidth="3" />
              <rect
                x="-12"
                y="65"
                width="24"
                height="18"
                rx="3"
                fill="#D97706"
                stroke="#000000"
                strokeWidth="3"
              />
              <circle cx="0" cy="12" r="38" fill="#EF4444" stroke="#000000" strokeWidth="3.5" />
              <path
                d="M 0 -26 C 14 -26, 18 12, 0 50 C -18 12, -14 -26, 0 -26 Z"
                fill="#FACC15"
                stroke="#000000"
                strokeWidth="3"
              />
            </g>

            {/* Hot Air Balloon 2 */}
            <g transform="translate(910, 140)">
              <line x1="-8" y1="38" x2="-5" y2="55" stroke="#000000" strokeWidth="3" />
              <line x1="8" y1="38" x2="5" y2="55" stroke="#000000" strokeWidth="3" />
              <rect
                x="-10"
                y="55"
                width="20"
                height="15"
                rx="3"
                fill="#D97706"
                stroke="#000000"
                strokeWidth="3"
              />
              <circle cx="0" cy="10" r="32" fill="#10B981" stroke="#000000" strokeWidth="3.5" />
              <path
                d="M 0 -22 C 12 -22, 15 10, 0 42 C -15 10, -12 -22, 0 -22 Z"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="3"
              />
            </g>
          </svg>
        </div>

        {/* 3. Low Sky & Clouds Layer (400m to 750m -> bottom 27.7% to 49.2%) */}
        <div
          className="absolute left-0 right-0 bg-[#0284C7] border-b-2 border-black overflow-hidden"
          style={{ bottom: '27.7%', height: '21.5%' }}
        >
          {/* Flat White SVG Clouds & Airplanes */}
          <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
            {/* Flat Cloud 1 */}
            <g transform="translate(140, 180)">
              <rect
                x="0"
                y="24"
                width="180"
                height="42"
                rx="21"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="3.5"
              />
              <circle cx="55" cy="24" r="28" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
              <circle cx="110" cy="18" r="34" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
              <rect x="5" y="24" width="170" height="36" rx="16" fill="#FFFFFF" />
            </g>

            {/* Flat Cloud 2 */}
            <g transform="translate(780, 220)">
              <rect
                x="0"
                y="24"
                width="200"
                height="44"
                rx="22"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="3.5"
              />
              <circle cx="60" cy="24" r="30" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
              <circle cx="125" cy="16" r="36" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
              <rect x="6" y="24" width="188" height="38" rx="18" fill="#FFFFFF" />
            </g>

            {/* Flat Airplane Silhouette */}
            <g transform="translate(520, 110)">
              <path
                d="M 0 20 L 90 20 L 115 5 L 125 5 L 112 20 L 140 20 C 152 20, 158 26, 158 30 C 158 34, 152 38, 140 38 L 90 38 L 62 66 L 46 66 L 62 38 L 20 38 L 8 50 L 0 50 L 8 30 L 0 20 Z"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* 2. Towers & Skyscrapers Layer (150m to 400m -> bottom 12.2% to 27.7%) */}
        <div
          className="absolute left-0 right-0 bg-[#38BDF8] border-b-2 border-black overflow-hidden"
          style={{ bottom: '12.2%', height: '15.5%' }}
        >
          {/* High-Rise Towers & Construction Cranes SVG */}
          <svg className="w-full h-full" viewBox="0 0 1200 320" preserveAspectRatio="none">
            {/* Construction Crane (Left) */}
            <g stroke="#000000" strokeWidth="3.5">
              <rect x="105" y="40" width="16" height="280" fill="#F59E0B" />
              <rect x="40" y="40" width="210" height="14" fill="#F59E0B" />
              <line x1="113" y1="15" x2="60" y2="40" strokeWidth="3" />
              <line x1="113" y1="15" x2="220" y2="40" strokeWidth="3" />
              <line x1="215" y1="54" x2="215" y2="120" strokeWidth="3" />
              <rect x="195" y="120" width="40" height="22" fill="#EF4444" />
            </g>

            {/* Skyscraper 1 */}
            <g>
              <rect
                x="280"
                y="30"
                width="120"
                height="290"
                fill="#334155"
                stroke="#000000"
                strokeWidth="4"
              />
              <rect
                x="315"
                y="6"
                width="50"
                height="24"
                fill="#475569"
                stroke="#000000"
                strokeWidth="3.5"
              />
              {/* Windows */}
              {[55, 95, 135, 175, 215, 255].map((wy) => (
                <g key={wy} fill="#E0F2FE" stroke="#000000" strokeWidth="2">
                  <rect x="298" y={wy} width="22" height="22" />
                  <rect x="330" y={wy} width="22" height="22" />
                  <rect x="362" y={wy} width="22" height="22" />
                </g>
              ))}
            </g>

            {/* Skyscraper 2 (Center Tower) */}
            <g>
              <rect
                x="540"
                y="18"
                width="135"
                height="302"
                fill="#1E293B"
                stroke="#000000"
                strokeWidth="4"
              />
              {[48, 90, 132, 174, 216, 258].map((wy) => (
                <g key={wy} fill="#FEF08A" stroke="#000000" strokeWidth="2">
                  <rect x="560" y={wy} width="24" height="24" />
                  <rect x="596" y={wy} width="24" height="24" />
                  <rect x="632" y={wy} width="24" height="24" />
                </g>
              ))}
            </g>

            {/* Skyscraper 3 (Right) */}
            <g>
              <rect
                x="860"
                y="50"
                width="130"
                height="270"
                fill="#475569"
                stroke="#000000"
                strokeWidth="4"
              />
              {[75, 115, 155, 195, 235, 275].map((wy) => (
                <g key={wy} fill="#E0F2FE" stroke="#000000" strokeWidth="2">
                  <rect x="880" y={wy} width="24" height="22" />
                  <rect x="915" y={wy} width="24" height="22" />
                  <rect x="950" y={wy} width="24" height="22" />
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* 1. Ground, Residential City Buildings, Houses & Street Layer (0m to 150m -> bottom 0% to 12.2%) */}
        <div
          className="absolute left-0 right-0 bottom-0 bg-[#7DD3FC] overflow-hidden"
          style={{ height: '12.2%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1200 260" preserveAspectRatio="none">
            {/* Residential Buildings & Houses */}
            {/* House 1 */}
            <rect
              x="50"
              y="70"
              width="130"
              height="120"
              fill="#F4F4F5"
              stroke="#000000"
              strokeWidth="4"
            />
            <polygon
              points="40,70 115,25 190,70"
              fill="#EF4444"
              stroke="#000000"
              strokeWidth="4"
            />
            <rect x="75" y="95" width="28" height="28" fill="#FDE047" stroke="#000000" strokeWidth="3" />
            <rect x="125" y="95" width="28" height="28" fill="#FDE047" stroke="#000000" strokeWidth="3" />
            <rect x="100" y="140" width="30" height="50" fill="#78350F" stroke="#000000" strokeWidth="3" />

            {/* City Apartment Building 1 */}
            <rect
              x="220"
              y="35"
              width="150"
              height="155"
              fill="#E4E4E7"
              stroke="#000000"
              strokeWidth="4"
            />
            {[60, 105].map((wy) => (
              <g key={wy} fill="#38BDF8" stroke="#000000" strokeWidth="2.5">
                <rect x="242" y={wy} width="28" height="26" />
                <rect x="282" y={wy} width="28" height="26" />
                <rect x="322" y={wy} width="28" height="26" />
              </g>
            ))}

            {/* City Apartment Building 2 */}
            <rect
              x="430"
              y="50"
              width="165"
              height="140"
              fill="#FDE68A"
              stroke="#000000"
              strokeWidth="4"
            />
            {[75, 118].map((wy) => (
              <g key={wy} fill="#FFFFFF" stroke="#000000" strokeWidth="2.5">
                <rect x="452" y={wy} width="30" height="26" />
                <rect x="498" y={wy} width="30" height="26" />
                <rect x="544" y={wy} width="30" height="26" />
              </g>
            ))}

            {/* City Apartment Building 3 */}
            <rect
              x="660"
              y="30"
              width="155"
              height="160"
              fill="#D4D4D8"
              stroke="#000000"
              strokeWidth="4"
            />
            {[55, 100].map((wy) => (
              <g key={wy} fill="#FDE047" stroke="#000000" strokeWidth="2.5">
                <rect x="682" y={wy} width="28" height="26" />
                <rect x="724" y={wy} width="28" height="26" />
                <rect x="766" y={wy} width="28" height="26" />
              </g>
            ))}

            {/* House 2 */}
            <rect
              x="980"
              y="70"
              width="145"
              height="120"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="4"
            />
            <polygon
              points="970,70 1052,24 1135,70"
              fill="#3B82F6"
              stroke="#000000"
              strokeWidth="4"
            />
            <rect x="1005" y="95" width="30" height="28" fill="#FDE047" stroke="#000000" strokeWidth="3" />
            <rect x="1065" y="95" width="30" height="28" fill="#FDE047" stroke="#000000" strokeWidth="3" />

            {/* Street Lamps */}
            {[198, 405, 625, 895, 1150].map((lx) => (
              <g key={lx}>
                <line x1={lx} y1="115" x2={lx} y2="190" stroke="#000000" strokeWidth="5" />
                <circle cx={lx} cy="112" r="9" fill="#FACC15" stroke="#000000" strokeWidth="3" />
              </g>
            ))}

            {/* Sidewalk Pavement */}
            <rect
              x="0"
              y="190"
              width="1200"
              height="22"
              fill="#D4D4D8"
              stroke="#000000"
              strokeWidth="4"
            />

            {/* Asphalt Street Road */}
            <rect
              x="0"
              y="212"
              width="1200"
              height="48"
              fill="#27272A"
              stroke="#000000"
              strokeWidth="4"
            />

            {/* Road Dashed Center Line */}
            {[40, 160, 280, 400, 520, 640, 760, 880, 1000, 1120].map((rx) => (
              <rect key={rx} x={rx} y="232" width="60" height="8" fill="#FACC15" />
            ))}
          </svg>
        </div>

        {/* =========================================================
            ALTITUDE MARKERS RULER (EVERY 100 METERS)
            ========================================================= */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {altitudeMarkers.map((meters) => {
            const bottomPct = metersToBottomPercent(meters);
            return (
              <div
                key={meters}
                className="absolute left-0 right-0 flex items-center justify-between px-3"
                style={{ bottom: `${bottomPct}%` }}
              >
                {/* Left Marker */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black text-white border border-white/40 font-mono font-black text-[11px]">
                    {meters} متر
                  </span>
                  <div className="w-8 h-[2px] bg-black" />
                </div>

                {/* Subtle Horizontal Reference Line */}
                <div className="flex-1 border-b border-dashed border-black/25 mx-2" />

                {/* Right Marker */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-[2px] bg-black" />
                  <span className="px-2 py-0.5 rounded bg-black text-white border border-white/40 font-mono font-black text-[11px]">
                    {meters} متر
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================
            SIDE-BY-SIDE CONTESTANT GHOSTS
            ========================================================= */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {contestants.map((c, index) => {
            const isSpotlight =
              cameraMode === 'spotlight' && index === safeSpotlightIdx;
            const res = results[c.id];
            const displayedMeters = getGhostDisplayedMeters(c.id, index);
            const bottomPct = metersToBottomPercent(displayedMeters);
            const leftPct = getContestantXPercent(index, totalCount);

            // Show answer card once this ghost has been reached in spotlight sequence or during global overview
            const showAnswer =
              cameraMode === 'global_overview' || index <= safeSpotlightIdx;

            return (
              <div
                key={c.id}
                className="absolute -translate-x-1/2 transition-all duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  left: `${leftPct}%`,
                  bottom: `${bottomPct}%`,
                  zIndex: isSpotlight ? 40 : 20,
                }}
              >
                <GhostAvatar
                  name={c.name}
                  colorIndex={index}
                  totalMeters={displayedMeters}
                  roundMeters={res?.roundMeters}
                  answer={res?.answer}
                  comment={res?.comment}
                  tier={res?.tier}
                  showAnswerCard={showAnswer}
                  isSpotlight={isSpotlight}
                  size={isSpotlight ? 'lg' : 'md'}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
