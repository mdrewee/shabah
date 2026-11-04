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
  const [hasLaunchedCurrent, setHasLaunchedCurrent] = useState(false);

  useEffect(() => {
    if (cameraMode !== 'spotlight') {
      setHasLaunchedCurrent(true);
      return;
    }
    setHasLaunchedCurrent(false);
    const launchTimer = setTimeout(() => {
      setHasLaunchedCurrent(true);
    }, 600);

    return () => clearTimeout(launchTimer);
  }, [activeSpotlightIndex, cameraMode]);

  // Convert meters (0..1500) to vertical percentage inside the 260vh world
  const metersToBottomPercent = (meters: number): number => {
    const clamped = Math.max(0, Math.min(MAX_WORLD_METERS, meters));
    // 0m sits at 3.5% from bottom (standing on traditional stone street), 1500m sits at 95%
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
    cameraScale = highestMeters > 950 ? 0.42 : highestMeters > 500 ? 0.52 : 0.65;
    cameraTranslateXPercent = 0;
    const midRatio = Math.min(0.45, (highestMeters / MAX_WORLD_METERS) * 0.32);
    cameraTranslateYPercent = midRatio * 40;
  }

  const altitudeMarkers = Array.from({ length: 15 }, (_, i) => (i + 1) * 100);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070A11] select-none">
      {/* 260vh World Canvas */}
      <div
        className="absolute left-0 right-0 bottom-0 w-full h-[260vh] origin-bottom transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transform: `translate3d(${cameraTranslateXPercent}%, ${cameraTranslateYPercent}%, 0) scale(${cameraScale})`,
        }}
      >
        {/* =========================================================
            LAYER 4: DEEP NIGHT SPACE & CELESTIAL SKY (800m+)
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#070A11] overflow-hidden"
          style={{ bottom: '52%', top: '0%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1400 650" preserveAspectRatio="none">
            {/* Soft Ambient Moon */}
            <circle cx="1180" cy="140" r="44" fill="#E2E8F0" />
            <circle cx="1160" cy="130" r="40" fill="#070A11" />

            {/* Shooting Star Trails */}
            <g stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
              <line x1="280" y1="90" x2="390" y2="150" />
              <line x1="820" y1="70" x2="910" y2="120" />
              <line x1="520" y1="280" x2="600" y2="330" />
            </g>

            {/* Peaceful Starlight Points */}
            {[
              [80, 50], [190, 110], [320, 45], [460, 130], [610, 60],
              [740, 140], [880, 40], [990, 105], [1120, 55], [1290, 120],
              [140, 240], [270, 310], [420, 260], [580, 340], [730, 270],
              [860, 320], [1030, 250], [1220, 310], [1340, 230],
              [110, 420], [240, 490], [390, 440], [530, 510], [690, 430],
              [830, 500], [960, 420], [1110, 480], [1270, 440],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i % 3 === 0 ? 2.5 : 1.5}
                fill={i % 4 === 0 ? '#FDE047' : '#F8FAFC'}
                opacity={0.75}
              />
            ))}
          </svg>
        </div>

        {/* =========================================================
            LAYER 3: SERENE NOCTURNAL CLOUDS (450m - 800m)
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#0C1220] overflow-hidden"
          style={{ bottom: '30%', height: '22%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1400 360" preserveAspectRatio="none">
            {/* Cloud Group 1 */}
            <g fill="#162033" opacity="0.85">
              <path d="M 80 160 Q 150 110 240 160 Q 320 120 400 160 Q 480 140 540 180 L 80 180 Z" />
            </g>
            <g fill="#1E2B45" opacity="0.95">
              <rect x="110" y="165" width="380" height="22" rx="11" />
              <circle cx="210" cy="155" r="28" />
              <circle cx="310" cy="145" r="34" />
              <circle cx="410" cy="155" r="24" />
            </g>

            {/* Cloud Group 2 */}
            <g fill="#162033" opacity="0.85">
              <path d="M 820 190 Q 900 140 1000 190 Q 1100 130 1220 190 Q 1300 160 1360 210 L 820 210 Z" />
            </g>
            <g fill="#1E2B45" opacity="0.95">
              <rect x="850" y="195" width="460" height="24" rx="12" />
              <circle cx="970" cy="180" r="32" />
              <circle cx="1080" cy="165" r="42" />
              <circle cx="1210" cy="182" r="28" />
            </g>
          </svg>
        </div>

        {/* =========================================================
            LAYER 2: SAUDI MODERN LANDMARKS SKYLINE (150m - 450m)
            Architectural Silhouettes: Kingdom Tower, Al Faisaliah, KAFD
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#121927] overflow-hidden"
          style={{ bottom: '12%', height: '18%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1400 340" preserveAspectRatio="none">
            {/* Background Far Buildings Silhouette */}
            <g fill="#182236">
              <rect x="40" y="160" width="85" height="180" />
              <rect x="180" y="140" width="75" height="200" />
              <rect x="440" y="170" width="90" height="170" />
              <rect x="740" y="150" width="110" height="190" />
              <rect x="1040" y="130" width="80" height="210" />
              <rect x="1260" y="160" width="90" height="180" />
            </g>

            {/* Midground Silhouette: KAFD Towers (King Abdullah Financial District) */}
            <g fill="#1E293B" stroke="#0B0F19" strokeWidth="2.5">
              {/* KAFD Faceted Tower 1 */}
              <polygon points="110,340 110,90 155,50 190,90 190,340" />
              {/* Window lines */}
              <line x1="150" y1="70" x2="150" y2="330" stroke="#334155" strokeWidth="2" />

              {/* KAFD Angled Tower 2 */}
              <polygon points="215,340 215,110 270,75 305,130 305,340" />
            </g>

            {/* Main Center Landmark: Kingdom Tower (برج المملكة) */}
            <g fill="#0F172A" stroke="#000000" strokeWidth="3">
              {/* Base and Shaft */}
              <path d="M 580 340 L 610 60 L 630 20 L 670 20 L 690 60 L 720 340 Z" />

              {/* Inverted Parabolic Arch & Sky Bridge (فتحة القوس المعلق) */}
              <path
                d="M 622 75 C 632 135, 668 135, 678 75 Z"
                fill="#121927"
              />
              {/* Sky Bridge walkway */}
              <rect x="626" y="24" width="48" height="10" fill="#38BDF8" opacity="0.75" />

              {/* Vertical architectural slit windows */}
              <line x1="650" y1="130" x2="650" y2="330" stroke="#1E293B" strokeWidth="3" />
            </g>

            {/* Main Landmark: Al Faisaliah Tower (برج الفيصلية) */}
            <g fill="#0F172A" stroke="#000000" strokeWidth="3">
              {/* Pyramid Shaft */}
              <polygon points="870,340 925,50 935,50 990,340" />
              {/* Golden/Warm Glass Globe near the apex */}
              <circle cx="930" cy="95" r="15" fill="#D97706" stroke="#000000" strokeWidth="2.5" />
              {/* Spire Spike */}
              <line x1="930" y1="50" x2="930" y2="12" stroke="#D97706" strokeWidth="3.5" />
            </g>

            {/* KAFD Diamond Tower (Right) */}
            <g fill="#1E293B" stroke="#0B0F19" strokeWidth="2.5">
              <polygon points="1120,340 1120,80 1175,40 1210,95 1210,340" />
              <polygon points="1230,340 1230,120 1285,85 1320,130 1320,340" />
            </g>

            {/* Architectural accent lights */}
            <g fill="#FDE047" opacity="0.8">
              <circle cx="930" cy="12" r="3" />
              <circle cx="650" cy="18" r="3" />
              <circle cx="155" cy="48" r="2.5" />
              <circle cx="1175" cy="38" r="2.5" />
            </g>
          </svg>
        </div>

        {/* =========================================================
            LAYER 1: AUTHENTIC SAUDI HERITAGE & PALM TREES (0m - 150m)
            Najdi Mud Architecture, Crenellations, Plaster Vents, Date Palms
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bottom-0 bg-[#161C26] overflow-hidden"
          style={{ height: '12%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1400 240" preserveAspectRatio="none">
            {/* Heritage Mud Fortresses & Houses Silhouette (Charcoal & Warm Earthen Taupe) */}
            {/* Left Heritage Fortress Wall */}
            <g fill="#241E1A" stroke="#0B0907" strokeWidth="3">
              <rect x="0" y="45" width="220" height="150" />
              {/* Stepped Crenellations (شرفات الطراز النجدي) */}
              <polygon points="0,45 15,22 30,45" fill="#241E1A" />
              <polygon points="35,45 50,22 65,45" fill="#241E1A" />
              <polygon points="70,45 85,22 100,45" fill="#241E1A" />
              <polygon points="105,45 120,22 135,45" fill="#241E1A" />
              <polygon points="140,45 155,22 170,45" fill="#241E1A" />
              <polygon points="175,45 190,22 205,45" fill="#241E1A" />

              {/* Traditional Triangular Plaster Vents (فتحات الجص المثلثية التراثية) */}
              <g fill="#F59E0B" opacity="0.9">
                <polygon points="40,85 46,75 52,85" />
                <polygon points="60,85 66,75 72,85" />
                <polygon points="80,85 86,75 92,85" />
                <polygon points="100,85 106,75 112,85" />

                <polygon points="50,110 56,100 62,110" />
                <polygon points="70,110 76,100 82,110" />
                <polygon points="90,110 96,100 102,110" />
              </g>

              {/* Mud Tower Corner */}
              <polygon points="190,195 190,30 240,40 240,195" fill="#2E2621" />
              <polygon points="190,30 205,12 220,35" fill="#2E2621" />
              <polygon points="220,35 235,14 245,40" fill="#2E2621" />
            </g>

            {/* Mid Traditional Mud Houses (Center) */}
            <g fill="#28221D" stroke="#0B0907" strokeWidth="3">
              <rect x="360" y="55" width="280" height="140" />
              {/* Crenellations */}
              {[370, 410, 450, 490, 530, 570, 610].map((cx) => (
                <polygon key={cx} points={`${cx},55 ${cx + 15},32 ${cx + 30},55`} fill="#28221D" />
              ))}

              {/* Traditional Heavy Wooden Gate (باب نجدي تراثي مقوس) */}
              <path
                d="M 480 195 L 480 115 C 480 95, 520 95, 520 115 L 520 195 Z"
                fill="#181310"
                stroke="#000000"
                strokeWidth="3.5"
              />
              {/* Gate Nails / Iron Studs */}
              <circle cx="490" cy="130" r="2.5" fill="#D97706" />
              <circle cx="490" cy="155" r="2.5" fill="#D97706" />
              <circle cx="510" cy="130" r="2.5" fill="#D97706" />
              <circle cx="510" cy="155" r="2.5" fill="#D97706" />

              {/* Triangle Vents */}
              <g fill="#F59E0B" opacity="0.9">
                <polygon points="390,95 397,84 404,95" />
                <polygon points="415,95 422,84 429,95" />
                <polygon points="560,95 567,84 574,95" />
                <polygon points="585,95 592,84 599,95" />
              </g>
            </g>

            {/* Right Heritage Mud Fortress & Watchtower */}
            <g fill="#241E1A" stroke="#0B0907" strokeWidth="3">
              <rect x="790" y="45" width="260" height="150" />
              {[800, 840, 880, 920, 960, 1000].map((cx) => (
                <polygon key={cx} points={`${cx},45 ${cx + 15},24 ${cx + 30},45`} fill="#241E1A" />
              ))}

              {/* Triangular Vents */}
              <g fill="#F59E0B" opacity="0.9">
                <polygon points="830,90 837,78 844,90" />
                <polygon points="860,90 867,78 874,90" />
                <polygon points="890,90 897,78 904,90" />
                <polygon points="950,90 957,78 964,90" />
                <polygon points="980,90 987,78 994,90" />
              </g>

              {/* Watchtower on far right */}
              <polygon points="1180,195 1190,30 1260,30 1270,195" fill="#2E2621" />
              <polygon points="1195,30 1210,12 1225,30" fill="#2E2621" />
              <polygon points="1230,30 1245,12 1260,30" fill="#2E2621" />
            </g>

            {/* =========================================================
                DATE PALM TREE SILHOUETTES (أشجار النخيل الباسقة)
                ========================================================= */}
            {/* Left Palm Cluster */}
            <g stroke="#000000" strokeWidth="2">
              {/* Palm 1 (Tall Left) */}
              <path d="M 270 195 Q 266 120 274 45" stroke="#120E0B" strokeWidth="8" fill="none" strokeLinecap="round" />
              {/* Fronds */}
              <g fill="#181310" stroke="#0B0907" strokeWidth="1.5">
                <path d="M 274 45 Q 230 15 190 35 Q 240 40 274 45 Z" />
                <path d="M 274 45 Q 240 5 220 -15 Q 255 15 274 45 Z" />
                <path d="M 274 45 Q 275 -15 285 -25 Q 285 20 274 45 Z" />
                <path d="M 274 45 Q 310 5 335 -10 Q 305 20 274 45 Z" />
                <path d="M 274 45 Q 320 20 355 45 Q 310 40 274 45 Z" />
                <path d="M 274 45 Q 315 50 330 75 Q 295 55 274 45 Z" />
                <path d="M 274 45 Q 235 50 215 70 Q 250 55 274 45 Z" />
              </g>

              {/* Palm 2 (Shorter Left) */}
              <path d="M 315 195 Q 322 140 318 80" stroke="#120E0B" strokeWidth="7" fill="none" strokeLinecap="round" />
              <g fill="#181310" stroke="#0B0907" strokeWidth="1.5">
                <path d="M 318 80 Q 280 55 250 70 Q 290 75 318 80 Z" />
                <path d="M 318 80 Q 290 45 275 30 Q 305 55 318 80 Z" />
                <path d="M 318 80 Q 320 35 328 25 Q 328 60 318 80 Z" />
                <path d="M 318 80 Q 350 45 370 35 Q 345 60 318 80 Z" />
                <path d="M 318 80 Q 360 60 385 85 Q 345 75 318 80 Z" />
              </g>
            </g>

            {/* Right Palm Cluster */}
            <g stroke="#000000" strokeWidth="2">
              {/* Palm 3 (Tall Right) */}
              <path d="M 1100 195 Q 1105 115 1095 40" stroke="#120E0B" strokeWidth="8" fill="none" strokeLinecap="round" />
              <g fill="#181310" stroke="#0B0907" strokeWidth="1.5">
                <path d="M 1095 40 Q 1050 12 1010 32 Q 1060 36 1095 40 Z" />
                <path d="M 1095 40 Q 1060 2 1040 -18 Q 1075 12 1095 40 Z" />
                <path d="M 1095 40 Q 1095 -18 1105 -28 Q 1105 18 1095 40 Z" />
                <path d="M 1095 40 Q 1130 2 1155 -12 Q 1125 18 1095 40 Z" />
                <path d="M 1095 40 Q 1140 18 1175 42 Q 1130 38 1095 40 Z" />
                <path d="M 1095 40 Q 1135 48 1150 72 Q 1115 52 1095 40 Z" />
              </g>

              {/* Palm 4 (Far Right) */}
              <path d="M 1340 195 Q 1335 130 1345 70" stroke="#120E0B" strokeWidth="7" fill="none" strokeLinecap="round" />
              <g fill="#181310" stroke="#0B0907" strokeWidth="1.5">
                <path d="M 1345 70 Q 1305 45 1275 60 Q 1315 65 1345 70 Z" />
                <path d="M 1345 70 Q 1315 35 1300 20 Q 1330 45 1345 70 Z" />
                <path d="M 1345 70 Q 1345 25 1355 15 Q 1355 50 1345 70 Z" />
                <path d="M 1345 70 Q 1375 35 1395 25 Q 1370 50 1345 70 Z" />
              </g>
            </g>

            {/* Traditional Wrought-Iron Ground Lanterns (فوانيس إضاءة أرضية دافئة) */}
            {[170, 345, 720, 1055, 1290].map((lx) => (
              <g key={lx}>
                {/* Lantern Post */}
                <line x1={lx} y1="140" x2={lx} y2="195" stroke="#0B0907" strokeWidth="4" />
                <line x1={lx - 6} y1="140" x2={lx + 6} y2="140" stroke="#0B0907" strokeWidth="4" />
                {/* Lantern Body */}
                <polygon
                  points={`${lx - 8},140 ${lx - 5},120 ${lx + 5},120 ${lx + 8},140`}
                  fill="#F59E0B"
                  stroke="#0B0907"
                  strokeWidth="2.5"
                />
                {/* Lantern Cap */}
                <polygon points={`${lx - 8},120 ${lx},112 ${lx + 8},120`} fill="#0B0907" />
                {/* Subtle Warm Core */}
                <circle cx={lx} cy="130" r="3.5" fill="#FEF08A" />
              </g>
            ))}

            {/* Traditional Stone Sidewalk Pavement */}
            <rect x="0" y="195" width="1400" height="15" fill="#1C1815" stroke="#0B0907" strokeWidth="3" />

            {/* Asphalt Ground Road */}
            <rect x="0" y="210" width="1400" height="30" fill="#14110F" />
          </svg>
        </div>

        {/* =========================================================
            CLEAN SOLID ALTITUDE MARKERS (EVERY 100 METERS)
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
                  <span className="px-2 py-0.5 rounded bg-[#0B0F19] text-white border border-zinc-700 font-mono font-black text-[11px]">
                    {meters} متر
                  </span>
                  <div className="w-6 h-[1.5px] bg-zinc-600" />
                </div>

                {/* Subtle Reference Line */}
                <div className="flex-1 border-b border-dashed border-zinc-800/40 mx-2" />

                {/* Right Marker */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[1.5px] bg-zinc-600" />
                  <span className="px-2 py-0.5 rounded bg-[#0B0F19] text-white border border-zinc-700 font-mono font-black text-[11px]">
                    {meters} متر
                  </span>
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
