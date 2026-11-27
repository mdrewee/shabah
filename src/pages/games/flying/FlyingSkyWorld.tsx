import React, { useMemo } from 'react';
import { GhostAvatar } from './GhostAvatar';
import { FLYING_RARITY } from './RarityBadge';
import { flyingAltitudeRatio, FLIGHT_DURATION_MS, FLIGHT_LAUNCH_DELAY_MS, METERS_PER_FLYING_ROUND } from './flyingRound';
import type { FlyingContestantResult, FlyingRoomState } from './types';
import './flyingSkyWorld.css';

interface Flyer { id: string; name: string }
interface FlyingSkyWorldProps {
  contestants: Flyer[];
  results: Record<string, FlyingContestantResult>;
  cumulativeMeters: Record<string, number>;
  activeSpotlightIndex: number;
  cameraMode: FlyingRoomState['cameraMode'];
  totalRounds: number;
  cameraStartedAt?: number;
  currentPlayerId?: string;
}

function FlyerFigure({player, result, index, meters, focused, isMe}: {
  player: Flyer; result?: FlyingContestantResult; index: number; meters: number; focused: boolean; isMe: boolean;
}) {
  const rarity = result && !result.needsReview ? FLYING_RARITY[result.tier] : undefined;
  const color = rarity?.color ?? '#94a3b8';
  const rejected = result && result.answer.trim() && !result.isValid && !result.needsReview;
  return <figure className="flying-figure" dir="rtl" aria-label={player.name}
    style={{'--rarity-color': color} as React.CSSProperties}>
    {result && <div className={`flying-answer ${focused && (rarity?.power ?? 0) >= 3 ? 'flying-answer-flash' : ''}`}>
      <b title={result.answer}>{result.answer || 'بدون إجابة'}</b>
      {rejected && <p className="flying-answer-reason" title={result.comment}>
        {result.comment?.trim() || 'الإجابة لا تطابق شرط السؤال'}
      </p>}
      <span>{result.needsReview ? 'تحتاج مراجعة' : rarity?.label}</span>
    </div>}
    <div className="flying-sprite">
      <GhostAvatar name={player.name} totalMeters={meters} tier={result?.tier} colorIndex={index} spriteOnly />
      {focused && (result?.roundMeters ?? 0) > 0 && <span aria-hidden="true" className="flying-trail" />}
    </div>
    <figcaption>
      <b title={player.name}>{player.name}{isMe ? ' · أنت' : ''}</b>
      <span>{focused && result ? `+${result.roundMeters} م · ` : ''}{meters} م</span>
    </figcaption>
  </figure>;
}

export function FlyingSkyWorld({contestants, results, cumulativeMeters, activeSpotlightIndex, cameraMode, totalRounds, cameraStartedAt, currentPlayerId}: FlyingSkyWorldProps) {
  const player = contestants[activeSpotlightIndex];
  const focus = cameraMode === 'spotlight' && player;
  const result = focus ? results[player.id] : undefined;
  const maxMeters = Math.max(0, ...contestants.map(({id}) => results[id]?.newTotalMeters ?? cumulativeMeters[id] ?? 0));
  const targetAltitude = result?.newTotalMeters ?? maxMeters;
  const flightGain = Math.max(0, Math.min(1, (result?.roundMeters ?? 0) / METERS_PER_FLYING_ROUND));
  const startingSpace = flyingAltitudeRatio(result?.previousTotalMeters ?? targetAltitude, totalRounds);
  const endingSpace = flyingAltitudeRatio(targetAltitude, totalRounds);
  const elapsed = useMemo(() => cameraStartedAt ? Date.now() - cameraStartedAt : 0,
    [cameraStartedAt, activeSpotlightIndex, cameraMode]);
  const launchDelay = Math.max(-FLIGHT_DURATION_MS, FLIGHT_LAUNCH_DELAY_MS - elapsed);
  const stageStyle = {
    '--space-from': Math.min(1, startingSpace * 1.9),
    '--space-to': Math.min(1, endingSpace * 1.9),
    '--camera-delay': `${Math.max(-720, -elapsed)}ms`,
    '--launch-delay': `${launchDelay}ms`,
    '--flight-duration': `${FLIGHT_DURATION_MS}ms`,
    // Spotlight magnifies the same 1,000 m window each round. It never follows the leader.
    '--climb': `${flightGain * 0.85}fr`,
    '--headroom': `${1 - flightGain * 0.85}fr`,
    '--lanes': Math.max(1, contestants.length),
    '--mobile-lanes': Math.min(5, Math.max(1, contestants.length)),
    '--mobile-rows': Math.max(1, Math.ceil(contestants.length / 5)),
  } as React.CSSProperties;

  return <section aria-label="ساحة طيران الأشباح" className={`flying-world ${focus ? 'flying-world-focus' : 'flying-world-wide'}`} style={stageStyle}>
    <div aria-hidden="true" className="flying-clouds" />
    <div aria-hidden="true" key={focus ? 'sky:' + player.id + ':' + cameraStartedAt : 'sky:overview'} className="flying-space" />
    {focus ? <div key={'focus:' + player.id + ':' + cameraStartedAt} className="flying-focus">
      <div className="flying-launch">
        <FlyerFigure player={player} index={activeSpotlightIndex} result={result}
          meters={result?.newTotalMeters ?? cumulativeMeters[player.id] ?? 0} focused isMe={player.id === currentPlayerId} />
      </div>
    </div> : <div className="flying-overview" aria-label="كل الأشباح" dir="ltr">
      {contestants.map((item, index) => {
        const verdict = results[item.id];
        const meters = verdict?.newTotalMeters ?? cumulativeMeters[item.id] ?? 0;
        const altitude = flyingAltitudeRatio(meters, totalRounds);
        return <div key={item.id} className="flying-lane" style={{'--altitude':`${altitude}fr`, '--headroom':`${1 - altitude}fr`} as React.CSSProperties}>
          <FlyerFigure player={item} index={index} result={verdict} meters={meters} focused={false} isMe={item.id === currentPlayerId} />
        </div>;
      })}
    </div>}
  </section>;
}
