import React, { useMemo } from 'react';
import * as d3 from 'd3-geo';
import * as turf from '@turf/turf';
import { TrajectoryRound, TrajectoryPlayer } from '../../types/trajectoryGame';

interface TrajectoryIsolatedCanvasProps {
  round: TrajectoryRound;
  worldGeoJSON: any;
  players: TrajectoryPlayer[];
  isRevealing: boolean;
  isIntermission: boolean;
}

export const TrajectoryIsolatedCanvas: React.FC<TrajectoryIsolatedCanvasProps> = ({
  round,
  worldGeoJSON,
  players,
  isRevealing,
  isIntermission,
}) => {
  const originFeature = useMemo(() => {
    if (!worldGeoJSON || !worldGeoJSON.features) return null;
    return (
      worldGeoJSON.features.find((f: any) => f.properties?.iso3 === round.originIso) ||
      worldGeoJSON.features.find((f: any) => f.properties?.nameAr === round.originCountry) ||
      null
    );
  }, [worldGeoJSON, round.originIso, round.originCountry]);

  // Find country features for player submissions
  const submittedCountryFeatures = useMemo(() => {
    if (!worldGeoJSON || !worldGeoJSON.features) return [];
    const validPlayers = players.filter((p) => p.hasSubmitted && (p.guessedIso3 || p.guessedCountryAr));

    const map = new Map<string, { feature: any; players: TrajectoryPlayer[] }>();

    validPlayers.forEach((p) => {
      const feat =
        worldGeoJSON.features.find((f: any) => p.guessedIso3 && f.properties?.iso3 === p.guessedIso3) ||
        worldGeoJSON.features.find((f: any) => f.properties?.nameAr === p.guessedCountryAr) ||
        worldGeoJSON.features.find((f: any) => p.guessedCountryEn && f.properties?.nameEn?.toLowerCase() === p.guessedCountryEn.toLowerCase()) ||
        worldGeoJSON.features.find((f: any) => p.guessedCountryAr && f.properties?.nameAr?.includes(p.guessedCountryAr));

      if (feat) {
        const iso = feat.properties?.iso3 || feat.properties?.nameAr;
        if (!map.has(iso)) {
          map.set(iso, { feature: feat, players: [p] });
        } else {
          map.get(iso)!.players.push(p);
        }
      }
    });

    return Array.from(map.values());
  }, [worldGeoJSON, players]);

  // Calculate dynamic projection & path generator
  const { originPath, trajectoryLinePath, originProjected, originCenter, submittedPaths, arrowHeadCoords } =
    useMemo(() => {
      const width = 1100;
      const height = 650;

      if (!originFeature) {
        return {
          pathGenerator: null,
          originPath: '',
          trajectoryLinePath: '',
          originProjected: [width / 4, height / 2] as [number, number],
          originCenter: [width / 4, height / 2] as [number, number],
          submittedPaths: [],
          arrowHeadCoords: null,
        };
      }

      // Trajectory end point along bearing (9,500 km trajectory beam)
      const startPt = turf.point(round.originCoords);
      const destPt = turf.destination(startPt, 9500, round.bearing, { units: 'kilometers' });

      // Build great-circle line for vector
      const greatCircleLine = turf.greatCircle(startPt, destPt, { npoints: 120 });

      // Gather features for framing the SVG canvas: origin + destination + trajectory line
      const boundsFeatures: any[] = [originFeature, destPt, greatCircleLine];

      if (isRevealing || isIntermission) {
        // Include submitted country features in bounds during reveal/intermission
        submittedCountryFeatures.forEach((sc) => boundsFeatures.push(sc.feature));
      }

      const featureCollection = turf.featureCollection(boundsFeatures);

      // Fit projection to the SVG viewport with generous 80px safe padding
      const projection = d3
        .geoEquirectangular()
        .fitExtent(
          [
            [80, 80],
            [width - 80, height - 80],
          ],
          featureCollection as any
        );

      const pathGen = d3.geoPath().projection(projection);

      // Origin projected path
      const oPath = pathGen(originFeature) || '';

      // Center of origin country
      const centerCoords = turf.centroid(originFeature).geometry.coordinates;
      const oCenter = projection(centerCoords as [number, number]) || [width / 4, height / 2];
      const oProj = projection(round.originCoords) || oCenter;

      // Active trajectory vector line is always fully framed within the projection
      const activeLineFeature = greatCircleLine;
      const tLinePath = pathGen(activeLineFeature) || '';

      // Arrow head calculation at end of visible line
      const lineCoords = activeLineFeature.geometry.coordinates;
      const lastCoord = lineCoords[lineCoords.length - 1];
      const prevCoord = lineCoords[Math.max(0, lineCoords.length - 4)];
      const pLast = projection(lastCoord as [number, number]);
      const pPrev = projection(prevCoord as [number, number]);

      let arrowCoords = null;
      if (pLast && pPrev) {
        const dx = pLast[0] - pPrev[0];
        const dy = pLast[1] - pPrev[1];
        const angle = Math.atan2(dy, dx);
        arrowCoords = { x: pLast[0], y: pLast[1], angle: (angle * 180) / Math.PI };
      }

      // Paths for submitted countries (only in reveal / intermission)
      const sPaths = (isRevealing || isIntermission)
        ? submittedCountryFeatures.map((sc) => {
            const path = pathGen(sc.feature) || '';
            const centroid = turf.centroid(sc.feature).geometry.coordinates;
            const cPos = projection(centroid as [number, number]) || [0, 0];
            return {
              ...sc,
              path,
              center: cPos,
            };
          })
        : [];

      return {
        pathGenerator: pathGen,
        originPath: oPath,
        trajectoryLinePath: tLinePath,
        originProjected: oProj as [number, number],
        originCenter: oCenter as [number, number],
        submittedPaths: sPaths,
        arrowHeadCoords: arrowCoords,
      };
    }, [originFeature, round, isRevealing, isIntermission, submittedCountryFeatures]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#E5E0D5] bg-[radial-gradient(#C8C1B2_0.75px,transparent_0.75px)] [background-size:24px_24px]">
      <svg
        className="w-full h-full max-w-[1250px] max-h-[750px]"
        viewBox="0 0 1100 650"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="tactile-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#2C2A29" floodOpacity="0.25" />
          </filter>
          <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#2C2A29" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* ======================================================== */}
        {/* 1. Trajectory Vector Line & Arrow                       */}
        {/* ======================================================== */}
        {trajectoryLinePath && (
          <g>
            <path
              d={trajectoryLinePath}
              fill="none"
              stroke="#2C2A29"
              strokeWidth={isRevealing || isIntermission ? '3.5' : '3'}
              strokeDasharray={isRevealing || isIntermission ? 'none' : '9, 7'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isRevealing ? 'transition-all duration-1000' : ''}
            />

            {/* Directional Arrow Head */}
            {arrowHeadCoords && (
              <g
                transform={`translate(${arrowHeadCoords.x}, ${arrowHeadCoords.y}) rotate(${arrowHeadCoords.angle})`}
              >
                <polygon
                  points="0,0 -16,-7 -12,0 -16,7"
                  fill="#2C2A29"
                  stroke="#2C2A29"
                  strokeWidth="1"
                />
              </g>
            )}
          </g>
        )}

        {/* ======================================================== */}
        {/* 2. ONLY Submitting Countries (Revealed upon expiration)   */}
        {/* ======================================================== */}
        {(isRevealing || isIntermission) &&
          submittedPaths.map((item, idx) => {
            const anyValid = item.players.some((p) => p.isValidIntersect);
            const primaryPlayer = item.players[0];
            const countryName = item.feature.properties?.nameAr || item.feature.properties?.name || '';
            const distance = primaryPlayer?.entryDistanceKm;

            return (
              <g key={idx} className="transition-all duration-700 ease-out animate-fade-in">
                {/* Silhouette */}
                <path
                  d={item.path}
                  fill={anyValid ? '#C68B59' : '#DDD8CC'}
                  fillOpacity={anyValid ? 0.85 : 0.4}
                  stroke={anyValid ? '#2C2A29' : 'rgba(44, 42, 41, 0.45)'}
                  strokeWidth={anyValid ? '2.5' : '1.5'}
                  strokeDasharray={anyValid ? 'none' : '4, 4'}
                  filter="url(#tactile-shadow)"
                />

                {/* Country Name Label on Silhouette */}
                <text
                  x={item.center[0]}
                  y={item.center[1]}
                  fill="#2C2A29"
                  fontSize="13"
                  fontWeight="900"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ textShadow: '0 1px 3px rgba(229, 224, 213, 0.9)' }}
                >
                  {countryName}
                </text>

                {/* Tactile Tag above the Country */}
                <g transform={`translate(${item.center[0]}, ${item.center[1] - 32})`}>
                  {anyValid ? (
                    <g filter="url(#badge-shadow)">
                      <rect
                        x="-70"
                        y="-14"
                        width="140"
                        height="28"
                        rx="6"
                        fill="#8A9A5B"
                        stroke="#2C2A29"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="4"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                      >
                        ✓ {item.players.map((p) => p.name).join(', ')} ({distance?.toLocaleString('ar-SA')} كم)
                      </text>
                    </g>
                  ) : (
                    <g filter="url(#badge-shadow)">
                      <rect
                        x="-55"
                        y="-13"
                        width="110"
                        height="26"
                        rx="6"
                        fill="#DDD8CC"
                        stroke="#A35A5A"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="4"
                        fill="#A35A5A"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                      >
                        ✕ {item.players.map((p) => p.name).join(', ')} (لم يتقاطع)
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}

        {/* ======================================================== */}
        {/* 3. Origin Country Silhouette (ALWAYS Present & Center-Left) */}
        {/* ======================================================== */}
        {originPath && (
          <g>
            {/* Origin Silhouette */}
            <path
              d={originPath}
              fill="#8A9A5B"
              stroke="#2C2A29"
              strokeWidth="2.5"
              filter="url(#tactile-shadow)"
            />

            {/* Country Center Name */}
            <text
              x={originCenter[0]}
              y={originCenter[1]}
              fill="#FFFFFF"
              fontSize="16"
              fontWeight="900"
              fontFamily="sans-serif"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ textShadow: '0 2px 4px rgba(44, 42, 41, 0.6)' }}
            >
              {round.originCountry}
            </text>

            {/* Origin Pin Marker */}
            <g transform={`translate(${originProjected[0]}, ${originProjected[1]})`}>
              <circle r="7" fill="#C68B59" stroke="#2C2A29" strokeWidth="2" />
              <circle r="3" fill="#FFFFFF" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};