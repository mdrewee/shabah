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
        {/* =========================================================
            LAYER 4: 16-BIT PIXEL SKY & CELESTIAL REALM (1800m - 5000m)
            Deep Charcoal / Nocturnal Navy (#030712 to #0B0F17)
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#030712] overflow-hidden"
          style={{ bottom: '48%', top: '0%' }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 1400 700"
            preserveAspectRatio="none"
            style={{ shapeRendering: 'crispEdges' }}
          >
            {/* Stepped Pixel Crescent Moon (16-Bit Style) */}
            <g fill="#E2E8F0">
              <rect x="1170" y="90" width="30" height="6" />
              <rect x="1164" y="96" width="42" height="6" />
              <rect x="1158" y="102" width="48" height="6" />
              <rect x="1158" y="108" width="42" height="6" />
              <rect x="1158" y="114" width="36" height="6" />
              <rect x="1164" y="120" width="30" height="6" />
              <rect x="1170" y="126" width="24" height="6" />
              <rect x="1176" y="132" width="18" height="6" />
              <rect x="1182" y="138" width="12" height="6" />
            </g>
            {/* Cutout to shape crescent */}
            <g fill="#030712">
              <rect x="1176" y="96" width="36" height="6" />
              <rect x="1172" y="102" width="42" height="6" />
              <rect x="1168" y="108" width="36" height="6" />
              <rect x="1166" y="114" width="30" height="6" />
              <rect x="1170" y="120" width="24" height="6" />
            </g>

            {/* Stepped Pixel Shooting Stars */}
            <g fill="#64748B">
              <rect x="250" y="80" width="4" height="4" />
              <rect x="254" y="84" width="6" height="4" />
              <rect x="260" y="88" width="8" height="4" />
              <rect x="268" y="92" width="12" height="4" />
              <rect x="280" y="96" width="16" height="4" />

              <rect x="850" y="60" width="4" height="4" />
              <rect x="854" y="64" width="6" height="4" />
              <rect x="860" y="68" width="10" height="4" />
              <rect x="870" y="72" width="14" height="4" />
            </g>

            {/* 16-Bit Diamond Pixel Stars (Cross Shape: 1 center, 4 wings) */}
            {[
              [80, 50], [190, 110], [320, 45], [460, 130], [610, 60],
              [740, 140], [880, 40], [990, 105], [1120, 55], [1290, 120],
              [140, 240], [270, 310], [420, 260], [580, 340], [730, 270],
              [860, 320], [1030, 250], [1220, 310], [1340, 230],
              [110, 420], [240, 490], [390, 440], [530, 510], [690, 430],
              [830, 500], [960, 420], [1110, 480], [1270, 440],
              [170, 590], [330, 630], [650, 600], [900, 640], [1190, 580],
            ].map(([x, y], i) => {
              const starColor = i % 3 === 0 ? '#FEF3C7' : '#E2E8F0';
              return (
                <g key={i} fill={starColor}>
                  {/* Center pixel */}
                  <rect x={x} y={y} width="4" height="4" />
                  {i % 2 === 0 && (
                    <>
                      <rect x={x - 4} y={y} width="4" height="4" opacity="0.6" />
                      <rect x={x + 4} y={y} width="4" height="4" opacity="0.6" />
                      <rect x={x} y={y - 4} width="4" height="4" opacity="0.6" />
                      <rect x={x} y={y + 4} width="4" height="4" opacity="0.6" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* =========================================================
            LAYER 3: 16-BIT PIXEL CLOUDS (800m - 1800m)
            Blocky Stepped Pixel Cloud Formations
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#070D18] overflow-hidden"
          style={{ bottom: '26%', height: '26%' }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 1400 380"
            preserveAspectRatio="none"
            style={{ shapeRendering: 'crispEdges' }}
          >
            {/* Left Pixel Cloud Structure */}
            <g fill="#0E1626">
              <rect x="70" y="190" width="380" height="30" />
              <rect x="110" y="170" width="300" height="20" />
              <rect x="160" y="150" width="190" height="20" />
              <rect x="200" y="130" width="100" height="20" />
            </g>
            <g fill="#141E33">
              <rect x="80" y="195" width="360" height="20" />
              <rect x="120" y="175" width="280" height="20" />
              <rect x="170" y="155" width="170" height="20" />
              <rect x="210" y="135" width="80" height="20" />
            </g>

            {/* Right Pixel Cloud Structure */}
            <g fill="#0E1626">
              <rect x="820" y="210" width="450" height="30" />
              <rect x="870" y="190" width="360" height="20" />
              <rect x="930" y="170" width="230" height="20" />
              <rect x="980" y="150" width="120" height="20" />
            </g>
            <g fill="#141E33">
              <rect x="830" y="215" width="430" height="20" />
              <rect x="880" y="195" width="340" height="20" />
              <rect x="940" y="175" width="210" height="20" />
              <rect x="990" y="155" width="100" height="20" />
            </g>
          </svg>
        </div>

        {/* =========================================================
            LAYER 2: 16-BIT PIXEL SKYLINE (200m - 800m)
            Stepped Kingdom Tower, Al Faisaliah, KAFD Towers
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bg-[#0B0F17] overflow-hidden"
          style={{ bottom: '11%', height: '17%' }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 1400 350"
            preserveAspectRatio="none"
            style={{ shapeRendering: 'crispEdges' }}
          >
            {/* Background Far Pixel Blocks (Distant Skyline) */}
            <g fill="#111827">
              <rect x="40" y="170" width="70" height="180" />
              <rect x="170" y="140" width="80" height="210" />
              <rect x="420" y="160" width="90" height="190" />
              <rect x="730" y="150" width="100" height="200" />
              <rect x="1030" y="130" width="80" height="220" />
              <rect x="1250" y="160" width="90" height="190" />

              {/* Scattered Square Pixel Windows (Amber) */}
              <g fill="#F59E0B" opacity="0.4">
                <rect x="50" y="190" width="8" height="8" />
                <rect x="70" y="210" width="8" height="8" />
                <rect x="180" y="160" width="8" height="8" />
                <rect x="200" y="180" width="8" height="8" />
                <rect x="740" y="170" width="8" height="8" />
                <rect x="760" y="190" width="8" height="8" />
                <rect x="1040" y="150" width="8" height="8" />
                <rect x="1060" y="170" width="8" height="8" />
              </g>
            </g>

            {/* Midground Left: Pixel KAFD Towers */}
            <g fill="#1E293B">
              {/* Stepped Angular Tower 1 */}
              <rect x="100" y="100" width="70" height="250" />
              <rect x="110" y="80" width="50" height="20" />
              <rect x="120" y="60" width="30" height="20" />
              <rect x="130" y="45" width="10" height="15" fill="#FEF3C7" />

              {/* Square Pixel Windows Grid */}
              <g fill="#FEF3C7" opacity="0.85">
                {[110, 140, 170, 200, 230, 260, 290, 320].map((wy) => (
                  <g key={wy}>
                    <rect x="115" y={wy} width="8" height="8" />
                    <rect x="145" y={wy} width="8" height="8" />
                  </g>
                ))}
              </g>

              {/* Stepped Angular Tower 2 */}
              <rect x="210" y="120" width="80" height="230" />
              <rect x="220" y="100" width="60" height="20" />
              <rect x="230" y="80" width="40" height="20" />
              <rect x="240" y="70" width="20" height="10" fill="#F59E0B" />

              <g fill="#F59E0B" opacity="0.8">
                {[130, 160, 190, 220, 250, 280, 310].map((wy) => (
                  <g key={wy}>
                    <rect x="225" y={wy} width="8" height="8" />
                    <rect x="265" y={wy} width="8" height="8" />
                  </g>
                ))}
              </g>
            </g>

            {/* Centerpiece 1: 16-Bit Pixel Kingdom Tower (برج المملكة بالبكسل) */}
            <g fill="#0F172A">
              {/* Main Shaft (Stepped Width from Base to Top) */}
              <rect x="580" y="260" width="140" height="90" />
              <rect x="590" y="180" width="120" height="80" />
              <rect x="600" y="100" width="100" height="80" />
              <rect x="610" y="30" width="80" height="70" />

              {/* Left & Right Spire Arches */}
              <rect x="610" y="10" width="16" height="20" />
              <rect x="674" y="10" width="16" height="20" />

              {/* Top Skybridge Walkway (Illuminated Pixel Bridge) */}
              <rect x="626" y="14" width="48" height="8" fill="#FEF3C7" />

              {/* Parabolic Inverted Arch Cutout (Stepped Pixel Cutout) */}
              <g fill="#0B0F17">
                <rect x="626" y="22" width="48" height="10" />
                <rect x="632" y="32" width="36" height="12" />
                <rect x="638" y="44" width="24" height="14" />
                <rect x="644" y="58" width="12" height="12" />
              </g>

              {/* Vertical Columns of Square Pixel Windows */}
              <g fill="#FEF3C7" opacity="0.85">
                {[110, 135, 160, 185, 210, 235, 260, 285, 310].map((wy) => (
                  <g key={wy}>
                    <rect x="620" y={wy} width="6" height="6" />
                    <rect x="640" y={wy} width="6" height="6" />
                    <rect x="654" y={wy} width="6" height="6" />
                    <rect x="674" y={wy} width="6" height="6" />
                  </g>
                ))}
              </g>
            </g>

            {/* Centerpiece 2: 16-Bit Pixel Al Faisaliah Tower (برج الفيصلية بالبكسل) */}
            <g fill="#0F172A">
              {/* Stepped Pyramid Shaft */}
              <rect x="880" y="270" width="100" height="80" />
              <rect x="895" y="190" width="70" height="80" />
              <rect x="910" y="110" width="40" height="80" />
              <rect x="920" y="50" width="20" height="60" />

              {/* Golden Pixel Globe */}
              <rect x="918" y="70" width="24" height="24" fill="#D97706" />
              <rect x="922" y="74" width="16" height="16" fill="#F59E0B" />
              <rect x="926" y="78" width="8" height="8" fill="#FEF08A" />

              {/* Pixel Spire Needle */}
              <rect x="928" y="15" width="4" height="35" fill="#D97706" />
              <rect x="926" y="10" width="8" height="5" fill="#FEF3C7" />

              {/* Stepped Pixel Window Bands */}
              <g fill="#FEF3C7" opacity="0.85">
                {[130, 155, 180, 210, 240, 270, 300, 325].map((wy, idx) => {
                  const width = 12 + idx * 6;
                  return (
                    <rect
                      key={wy}
                      x={930 - width / 2}
                      y={wy}
                      width={width}
                      height="5"
                    />
                  );
                })}
              </g>
            </g>

            {/* Midground Right: Pixel KAFD Diamond Towers */}
            <g fill="#1E293B">
              <rect x="1110" y="110" width="80" height="240" />
              <rect x="1120" y="90" width="60" height="20" />
              <rect x="1135" y="70" width="30" height="20" />
              <rect x="1145" y="55" width="10" height="15" fill="#FEF3C7" />

              <g fill="#F59E0B" opacity="0.85">
                {[120, 150, 180, 210, 240, 270, 300].map((wy) => (
                  <g key={wy}>
                    <rect x="1125" y={wy} width="8" height="8" />
                    <rect x="1165" y={wy} width="8" height="8" />
                  </g>
                ))}
              </g>
            </g>
          </svg>
        </div>

        {/* =========================================================
            LAYER 1: 16-BIT PIXEL SAUDI HERITAGE & PALMS (0m - 200m)
            Najdi Mud Fortresses, Stepped Merlons, Pixel Date Palms
            ========================================================= */}
        <div
          className="absolute left-0 right-0 bottom-0 bg-[#0F141C] overflow-hidden"
          style={{ height: '11%' }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 1400 240"
            preserveAspectRatio="none"
            style={{ shapeRendering: 'crispEdges' }}
          >
            {/* Left Heritage Mud Fortress Wall */}
            <g fill="#1F1916">
              <rect x="0" y="50" width="220" height="145" />

              {/* Stepped Triangular Pixel Merlons (شرفات الطراز النجدي بالبكسل) */}
              {[0, 30, 60, 90, 120, 150, 180].map((cx) => (
                <g key={cx}>
                  <rect x={cx} y="44" width="20" height="6" />
                  <rect x={cx + 4} y="38" width="12" height="6" />
                  <rect x={cx + 8} y="32" width="4" height="6" />
                </g>
              ))}

              {/* Traditional Triangular Plaster Vents in Pixels (Warm Amber) */}
              <g fill="#F59E0B">
                {[40, 70, 100, 130].map((vx) => (
                  <g key={vx}>
                    <rect x={vx} y="88" width="12" height="4" />
                    <rect x={vx + 3} y="84" width="6" height="4" />
                    <rect x={vx + 5} y="80" width="2" height="4" />
                  </g>
                ))}
                {[55, 85, 115].map((vx) => (
                  <g key={vx}>
                    <rect x={vx} y="112" width="12" height="4" />
                    <rect x={vx + 3} y="108" width="6" height="4" />
                    <rect x={vx + 5} y="104" width="2" height="4" />
                  </g>
                ))}
              </g>

              {/* Watchtower Corner */}
              <rect x="190" y="30" width="50" height="165" fill="#29211C" />
              <rect x="194" y="24" width="18" height="6" fill="#29211C" />
              <rect x="216" y="24" width="18" height="6" fill="#29211C" />
            </g>

            {/* Mid Traditional Mud Houses (Center) */}
            <g fill="#241D18">
              <rect x="360" y="60" width="280" height="135" />

              {/* Stepped Merlons */}
              {[360, 395, 430, 465, 500, 535, 570, 605].map((cx) => (
                <g key={cx}>
                  <rect x={cx} y="54" width="20" height="6" />
                  <rect x={cx + 4} y="48" width="12" height="6" />
                  <rect x={cx + 8} y="42" width="4" height="6" />
                </g>
              ))}

              {/* Traditional Heavy Wooden Gate (Square Stepped Arch) */}
              <rect x="480" y="110" width="50" height="85" fill="#120E0C" />
              <rect x="485" y="102" width="40" height="8" fill="#120E0C" />
              <rect x="490" y="96" width="30" height="6" fill="#120E0C" />

              {/* Iron Studs / Nails (Amber Squares) */}
              <rect x="492" y="125" width="4" height="4" fill="#D97706" />
              <rect x="492" y="150" width="4" height="4" fill="#D97706" />
              <rect x="514" y="125" width="4" height="4" fill="#D97706" />
              <rect x="514" y="150" width="4" height="4" fill="#D97706" />

              {/* Triangular Vents */}
              <g fill="#F59E0B">
                <rect x="390" y="94" width="12" height="4" />
                <rect x="393" y="90" width="6" height="4" />
                <rect x="395" y="86" width="2" height="4" />

                <rect x="420" y="94" width="12" height="4" />
                <rect x="423" y="90" width="6" height="4" />
                <rect x="425" y="86" width="2" height="4" />

                <rect x="560" y="94" width="12" height="4" />
                <rect x="563" y="90" width="6" height="4" />
                <rect x="565" y="86" width="2" height="4" />
              </g>
            </g>

            {/* Right Heritage Mud Fortress & Watchtower */}
            <g fill="#1F1916">
              <rect x="790" y="50" width="260" height="145" />

              {[790, 825, 860, 895, 930, 965, 1000].map((cx) => (
                <g key={cx}>
                  <rect x={cx} y="44" width="20" height="6" />
                  <rect x={cx + 4} y="38" width="12" height="6" />
                  <rect x={cx + 8} y="32" width="4" height="6" />
                </g>
              ))}

              {/* Amber Vents */}
              <g fill="#F59E0B">
                {[820, 855, 890, 950, 985].map((vx) => (
                  <g key={vx}>
                    <rect x={vx} y="88" width="12" height="4" />
                    <rect x={vx + 3} y="84" width="6" height="4" />
                    <rect x={vx + 5} y="80" width="2" height="4" />
                  </g>
                ))}
              </g>

              {/* Right Tower */}
              <rect x="1180" y="30" width="80" height="165" fill="#29211C" />
              <rect x="1190" y="24" width="20" height="6" fill="#29211C" />
              <rect x="1230" y="24" width="20" height="6" fill="#29211C" />
            </g>

            {/* =========================================================
                16-BIT PIXEL DATE PALM TREES (نخيل بكسل آرت)
                ========================================================= */}
            {/* Left Palm Cluster */}
            <g fill="#0F0C0A">
              {/* Palm 1 Trunk */}
              <rect x="270" y="60" width="8" height="135" />
              <rect x="268" y="100" width="12" height="6" />
              <rect x="268" y="140" width="12" height="6" />
              <rect x="268" y="170" width="12" height="6" />
              {/* Stepped Pixel Fronds */}
              <rect x="250" y="45" width="48" height="8" fill="#140F0D" />
              <rect x="235" y="35" width="25" height="10" fill="#140F0D" />
              <rect x="220" y="45" width="20" height="8" fill="#140F0D" />
              <rect x="288" y="35" width="25" height="10" fill="#140F0D" />
              <rect x="308" y="45" width="20" height="8" fill="#140F0D" />
              <rect x="265" y="25" width="18" height="12" fill="#140F0D" />

              {/* Palm 2 (Shorter Left) */}
              <rect x="315" y="90" width="8" height="105" />
              <rect x="313" y="125" width="12" height="6" />
              <rect x="313" y="160" width="12" height="6" />
              <rect x="295" y="78" width="48" height="8" fill="#140F0D" />
              <rect x="280" y="70" width="22" height="8" fill="#140F0D" />
              <rect x="335" y="70" width="22" height="8" fill="#140F0D" />
            </g>

            {/* Right Palm Cluster */}
            <g fill="#0F0C0A">
              <rect x="1090" y="55" width="8" height="140" />
              <rect x="1088" y="95" width="12" height="6" />
              <rect x="1088" y="135" width="12" height="6" />
              <rect x="1070" y="42" width="48" height="8" fill="#140F0D" />
              <rect x="1055" y="32" width="22" height="10" fill="#140F0D" />
              <rect x="1110" y="32" width="22" height="10" fill="#140F0D" />

              <rect x="1340" y="80" width="8" height="115" />
              <rect x="1320" y="68" width="48" height="8" fill="#140F0D" />
            </g>

            {/* 16-Bit Pixel Street Lanterns (Warm Amber Core) */}
            {[170, 345, 720, 1055, 1290].map((lx) => (
              <g key={lx}>
                {/* Post */}
                <rect x={lx - 2} y="135" width="4" height="60" fill="#050403" />
                {/* Arm */}
                <rect x={lx - 6} y="135" width="12" height="4" fill="#050403" />
                {/* Cap */}
                <rect x={lx - 8} y="122" width="16" height="4" fill="#050403" />
                {/* Amber Light Core */}
                <rect x={lx - 6} y="126" width="12" height="9" fill="#F59E0B" />
                <rect x={lx - 3} y="128" width="6" height="5" fill="#FEF08A" />
              </g>
            ))}

            {/* Stepped Pixel Stone Sidewalk */}
            <rect x="0" y="195" width="1400" height="15" fill="#171310" />
            {Array.from({ length: 46 }).map((_, i) => (
              <rect
                key={i}
                x={i * 30 + 5}
                y="198"
                width="24"
                height="8"
                fill="#241E1A"
              />
            ))}

            {/* Asphalt Ground Road */}
            <rect x="0" y="210" width="1400" height="30" fill="#0C0A09" />
          </svg>
        </div>

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
