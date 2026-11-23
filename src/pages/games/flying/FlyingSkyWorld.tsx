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

export const FlyingSkyWorld: React.FC<FlyingSkyWorldProps> = ({ contestants, results, cumulativeMeters, activeSpotlightIndex, cameraMode }) => {
  const [launched, setLaunched] = useState(false);
  useEffect(() => {
    setLaunched(false);
    const timer = window.setTimeout(() => setLaunched(true), 350);
    return () => window.clearTimeout(timer);
  }, [activeSpotlightIndex, cameraMode]);
  const spotlight = cameraMode === 'spotlight';
  const active = contestants[Math.min(Math.max(0, activeSpotlightIndex), contestants.length - 1)];
  const visible = spotlight && active ? [active] : contestants;
  const highest = Math.max(300, ...contestants.map((p) => results[p.id]?.newTotalMeters ?? cumulativeMeters[p.id] ?? 0));
  const ceiling = Math.ceil(highest / 250) * 250;
  const flightBottom = (ratio: number) => `calc(140px + max(0px, 100% - 560px) * ${ratio})`;
  return <section aria-label="ساحة طيران الأشباح" className="relative h-full w-full overflow-hidden bg-[#071126]">
    <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/images/games/flying-sky.svg)' }} />
    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#071126]/60 via-transparent to-[#071126]/70" />
    <div className="absolute inset-x-3 top-16 z-10 flex items-center justify-between gap-2 text-xs font-bold text-white">
      <span className="rounded-full border border-white/20 bg-black/65 px-3 py-2">{spotlight ? 'لحظة الإقلاع' : 'سباق الارتفاعات'}</span>
      <span className="rounded-full border border-white/20 bg-black/65 px-3 py-2">{contestants.length} أشباح</span>
    </div>
    <div className="absolute inset-0 overflow-x-auto overscroll-x-contain" dir="ltr" tabIndex={0} aria-label="اسحب لمقارنة ارتفاعات اللاعبين">
      <div className="relative h-full min-w-full" style={{ width: spotlight ? '100%' : Math.max(320, visible.length * 150) }}>
        {[0, 1, 2, 3, 4].map((step) => <div key={step} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-white/20" style={{ bottom: flightBottom(step / 4) }}>
          <span className="absolute left-2 -top-3 rounded-md bg-[#071126]/85 px-2 py-1 font-mono text-[10px] text-white/80">{Math.round(ceiling * step / 4)} م</span>
        </div>)}
        {visible.map((p, index) => {
          const result = results[p.id];
          const meters = result ? (spotlight && !launched ? result.previousTotalMeters : result.newTotalMeters) : cumulativeMeters[p.id] || 0;
          return <div key={p.id} className="absolute -translate-x-1/2 motion-safe:transition-[bottom] motion-safe:duration-[1400ms] motion-safe:ease-out" style={{ left: spotlight ? '50%' : ((index + 0.5) / visible.length * 100) + '%', bottom: flightBottom(Math.min(1, meters / ceiling)) }}>
            <GhostAvatar name={p.name} colorIndex={contestants.findIndex((entry) => entry.id === p.id)} totalMeters={meters}
              roundMeters={result?.roundMeters} answer={result?.answer} comment={result?.comment} tier={result?.tier}
              showAnswerCard={Boolean(result)} isSpotlight={spotlight} size={spotlight ? 'md' : 'sm'} />
          </div>;
        })}
      </div>
    </div>
    {!spotlight && visible.length > 2 && <p className="absolute inset-x-4 bottom-36 pointer-events-none text-center text-xs font-bold text-white/80">↔ اسحب لمشاهدة بقية الأشباح</p>}
  </section>;
};
