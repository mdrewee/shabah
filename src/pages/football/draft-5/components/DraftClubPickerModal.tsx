import React, { FC } from 'react';
import { DRAFT_CURATED_CLUBS, DraftClub } from '../../../../data/draftClubs';
import { X, Shield } from 'lucide-react';
import { sound } from '../../../../lib/audio';

interface DraftClubPickerModalProps {
  isOpen: boolean;
  selectedClubId?: string;
  onSelectClub: (club: DraftClub) => void;
  onClose: () => void;
}

export const DraftClubPickerModal: FC<DraftClubPickerModalProps> = ({
  isOpen,
  selectedClubId,
  onSelectClub,
  onClose,
}) => {
  if (!isOpen) return null;

  // Group clubs by league
  const leagues = [
    'دوري روشن السعودي',
    'الدوري الإسباني',
    'الدوري الإيطالي',
    'الدوري الإنجليزي',
    'الدوري الفرنسي',
    'الدوري الهولندي',
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in"
      dir="rtl"
    >
      <div className="bg-[#F7F4EC] border-3 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#2C2A29] bg-[#E5E0D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-[#8A9A5B]" />
            <h3 className="font-black text-lg text-[#2C2A29]">اختر شعار فريقك (20 نادياً)</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-lg border-2 border-[#2C2A29] bg-white hover:bg-[#E5E0D5] text-[#2C2A29] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Clubs Grid List */}
        <div className="p-4 overflow-y-auto space-y-4">
          {leagues.map((league) => {
            const clubs = DRAFT_CURATED_CLUBS.filter((c) => c.league === league);
            if (clubs.length === 0) return null;

            return (
              <div key={league} className="space-y-2">
                <span className="text-xs font-black text-[#5C4033] block border-b border-[#2C2A29]/15 pb-1">
                  {league} ({clubs.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {clubs.map((club) => {
                    const isSelected = selectedClubId === club.id;
                    return (
                      <button
                        key={club.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          onSelectClub(club);
                          onClose();
                        }}
                        className={`p-2 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#8A9A5B] text-white border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]'
                            : 'bg-white hover:bg-[#E5E0D5] text-[#2C2A29] border-[#2C2A29]'
                        }`}
                      >
                        <img
                          src={club.badgeUrl}
                          alt={club.name}
                          className="w-8 h-8 object-contain shrink-0"
                          loading="lazy"
                        />
                        <span className="font-black text-xs truncate leading-tight">
                          {club.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
