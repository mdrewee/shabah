import React, { useState } from 'react';
import { Check, CheckSquare, Square, Play, ArrowRight } from 'lucide-react';
import { EshrahCategory } from '../../types/eshrah';
import { ESHRAH_CATEGORIES_CONFIG } from '../../data/eshrahWordsBank';
import { sound } from '../../lib/audio';

interface CategoryPickerProps {
  selectedCategories: EshrahCategory[];
  onChangeCategories: (categories: EshrahCategory[]) => void;
  onStartMatch: () => void;
  onBackToTeams?: () => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategories,
  onChangeCategories,
  onStartMatch,
  onBackToTeams
}) => {
  const allCategoryIds = ESHRAH_CATEGORIES_CONFIG.map((c) => c.id);
  const isAllSelected = selectedCategories.length === allCategoryIds.length;

  const handleToggleCategory = (catId: EshrahCategory) => {
    sound.playClick();
    if (selectedCategories.includes(catId)) {
      // Don't allow deselecting everything (keep at least 1)
      if (selectedCategories.length === 1) return;
      onChangeCategories(selectedCategories.filter((id) => id !== catId));
    } else {
      onChangeCategories([...selectedCategories, catId]);
    }
  };

  const handleToggleAll = () => {
    sound.playClick();
    if (isAllSelected) {
      onChangeCategories([allCategoryIds[0]]);
    } else {
      onChangeCategories([...allCategoryIds]);
    }
  };

  const handleStart = () => {
    if (selectedCategories.length === 0) return;
    sound.playClick();
    onStartMatch();
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 py-4 px-2 select-none" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black text-[#2C2A29] tracking-tight">
          تحديد فئات الكلمات
        </h2>
        <p className="text-xs md:text-sm font-bold text-[#5C4033] mt-1">
          اختر فئة واحدة أو عدة فئات لتوزيع الكلمات في الجولات
        </p>
      </div>

      {/* Select All Quick Button */}
      <div className="flex justify-between items-center px-1">
        <button
          type="button"
          onClick={handleToggleAll}
          className="flex items-center gap-2 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-3.5 py-1.5 rounded-xl text-xs font-black text-[#2C2A29] hover:bg-[#E5E0D5] transition-all cursor-pointer"
        >
          {isAllSelected ? <CheckSquare size={16} className="text-[#8A9A5B]" /> : <Square size={16} />}
          <span>{isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
        </button>

        <span className="text-xs font-black text-[#5C4033] bg-[#F7F4EC] border border-[#2C2A29] px-2.5 py-1 rounded-lg">
          تم اختيار {selectedCategories.length} من {allCategoryIds.length} فئات
        </span>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {ESHRAH_CATEGORIES_CONFIG.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);
          return (
            <div
              key={cat.id}
              onClick={() => handleToggleCategory(cat.id)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-[#8A9A5B] text-white border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] scale-102'
                  : 'bg-[#F7F4EC] text-[#2C2A29] border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] hover:bg-[#E5E0D5]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-black tracking-tight">{cat.label}</span>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    isSelected ? 'bg-white border-[#2C2A29] text-[#8A9A5B]' : 'bg-[#E5E0D5] border-[#2C2A29]'
                  }`}
                >
                  {isSelected && <Check size={13} strokeWidth={3} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex gap-3 pt-2">
        {onBackToTeams && (
          <button
            type="button"
            onClick={onBackToTeams}
            className="flex-1 py-3.5 rounded-2xl font-black text-sm border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] bg-[#F7F4EC] text-[#2C2A29] hover:bg-[#E5E0D5] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight size={16} />
            <span>الرجوع للفرق</span>
          </button>
        )}

        <button
          type="button"
          disabled={selectedCategories.length === 0}
          onClick={handleStart}
          className={`flex-2 py-3.5 rounded-2xl font-black text-base border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] transition-all flex items-center justify-center gap-2 ${
            selectedCategories.length > 0
              ? 'bg-[#8A9A5B] text-white hover:bg-[#78884e] active:translate-y-0.5 cursor-pointer'
              : 'bg-[#E5E0D5] text-[#2C2A29]/40 border-[#2C2A29]/40 shadow-none cursor-not-allowed'
          }`}
        >
          <Play size={18} />
          <span>بدء المباراة</span>
        </button>
      </div>
    </div>
  );
};
