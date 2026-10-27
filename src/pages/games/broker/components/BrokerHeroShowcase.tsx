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
              {item.categoryLabel}
            </span>
            <span className="text-xs font-bold text-neutral-500 hidden sm:inline">
              حراج الشبح المباشر
            </span>
          </div>

          {/* Hero Item Name */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#0A0A0A] tracking-tight mb-4 leading-tight">
            {item.name}
          </h1>

          {/* Flaw and Perk Grid / Stack */}
          <div className="w-full max-w-2xl mb-6 flex flex-col sm:flex-row gap-3">
            {/* Fatal Flaw Badge */}
            <div className="flex-1 px-4 py-3 rounded-2xl bg-red-500/10 border-2 border-red-500/40 text-red-700 flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-right">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-red-800 block">
                  العيب:
                </span>
                <span className="text-xs sm:text-sm font-bold text-red-700 leading-snug">
                  {item.flaw}
                </span>
              </div>
            </div>

            {/* Rare Perk Badge */}
            {item.perk && (
              <div className="flex-1 px-4 py-3 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-800 flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-right">
                <Sparkles className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-black text-emerald-900 block">
                    الميزة:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-800 leading-snug">
                    {item.perk}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Specs Pill Tags */}
          {item.specs && item.specs.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-xl">
              {item.specs.map((spec, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-600"
                >
                  • {spec}
                </span>
              ))}
            </div>
          )}

          {/* Current Top Bid Card */}
          <div className="w-full max-w-md p-4 rounded-xl bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] shadow-[3px_3px_0px_rgba(0,0,0,0.25)] flex items-center justify-between">
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
  );
};
