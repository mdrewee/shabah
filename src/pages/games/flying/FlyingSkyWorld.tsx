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
    }, 600);

    return () => clearTimeout(launchTimer);
  }, [activeSpotlightIndex, cameraMode]);

  // Convert meters (0..5000) to vertical percentage inside the 260vh world
  const metersToBottomPercent = (meters: number): number => {
    const clamped = Math.max(0, Math.min(MAX_WORLD_METERS, meters));
    // 0m sits at 3.5% from bottom (standing on traditional stone street), 5000m sits at 95%
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

  // Large altitude markers up to 5000m as specified
  const altitudeMarkers = [5000, 4000, 3000, 2000, 1500, 1000, 500, 200];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030712] select-none">
      {/* 260vh World Canvas */}
      <div
        className="absolute left-0 right-0 bottom-0 w-full h-[260vh] origin-bottom transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transform: `translate3d(${cameraTranslateXPercent}%, ${cameraTranslateYPercent}%, 0) scale(${cameraScale})`,
        }}
      >
        {/* =========================================================
            LAYER 4: DEEP MIDNIGHT SKY & CELESTIAL REALM (1800m - 5000m)
            Deep Charcoal / Nocturnal Navy (#030712 to #0B0F17)
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#030712] overflow-hidden"
          style={{ bottom: '48%', top: '0%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1400 700" preserveAspectRatio="none">
            {/* Tranquil Crescent Moon */}
            <circle cx="1180" cy="130" r="42" fill="#E2E8F0" opacity="0.9" />
            <circle cx="1162" cy="122" r="38" fill="#030712" />

            {/* Distant Midnight Shooting Star Streaks */}
            <g stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
              <line x1="240" y1="80" x2="350" y2="140" />
              <line x1="840" y1="60" x2="930" y2="110" />
              <line x1="500" y1="260" x2="580" y2="310" />
            </g>

            {/* Quiet Starlight Constellations in Soft White and Warm Amber */}
            {[
              [70, 45], [180, 105], [310, 40], [450, 125], [600, 55],
              [730, 135], [870, 35], [980, 100], [1110, 50], [1280, 115],
              [130, 230], [260, 300], [410, 250], [570, 330], [720, 260],
              [850, 310], [1020, 240], [1210, 300], [1330, 220],
              [100, 410], [230, 480], [380, 430], [520, 500], [680, 420],
              [820, 490], [950, 410], [1100, 470], [1260, 430],
              [160, 580], [320, 620], [640, 590], [890, 630], [1180, 570],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i % 4 === 0 ? 2.5 : 1.5}
                fill={i % 3 === 0 ? '#FEF3C7' : '#E2E8F0'}
                opacity={i % 2 === 0 ? 0.85 : 0.6}
              />
            ))}
          </svg>
        </div>

        {/* =========================================================
            LAYER 3: SERENE NOCTURNAL CLOUDS (800m - 1800m)
            Dark Slate / Midnight Slate-Blue (#0B0F19 to #111827)
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#070D18] overflow-hidden"
          style={{ bottom: '26%', height: '26%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1400 380" preserveAspectRatio="none">
            {/* Cloud Group 1 */}
            <g fill="#0E1626" opacity="0.9">
              <path d="M 60 170 Q 140 110 230 170 Q 310 120 400 170 Q 480 140 550 190 L 60 190 Z" />
            </g>
            <g fill="#141E33" opacity="0.95">
              <rect x="90" y="175" width="410" height="24" rx="12" />
              <circle cx="190" cy="165" r="30" />
              <circle cx="295" cy="150" r="36" />
              <circle cx="400" cy="162" r="26" />
            </g>

            {/* Cloud Group 2 */}
            <g fill="#0E1626" opacity="0.9">
              <path d="M 800 200 Q 890 140 990 200 Q 1090 130 1210 200 Q 1290 160 1370 220 L 800 220 Z" />
            </g>
            <g fill="#141E33" opacity="0.95">
              <rect x="830" y="205" width="480" height="26" rx="13" />
              <circle cx="950" cy="188" r="34" />
              <circle cx="1070" cy="170" r="44" />
              <circle cx="1200" cy="190" r="30" />
            </g>
          </svg>
        </div>

        {/* =========================================================
            LAYER 2: SAUDI MODERN LANDMARKS SKYLINE (200m - 800m)
            Kingdom Tower, Al Faisaliah, KAFD with Warm Glowing Windows
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#0B0F17] overflow-hidden"
          style={{ bottom: '11%', height: '17%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1400 350" preserveAspectRatio="none">
            {/* Background Far Commercial Buildings Silhouette */}
            <g fill="#111827">
              <rect x="30" y="150" width="85" height="200" />
              <rect x="170" y="130" width="75" height="220" />
              <rect x="430" y="160" width="90" height="190" />
              <rect x="730" y="140" width="105" height="210" />
              <rect x="1030" y="125" width="85" height="225" />
              <rect x="1250" y="150" width="95" height="200" />

              {/* Scattered warm midnight window specks in distant skyline */}
              <g fill="#F59E0B" opacity="0.45">
                <rect x="45" y="170" width="6" height="4" />
                <rect x="65" y="195" width="6" height="4" />
                <rect x="85" y="220" width="6" height="4" />
                <rect x="185" y="160" width="6" height="4" />
                <rect x="210" y="185" width="6" height="4" />
                <rect x="750" y="165" width="6" height="4" />
                <rect x="780" y="195" width="6" height="4" />
                <rect x="1050" y="150" width="6" height="4" />
                <rect x="1080" y="180" width="6" height="4" />
                <rect x="1270" y="175" width="6" height="4" />
              </g>
            </g>

            {/* Midground Left: KAFD Towers (King Abdullah Financial District) */}
            <g fill="#1E293B" stroke="#030712" strokeWidth="2.5">
              {/* KAFD Faceted Tower 1 */}
              <polygon points="105,350 105,85 150,45 185,85 185,350" />
              {/* Architectural slit & glowing windows */}
              <line x1="145" y1="65" x2="145" y2="340" stroke="#0F172A" strokeWidth="2" />
              <g fill="#FEF3C7" opacity="0.85">
                {[95, 125, 155, 185, 215, 245, 275, 305].map((wy) => (
                  <g key={wy}>
                    <rect x="120" y={wy} width="8" height="5" rx="1" />
                    <rect x="160" y={wy} width="8" height="5" rx="1" />
                  </g>
                ))}
              </g>

              {/* KAFD Angled Tower 2 */}
              <polygon points="210,350 210,105 265,70 300,125 300,350" />
              <g fill="#F59E0B" opacity="0.8">
                {[120, 150, 180, 210, 240, 270, 300].map((wy) => (
                  <g key={wy}>
                    <rect x="230" y={wy} width="9" height="5" rx="1" />
                    <rect x="265" y={wy} width="9" height="5" rx="1" />
                  </g>
                ))}
              </g>
            </g>

            {/* Centerpiece 1: Kingdom Tower (برج المملكة) */}
            <g fill="#0F172A" stroke="#030712" strokeWidth="3">
              {/* Base and Tower Shaft */}
              <path d="M 575 350 L 605 55 L 625 15 L 675 15 L 695 55 L 725 350 Z" />

              {/* Parabolic Inverted Arch (فتحة القوس المعلق) */}
              <path
                d="M 618 70 C 628 130, 672 130, 682 70 Z"
                fill="#0B0F17"
                stroke="#030712"
                strokeWidth="2.5"
              />
              {/* Sky Bridge Walkway with Soft Ambient Light */}
              <rect x="622" y="20" width="56" height="10" fill="#FEF3C7" opacity="0.9" />

              {/* Architectural Vertical Slit */}
              <line x1="650" y1="125" x2="650" y2="340" stroke="#030712" strokeWidth="3" />

              {/* Midnight Office Windows Grid on Kingdom Tower */}
              <g fill="#FEF3C7" opacity="0.85">
                {[135, 160, 185, 210, 235, 260, 285, 310].map((wy) => (
                  <g key={wy}>
                    <rect x="625" y={wy} width="7" height="4" rx="1" />
                    <rect x="668" y={wy} width="7" height="4" rx="1" />
                  </g>
                ))}
              </g>
            </g>

            {/* Centerpiece 2: Al Faisaliah Tower (برج الفيصلية) */}
            <g fill="#0F172A" stroke="#030712" strokeWidth="3">
              {/* Pyramid Body */}
              <polygon points="865,350 920,45 930,45 985,350" />
              {/* The Iconic Golden Glass Sphere */}
              <circle cx="925" cy="90" r="16" fill="#D97706" stroke="#030712" strokeWidth="2.5" />
              <circle cx="923" cy="88" r="8" fill="#F59E0B" opacity="0.85" />

              {/* Architectural Spire Spike */}
              <line x1="925" y1="45" x2="925" y2="8" stroke="#D97706" strokeWidth="3.5" />

              {/* Faisaliah Floor Bands & Warm Windows */}
              <g fill="#FEF3C7" opacity="0.85">
                {[120, 145, 170, 195, 220, 245, 270, 295, 320].map((wy, idx) => {
                  const width = 14 + idx * 4;
                  return (
                    <rect
                      key={wy}
                      x={925 - width / 2}
                      y={wy}
                      width={width}
                      height="4"
                      rx="1"
                    />
                  );
                })}
              </g>
            </g>

            {/* Midground Right: KAFD Diamond & Angular Towers */}
            <g fill="#1E293B" stroke="#030712" strokeWidth="2.5">
              <polygon points="1115,350 1115,75 1170,35 1205,90 1205,350" />
              <polygon points="1225,350 1225,115 1280,80 1315,125 1315,350" />

              {/* Warm Amber Office Windows on Diamond Towers */}
              <g fill="#F59E0B" opacity="0.85">
                {[90, 120, 150, 180, 210, 240, 270, 300].map((wy) => (
                  <g key={wy}>
                    <rect x="1135" y={wy} width="8" height="5" rx="1" />
                    <rect x="1175" y={wy} width="8" height="5" rx="1" />
                  </g>
                ))}
                {[135, 165, 195, 225, 255, 285, 315].map((wy) => (
                  <g key={wy}>
                    <rect x="1250" y={wy} width="8" height="5" rx="1" />
                    <rect x="1285" y={wy} width="8" height="5" rx="1" />
                  </g>
                ))}
              </g>
            </g>

            {/* Spire Architectural Beacons */}
            <g fill="#FEF3C7" opacity="0.9">
              <circle cx="925" cy="8" r="3" />
              <circle cx="650" cy="14" r="3" />
              <circle cx="150" cy="43" r="2.5" />
              <circle cx="1170" cy="33" r="2.5" />
            </g>
          </svg>
        </div>

        {/* =========================================================
            LAYER 1: AUTHENTIC SAUDI HERITAGE & DATE PALMS (0m - 200m)
            Najdi Mud Houses, Triangular Plaster Vents & Ground Lanterns
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bottom-0 bg-[#0F141C] overflow-hidden"
          style={{ height: '11%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1400 240" preserveAspectRatio="none">
            {/* Heritage Mud Fortresses & Houses (Dark Slate / Charcoal Earthen Tones) */}
            {/* Left Heritage Fortress Wall */}
            <g fill="#1F1916" stroke="#050403" strokeWidth="3">
              <rect x="0" y="45" width="220" height="150" />
              {/* Stepped Crenellations (شرفات الطراز النجدي التراثي) */}
              <polygon points="0,45 15,22 30,45" fill="#1F1916" />
              <polygon points="35,45 50,22 65,45" fill="#1F1916" />
              <polygon points="70,45 85,22 100,45" fill="#1F1916" />
              <polygon points="105,45 120,22 135,45" fill="#1F1916" />
              <polygon points="140,45 155,22 170,45" fill="#1F1916" />
              <polygon points="175,45 190,22 205,45" fill="#1F1916" />

              {/* Traditional Triangular Plaster Vents (فتحات الجص المثلثية المضيئة بضوء دافئ) */}
              <g fill="#F59E0B" opacity="0.95">
                <polygon points="40,85 46,75 52,85" />
                <polygon points="60,85 66,75 72,85" />
                <polygon points="80,85 86,75 92,85" />
                <polygon points="100,85 106,75 112,85" />

                <polygon points="50,110 56,100 62,110" />
                <polygon points="70,110 76,100 82,110" />
                <polygon points="90,110 96,100 102,110" />
              </g>

              {/* Mud Tower Corner */}
              <polygon points="190,195 190,30 240,40 240,195" fill="#29211C" />
              <polygon points="190,30 205,12 220,35" fill="#29211C" />
              <polygon points="220,35 235,14 245,40" fill="#29211C" />
            </g>

            {/* Mid Traditional Mud Houses (Center) */}
            <g fill="#241D18" stroke="#050403" strokeWidth="3">
              <rect x="360" y="55" width="280" height="140" />
              {/* Crenellations */}
              {[370, 410, 450, 490, 530, 570, 610].map((cx) => (
                <polygon key={cx} points={`${cx},55 ${cx + 15},32 ${cx + 30},55`} fill="#241D18" />
              ))}

              {/* Traditional Heavy Wooden Gate (باب نجدي تراثي مقوس) */}
              <path
                d="M 480 195 L 480 115 C 480 95, 520 95, 520 115 L 520 195 Z"
                fill="#120E0C"
                stroke="#050403"
                strokeWidth="3.5"
              />
              {/* Gate Iron Studs / Nails */}
              <circle cx="490" cy="130" r="2.5" fill="#D97706" />
              <circle cx="490" cy="155" r="2.5" fill="#D97706" />
              <circle cx="510" cy="130" r="2.5" fill="#D97706" />
              <circle cx="510" cy="155" r="2.5" fill="#D97706" />

              {/* Warm Triangular Plaster Vents */}
              <g fill="#F59E0B" opacity="0.95">
                <polygon points="390,95 397,84 404,95" />
                <polygon points="415,95 422,84 429,95" />
                <polygon points="560,95 567,84 574,95" />
                <polygon points="585,95 592,84 599,95" />
              </g>
            </g>

            {/* Right Heritage Mud Fortress & Watchtower */}
            <g fill="#1F1916" stroke="#050403" strokeWidth="3">
              <rect x="790" y="45" width="260" height="150" />
              {[800, 840, 880, 920, 960, 1000].map((cx) => (
                <polygon key={cx} points={`${cx},45 ${cx + 15},24 ${cx + 30},45`} fill="#1F1916" />
              ))}

              {/* Warm Amber Vents */}
              <g fill="#F59E0B" opacity="0.95">
                <polygon points="830,90 837,78 844,90" />
                <polygon points="860,90 867,78 874,90" />
                <polygon points="890,90 897,78 904,90" />
                <polygon points="950,90 957,78 964,90" />
                <polygon points="980,90 987,78 994,90" />
              </g>

              {/* Far Right Watchtower */}
              <polygon points="1180,195 1190,30 1260,30 1270,195" fill="#29211C" />
              <polygon points="1195,30 1210,12 1225,30" fill="#29211C" />
              <polygon points="1230,30 1245,12 1260,30" fill="#29211C" />
            </g>

            {/* =========================================================
                DATE PALM TREE SILHOUETTES (أشجار النخيل الباسقة)
                ========================================================= */}
            {/* Left Palm Cluster */}
            <g stroke="#000000" strokeWidth="2">
              <path d="M 270 195 Q 266 120 274 45" stroke="#0F0C0A" strokeWidth="8" fill="none" strokeLinecap="round" />
              <g fill="#140F0D" stroke="#050403" strokeWidth="1.5">
                <path d="M 274 45 Q 230 15 190 35 Q 240 40 274 45 Z" />
                <path d="M 274 45 Q 240 5 220 -15 Q 255 15 274 45 Z" />
                <path d="M 274 45 Q 275 -15 285 -25 Q 285 20 274 45 Z" />
                <path d="M 274 45 Q 310 5 335 -10 Q 305 20 274 45 Z" />
                <path d="M 274 45 Q 320 20 355 45 Q 310 40 274 45 Z" />
                <path d="M 274 45 Q 315 50 330 75 Q 295 55 274 45 Z" />
                <path d="M 274 45 Q 235 50 215 70 Q 250 55 274 45 Z" />
              </g>

              <path d="M 315 195 Q 322 140 318 80" stroke="#0F0C0A" strokeWidth="7" fill="none" strokeLinecap="round" />
              <g fill="#140F0D" stroke="#050403" strokeWidth="1.5">
                <path d="M 318 80 Q 280 55 250 70 Q 290 75 318 80 Z" />
                <path d="M 318 80 Q 290 45 275 30 Q 305 55 318 80 Z" />
                <path d="M 318 80 Q 320 35 328 25 Q 328 60 318 80 Z" />
                <path d="M 318 80 Q 350 45 370 35 Q 345 60 318 80 Z" />
                <path d="M 318 80 Q 360 60 385 85 Q 345 75 318 80 Z" />
              </g>
            </g>

            {/* Right Palm Cluster */}
            <g stroke="#000000" strokeWidth="2">
              <path d="M 1100 195 Q 1105 115 1095 40" stroke="#0F0C0A" strokeWidth="8" fill="none" strokeLinecap="round" />
              <g fill="#140F0D" stroke="#050403" strokeWidth="1.5">
                <path d="M 1095 40 Q 1050 12 1010 32 Q 1060 36 1095 40 Z" />
                <path d="M 1095 40 Q 1060 2 1040 -18 Q 1075 12 1095 40 Z" />
                <path d="M 1095 40 Q 1095 -18 1105 -28 Q 1105 18 1095 40 Z" />
                <path d="M 1095 40 Q 1130 2 1155 -12 Q 1125 18 1095 40 Z" />
                <path d="M 1095 40 Q 1140 18 1175 42 Q 1130 38 1095 40 Z" />
                <path d="M 1095 40 Q 1135 48 1150 72 Q 1115 52 1095 40 Z" />
              </g>

              <path d="M 1340 195 Q 1335 130 1345 70" stroke="#0F0C0A" strokeWidth="7" fill="none" strokeLinecap="round" />
              <g fill="#140F0D" stroke="#050403" strokeWidth="1.5">
                <path d="M 1345 70 Q 1305 45 1275 60 Q 1315 65 1345 70 Z" />
                <path d="M 1345 70 Q 1315 35 1300 20 Q 1330 45 1345 70 Z" />
                <path d="M 1345 70 Q 1345 25 1355 15 Q 1355 50 1345 70 Z" />
                <path d="M 1345 70 Q 1375 35 1395 25 Q 1370 50 1345 70 Z" />
              </g>
            </g>

            {/* Wrought-Iron Street Lanterns Casting Warm Midnight Glow */}
            {[170, 345, 720, 1055, 1290].map((lx) => (
              <g key={lx}>
                <line x1={lx} y1="140" x2={lx} y2="195" stroke="#050403" strokeWidth="4" />
                <line x1={lx - 6} y1="140" x2={lx + 6} y2="140" stroke="#050403" strokeWidth="4" />
                <polygon
                  points={`${lx - 8},140 ${lx - 5},120 ${lx + 5},120 ${lx + 8},140`}
                  fill="#F59E0B"
                  stroke="#050403"
                  strokeWidth="2.5"
                />
                <polygon points={`${lx - 8},120 ${lx},112 ${lx + 8},120`} fill="#050403" />
                <circle cx={lx} cy="130" r="3.5" fill="#FEF08A" />
              </g>
            ))}

            {/* Traditional Stone Sidewalk */}
            <rect x="0" y="195" width="1400" height="15" fill="#171310" stroke="#050403" strokeWidth="3" />

            {/* Asphalt Ground Road */}
            <rect x="0" y="210" width="1400" height="30" fill="#0C0A09" />
          </svg>
        </div>

        {/* =========================================================
            CLEAN SOLID ALTITUDE RULER MARKERS (UP TO 5000 METERS)
            [5000, 4000, 3000, 2000, 1500, 1000, 500, 200]
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
                {/* Left Marker Badge */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#030712] text-white border-2 border-zinc-700 font-mono font-black text-xs shadow-md">
                    {meters} م
                  </span>
                  <div className="w-8 h-[2px] bg-zinc-600" />
                </div>

                {/* Clear Reference Dashed Line Across Sky */}
                <div className="flex-1 border-b border-dashed border-zinc-700/50 mx-3" />

                {/* Right Marker Badge */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-[2px] bg-zinc-600" />
                  <span className="px-2.5 py-1 rounded bg-[#030712] text-white border-2 border-zinc-700 font-mono font-black text-xs shadow-md">
                    {meters} م
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
                <div className="animate-hover-subtle">
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
