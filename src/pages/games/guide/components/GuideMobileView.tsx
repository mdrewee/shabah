import React, { useState, useRef, useEffect } from 'react';
import { GuideMobileMap } from './GuideMobileMap';
import { toArabicNumber } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import {
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Compass,
} from 'lucide-react';

interface GuideMobileViewProps {
  roomCode?: string;
  roundNumber: number;
  totalRounds: number;
  timerSeconds: number;
  activeClueText: string;
  activeClueIndex: number;
  hasSubmitted: boolean;
  onLockPin: (coords: { lat: number; lng: number }) => void;
  onReturnToLobby?: () => void;
}

export const GuideMobileView: React.FC<GuideMobileViewProps> = ({
  roomCode,
  roundNumber,
  totalRounds,
  timerSeconds,
  activeClueText,
  activeClueIndex,
  hasSubmitted,
  onLockPin,
  onReturnToLobby,
}) => {
  const [selectedPin, setSelectedPin] = useState<{ lat: number; lng: number } | null>(null);
  const selectedPinRef = useRef(selectedPin);
  selectedPinRef.current = selectedPin;

  const hasSubmittedRef = useRef(hasSubmitted);
  hasSubmittedRef.current = hasSubmitted;

  const onLockPinRef = useRef(onLockPin);
  onLockPinRef.current = onLockPin;

  const handlePinChange = (coords: { lat: number; lng: number }) => {
    if (hasSubmittedRef.current) return;
    sound.playClick();
    setSelectedPin(coords);
  };

  const handleConfirmPin = () => {
    if (!selectedPinRef.current || hasSubmittedRef.current) return;
    sound.playVictory();
    onLockPinRef.current(selectedPinRef.current);
  };

  // Auto-submit draft pin on timeout so no contestant's answer is lost
  useEffect(() => {
    if (timerSeconds <= 0 && selectedPinRef.current && !hasSubmittedRef.current) {
      handleConfirmPin();
    }
  }, [timerSeconds]);

  return (
    <div
      dir="rtl"
      className="flex-1 w-full h-full min-h-screen bg-[#000000] text-white flex flex-col justify-between p-3 select-none overflow-hidden relative"
    >
      {/* 1. Sticky Top Navigation & Timer */}
      <div className="flex-shrink-0 flex items-center justify-between pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] p-0.5">
            <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center">
              <Compass className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-sans font-bold text-zinc-400">
              الجولة {toArabicNumber(roundNumber)} من {toArabicNumber(totalRounds)}
            </div>
          </div>
        </div>

        {/* Timer Badge & Return button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-400 font-sans font-extrabold text-sm">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>{toArabicNumber(timerSeconds)}ث</span>
          </div>

          {onReturnToLobby && (
            <button
              type="button"
              onClick={onReturnToLobby}
              className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-sans font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              اللوبي
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Clue Capsule (Synchronized with TV) */}
      <div className="flex-shrink-0 my-2 bg-zinc-950 border border-purple-500/50 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between text-[11px] font-sans font-bold text-purple-400 mb-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>التلميح رقم {toArabicNumber(activeClueIndex + 1)} من ٥</span>
          </span>
          <span className="text-zinc-500 text-[10px]">تلميح جديد كل ١٢ث</span>
        </div>
        <p className="font-sans font-extrabold text-sm sm:text-base text-zinc-100 leading-relaxed">
          "{activeClueText}"
        </p>
      </div>

      {/* 3. Center Interactive Leaflet Dark Map */}
      <div className="w-full h-[62vh] min-h-[360px] rounded-2xl overflow-hidden border border-zinc-800 my-1 relative bg-black flex-shrink-0">
        <GuideMobileMap
          key={`${roomCode || 'guide'}-${roundNumber}`}
          userPin={selectedPin}
          onPinChange={handlePinChange}
          isLocked={hasSubmitted}
          className="w-full h-full"
        />

        {/* Coordinate indicator floating badge */}
        {selectedPin && !hasSubmitted && (
          <div className="absolute top-3 left-3 z-[1000] px-3 py-1 rounded-xl bg-black/90 border border-purple-500 text-[11px] font-sans font-bold text-purple-300 shadow-xl backdrop-blur-md">
            ({toArabicNumber(selectedPin.lat)}°, {toArabicNumber(selectedPin.lng)}°)
          </div>
        )}

        {/* Waiting Overlay after submitting */}
        {hasSubmitted && (
          <div className="absolute inset-0 z-[1001] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-sans font-black text-xl text-white mb-2">
              تم تثبيت موقعك بنجاح!
            </h3>
            <p className="font-sans text-xs text-zinc-400 max-w-xs leading-relaxed mb-4">
              ننتظر انتهاء باقي الرحالة أو نفاذ الوقت لكشف المعلم ورصد النقاط على شاشة العرض!
            </p>
            {selectedPin && (
              <div className="inline-block px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-sans text-purple-300">
                إحداثياتك: ({toArabicNumber(selectedPin.lat)}°, {toArabicNumber(selectedPin.lng)}°)
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom Lock Pin Action Bar */}
      <div className="flex-shrink-0 pt-2">
        {!hasSubmitted ? (
          <button
            type="button"
            onClick={handleConfirmPin}
            disabled={!selectedPin}
            className={`w-full py-3.5 px-4 rounded-2xl font-sans font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-lg ${
              selectedPin
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
            }`}
          >
            <MapPin className="w-5 h-5 fill-current" />
            <span>
              {selectedPin ? 'تثبيت الموقع واعتماد الإجابة' : 'المس الخريطة لتحديد مكان الدبوس أولاً'}
            </span>
          </button>
        ) : (
          <div className="w-full py-3 px-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center font-sans font-bold text-xs text-zinc-400">
            بانتظار انتقال شاشة العرض لمرحلة كشف المعلم...
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideMobileView;
