// src/pages/ai/ai-room/components/EvidenceBoard.tsx
import React from 'react';
import { HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Suspect, AnswerSubmission } from '../types';
import { AvatarBadge } from './AvatarBadge';

interface EvidenceBoardProps {
  questions: [string, string];
  suspects: Suspect[];
  answers: AnswerSubmission[];
  showRealNames?: boolean;
  mode?: 'tv' | 'mobile';
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const EvidenceBoard: React.FC<EvidenceBoardProps> = ({
  questions,
  suspects,
  answers,
  showRealNames = false,
  mode = 'tv',
}) => {
  const answersQ0 = answers.filter((a) => a.questionIndex === 0);
  const answersQ1 = answers.filter((a) => a.questionIndex === 1);

  const renderAnswersList = (ansList: AnswerSubmission[]) => {
    if (ansList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-stone-500 font-bold text-xs">
          بانتظار وصول الإجابات...
        </div>
      );
    }

    return (
      <div className="space-y-2 overflow-y-auto pr-1">
        {ansList.map((ans, idx) => {
          const suspect = suspects.find((s) => s.avatarId === ans.avatarId);
          if (!suspect) return null;

          return (
            <div
              key={`${ans.avatarId}-${idx}`}
              className="p-3 bg-white rounded-xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] flex flex-col gap-1.5 transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <AvatarBadge
                  suspect={suspect}
                  size="sm"
                  showRealName={showRealNames}
                />
                <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500">
                  <CheckCircle2 size={12} className="text-[#8A9A5B]" />
                  <span>تم الإدلاء</span>
                </div>
              </div>

              <div className="p-2 bg-[#F7F4EC] rounded-lg border border-[#2C2A29] text-xs font-bold text-[#000000] leading-relaxed">
                "{ans.answer}"
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // TV Layout: Side-by-Side (2 Columns, NO tabs)
  if (mode === 'tv') {
    return (
      <div className="flex flex-col h-full bg-[#E5E0D5] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] p-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#2C2A29] shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="text-[#2C2A29]" size={22} />
            <h2 className="text-xl font-black text-[#000000]">لوحة الأدلة والتحقيق</h2>
          </div>
          <span className="text-xs font-bold text-[#5C4033]">
            مقارنة الإجابات لكشف المندس
          </span>
        </div>

        {/* 2-Column Side-by-Side Layout */}
        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Column 1: Question 1 */}
          <div className="flex flex-col h-full bg-[#F7F4EC] p-3 rounded-xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] overflow-hidden">
            <div className="mb-2.5 p-2.5 bg-white rounded-lg border border-[#2C2A29] shrink-0">
              <span className="text-[11px] font-black text-[#C68B59] block mb-0.5">
                السؤال الأول:
              </span>
              <p className="font-bold text-xs text-[#000000] line-clamp-2">
                {questions[0] || 'لا يوجد سؤال'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderAnswersList(answersQ0)}
            </div>
          </div>

          {/* Column 2: Question 2 */}
          <div className="flex flex-col h-full bg-[#F7F4EC] p-3 rounded-xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] overflow-hidden">
            <div className="mb-2.5 p-2.5 bg-white rounded-lg border border-[#2C2A29] shrink-0">
              <span className="text-[11px] font-black text-[#C68B59] block mb-0.5">
                السؤال الثاني:
              </span>
              <p className="font-bold text-xs text-[#000000] line-clamp-2">
                {questions[1] || 'لا يوجد سؤال'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderAnswersList(answersQ1)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Drawer Layout: Clean Vertical Stack (NO tabs)
  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 p-2">
      {/* Section 1: Question 1 */}
      <div className="bg-[#F7F4EC] p-3 rounded-xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]">
        <div className="mb-2.5 p-2.5 bg-white rounded-lg border border-[#2C2A29]">
          <span className="text-[11px] font-black text-[#C68B59] block mb-0.5">
            السؤال الأول:
          </span>
          <p className="font-bold text-xs text-[#000000]">
            {questions[0] || 'لا يوجد سؤال'}
          </p>
        </div>
        {renderAnswersList(answersQ0)}
      </div>

      {/* Section 2: Question 2 */}
      <div className="bg-[#F7F4EC] p-3 rounded-xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]">
        <div className="mb-2.5 p-2.5 bg-white rounded-lg border border-[#2C2A29]">
          <span className="text-[11px] font-black text-[#C68B59] block mb-0.5">
            السؤال الثاني:
          </span>
          <p className="font-bold text-xs text-[#000000]">
            {questions[1] || 'لا يوجد سؤال'}
          </p>
        </div>
        {renderAnswersList(answersQ1)}
      </div>
    </div>
  );
};
