import React from 'react';
import { ShabahGhost, ShabahMood } from '../../../../components/mascot/ShabahGhost';
import { BrokerAnnouncement } from '../types';
import { Volume2 } from 'lucide-react';

interface BrokerMascotStageProps {
  mood: ShabahMood;
  announcements: BrokerAnnouncement[];
}

export const BrokerMascotStage: React.FC<BrokerMascotStageProps> = ({
  mood,
  announcements,
}) => {
  const latestAnnouncement = announcements[announcements.length - 1];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-6 select-none flex flex-col items-center">
      {/* Reactive Shabah Ghost */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3">
        <ShabahGhost mood={mood} className="w-full h-full" />
      </div>

      {/* Live General Announcement Ticker */}
      <div className="w-full shabah-pill-wrap max-w-xl">
        <div className="shabah-pill-inner">
          <div className="shabah-pill-surface px-5 py-2.5 flex items-center justify-center gap-2.5 text-center">
            <Volume2 className="w-4 h-4 text-neutral-500 shrink-0 animate-pulse" />
            <p className="text-xs sm:text-sm font-black text-[#0A0A0A] truncate">
              {latestAnnouncement?.text || 'الشريطي يترقب أقوى سومة من المتسابقين!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
