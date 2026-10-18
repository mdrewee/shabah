import React from 'react';
import { BrokerItem } from '../types';
import { formatPriceArabic } from '../brokerUtils';
import { AlertTriangle, Tag, TrendingUp, Sparkles } from 'lucide-react';

interface BrokerHeroShowcaseProps {
  item: BrokerItem;
  topBid: number;
  topBidderName?: string;
}

export const BrokerHeroShowcase: React.FC<BrokerHeroShowcaseProps> = ({
  item,
  topBid,
  topBidderName,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto shabah-border-wrap">
      <div className="shabah-border-inner">
        <div className="shabah-surface p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
          {/* Category & Lore Pill */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3.5 py-1 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-black flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-600" />
              {item.category}
            </span>
            <span className="text-xs font-bold text-neutral-500 hidden sm:inline">
              مزاد الشبح المباشر
            </span>
          </div>

          {/* Hero Item Name */}
          <h1 className="text-3xl sm:text-5xl font-black text-[#0A0A0A] tracking-tight mb-4 leading-tight">
            {item.name}
          </h1>

          {/* Fatal Flaw Badge - High Impact Alert */}
          <div className="w-full max-w-2xl mb-6 px-4 py-3 rounded-2xl bg-red-500/10 border-2 border-red-500/40 text-red-700 flex items-center justify-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="text-right sm:text-center">
              <span className="text-xs font-black text-red-800 block sm:inline sm:ml-2">
                العيب القاتل:
              </span>
              <span className="text-sm sm:text-base font-bold text-red-700">
                {item.fatalFlaw}
              </span>
            </div>
          </div>

          {/* Scribe of Opening Bid & Top Bid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl">
            {/* Opening Bid */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-100 border-2 border-neutral-300 flex items-center justify-between">
              <div className="text-right">
                <span className="text-xs font-black text-neutral-500 block">
                  فتحة السوم
                </span>
                <span className="text-lg sm:text-xl font-black text-neutral-800">
                  {formatPriceArabic(item.openingBid)}
                </span>
              </div>
              <Tag className="w-6 h-6 text-neutral-400" />
            </div>

            {/* Current Top Bid */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] shadow-[3px_3px_0px_rgba(0,0,0,0.25)] flex items-center justify-between">
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-neutral-400 block">
                    أعلى سومة حالياً
                  </span>
                  {topBidderName && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                      بواسطة: {topBidderName}
                    </span>
                  )}
                </div>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {formatPriceArabic(topBid)}
                </span>
              </div>
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
