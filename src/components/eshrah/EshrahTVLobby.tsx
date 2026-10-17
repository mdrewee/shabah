import React from 'react';
import { EshrahPlayer } from '../../types/eshrah';
import { UnifiedShabahLobby } from '../lobby/UnifiedShabahLobby';

interface EshrahTVLobbyProps {
  roomCode: string;
  gameTitle: string;
  gameRuleSnippet: string;
  players: EshrahPlayer[];
  onStartMatch: () => void;
  categories?: { id: string; label: string }[];
  selectedCategories?: string[];
  onToggleCategory?: (id: any) => void;
}

export const EshrahTVLobby: React.FC<EshrahTVLobbyProps> = ({
  roomCode,
  gameTitle,
  gameRuleSnippet,
  players,
  onStartMatch,
  categories,
  selectedCategories,
  onToggleCategory,
}) => {
  const mappedPlayers = players.map((p) => ({
    id: p.id,
    name: p.name,
    isReady: Boolean(p.teamId),
  }));

  const categoryControls =
    categories && categories.length > 0 && onToggleCategory ? (
      <div className="flex flex-wrap gap-2 pt-2">
        {categories.map((cat) => {
          const isSelected = selectedCategories?.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onToggleCategory(cat.id)}
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[#0A0A0A] transition-colors ${
                isSelected
                  ? 'bg-[#0A0A0A] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] text-[#0A0A0A]/70'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    ) : undefined;

  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameTitle={gameTitle}
      rulesSummary={[
        gameRuleSnippet,
        'انضم من جوالك واختر فريقك ثم اضغط جاهز لبدء المواجهة!',
      ]}
      players={mappedPlayers}
      role="host"
      onStartGame={onStartMatch}
      minPlayers={1}
      extraControls={categoryControls}
    />
  );
};

export default EshrahTVLobby;
