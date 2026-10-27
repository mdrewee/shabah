import React from 'react';
import { GuideLandmark } from '../../../../data/guideLandmarks';
import { ContestantRoundResult } from '../types';
import { GuideWorldMap, MapMarker } from './GuideWorldMap';
import { GuideMascot } from './GuideMascot';
import { toArabicNumber, formatPoints } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import {
  Compass,
  MapPin,
  Check,
  ChevronRight,
  Sparkles,
  Trophy,
  Navigation,
} from 'lucide-react';

interface GuideResultsStageProps {
  isTV?: boolean;
  landmark: GuideLandmark;
  roundNumber: number;
  totalRounds: number;
  results: Record<string, ContestantRoundResult>;
  cumulativeScores: Record<string, number>;
  onNextRound?: () => void;
  onReturnToLobby?: () => void;
  isReadyForNextRound?: boolean;
  onToggleReady?: () => void;
  readyCount?: number;
  totalConnectedCount?: number;
  currentContestantId?: string;
}

export const GuideResultsStage: React.FC<GuideResultsStageProps> = ({
  isTV = true,
  landmark,
  roundNumber,
  totalRounds,
  results,
  cumulativeScores,
  onNextRound,
  onReturnToLobby,
  isReadyForNextRound = false,
  onToggleReady,
  readyCount = 0,
  totalConnectedCount = 1,
  currentContestantId,
}) => {
  const resultsList = Object.values(results).sort((a, b) => b.points - a.points || a.distanceKm - b.distanceKm);

  // Vibrant distinct palette for contestants on the map & scoreboard
  const CONTESTANT_COLORS = [
    '#38BDF8', // Sky Blue
    '#A855F7', // Neon Purple
    '#EC4899', // Hot Pink
    '#F97316', // Orange
    '#10B981', // Emerald
    '#EAB308', // Amber Gold
    '#06B6D4', // Cyan
    '#8B5CF6', // Violet
  ];

  // Convert results to map markers with assigned colors
  const markers: MapMarker[] = resultsList.map((r, idx) => ({
    id: r.contestantId,
    name: r.contestantName,
    lat: r.lat,
    lng: r.lng,
    distanceKm: r.distanceKm,
    points: r.points,
    color: CONTESTANT_COLORS[idx % CONTESTANT_COLORS.length],
  }));

  const myResult = currentContestantId
    ? results[currentContestantId] || Object.values(results).find((r) => r.contestantId === currentContestantId)
    : undefined;

  // TV View: Map with auto-zoom on target + Side scoreboard
  if (isTV) {
    return (
      <div
        dir="rtl"
        className="w-full h-screen max-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 select-none overflow-hidden"
      >
        {/* Top Header */}
        <header className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-1 rounded-2xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                <Navigation className="w-7 h-7 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-sans font-bold text-xs">
                  كشف موقع الجولة {toArabicNumber(roundNumber)} من {toArabicNumber(totalRounds)}
                </span>
                <span className="text-xs font-sans text-zinc-400">
                  {landmark.city}، {landmark.country}
                </span>
              </div>
              <h1 className="text-2xl font-sans font-black text-white">
                الموقع الحقيقي: {landmark.name}
              </h1>
            </div>
          </div>

          {/* Action Buttons & Readiness */}
          <div className="flex items-center gap-3">
            <div className="text-xs font-sans text-zinc-400 text-right">
              جاهزية المتسابقين:{' '}
              <strong className="text-emerald-400 font-bold">
                {toArabicNumber(readyCount)} من {toArabicNumber(totalConnectedCount)}
              </strong>
            </div>

            {onNextRound && (
              <button
                type="button"
                onClick={onNextRound}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer"
              >
                <span>بدء الجولة التالية فوراً</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {onReturnToLobby && (
              <button
                type="button"
                onClick={onReturnToLobby}
                className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
              >
                العودة للوبي
              </button>
            )}
          </div>
        </header>

        {/* Center: 68% Zoomed Map + 32% Leaderboard & Feedback */}
        <div className="flex-1 my-4 flex items-stretch gap-6 overflow-hidden">
          {/* Left Area (68%): Zoomed World Map with Target & Distance Lines */}
          <div className="flex-1 h-full rounded-3xl overflow-hidden border border-zinc-800 bg-black relative shadow-2xl">
            <GuideWorldMap
              interactive={true}
              targetLandmark={landmark}
              markers={markers}
              showDistanceLines={true}
              autoCenterOnTarget={true}
              className="w-full h-full"
            />
          </div>

          {/* Right Area (32%): Round Scores & Feedback Cards */}
          <div className="w-[34%] bg-zinc-950 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between overflow-hidden shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="font-sans font-black text-sm text-zinc-200 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>نتائج الجولة والتثمين الجغرافي:</span>
                </span>
                <span className="text-[11px] font-sans text-zinc-500">
                  فرز بحسب المسافة
                </span>
              </div>

              {/* Contestants Results Stack */}
              <div className="my-3 space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {resultsList.map((res, idx) => {
                  const cumScore = cumulativeScores[res.contestantId] || res.points;
                  const color = CONTESTANT_COLORS[idx % CONTESTANT_COLORS.length];

                  return (
                    <div
                      key={res.contestantId}
                      className="bg-black border border-zinc-800 rounded-2xl p-3 flex flex-col gap-1.5 transition-colors hover:border-zinc-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg bg-zinc-900 border flex items-center justify-center font-sans font-black text-xs"
                            style={{ borderColor: color, color }}
                          >
                            {res.contestantName.slice(0, 1)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                            />
                            <span className="font-sans font-black text-sm text-white truncate max-w-[130px]">
                              {res.contestantName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-sans font-bold text-xs text-zinc-400">
                            {toArabicNumber(res.distanceKm)} كم
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg font-sans font-black text-xs ${
                              res.points >= 6
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : res.points >= 1
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {formatPoints(res.points)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-sans border-t border-zinc-900 pt-1">
                        <span className="text-zinc-400 truncate max-w-[190px]">
                          {res.label}
                        </span>
                        <span className="text-zinc-500">
                          المجموع: <strong className="text-white font-bold">{toArabicNumber(cumScore)}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Target Coordinates Summary */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-sans text-zinc-400">
              <span>إحداثيات المعلم:</span>
              <span className="font-mono text-zinc-300 font-bold">
                {landmark.lat}°, {landmark.lng}°
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile View: Focused Contestant Feedback Card + Ready Button
  return (
    <div
      dir="rtl"
      className="flex-1 w-full min-h-screen bg-[#000000] text-white flex flex-col justify-between p-4 select-none overflow-y-auto"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <div className="text-[11px] font-sans text-zinc-400">
            نتائج الجولة {toArabicNumber(roundNumber)} من {toArabicNumber(totalRounds)}
          </div>
          <h2 className="font-sans font-black text-lg text-white">
            {landmark.name} ({landmark.city})
          </h2>
        </div>
        {onReturnToLobby && (
          <button
            type="button"
            onClick={onReturnToLobby}
            className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-sans font-bold text-zinc-400"
          >
            اللوبي
          </button>
        )}
      </div>

      {/* User's Performance Card */}
      <div className="my-auto py-4 flex flex-col items-center text-center">
        {myResult ? (
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center">
            <div className="mb-2">
              <GuideMascot mood={myResult.points >= 6 ? 'focused' : 'curious'} className="w-24 h-28" />
            </div>

            <div className="text-xs font-sans text-zinc-400 mb-1">المسافة عن المعلم الصحيح:</div>
            <div className="font-sans font-black text-3xl text-white mb-2">
              {toArabicNumber(myResult.distanceKm)} كم
            </div>

            <div className="inline-block px-3 py-1 rounded-xl bg-black border border-zinc-800 text-xs font-sans text-zinc-300 mb-4">
              {myResult.label}
            </div>

            <div className="flex items-center justify-center gap-3 py-3 border-t border-zinc-800">
              <span className="text-xs font-sans text-zinc-400">النقاط المكتسبة:</span>
              <span className="px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400 font-sans font-black text-lg">
                {formatPoints(myResult.points)}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 text-zinc-400 font-sans text-sm">
            لم تسجل تخميناً في هذه الجولة (٠ نقاط).
          </div>
        )}
      </div>

      {/* Bottom Ready Toggle Button */}
      <div className="pt-2 border-t border-zinc-900">
        {onToggleReady && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleReady();
            }}
            className={`w-full py-3.5 px-4 rounded-2xl font-sans font-black text-base flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer ${
              isReadyForNextRound
                ? 'bg-zinc-800 border-2 border-emerald-500/80 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isReadyForNextRound ? (
              <>
                <Check className="w-5 h-5 text-emerald-400" />
                <span>جاهز للجولة التالية ({toArabicNumber(readyCount)}/{toArabicNumber(totalConnectedCount)})</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>أنا جاهز للجولة التالية</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
