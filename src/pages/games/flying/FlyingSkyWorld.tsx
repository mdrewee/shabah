import React, { useEffect, useState } from 'react';
import { FlyingContestantResult } from './types';
import { GhostAvatar } from './GhostAvatar';

export const MAX_WORLD_METERS = 5000;

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
  const [hasLaunchedCurrent, setHasLaunchedCurrent] = useState(false);

  useEffect(() => {
    if (cameraMode !== 'spotlight') {
      setHasLaunchedCurrent(true);
      return;
    }
    setHasLaunchedCurrent(false);
    const launchTimer = setTimeout(() => {
      setHasLaunchedCurrent(true);
    }, 500);

    return () => clearTimeout(launchTimer);
  }, [activeSpotlightIndex, cameraMode]);

  // Convert meters (0..5000) to vertical percentage inside the 260vh world
  const metersToBottomPercent = (meters: number): number => {
    const clamped = Math.max(0, Math.min(MAX_WORLD_METERS, meters));
    // 0m sits at 3.5% from bottom (standing on stone ground), 5000m sits at 95%
    return 3.5 + (clamped / MAX_WORLD_METERS) * 91.5;
  };

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

  const totalCount = Math.max(1, contestants.length);
  const safeSpotlightIdx = Math.min(totalCount - 1, Math.max(0, activeSpotlightIndex));
  const activeContestant = contestants[safeSpotlightIdx];
  const activeAltitude = activeContestant
    ? getGhostDisplayedMeters(activeContestant.id, safeSpotlightIdx)
    : 0;

  const highestMeters = Math.max(
    300,
    ...contestants.map((c, idx) => getGhostDisplayedMeters(c.id, idx))
  );

  const getContestantXPercent = (index: number, count: number): number => {
    if (count <= 1) return 50;
    const span = 68; // 16% to 84%
    return 16 + (index / (count - 1)) * span;
  };

  let cameraScale = 1;
  let cameraTranslateXPercent = 0;
  let cameraTranslateYPercent = 0;

  if (cameraMode === 'spotlight' && activeContestant) {
    cameraScale = 1.15;
    const xPercent = getContestantXPercent(safeSpotlightIdx, totalCount);
    cameraTranslateXPercent = (50 - xPercent) * 0.55;
    const altitudeRatio = Math.max(0, Math.min(1, activeAltitude / MAX_WORLD_METERS));
    cameraTranslateYPercent = altitudeRatio * 58;
  } else {
    cameraScale = highestMeters > 3500 ? 0.35 : highestMeters > 2000 ? 0.44 : highestMeters > 1000 ? 0.54 : 0.65;
    cameraTranslateXPercent = 0;
    const midRatio = Math.min(0.52, (highestMeters / MAX_WORLD_METERS) * 0.48);
    cameraTranslateYPercent = midRatio * 45;
  }

  // Large altitude markers up to 5000m
  const altitudeMarkers = [5000, 4000, 3000, 2000, 1500, 1000, 500, 200];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030712] select-none pixel-art">
      {/* 260vh World Canvas with Stepped Arcade Easing */}
      <div
        className="absolute left-0 right-0 bottom-0 w-full h-[260vh] origin-bottom transition-transform duration-[1200ms] ease-out"
        style={{
          transform: `translate3d(${cameraTranslateXPercent}%, ${cameraTranslateYPercent}%, 0) scale(${cameraScale})`,
        }}
      >
        <img
          src="/images/games/flying-sky.svg"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full pointer-events-none"
        />

        {/* =========================================================
            CLEAN SOLID ALTITUDE RULER MARKERS (UP TO 5000 METERS)
            16-Bit Pixel Box Badges with Stepped Dashed Reference Lines
            ========================================================= */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {altitudeMarkers.map((meters) => {
            const bottomPct = metersToBottomPercent(meters);
            return (
              <div
                key={meters}
                className="absolute left-0 right-0 flex items-center justify-between px-4"
                style={{ bottom: `${bottomPct}%` }}
              >
                {/* Left Pixel Marker Badge */}
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-black text-white border-2 border-zinc-600 font-mono font-black text-xs shadow-[2px_2px_0px_#000]">
                    {meters} م
                  </div>
                  <div className="w-8 h-1 bg-zinc-600" />
                </div>

                {/* Pixel Dashed Reference Line Across Sky */}
                <div className="flex-1 border-b-2 border-dashed border-zinc-700/60 mx-3" />

                {/* Right Pixel Marker Badge */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-zinc-600" />
                  <div className="px-2.5 py-1 bg-black text-white border-2 border-zinc-600 font-mono font-black text-xs shadow-[2px_2px_0px_#000]">
                    {meters} م
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================
            CONTESTANT GHOSTS SIDE-BY-SIDE
            ========================================================= */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {contestants.map((c, index) => {
            const isSpotlight =
              cameraMode === 'spotlight' && index === safeSpotlightIdx;
            const res = results[c.id];
            const displayedMeters = getGhostDisplayedMeters(c.id, index);
            const bottomPct = metersToBottomPercent(displayedMeters);
            const leftPct = getContestantXPercent(index, totalCount);

            const showAnswer =
              cameraMode === 'global_overview' || index <= safeSpotlightIdx;

            return (
              <div
                key={c.id}
                className="absolute -translate-x-1/2 transition-all duration-[1200ms] ease-out"
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
