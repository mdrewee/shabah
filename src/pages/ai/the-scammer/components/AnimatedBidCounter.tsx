// src/pages/ai/the-scammer/components/AnimatedBidCounter.tsx
import React, { useEffect, useState, useRef } from 'react';

interface AnimatedBidCounterProps {
  bid: number;
  className?: string;
  enableHaptics?: boolean;
}

export const AnimatedBidCounter: React.FC<AnimatedBidCounterProps> = ({
  bid,
  className = '',
  enableHaptics = false
}) => {
  const [displayBid, setDisplayBid] = useState(bid);
  const prevBidRef = useRef(bid);

  useEffect(() => {
    const start = displayBid;
    const end = bid;
    if (start === end) return;

    // Trigger phone vibration on increase if supported
    if (enableHaptics && end > start && typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 50, 80]); // Distinct success pulse
      } catch (e) {
        // Ignore if unsupported
      }
    }

    const duration = 650; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (end - start) * easedProgress);

      setDisplayBid(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayBid(end);
        prevBidRef.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [bid, enableHaptics]);

  const isIncreased = bid > prevBidRef.current;

  return (
    <div
      className={`inline-flex items-center gap-2 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] px-4 py-2 rounded-2xl transition-transform ${
        isIncreased ? 'scale-105 border-[#8A9A5B]' : ''
      } ${className}`}
      dir="rtl"
    >
      <span className="text-xl select-none">💰</span>
      <div className="flex flex-col text-right">
        <span className="text-[10px] font-black text-[#5C4033] leading-none">أعلى سومة:</span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-2xl font-black text-[#2C2A29] tracking-tight tabular-nums font-mono">
            {displayBid.toLocaleString('en-US')}
          </span>
          <span className="text-xs font-bold text-[#8A9A5B]">ريال</span>
        </div>
      </div>
    </div>
  );
};
